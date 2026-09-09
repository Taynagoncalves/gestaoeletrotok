const db = require('../../config/database');
const repository = require('./os.repository');
const clientesService = require('../clientes/clientes.service');
const estoqueRepository = require('../estoque/estoque.repository');
const AppError = require('../../shared/errors/AppError');

const STATUS_VALIDOS = [
  'recebido',
  'em_diagnostico',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_reparo',
  'pronto',
  'entregue',
  'recusado',
  'devolvido_sem_reparo',
];

async function resolverCliente(dados) {
  if (dados.cliente_id) {
    return dados.cliente_id;
  }
  if (dados.cliente && dados.cliente.nome) {
    const cliente = await clientesService.criar(dados.cliente);
    return cliente.id;
  }
  throw new AppError('Informe cliente_id ou os dados do cliente (nome) para cadastrá-lo.');
}

async function abrirOS(dados) {
  if (!dados.empresa_id || !dados.aparelho_modelo) {
    throw new AppError('Empresa e modelo do aparelho são obrigatórios.');
  }

  const clienteId = await resolverCliente(dados);

  const osId = await repository.criar({
    empresa_id: dados.empresa_id,
    cliente_id: clienteId,
    tecnico_id: dados.tecnico_id,
    aparelho_modelo: dados.aparelho_modelo,
    imei: dados.imei,
    senha_desbloqueio: dados.senha_desbloqueio,
    condicao_entrada: dados.condicao_entrada,
    defeito_relatado: dados.defeito_relatado,
    prazo_estimado: dados.prazo_estimado,
  });

  await repository.inserirHistoricoStatus(osId, 'recebido', dados.usuario_id);

  if (Array.isArray(dados.checklist) && dados.checklist.length > 0) {
    await repository.substituirChecklist(osId, dados.checklist);
  }

  if (Array.isArray(dados.fotos)) {
    for (const foto of dados.fotos) {
      await repository.inserirFoto(osId, foto);
    }
  }

  if (dados.garantia && dados.garantia.prazo_dias) {
    await repository.upsertGarantia(osId, dados.garantia);
  }

  return repository.buscarCompletoPorId(osId);
}

async function buscarPorId(id) {
  const os = await repository.buscarCompletoPorId(id);
  if (!os) {
    throw new AppError('Ordem de serviço não encontrada.', 404);
  }
  return os;
}

async function buscarBasicoPorId(id) {
  const os = await repository.buscarBasicoPorId(id);
  if (!os) {
    throw new AppError('Ordem de serviço não encontrada.', 404);
  }
  return os;
}

async function listar(empresaId, filtros) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.listar(empresaId, filtros);
}

async function registrarChecklist(osId, itens) {
  await buscarBasicoPorId(osId);
  if (!Array.isArray(itens)) {
    throw new AppError('Checklist deve ser uma lista de itens.');
  }
  await repository.substituirChecklist(osId, itens);
  return buscarPorId(osId);
}

async function adicionarFoto(osId, imagemBase64) {
  await buscarBasicoPorId(osId);
  if (!imagemBase64) {
    throw new AppError('Imagem é obrigatória.');
  }
  await repository.inserirFoto(osId, imagemBase64);
  return repository.listarFotos(osId);
}

async function buscarFoto(osId, fotoId) {
  await buscarBasicoPorId(osId);
  const foto = await repository.buscarFotoPorId(fotoId);
  if (!foto || foto.os_id !== Number(osId)) {
    throw new AppError('Foto não encontrada.', 404);
  }
  return foto;
}

async function removerFoto(osId, fotoId) {
  await buscarFoto(osId, fotoId);
  await repository.removerFoto(fotoId);
  return repository.listarFotos(osId);
}

async function registrarTermo(osId, assinaturaBase64) {
  await buscarBasicoPorId(osId);
  if (!assinaturaBase64) {
    throw new AppError('Assinatura é obrigatória.');
  }
  await repository.upsertTermo(osId, assinaturaBase64);
  return buscarPorId(osId);
}

async function registrarDiagnostico(osId, { defeito_relatado, tecnico_id, usuario_id }) {
  const os = await buscarBasicoPorId(osId);

  await repository.atualizarDadosGerais(osId, { defeito_relatado, tecnico_id });

  if (os.status === 'recebido') {
    await repository.atualizarStatus(osId, 'em_diagnostico');
    await repository.inserirHistoricoStatus(osId, 'em_diagnostico', usuario_id);
  }

  return buscarPorId(osId);
}

async function atribuirTecnico(osId, tecnicoId) {
  await buscarBasicoPorId(osId);
  await repository.atualizarDadosGerais(osId, { tecnico_id: tecnicoId });
  return buscarPorId(osId);
}

async function atualizarStatus(osId, status, usuarioId) {
  await buscarBasicoPorId(osId);
  if (!STATUS_VALIDOS.includes(status)) {
    throw new AppError('Status inválido.');
  }
  await repository.atualizarStatus(osId, status);
  await repository.inserirHistoricoStatus(osId, status, usuarioId);
  return buscarPorId(osId);
}

async function criarOrcamento(osId, dados) {
  const os = await buscarBasicoPorId(osId);
  const { valor_pecas, valor_mao_obra, itens, usuario_id } = dados;

  const orcamentoId = await repository.inserirOrcamento(osId, { valor_pecas, valor_mao_obra });

  if (Array.isArray(itens)) {
    for (const item of itens) {
      if (!item.produto_id || !item.valor) {
        throw new AppError('Cada item do orçamento precisa de produto_id e valor.');
      }
      await repository.inserirOrcamentoItem(orcamentoId, item);
    }
  }

  await repository.atualizarStatus(osId, 'aguardando_aprovacao');
  await repository.inserirHistoricoStatus(osId, 'aguardando_aprovacao', usuario_id);

  return buscarPorId(osId);
}

async function responderOrcamento(orcamentoId, { status, usuario_id }) {
  const orcamento = await repository.buscarOrcamentoPorId(orcamentoId);
  if (!orcamento) {
    throw new AppError('Orçamento não encontrado.', 404);
  }
  if (!['aprovado', 'recusado'].includes(status)) {
    throw new AppError('Status do orçamento deve ser "aprovado" ou "recusado".');
  }
  if (orcamento.status !== 'pendente') {
    throw new AppError('Este orçamento já foi respondido.');
  }

  const os = await repository.buscarBasicoPorId(orcamento.os_id);

  if (status === 'aprovado') {
    const itens = await repository.listarItensOrcamento(orcamentoId);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const item of itens) {
        const saldo = await estoqueRepository.saldoNaoSerializado(item.produto_id, os.empresa_id);
        if (saldo < item.quantidade) {
          throw new AppError(`Estoque insuficiente para a peça do item de orçamento #${item.id}.`);
        }

        await estoqueRepository.ajustarSaldoNaoSerializado(connection, {
          produto_id: item.produto_id,
          empresa_id: os.empresa_id,
          delta: -item.quantidade,
        });

        await estoqueRepository.inserirMovimentacao(connection, {
          produto_id: item.produto_id,
          empresa_id: os.empresa_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          valor_unitario: item.valor,
          motivo: 'os',
          usuario_id,
        });
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    await repository.atualizarStatusOrcamento(orcamentoId, 'aprovado');
    await repository.atualizarStatus(os.id, 'em_reparo');
    await repository.inserirHistoricoStatus(os.id, 'em_reparo', usuario_id);
  } else {
    await repository.atualizarStatusOrcamento(orcamentoId, 'recusado');
    await repository.atualizarStatus(os.id, 'recusado');
    await repository.inserirHistoricoStatus(os.id, 'recusado', usuario_id);
  }

  return buscarPorId(os.id);
}

async function registrarEntrega(osId, { retirado_por, usuario_id }) {
  await buscarBasicoPorId(osId);
  if (!retirado_por) {
    throw new AppError('Informe quem retirou o aparelho.');
  }

  await repository.inserirEntrega(osId, { retirado_por, usuario_id });
  await repository.atualizarStatus(osId, 'entregue');
  await repository.inserirHistoricoStatus(osId, 'entregue', usuario_id);

  return buscarPorId(osId);
}

async function registrarGarantia(osId, { prazo_dias, cobertura }) {
  await buscarBasicoPorId(osId);
  if (!prazo_dias) {
    throw new AppError('Prazo da garantia é obrigatório.');
  }
  await repository.upsertGarantia(osId, { prazo_dias, cobertura });
  return buscarPorId(osId);
}

module.exports = {
  abrirOS,
  buscarPorId,
  listar,
  registrarChecklist,
  registrarTermo,
  registrarDiagnostico,
  atribuirTecnico,
  atualizarStatus,
  criarOrcamento,
  responderOrcamento,
  registrarEntrega,
  registrarGarantia,
  adicionarFoto,
  buscarFoto,
  removerFoto,
};

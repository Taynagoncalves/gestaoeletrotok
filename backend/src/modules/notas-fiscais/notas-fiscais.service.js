const repository = require('./notas-fiscais.repository');
const empresasRepository = require('../empresas/empresas.repository');
const vendasRepository = require('../vendas/vendas.repository');
const osRepository = require('../ordens-servico/os.repository');
const produtosRepository = require('../produtos/produtos.repository');
const { obterProvider } = require('./providers');
const { descriptografar } = require('../../shared/utils/crypto');
const AppError = require('../../shared/errors/AppError');

const ORIGENS_VALIDAS = ['venda', 'os'];
const FORMAS_PAGAMENTO_VALIDAS = ['dinheiro', 'pix', 'credito', 'debito', 'outros'];

async function buscarOrigem(origem, origemId) {
  if (origem === 'venda') {
    const venda = await vendasRepository.buscarPorId(origemId);
    if (!venda) throw new AppError('Venda não encontrada.', 404);
    return venda;
  }
  const os = await osRepository.buscarBasicoPorId(origemId);
  if (!os) throw new AppError('Ordem de serviço não encontrada.', 404);
  return os;
}

async function carregarConfigFiscalDescriptografada(empresaId) {
  const config = await empresasRepository.buscarConfigFiscal(empresaId);
  if (!config || !config.provider) {
    throw new AppError(
      'Esta empresa ainda não tem um provedor de nota fiscal configurado. Configure em Empresas → Configuração fiscal.'
    );
  }
  if (!config.certificado_base64) {
    throw new AppError('Esta empresa ainda não tem certificado digital cadastrado na configuração fiscal.');
  }

  return {
    ...config,
    provider_token: config.provider_token ? descriptografar(config.provider_token) : null,
    certificado_base64: descriptografar(config.certificado_base64),
    certificado_senha: config.certificado_senha ? descriptografar(config.certificado_senha) : null,
  };
}

async function emitir({ origem, origem_id, usuario_id }) {
  if (!ORIGENS_VALIDAS.includes(origem)) {
    throw new AppError('Origem deve ser "venda" ou "os".');
  }

  const dadosOrigem = await buscarOrigem(origem, origem_id);
  const empresaId = dadosOrigem.empresa_id;

  const ativa = await repository.buscarAtivaPorOrigem(origem, origem_id);
  if (ativa) {
    throw new AppError(
      `Já existe uma nota fiscal ${ativa.status === 'autorizada' ? 'autorizada' : 'pendente'} para esta ${origem === 'venda' ? 'venda' : 'OS'} (nota #${ativa.id}).`,
      409
    );
  }

  const empresa = await empresasRepository.buscarPorId(empresaId);
  const tipo = empresa.tipo === 'varejo' ? 'nfce' : 'nfe55';

  const configFiscal = await carregarConfigFiscalDescriptografada(empresaId);

  let total = null;
  if (origem === 'venda') {
    total = Number(dadosOrigem.total);
  } else {
    const orcamentoAprovado = await osRepository.buscarOrcamentoAprovadoPorOs(origem_id);
    if (orcamentoAprovado) {
      total = Number(orcamentoAprovado.valor_pecas) + Number(orcamentoAprovado.valor_mao_obra);
    }
  }

  const nota = await repository.criar({
    empresa_id: empresaId,
    origem,
    origem_id,
    cliente_id: dadosOrigem.cliente_id,
    tipo,
    provider: configFiscal.provider,
    ambiente: configFiscal.ambiente,
    total,
  });

  return processarEmissao(nota, configFiscal, dadosOrigem, usuario_id);
}

async function emitirAvulsa(dados) {
  const {
    empresa_id,
    cliente_id,
    tipo,
    itens,
    desconto,
    acrescimo,
    forma_pagamento,
    observacoes,
    vendedor_usuario_id,
    natureza_operacao,
    serie,
    enviar_email,
    usuario_id,
  } = dados;

  if (!empresa_id) {
    throw new AppError('Empresa é obrigatória.');
  }
  if (!['nfce', 'nfe55'].includes(tipo)) {
    throw new AppError('Tipo de nota deve ser "nfce" ou "nfe55".');
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError('A nota precisa ter pelo menos um produto.');
  }
  if (forma_pagamento && !FORMAS_PAGAMENTO_VALIDAS.includes(forma_pagamento)) {
    throw new AppError('Forma de pagamento inválida.');
  }

  const itensPreparados = [];
  for (const item of itens) {
    const produto = await produtosRepository.buscarPorId(item.produto_id);
    if (!produto) {
      throw new AppError(`Produto ${item.produto_id} não encontrado.`);
    }
    const quantidade = Number(item.quantidade) || 1;
    const valorUnitario = Number(item.valor_unitario);
    if (!valorUnitario || valorUnitario < 0) {
      throw new AppError(`Valor unitário inválido para o produto "${produto.nome}".`);
    }
    itensPreparados.push({ produto_id: produto.id, produto_nome: produto.nome, quantidade, valor_unitario: valorUnitario });
  }

  const subtotal = itensPreparados.reduce((soma, item) => soma + item.quantidade * item.valor_unitario, 0);
  const valorDesconto = Number(desconto) || 0;
  const valorAcrescimo = Number(acrescimo) || 0;
  const total = subtotal - valorDesconto + valorAcrescimo;

  if (total < 0) {
    throw new AppError('O total da nota não pode ser negativo.');
  }

  const configFiscal = await carregarConfigFiscalDescriptografada(empresa_id);

  const nota = await repository.criarAvulsa({
    empresa_id,
    cliente_id,
    tipo,
    provider: configFiscal.provider,
    ambiente: configFiscal.ambiente,
    total,
    desconto: valorDesconto,
    acrescimo: valorAcrescimo,
    forma_pagamento,
    observacoes,
    vendedor_usuario_id,
    natureza_operacao,
    serie,
    enviar_email,
  });

  for (const item of itensPreparados) {
    await repository.inserirItem(nota.id, item);
  }

  return processarEmissao(nota, configFiscal, { cliente_id, empresa_id }, usuario_id);
}

async function processarEmissao(nota, configFiscal, dadosOrigem, usuarioId) {
  const provider = obterProvider(nota.provider);

  try {
    const resultado = await provider.emitir(configFiscal, nota, dadosOrigem, { usuario_id: usuarioId });
    return repository.atualizar(nota.id, {
      status: 'autorizada',
      provider_referencia: resultado.provider_referencia,
      numero: resultado.numero,
      serie: resultado.serie,
      chave_acesso: resultado.chave_acesso,
      motivo: null,
    });
  } catch (err) {
    await repository.atualizar(nota.id, { status: 'erro', motivo: err.message });
    throw err;
  }
}

async function reemitir(notaId) {
  const nota = await buscarPorId(notaId);
  if (!['erro', 'rejeitada'].includes(nota.status)) {
    throw new AppError('Só é possível reemitir notas com status "erro" ou "rejeitada".');
  }

  const dadosOrigem = await buscarOrigem(nota.origem, nota.origem_id);
  const configFiscal = await carregarConfigFiscalDescriptografada(nota.empresa_id);
  return processarEmissao(nota, configFiscal, dadosOrigem, null);
}

async function consultarStatus(notaId) {
  const nota = await buscarPorId(notaId);
  const configFiscal = await carregarConfigFiscalDescriptografada(nota.empresa_id);
  const provider = obterProvider(nota.provider);

  try {
    const resultado = await provider.consultarStatus(configFiscal, nota);
    return repository.atualizar(notaId, {
      status: resultado.status,
      numero: resultado.numero,
      serie: resultado.serie,
      chave_acesso: resultado.chave_acesso,
      motivo: resultado.motivo || null,
    });
  } catch (err) {
    throw err;
  }
}

async function cancelar(notaId, justificativa) {
  const nota = await buscarPorId(notaId);

  if (['pendente', 'erro'].includes(nota.status)) {
    return repository.atualizar(notaId, { status: 'cancelada', motivo: justificativa || 'Cancelada antes da autorização.' });
  }

  if (nota.status !== 'autorizada') {
    throw new AppError('Esta nota não pode ser cancelada no status atual.');
  }

  const configFiscal = await carregarConfigFiscalDescriptografada(nota.empresa_id);
  const provider = obterProvider(nota.provider);

  const resultado = await provider.cancelar(configFiscal, nota, justificativa);
  return repository.atualizar(notaId, { status: 'cancelada', motivo: resultado?.motivo || justificativa });
}

async function buscarPorId(id) {
  const nota = await repository.buscarPorId(id);
  if (!nota) {
    throw new AppError('Nota fiscal não encontrada.', 404);
  }
  if (nota.origem === 'avulsa') {
    nota.itens = await repository.listarItens(id);
  }
  return nota;
}

async function listarPorOrigem(origem, origemId) {
  return repository.listarPorOrigem(origem, origemId);
}

async function listar(empresaId, filtros) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.listar(empresaId, filtros);
}

async function resumoPeriodo(empresaId, de, ate) {
  if (!empresaId || !de || !ate) {
    throw new AppError('Empresa e período são obrigatórios.');
  }
  return repository.resumoPeriodo(empresaId, de, ate);
}

module.exports = {
  emitir,
  emitirAvulsa,
  reemitir,
  consultarStatus,
  cancelar,
  buscarPorId,
  listarPorOrigem,
  listar,
  resumoPeriodo,
};

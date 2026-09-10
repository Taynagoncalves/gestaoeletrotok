const repository = require('./notas-fiscais.repository');
const empresasRepository = require('../empresas/empresas.repository');
const vendasRepository = require('../vendas/vendas.repository');
const osRepository = require('../ordens-servico/os.repository');
const produtosRepository = require('../produtos/produtos.repository');
const clientesRepository = require('../clientes/clientes.repository');
const { obterProvider } = require('./providers');
const { descriptografar } = require('../../shared/utils/crypto');
const AppError = require('../../shared/errors/AppError');

const ORIGENS_VALIDAS = ['venda', 'os'];
const FORMAS_PAGAMENTO_VALIDAS = ['dinheiro', 'pix', 'credito', 'debito', 'outros'];

// Campos que a Focus NFe exige do emitente para qualquer emissao.
const CAMPOS_EMPRESA_OBRIGATORIOS = [
  ['logradouro', 'Logradouro'],
  ['numero', 'Número'],
  ['bairro', 'Bairro'],
  ['municipio', 'Município'],
  ['codigo_municipio_ibge', 'Código IBGE do município'],
  ['uf', 'UF'],
  ['cep', 'CEP'],
  ['cnae', 'CNAE'],
];

function validarProntoParaEmissao(empresa, configFiscal, cliente, tipo) {
  const faltando = CAMPOS_EMPRESA_OBRIGATORIOS.filter(([campo]) => !empresa[campo]).map(([, rotulo]) => rotulo);
  if (faltando.length > 0) {
    throw new AppError(
      `Empresa "${empresa.razao_social}" está com dados fiscais incompletos: ${faltando.join(', ')}. Configure em Empresas.`
    );
  }

  if (configFiscal.provider === 'focus_nfe' && tipo === 'nfce' && (!configFiscal.csc_id || !configFiscal.csc_token)) {
    throw new AppError(
      'Esta empresa ainda não tem CSC (código de segurança do contribuinte) configurado, necessário para emitir NFC-e. Configure em Configurações.'
    );
  }

  if (configFiscal.provider === 'focus_nfe' && !configFiscal.provider_empresa_id) {
    throw new AppError(
      'Esta empresa ainda não foi registrada no Focus NFe. Clique em "Testar configuração fiscal" em Configurações antes de emitir.'
    );
  }

  if (tipo === 'nfe55') {
    if (!cliente) {
      throw new AppError('NF-e completa exige um cliente identificado com endereço.');
    }
    const faltandoCliente = ['logradouro', 'numero', 'bairro', 'municipio', 'codigo_municipio_ibge', 'uf', 'cep'].filter(
      (campo) => !cliente[campo]
    );
    if (faltandoCliente.length > 0) {
      throw new AppError(
        `Cliente "${cliente.nome}" está com endereço incompleto para NF-e: ${faltandoCliente.join(', ')}. Complete o cadastro em Clientes.`
      );
    }
  }
}

async function montarItensParaEmissao(itensBrutos, campoValorUnitario) {
  const itens = [];
  for (const item of itensBrutos) {
    const produto = await produtosRepository.buscarPorId(item.produto_id);
    if (!produto) {
      throw new AppError(`Produto ${item.produto_id} não encontrado.`);
    }
    if (!produto.ncm) {
      throw new AppError(`Produto "${produto.nome}" está sem NCM cadastrado (obrigatório para emitir nota fiscal). Edite o produto em Produtos.`);
    }
    itens.push({
      produto,
      quantidade: Number(item.quantidade) || 1,
      valor_unitario: Number(item[campoValorUnitario]),
    });
  }
  return itens;
}

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
    csc_token: config.csc_token ? descriptografar(config.csc_token) : null,
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
  const cliente = dadosOrigem.cliente_id ? await clientesRepository.buscarPorId(dadosOrigem.cliente_id) : null;
  validarProntoParaEmissao(empresa, configFiscal, cliente, tipo);

  let total = null;
  let itens = [];
  let pagamentos = [];
  if (origem === 'venda') {
    total = Number(dadosOrigem.total);
    itens = await montarItensParaEmissao(dadosOrigem.itens || [], 'preco_unitario');
    pagamentos = dadosOrigem.pagamentos || [];
  } else {
    const orcamentoAprovado = await osRepository.buscarOrcamentoAprovadoPorOs(origem_id);
    if (orcamentoAprovado) {
      total = Number(orcamentoAprovado.valor_pecas) + Number(orcamentoAprovado.valor_mao_obra);
      itens = await montarItensParaEmissao(await osRepository.listarItensOrcamento(orcamentoAprovado.id), 'valor');
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

  const contexto = { empresa, cliente, itens, pagamentos, natureza_operacao: 'Venda de mercadoria' };
  return processarEmissao(nota, configFiscal, contexto, usuario_id);
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

  const produtosPorItem = [];
  const itensPreparados = [];
  for (const item of itens) {
    const produto = await produtosRepository.buscarPorId(item.produto_id);
    if (!produto) {
      throw new AppError(`Produto ${item.produto_id} não encontrado.`);
    }
    if (!produto.ncm) {
      throw new AppError(`Produto "${produto.nome}" está sem NCM cadastrado (obrigatório para emitir nota fiscal). Edite o produto em Produtos.`);
    }
    const quantidade = Number(item.quantidade) || 1;
    const valorUnitario = Number(item.valor_unitario);
    if (!valorUnitario || valorUnitario < 0) {
      throw new AppError(`Valor unitário inválido para o produto "${produto.nome}".`);
    }
    itensPreparados.push({ produto_id: produto.id, produto_nome: produto.nome, quantidade, valor_unitario: valorUnitario });
    produtosPorItem.push({ produto, quantidade, valor_unitario: valorUnitario });
  }

  const subtotal = itensPreparados.reduce((soma, item) => soma + item.quantidade * item.valor_unitario, 0);
  const valorDesconto = Number(desconto) || 0;
  const valorAcrescimo = Number(acrescimo) || 0;
  const total = subtotal - valorDesconto + valorAcrescimo;

  if (total < 0) {
    throw new AppError('O total da nota não pode ser negativo.');
  }

  const empresa = await empresasRepository.buscarPorId(empresa_id);
  const configFiscal = await carregarConfigFiscalDescriptografada(empresa_id);
  const cliente = cliente_id ? await clientesRepository.buscarPorId(cliente_id) : null;
  validarProntoParaEmissao(empresa, configFiscal, cliente, tipo);

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

  const pagamentos = forma_pagamento ? [{ forma: forma_pagamento, valor: total }] : [];
  const contexto = {
    empresa,
    cliente,
    itens: produtosPorItem,
    pagamentos,
    natureza_operacao: natureza_operacao || 'Venda de mercadoria',
    observacoes,
  };
  return processarEmissao(nota, configFiscal, contexto, usuario_id);
}

async function processarEmissao(nota, configFiscal, dadosOrigem, usuarioId) {
  const provider = obterProvider(nota.provider);

  try {
    const resultado = await provider.emitir(configFiscal, nota, dadosOrigem, { usuario_id: usuarioId });
    return repository.atualizar(nota.id, {
      status: resultado.status || 'autorizada',
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

  const empresa = await empresasRepository.buscarPorId(nota.empresa_id);
  const configFiscal = await carregarConfigFiscalDescriptografada(nota.empresa_id);
  const cliente = nota.cliente_id ? await clientesRepository.buscarPorId(nota.cliente_id) : null;
  validarProntoParaEmissao(empresa, configFiscal, cliente, nota.tipo);

  let itens = [];
  let pagamentos = [];
  if (nota.origem === 'avulsa') {
    itens = await montarItensParaEmissao(await repository.listarItens(notaId), 'valor_unitario');
    if (nota.forma_pagamento) pagamentos = [{ forma: nota.forma_pagamento, valor: nota.total }];
  } else if (nota.origem === 'venda') {
    const venda = await buscarOrigem('venda', nota.origem_id);
    itens = await montarItensParaEmissao(venda.itens || [], 'preco_unitario');
    pagamentos = venda.pagamentos || [];
  } else {
    const orcamentoAprovado = await osRepository.buscarOrcamentoAprovadoPorOs(nota.origem_id);
    if (orcamentoAprovado) {
      itens = await montarItensParaEmissao(await osRepository.listarItensOrcamento(orcamentoAprovado.id), 'valor');
    }
  }

  const contexto = { empresa, cliente, itens, pagamentos, natureza_operacao: nota.natureza_operacao || 'Venda de mercadoria' };
  return processarEmissao(nota, configFiscal, contexto, null);
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

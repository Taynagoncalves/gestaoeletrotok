// Adaptador para a API do Focus NFe (https://doc.focusnfe.com.br).
//
// Nomes de campos conferidos na documentacao oficial (reference/criar_empresa,
// reference/emitir_nfce, reference/emitir_nfe, reference/consultar_nfce,
// reference/cancelar_nfce). Se a Focus mudar o contrato, comece revendo essas
// paginas antes de mexer aqui.
//
// Simplificacoes assumidas (documentadas para quem for evoluir isto):
// - CFOP: usa o cadastrado no produto (cfop_padrao) ou calcula 5102/6102
//   comparando UF do emitente com a do destinatario. Nao cobre CFOPs de
//   devolucao, transferencia entre filiais, ST etc.
// - ICMS: usa o CST/CSOSN cadastrado no produto ou um default plausivel por
//   regime tributario (CSOSN 102 para Simples Nacional, CST 00 para os
//   demais). Nao calcula base de calculo/aliquota - assume que o regime
//   dispensa isso (comum no Simples) ou que a Focus/SEFAZ complementam.
// - PIS/COFINS: default "07" (isento/nao tributado) quando o produto nao tem
//   valor especifico cadastrado.
// Isto cobre o caso comum de varejo/Simples Nacional emitindo NFC-e; regras
// fiscais mais avancadas (substituicao tributaria, regimes especiais,
// diferimento) exigem ajuste caso a caso.

const AppError = require('../../../shared/errors/AppError');

const BASE_URLS = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br',
};

const POLLING_TENTATIVAS = 4;
const POLLING_INTERVALO_MS = 2000;

function baseUrl(configFiscal) {
  return BASE_URLS[configFiscal.ambiente] || BASE_URLS.homologacao;
}

function authHeader(configFiscal) {
  const token = Buffer.from(`${configFiscal.provider_token}:`).toString('base64');
  return `Basic ${token}`;
}

function apenasDigitos(valor) {
  return (valor || '').replace(/\D/g, '');
}

async function chamar(configFiscal, method, path, { body, query } = {}) {
  if (!configFiscal.provider_token) {
    throw new AppError('Token do Focus NFe não configurado para esta empresa.');
  }

  const url = new URL(baseUrl(configFiscal) + path);
  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null) url.searchParams.set(chave, valor);
    }
  }

  const headers = { Authorization: authHeader(configFiscal) };
  let requestBody;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const resposta = await fetch(url, { method, headers, body: requestBody });
  const texto = await resposta.text();
  let dados;
  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = { mensagem: texto };
  }

  if (!resposta.ok) {
    const mensagem = dados.mensagem || dados.erro || dados.message || `Erro ${resposta.status} ao chamar o Focus NFe.`;
    throw new AppError(`Focus NFe: ${mensagem}`, resposta.status >= 500 ? 502 : resposta.status);
  }

  return dados;
}

function regimeTributarioCodigo(regime) {
  const texto = (regime || '').toLowerCase();
  if (texto.includes('mei')) return 4;
  if (texto.includes('simples')) return 1;
  return 3;
}

async function garantirEmpresaRegistrada(configFiscal, empresa) {
  if (configFiscal.provider_empresa_id) {
    return {
      provider_empresa_id: configFiscal.provider_empresa_id,
      habilitado_nfce: Boolean(configFiscal.habilitado_nfce),
      habilitado_nfe: Boolean(configFiscal.habilitado_nfe),
    };
  }

  const camposObrigatorios = ['logradouro', 'numero', 'bairro', 'municipio', 'uf', 'cep'];
  const faltando = camposObrigatorios.filter((campo) => !empresa[campo]);
  if (faltando.length > 0) {
    throw new AppError(`Empresa com endereço incompleto para registrar no Focus NFe: ${faltando.join(', ')}.`);
  }
  if (!configFiscal.certificado_base64 || !configFiscal.certificado_senha) {
    throw new AppError('Certificado digital (arquivo + senha) é obrigatório para registrar a empresa no Focus NFe.');
  }

  const payload = {
    nome: configFiscal.razao_social_emitente || empresa.razao_social,
    nome_fantasia: empresa.nome_fantasia || empresa.razao_social,
    cnpj: apenasDigitos(empresa.cnpj),
    logradouro: empresa.logradouro,
    numero: empresa.numero,
    complemento: empresa.complemento || undefined,
    bairro: empresa.bairro,
    municipio: empresa.municipio,
    uf: empresa.uf,
    cep: apenasDigitos(empresa.cep),
    inscricao_estadual: empresa.inscricao_estadual || undefined,
    inscricao_municipal: empresa.inscricao_municipal || undefined,
    regime_tributario: regimeTributarioCodigo(configFiscal.regime_tributario_emitente || empresa.regime_tributario),
    habilita_nfce: true,
    habilita_nfe: true,
    arquivo_certificado_base64: configFiscal.certificado_base64,
    senha_certificado: configFiscal.certificado_senha,
  };

  if (configFiscal.csc_id && configFiscal.csc_token) {
    const sufixo = configFiscal.ambiente === 'producao' ? 'producao' : 'homologacao';
    payload[`id_token_nfce_${sufixo}`] = configFiscal.csc_id;
    payload[`csc_nfce_${sufixo}`] = configFiscal.csc_token;
  }

  const resultado = await chamar(configFiscal, 'POST', '/v2/empresas', { body: payload });

  return {
    provider_empresa_id: String(resultado.id),
    habilitado_nfce: Boolean(resultado.habilita_nfce ?? true),
    habilitado_nfe: Boolean(resultado.habilita_nfe ?? true),
  };
}

function determinarCfop(produto, empresa, cliente) {
  if (produto.cfop_padrao) return produto.cfop_padrao;
  const ufDestino = cliente?.uf || empresa.uf;
  return ufDestino === empresa.uf ? '5102' : '6102';
}

function determinarIcmsSituacaoTributaria(produto, regimeTributario) {
  if (produto.icms_situacao_tributaria) return produto.icms_situacao_tributaria;
  return (regimeTributario || '').toLowerCase().includes('simples') ? '102' : '00';
}

function montarItemFiscal({ produto, quantidade, valor_unitario: valorUnitario }, numeroItem, empresa, cliente) {
  const valorBruto = Number((quantidade * valorUnitario).toFixed(2));
  const unidade = produto.unidade_medida || 'UN';

  return {
    numero_item: numeroItem,
    codigo_produto: produto.referencia_interna || String(produto.id),
    descricao: produto.nome,
    codigo_ncm: produto.ncm,
    cfop: determinarCfop(produto, empresa, cliente),
    quantidade_comercial: quantidade,
    quantidade_tributavel: quantidade,
    unidade_comercial: unidade,
    unidade_tributavel: unidade,
    valor_unitario_comercial: valorUnitario,
    valor_unitario_tributavel: valorUnitario,
    valor_bruto: valorBruto,
    icms_origem: String(produto.origem_mercadoria ?? 0),
    icms_situacao_tributaria: determinarIcmsSituacaoTributaria(produto, empresa.regime_tributario),
    pis_situacao_tributaria: produto.pis_situacao_tributaria || '07',
    cofins_situacao_tributaria: produto.cofins_situacao_tributaria || '07',
  };
}

function montarFormasPagamento(pagamentos) {
  const CODIGOS = { dinheiro: '01', pix: '17', credito: '03', debito: '04', outros: '99' };
  if (!pagamentos || pagamentos.length === 0) {
    return [{ forma_pagamento: '99', valor_pagamento: 0 }];
  }
  return pagamentos.map((pagamento) => ({
    forma_pagamento: CODIGOS[pagamento.forma] || '99',
    valor_pagamento: Number(pagamento.valor) || 0,
  }));
}

function montarPayloadNfce(nota, empresa, contexto) {
  const itens = contexto.itens.map((item, index) => montarItemFiscal(item, index + 1, empresa, contexto.cliente));

  const payload = {
    natureza_operacao: contexto.natureza_operacao || 'Venda de mercadoria',
    data_emissao: new Date().toISOString(),
    presenca_comprador: '1',
    modalidade_frete: '9',
    local_destino: '1',
    cnpj_emitente: apenasDigitos(empresa.cnpj),
    items: itens,
    formas_pagamento: montarFormasPagamento(contexto.pagamentos),
  };

  if (contexto.cliente) {
    payload.nome_destinatario = contexto.cliente.nome;
    const documento = apenasDigitos(contexto.cliente.cpf_cnpj);
    if (documento.length === 14) payload.cnpj_destinatario = documento;
    else if (documento.length === 11) payload.cpf_destinatario = documento;
  }

  return payload;
}

function montarPayloadNfe(nota, empresa, contexto) {
  const itens = contexto.itens.map((item, index) => montarItemFiscal(item, index + 1, empresa, contexto.cliente));
  const cliente = contexto.cliente;

  const payload = {
    natureza_operacao: contexto.natureza_operacao || 'Venda de mercadoria',
    data_emissao: new Date().toISOString(),
    tipo_documento: '1',
    finalidade_emissao: '1',
    consumidor_final: '1',
    presenca_comprador: '1',
    modalidade_frete: '9',
    local_destino: cliente?.uf && cliente.uf === empresa.uf ? '1' : '2',
    cnpj_emitente: apenasDigitos(empresa.cnpj),
    nome_emitente: empresa.razao_social,
    nome_fantasia_emitente: empresa.nome_fantasia || empresa.razao_social,
    logradouro_emitente: empresa.logradouro,
    numero_emitente: empresa.numero,
    bairro_emitente: empresa.bairro,
    municipio_emitente: empresa.municipio,
    uf_emitente: empresa.uf,
    cep_emitente: apenasDigitos(empresa.cep),
    inscricao_estadual_emitente: empresa.inscricao_estadual,
    regime_tributario_emitente: regimeTributarioCodigo(empresa.regime_tributario),
    nome_destinatario: cliente.nome,
    logradouro_destinatario: cliente.logradouro,
    numero_destinatario: cliente.numero,
    bairro_destinatario: cliente.bairro,
    municipio_destinatario: cliente.municipio,
    uf_destinatario: cliente.uf,
    cep_destinatario: apenasDigitos(cliente.cep),
    email_destinatario: cliente.email || undefined,
    items: itens,
  };

  const documentoCliente = apenasDigitos(cliente.cpf_cnpj);
  if (documentoCliente.length === 14) {
    payload.cnpj_destinatario = documentoCliente;
  } else {
    payload.cpf_destinatario = documentoCliente;
    payload.indicador_inscricao_estadual_destinatario = '9';
  }

  return payload;
}

function caminhoPorTipo(tipo) {
  return tipo === 'nfce' ? '/v2/nfce' : '/v2/nfe';
}

function mapearStatus(statusFocus) {
  switch (statusFocus) {
    case 'autorizado':
      return 'autorizada';
    case 'cancelado':
      return 'cancelada';
    case 'erro_autorizacao':
    case 'denegado':
      return 'erro';
    default:
      return 'pendente';
  }
}

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function consultarPorRef(configFiscal, tipo, ref) {
  return chamar(configFiscal, 'GET', `${caminhoPorTipo(tipo)}/${ref}`);
}

async function emitir(configFiscal, nota, contexto) {
  const empresa = contexto.empresa;
  if (!contexto.itens || contexto.itens.length === 0) {
    throw new AppError('A nota fiscal precisa ter pelo menos um item.');
  }
  if (!configFiscal.provider_empresa_id) {
    throw new AppError(
      'Esta empresa ainda não foi registrada no Focus NFe. Use o botão "Testar configuração fiscal" em Configurações antes de emitir.'
    );
  }

  const payload = nota.tipo === 'nfce' ? montarPayloadNfce(nota, empresa, contexto) : montarPayloadNfe(nota, empresa, contexto);
  const ref = `nota-${nota.id}`;

  await chamar(configFiscal, 'POST', caminhoPorTipo(nota.tipo), { body: payload, query: { ref } });

  for (let tentativa = 0; tentativa < POLLING_TENTATIVAS; tentativa++) {
    await aguardar(POLLING_INTERVALO_MS);
    const consulta = await consultarPorRef(configFiscal, nota.tipo, ref);
    const status = mapearStatus(consulta.status);

    if (status === 'autorizada') {
      return {
        status: 'autorizada',
        provider_referencia: ref,
        numero: consulta.numero,
        serie: consulta.serie,
        chave_acesso: consulta.chave_nfe,
      };
    }
    if (status === 'erro') {
      throw new AppError(consulta.mensagem_sefaz || 'A nota fiscal foi rejeitada pela SEFAZ.');
    }
  }

  // Ainda processando apos o polling: fica "pendente" e o usuario consulta
  // de novo mais tarde (botao "Consultar status" ja existente na tela).
  return { status: 'pendente', provider_referencia: ref };
}

async function consultarStatus(configFiscal, nota) {
  if (!nota.provider_referencia) {
    throw new AppError('Esta nota ainda não foi enviada ao Focus NFe.');
  }

  const consulta = await consultarPorRef(configFiscal, nota.tipo, nota.provider_referencia);
  const status = mapearStatus(consulta.status);

  return {
    status,
    numero: consulta.numero,
    serie: consulta.serie,
    chave_acesso: consulta.chave_nfe,
    motivo: status === 'erro' ? consulta.mensagem_sefaz : null,
  };
}

async function cancelar(configFiscal, nota, justificativa) {
  if (!justificativa || justificativa.trim().length < 15) {
    throw new AppError('A justificativa de cancelamento deve ter pelo menos 15 caracteres.');
  }
  if (!nota.provider_referencia) {
    throw new AppError('Esta nota ainda não foi enviada ao Focus NFe.');
  }

  await chamar(configFiscal, 'DELETE', `${caminhoPorTipo(nota.tipo)}/${nota.provider_referencia}`, {
    body: { justificativa },
  });

  return { motivo: justificativa };
}

module.exports = { emitir, consultarStatus, cancelar, garantirEmpresaRegistrada };

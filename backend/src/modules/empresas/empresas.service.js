const repository = require('./empresas.repository');
const AppError = require('../../shared/errors/AppError');
const { criptografar, descriptografar, mascarar } = require('../../shared/utils/crypto');

const TIPOS_VALIDOS = ['atacado', 'varejo'];
const PROVIDERS_VALIDOS = ['focus_nfe', 'plugnotas'];
const AMBIENTES_VALIDOS = ['homologacao', 'producao'];

function validarCamposComuns(dados) {
  if (!dados.razao_social || !dados.tipo) {
    throw new AppError('Razão social e tipo são obrigatórios.');
  }

  if (!TIPOS_VALIDOS.includes(dados.tipo)) {
    throw new AppError('Tipo deve ser "atacado" ou "varejo".');
  }
}

async function listar() {
  return repository.listar();
}

async function buscarPorId(id) {
  const empresa = await repository.buscarPorId(id);
  if (!empresa) {
    throw new AppError('Empresa não encontrada.', 404);
  }
  return empresa;
}

async function criar(dados) {
  if (!dados.cnpj) {
    throw new AppError('CNPJ é obrigatório.');
  }
  validarCamposComuns(dados);

  const existente = await repository.buscarPorCnpj(dados.cnpj);
  if (existente) {
    throw new AppError('Já existe uma empresa cadastrada com este CNPJ.', 409);
  }

  return repository.criar(dados);
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  validarCamposComuns(dados);
  return repository.atualizar(id, dados);
}

async function buscarConfigFiscal(empresaId) {
  await buscarPorId(empresaId);
  const config = await repository.buscarConfigFiscal(empresaId);

  if (!config) {
    return {
      empresa_id: Number(empresaId),
      configurado: false,
      provider: null,
      provider_token_mascarado: null,
      certificado_nome_arquivo: null,
      certificado_configurado: false,
      certificado_validade: null,
      serie_nfce: null,
      serie_nfe: null,
      ambiente: 'homologacao',
      razao_social_emitente: null,
      regime_tributario_emitente: null,
    };
  }

  return {
    empresa_id: config.empresa_id,
    configurado: Boolean(config.provider && config.certificado_base64),
    provider: config.provider,
    provider_token_mascarado: config.provider_token ? mascarar(descriptografar(config.provider_token)) : null,
    certificado_nome_arquivo: config.certificado_nome_arquivo,
    certificado_configurado: Boolean(config.certificado_base64),
    certificado_validade: config.certificado_validade,
    serie_nfce: config.serie_nfce,
    serie_nfe: config.serie_nfe,
    ambiente: config.ambiente,
    razao_social_emitente: config.razao_social_emitente,
    regime_tributario_emitente: config.regime_tributario_emitente,
    atualizada_em: config.atualizada_em,
  };
}

async function salvarConfigFiscal(empresaId, dados) {
  await buscarPorId(empresaId);

  if (dados.provider && !PROVIDERS_VALIDOS.includes(dados.provider)) {
    throw new AppError('Provedor deve ser "focus_nfe" ou "plugnotas".');
  }
  if (dados.ambiente && !AMBIENTES_VALIDOS.includes(dados.ambiente)) {
    throw new AppError('Ambiente deve ser "homologacao" ou "producao".');
  }

  await repository.salvarConfigFiscal(empresaId, {
    razao_social_emitente: dados.razao_social_emitente,
    regime_tributario_emitente: dados.regime_tributario_emitente,
    provider: dados.provider,
    // So sobrescreve credenciais quando um novo valor e enviado --
    // permite editar outros campos sem reenviar token/senha/certificado.
    provider_token_criptografado: dados.provider_token ? criptografar(dados.provider_token) : undefined,
    certificado_base64_criptografado: dados.certificado_base64 ? criptografar(dados.certificado_base64) : undefined,
    certificado_nome_arquivo: dados.certificado_nome_arquivo,
    certificado_senha_criptografada: dados.certificado_senha ? criptografar(dados.certificado_senha) : undefined,
    certificado_validade: dados.certificado_validade,
    serie_nfce: dados.serie_nfce,
    serie_nfe: dados.serie_nfe,
    ambiente: dados.ambiente,
  });

  return buscarConfigFiscal(empresaId);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  buscarConfigFiscal,
  salvarConfigFiscal,
};

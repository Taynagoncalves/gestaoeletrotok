const repository = require('./notas-fiscais.repository');
const empresasRepository = require('../empresas/empresas.repository');
const vendasRepository = require('../vendas/vendas.repository');
const osRepository = require('../ordens-servico/os.repository');
const { obterProvider } = require('./providers');
const { descriptografar } = require('../../shared/utils/crypto');
const AppError = require('../../shared/errors/AppError');

const ORIGENS_VALIDAS = ['venda', 'os'];

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

  const nota = await repository.criar({
    empresa_id: empresaId,
    origem,
    origem_id,
    tipo,
    provider: configFiscal.provider,
    ambiente: configFiscal.ambiente,
  });

  return processarEmissao(nota, configFiscal, dadosOrigem, usuario_id);
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

module.exports = {
  emitir,
  reemitir,
  consultarStatus,
  cancelar,
  buscarPorId,
  listarPorOrigem,
  listar,
};

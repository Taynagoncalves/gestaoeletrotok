const repository = require('./empresas.repository');
const AppError = require('../../shared/errors/AppError');

const TIPOS_VALIDOS = ['atacado', 'varejo'];

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

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};

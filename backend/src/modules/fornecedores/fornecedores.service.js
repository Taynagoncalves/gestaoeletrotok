const repository = require('./fornecedores.repository');
const AppError = require('../../shared/errors/AppError');

function validar(dados) {
  if (!dados.razao_social) {
    throw new AppError('Razão social é obrigatória.');
  }
}

async function listar() {
  return repository.listar();
}

async function buscarPorId(id) {
  const fornecedor = await repository.buscarPorId(id);
  if (!fornecedor) {
    throw new AppError('Fornecedor não encontrado.', 404);
  }
  return fornecedor;
}

async function criar(dados) {
  validar(dados);
  return repository.criar(dados);
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  validar(dados);
  return repository.atualizar(id, dados);
}

async function buscarHistoricoCompras(id) {
  await buscarPorId(id);
  return repository.buscarHistoricoCompras(id);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  buscarHistoricoCompras,
};

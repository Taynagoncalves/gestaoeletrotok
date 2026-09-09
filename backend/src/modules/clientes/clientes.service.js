const repository = require('./clientes.repository');
const AppError = require('../../shared/errors/AppError');

function validar(dados) {
  if (!dados.nome) {
    throw new AppError('Nome é obrigatório.');
  }
}

async function listar(termoBusca) {
  return repository.listar(termoBusca);
}

async function buscarPorId(id) {
  const cliente = await repository.buscarPorId(id);
  if (!cliente) {
    throw new AppError('Cliente não encontrado.', 404);
  }
  return cliente;
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

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};

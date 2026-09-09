const repository = require('./produtos.repository');
const AppError = require('../../shared/errors/AppError');

const TIPOS_VALIDOS = ['celular', 'acessorio', 'eletronico'];

function validar(dados) {
  if (!dados.nome || !dados.tipo) {
    throw new AppError('Nome e tipo são obrigatórios.');
  }

  if (!TIPOS_VALIDOS.includes(dados.tipo)) {
    throw new AppError('Tipo deve ser "celular", "acessorio" ou "eletronico".');
  }
}

async function listar(empresaId) {
  return repository.listar(empresaId);
}

async function buscarPorId(id) {
  const produto = await repository.buscarPorId(id);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  return produto;
}

async function criar(dados) {
  validar(dados);
  return repository.criar(dados);
}

async function atualizar(id, dados) {
  const produto = await buscarPorId(id);
  validar({ ...dados, tipo: produto.tipo });
  return repository.atualizar(id, dados);
}

async function definirPreco(produtoId, empresaId, precoVenda) {
  await buscarPorId(produtoId);

  if (precoVenda === undefined || precoVenda === null || Number(precoVenda) < 0) {
    throw new AppError('Preço de venda inválido.');
  }

  await repository.definirPreco(produtoId, empresaId, precoVenda);
  return repository.listarPrecos(produtoId);
}

async function listarPrecos(produtoId) {
  await buscarPorId(produtoId);
  return repository.listarPrecos(produtoId);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  definirPreco,
  listarPrecos,
};

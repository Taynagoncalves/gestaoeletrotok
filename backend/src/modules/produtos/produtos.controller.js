const service = require('./produtos.service');

async function listar(req, res) {
  const produtos = await service.listar(req.query.empresa_id);
  res.json(produtos);
}

async function buscarPorId(req, res) {
  const produto = await service.buscarPorId(req.params.id);
  res.json(produto);
}

async function criar(req, res) {
  const produto = await service.criar(req.body);
  res.status(201).json(produto);
}

async function atualizar(req, res) {
  const produto = await service.atualizar(req.params.id, req.body);
  res.json(produto);
}

async function listarPrecos(req, res) {
  const precos = await service.listarPrecos(req.params.id);
  res.json(precos);
}

async function definirPreco(req, res) {
  const precos = await service.definirPreco(req.params.id, req.body.empresa_id, req.body.preco_venda);
  res.json(precos);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  listarPrecos,
  definirPreco,
};

const service = require('./clientes.service');

async function listar(req, res) {
  const clientes = await service.listar(req.query.busca);
  res.json(clientes);
}

async function buscarPorId(req, res) {
  const cliente = await service.buscarPorId(req.params.id);
  res.json(cliente);
}

async function criar(req, res) {
  const cliente = await service.criar(req.body);
  res.status(201).json(cliente);
}

async function atualizar(req, res) {
  const cliente = await service.atualizar(req.params.id, req.body);
  res.json(cliente);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};

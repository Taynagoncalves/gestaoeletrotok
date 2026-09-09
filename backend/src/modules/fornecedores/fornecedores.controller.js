const service = require('./fornecedores.service');

async function listar(req, res) {
  const fornecedores = await service.listar();
  res.json(fornecedores);
}

async function buscarPorId(req, res) {
  const fornecedor = await service.buscarPorId(req.params.id);
  res.json(fornecedor);
}

async function criar(req, res) {
  const fornecedor = await service.criar(req.body);
  res.status(201).json(fornecedor);
}

async function atualizar(req, res) {
  const fornecedor = await service.atualizar(req.params.id, req.body);
  res.json(fornecedor);
}

async function buscarHistoricoCompras(req, res) {
  const historico = await service.buscarHistoricoCompras(req.params.id);
  res.json(historico);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  buscarHistoricoCompras,
};

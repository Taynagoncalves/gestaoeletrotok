const service = require('./empresas.service');

async function listar(req, res) {
  const empresas = await service.listar();
  res.json(empresas);
}

async function buscarPorId(req, res) {
  const empresa = await service.buscarPorId(req.params.id);
  res.json(empresa);
}

async function criar(req, res) {
  const empresa = await service.criar(req.body);
  res.status(201).json(empresa);
}

async function atualizar(req, res) {
  const empresa = await service.atualizar(req.params.id, req.body);
  res.json(empresa);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};

const service = require('./usuarios.service');

async function listar(req, res) {
  const usuarios = await service.listar();
  res.json(usuarios);
}

async function buscarPorId(req, res) {
  const usuario = await service.buscarPorId(req.params.id);
  res.json(usuario);
}

async function criar(req, res) {
  const usuario = await service.criar(req.body);
  res.status(201).json(usuario);
}

async function atualizar(req, res) {
  const usuario = await service.atualizar(req.params.id, req.body);
  res.json(usuario);
}

async function listarEmpresas(req, res) {
  const empresas = await service.listarEmpresas(req.params.id);
  res.json(empresas);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  listarEmpresas,
};

const service = require('./estoque.service');

async function registrarEntrada(req, res) {
  const resultado = await service.registrarEntrada(req.body);
  res.status(201).json(resultado);
}

async function consultarSaldo(req, res) {
  const resultado = await service.consultarSaldo(req.params.produtoId, req.query.empresa_id);
  res.json(resultado);
}

async function consultarCustoAtual(req, res) {
  const resultado = await service.consultarCustoAtual(req.params.produtoId, req.query.empresa_id);
  res.json(resultado);
}

async function historico(req, res) {
  const resultado = await service.historico(req.params.produtoId, req.query.empresa_id);
  res.json(resultado);
}

async function listarSaldos(req, res) {
  const resultado = await service.listarSaldos(req.query.empresa_id);
  res.json(resultado);
}

async function listarEstoqueBaixo(req, res) {
  const resultado = await service.listarEstoqueBaixo(req.query.empresa_id);
  res.json(resultado);
}

module.exports = {
  registrarEntrada,
  consultarSaldo,
  consultarCustoAtual,
  historico,
  listarSaldos,
  listarEstoqueBaixo,
};

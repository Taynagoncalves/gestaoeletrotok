const service = require('./vendas.service');

async function registrarVenda(req, res) {
  const venda = await service.registrarVenda(req.body);
  res.status(201).json(venda);
}

async function buscarPorId(req, res) {
  const venda = await service.buscarPorId(req.params.id);
  res.json(venda);
}

async function listar(req, res) {
  const vendas = await service.listar(req.query.empresa_id, {
    de: req.query.de,
    ate: req.query.ate,
  });
  res.json(vendas);
}

async function produtosMaisVendidos(req, res) {
  const resultado = await service.produtosMaisVendidos(req.query.empresa_id, req.query.limite);
  res.json(resultado);
}

async function totalPorDia(req, res) {
  const resultado = await service.totalPorDia(req.query.empresa_id, req.query.dias);
  res.json(resultado);
}

module.exports = {
  registrarVenda,
  buscarPorId,
  listar,
  produtosMaisVendidos,
  totalPorDia,
};

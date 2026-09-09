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

module.exports = {
  registrarVenda,
  buscarPorId,
  listar,
};

const service = require('./relatorios.service');

async function relatorioVendas(req, res) {
  const resultado = await service.relatorioVendas(req.query);
  res.json(resultado);
}

async function relatorioMargem(req, res) {
  const resultado = await service.relatorioMargem(req.query);
  res.json(resultado);
}

async function relatorioMargemPorVenda(req, res) {
  const resultado = await service.relatorioMargemPorVenda(req.query);
  res.json(resultado);
}

async function relatorioEstoqueConsolidado(req, res) {
  const resultado = await service.relatorioEstoqueConsolidado();
  res.json(resultado);
}

module.exports = {
  relatorioVendas,
  relatorioMargem,
  relatorioMargemPorVenda,
  relatorioEstoqueConsolidado,
};

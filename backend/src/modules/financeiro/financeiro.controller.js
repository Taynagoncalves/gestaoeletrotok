const service = require('./financeiro.service');

// ---------- Contas a pagar ----------

async function criarContaPagar(req, res) {
  const conta = await service.criarContaPagar(req.body);
  res.status(201).json(conta);
}

async function listarContasPagar(req, res) {
  const contas = await service.listarContasPagar(req.query.empresa_id, {
    status: req.query.status,
    de: req.query.de,
    ate: req.query.ate,
  });
  res.json(contas);
}

async function atualizarContaPagar(req, res) {
  const conta = await service.atualizarContaPagar(req.params.id, req.body);
  res.json(conta);
}

async function baixarContaPagar(req, res) {
  const conta = await service.baixarContaPagar(req.params.id, req.body);
  res.json(conta);
}

async function cancelarContaPagar(req, res) {
  const conta = await service.cancelarContaPagar(req.params.id);
  res.json(conta);
}

// ---------- Contas a receber ----------

async function criarContaReceber(req, res) {
  const conta = await service.criarContaReceber(req.body);
  res.status(201).json(conta);
}

async function listarContasReceber(req, res) {
  const contas = await service.listarContasReceber(req.query.empresa_id, {
    status: req.query.status,
    de: req.query.de,
    ate: req.query.ate,
  });
  res.json(contas);
}

async function atualizarContaReceber(req, res) {
  const conta = await service.atualizarContaReceber(req.params.id, req.body);
  res.json(conta);
}

async function baixarContaReceber(req, res) {
  const conta = await service.baixarContaReceber(req.params.id, req.body);
  res.json(conta);
}

async function cancelarContaReceber(req, res) {
  const conta = await service.cancelarContaReceber(req.params.id);
  res.json(conta);
}

// ---------- Fluxo de caixa ----------

async function resumoFluxoCaixa(req, res) {
  const resumo = await service.resumoFluxoCaixa(req.query.empresa_id, req.query.de, req.query.ate);
  res.json(resumo);
}

async function fluxoDiario(req, res) {
  const fluxo = await service.fluxoDiario(req.query.empresa_id, req.query.de, req.query.ate);
  res.json(fluxo);
}

module.exports = {
  criarContaPagar,
  listarContasPagar,
  atualizarContaPagar,
  baixarContaPagar,
  cancelarContaPagar,
  criarContaReceber,
  listarContasReceber,
  atualizarContaReceber,
  baixarContaReceber,
  cancelarContaReceber,
  resumoFluxoCaixa,
  fluxoDiario,
};

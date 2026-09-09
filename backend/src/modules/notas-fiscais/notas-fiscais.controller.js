const service = require('./notas-fiscais.service');

async function emitir(req, res) {
  const nota = await service.emitir(req.body);
  res.status(201).json(nota);
}

async function reemitir(req, res) {
  const nota = await service.reemitir(req.params.id);
  res.json(nota);
}

async function consultarStatus(req, res) {
  const nota = await service.consultarStatus(req.params.id);
  res.json(nota);
}

async function cancelar(req, res) {
  const nota = await service.cancelar(req.params.id, req.body.justificativa);
  res.json(nota);
}

async function buscarPorId(req, res) {
  const nota = await service.buscarPorId(req.params.id);
  res.json(nota);
}

async function listarPorOrigem(req, res) {
  const notas = await service.listarPorOrigem(req.params.origem, req.params.origemId);
  res.json(notas);
}

async function listar(req, res) {
  const notas = await service.listar(req.query.empresa_id, {
    status: req.query.status,
    tipo: req.query.tipo,
    origem: req.query.origem,
  });
  res.json(notas);
}

module.exports = {
  emitir,
  reemitir,
  consultarStatus,
  cancelar,
  buscarPorId,
  listarPorOrigem,
  listar,
};

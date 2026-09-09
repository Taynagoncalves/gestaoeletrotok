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
    de: req.query.de,
    ate: req.query.ate,
    busca: req.query.busca,
  });
  res.json(notas);
}

async function emitirAvulsa(req, res) {
  const nota = await service.emitirAvulsa(req.body);
  res.status(201).json(nota);
}

async function resumoPeriodo(req, res) {
  const resumo = await service.resumoPeriodo(req.query.empresa_id, req.query.de, req.query.ate);
  res.json(resumo);
}

module.exports = {
  emitir,
  emitirAvulsa,
  reemitir,
  consultarStatus,
  cancelar,
  buscarPorId,
  listarPorOrigem,
  listar,
  resumoPeriodo,
};

const service = require('./os.service');

async function abrirOS(req, res) {
  const os = await service.abrirOS(req.body);
  res.status(201).json(os);
}

async function buscarPorId(req, res) {
  const os = await service.buscarPorId(req.params.id);
  res.json(os);
}

async function listar(req, res) {
  const resultado = await service.listar(req.query.empresa_id, {
    status: req.query.status,
    tecnico_id: req.query.tecnico_id,
  });
  res.json(resultado);
}

async function registrarChecklist(req, res) {
  const os = await service.registrarChecklist(req.params.id, req.body.itens);
  res.json(os);
}

async function registrarTermo(req, res) {
  const os = await service.registrarTermo(req.params.id, req.body.assinatura_base64);
  res.json(os);
}

async function registrarDiagnostico(req, res) {
  const os = await service.registrarDiagnostico(req.params.id, req.body);
  res.json(os);
}

async function atribuirTecnico(req, res) {
  const os = await service.atribuirTecnico(req.params.id, req.body.tecnico_id);
  res.json(os);
}

async function atualizarStatus(req, res) {
  const os = await service.atualizarStatus(req.params.id, req.body.status, req.body.usuario_id);
  res.json(os);
}

async function criarOrcamento(req, res) {
  const os = await service.criarOrcamento(req.params.id, req.body);
  res.status(201).json(os);
}

async function responderOrcamento(req, res) {
  const os = await service.responderOrcamento(req.params.orcamentoId, req.body);
  res.json(os);
}

async function registrarEntrega(req, res) {
  const os = await service.registrarEntrega(req.params.id, req.body);
  res.json(os);
}

async function registrarGarantia(req, res) {
  const os = await service.registrarGarantia(req.params.id, req.body);
  res.json(os);
}

async function adicionarFoto(req, res) {
  const fotos = await service.adicionarFoto(req.params.id, req.body.imagem_base64);
  res.status(201).json(fotos);
}

async function buscarFoto(req, res) {
  const foto = await service.buscarFoto(req.params.id, req.params.fotoId);
  res.json(foto);
}

async function removerFoto(req, res) {
  const fotos = await service.removerFoto(req.params.id, req.params.fotoId);
  res.json(fotos);
}

module.exports = {
  abrirOS,
  buscarPorId,
  listar,
  registrarChecklist,
  registrarTermo,
  registrarDiagnostico,
  atribuirTecnico,
  atualizarStatus,
  criarOrcamento,
  responderOrcamento,
  registrarEntrega,
  registrarGarantia,
  adicionarFoto,
  buscarFoto,
  removerFoto,
};

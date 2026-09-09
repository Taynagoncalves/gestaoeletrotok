const { Router } = require('express');
const controller = require('./os.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.abrirOS));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.put('/:id/checklist', asyncHandler(controller.registrarChecklist));
router.put('/:id/termo', asyncHandler(controller.registrarTermo));
router.put('/:id/diagnostico', asyncHandler(controller.registrarDiagnostico));
router.put('/:id/tecnico', asyncHandler(controller.atribuirTecnico));
router.put('/:id/status', asyncHandler(controller.atualizarStatus));
router.post('/:id/orcamentos', asyncHandler(controller.criarOrcamento));
router.put('/orcamentos/:orcamentoId/resposta', asyncHandler(controller.responderOrcamento));
router.post('/:id/entrega', asyncHandler(controller.registrarEntrega));
router.put('/:id/garantia', asyncHandler(controller.registrarGarantia));

module.exports = router;

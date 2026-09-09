const { Router } = require('express');
const controller = require('./notas-fiscais.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/resumo-periodo', asyncHandler(controller.resumoPeriodo));
router.post('/emitir', asyncHandler(controller.emitir));
router.post('/emitir-avulsa', asyncHandler(controller.emitirAvulsa));
router.get('/origem/:origem/:origemId', asyncHandler(controller.listarPorOrigem));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/:id/reemitir', asyncHandler(controller.reemitir));
router.post('/:id/consultar', asyncHandler(controller.consultarStatus));
router.post('/:id/cancelar', asyncHandler(controller.cancelar));

module.exports = router;

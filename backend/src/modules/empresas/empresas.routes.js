const { Router } = require('express');
const controller = require('./empresas.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', asyncHandler(controller.criar));
router.put('/:id', asyncHandler(controller.atualizar));
router.get('/:id/config-fiscal', asyncHandler(controller.buscarConfigFiscal));
router.put('/:id/config-fiscal', asyncHandler(controller.salvarConfigFiscal));
router.post('/:id/config-fiscal/testar', asyncHandler(controller.testarConfigFiscal));

module.exports = router;

const { Router } = require('express');
const controller = require('./fornecedores.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', asyncHandler(controller.criar));
router.put('/:id', asyncHandler(controller.atualizar));
router.get('/:id/historico-compras', asyncHandler(controller.buscarHistoricoCompras));

module.exports = router;

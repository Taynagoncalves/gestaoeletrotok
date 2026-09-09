const { Router } = require('express');
const controller = require('./vendas.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/relatorios/produtos-mais-vendidos', asyncHandler(controller.produtosMaisVendidos));
router.get('/relatorios/por-dia', asyncHandler(controller.totalPorDia));
router.get('/relatorios/resumo', asyncHandler(controller.resumoPeriodo));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', asyncHandler(controller.registrarVenda));
router.put('/:id/cancelar', asyncHandler(controller.cancelarVenda));

module.exports = router;

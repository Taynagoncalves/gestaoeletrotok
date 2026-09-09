const { Router } = require('express');
const controller = require('./relatorios.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/vendas', asyncHandler(controller.relatorioVendas));
router.get('/margem', asyncHandler(controller.relatorioMargem));
router.get('/margem/por-venda', asyncHandler(controller.relatorioMargemPorVenda));
router.get('/estoque-consolidado', asyncHandler(controller.relatorioEstoqueConsolidado));

module.exports = router;

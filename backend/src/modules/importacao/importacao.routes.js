const { Router } = require('express');
const controller = require('./importacao.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.post('/preview', asyncHandler(controller.preview));
router.post('/produtos/executar', asyncHandler(controller.executarProdutos));

module.exports = router;

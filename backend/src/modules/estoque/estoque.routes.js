const { Router } = require('express');
const controller = require('./estoque.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.post('/entradas', asyncHandler(controller.registrarEntrada));
router.get('/saldos', asyncHandler(controller.listarSaldos));
router.get('/saldos/baixo', asyncHandler(controller.listarEstoqueBaixo));
router.get('/produtos/:produtoId/saldo', asyncHandler(controller.consultarSaldo));
router.get('/produtos/:produtoId/custo-atual', asyncHandler(controller.consultarCustoAtual));
router.get('/produtos/:produtoId/historico', asyncHandler(controller.historico));

module.exports = router;

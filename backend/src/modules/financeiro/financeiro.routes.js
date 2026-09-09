const { Router } = require('express');
const controller = require('./financeiro.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/contas-pagar', asyncHandler(controller.listarContasPagar));
router.post('/contas-pagar', asyncHandler(controller.criarContaPagar));
router.put('/contas-pagar/:id', asyncHandler(controller.atualizarContaPagar));
router.put('/contas-pagar/:id/baixar', asyncHandler(controller.baixarContaPagar));
router.put('/contas-pagar/:id/cancelar', asyncHandler(controller.cancelarContaPagar));

router.get('/contas-receber', asyncHandler(controller.listarContasReceber));
router.post('/contas-receber', asyncHandler(controller.criarContaReceber));
router.put('/contas-receber/:id', asyncHandler(controller.atualizarContaReceber));
router.put('/contas-receber/:id/baixar', asyncHandler(controller.baixarContaReceber));
router.put('/contas-receber/:id/cancelar', asyncHandler(controller.cancelarContaReceber));

router.get('/fluxo-caixa/resumo', asyncHandler(controller.resumoFluxoCaixa));
router.get('/fluxo-caixa/diario', asyncHandler(controller.fluxoDiario));

module.exports = router;

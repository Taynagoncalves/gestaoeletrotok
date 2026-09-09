const { Router } = require('express');
const controller = require('./produtos.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', asyncHandler(controller.criar));
router.put('/:id', asyncHandler(controller.atualizar));
router.get('/:id/precos', asyncHandler(controller.listarPrecos));
router.put('/:id/precos', asyncHandler(controller.definirPreco));

module.exports = router;

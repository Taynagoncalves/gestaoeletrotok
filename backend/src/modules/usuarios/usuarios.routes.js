const { Router } = require('express');
const controller = require('./usuarios.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.criar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.put('/:id', asyncHandler(controller.atualizar));
router.get('/:id/empresas', asyncHandler(controller.listarEmpresas));

module.exports = router;

const bcrypt = require('bcrypt');
const repository = require('./usuarios.repository');
const AppError = require('../../shared/errors/AppError');

const PERFIS_VALIDOS = ['admin', 'caixa', 'tecnico'];

async function listar() {
  return repository.listar();
}

async function buscarPorId(id) {
  const usuario = await repository.buscarPorId(id);
  if (!usuario) {
    throw new AppError('Usuário não encontrado.', 404);
  }
  return usuario;
}

async function criar(dados) {
  const { nome, login, senha, perfil, empresa_ids } = dados;

  if (!nome || !login || !senha || !perfil) {
    throw new AppError('Nome, login, senha e perfil são obrigatórios.');
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw new AppError('Perfil deve ser "admin", "caixa" ou "tecnico".');
  }
  if (senha.length < 4) {
    throw new AppError('Senha deve ter ao menos 4 caracteres.');
  }

  const existente = await repository.buscarPorLogin(login);
  if (existente) {
    throw new AppError('Já existe um usuário com este login.', 409);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await repository.criar({ nome, login, senha_hash: senhaHash, perfil });

  if (Array.isArray(empresa_ids)) {
    await repository.definirEmpresas(usuario.id, empresa_ids);
  }

  return usuario;
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  const { nome, perfil, ativo, empresa_ids } = dados;

  if (!nome || !perfil) {
    throw new AppError('Nome e perfil são obrigatórios.');
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw new AppError('Perfil deve ser "admin", "caixa" ou "tecnico".');
  }

  const usuario = await repository.atualizar(id, { nome, perfil, ativo });

  if (Array.isArray(empresa_ids)) {
    await repository.definirEmpresas(id, empresa_ids);
  }

  return usuario;
}

async function listarEmpresas(id) {
  await buscarPorId(id);
  return repository.listarEmpresas(id);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  listarEmpresas,
};

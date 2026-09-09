const bcrypt = require('bcrypt');
const usuariosRepository = require('../usuarios/usuarios.repository');
const AppError = require('../../shared/errors/AppError');

async function login({ login, senha }) {
  if (!login || !senha) {
    throw new AppError('Login e senha são obrigatórios.');
  }

  const usuario = await usuariosRepository.buscarPorLogin(login);
  if (!usuario) {
    throw new AppError('Login ou senha inválidos.', 401);
  }
  if (!usuario.ativo) {
    throw new AppError('Este usuário está inativo. Fale com um administrador.', 401);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) {
    throw new AppError('Login ou senha inválidos.', 401);
  }

  const empresas = await usuariosRepository.listarEmpresas(usuario.id);

  return {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    empresas,
  };
}

module.exports = { login };

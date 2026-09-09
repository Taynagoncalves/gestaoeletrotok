const db = require('../../config/database');

async function listar() {
  const [rows] = await db.query(
    'SELECT id, nome, login, perfil, ativo, criado_em FROM usuarios ORDER BY nome'
  );
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    'SELECT id, nome, login, perfil, ativo, criado_em FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function buscarPorLogin(login) {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE login = ?', [login]);
  return rows[0] || null;
}

async function criar({ nome, login, senha_hash, perfil }) {
  const [result] = await db.query(
    'INSERT INTO usuarios (nome, login, senha_hash, perfil) VALUES (?, ?, ?, ?)',
    [nome, login, senha_hash, perfil]
  );
  return buscarPorId(result.insertId);
}

async function atualizar(id, { nome, perfil, ativo }) {
  await db.query('UPDATE usuarios SET nome = ?, perfil = ?, ativo = ? WHERE id = ?', [
    nome,
    perfil,
    ativo ?? 1,
    id,
  ]);
  return buscarPorId(id);
}

async function definirEmpresas(id, empresaIds) {
  await db.query('DELETE FROM usuario_empresas WHERE usuario_id = ?', [id]);
  for (const empresaId of empresaIds) {
    await db.query('INSERT INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)', [id, empresaId]);
  }
}

async function listarEmpresas(id) {
  const [rows] = await db.query(
    `SELECT e.id, e.razao_social, e.tipo
     FROM usuario_empresas ue
     JOIN empresas e ON e.id = ue.empresa_id
     WHERE ue.usuario_id = ?`,
    [id]
  );
  return rows;
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorLogin,
  criar,
  atualizar,
  definirEmpresas,
  listarEmpresas,
};

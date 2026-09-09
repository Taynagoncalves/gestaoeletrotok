const db = require('../../config/database');

async function listar(termoBusca) {
  if (termoBusca) {
    const [rows] = await db.query(
      `SELECT * FROM clientes WHERE nome LIKE ? OR cpf_cnpj LIKE ? OR telefone LIKE ? ORDER BY nome`,
      [`%${termoBusca}%`, `%${termoBusca}%`, `%${termoBusca}%`]
    );
    return rows;
  }

  const [rows] = await db.query('SELECT * FROM clientes ORDER BY nome');
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return rows[0] || null;
}

async function criar(dados) {
  const { nome, cpf_cnpj, telefone, endereco } = dados;

  const [result] = await db.query(
    'INSERT INTO clientes (nome, cpf_cnpj, telefone, endereco) VALUES (?, ?, ?, ?)',
    [nome, cpf_cnpj || null, telefone || null, endereco || null]
  );

  return buscarPorId(result.insertId);
}

async function atualizar(id, dados) {
  const { nome, cpf_cnpj, telefone, endereco } = dados;

  await db.query(
    'UPDATE clientes SET nome = ?, cpf_cnpj = ?, telefone = ?, endereco = ? WHERE id = ?',
    [nome, cpf_cnpj || null, telefone || null, endereco || null, id]
  );

  return buscarPorId(id);
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};

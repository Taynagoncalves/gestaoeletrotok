const db = require('../../config/database');

async function listar() {
  const [rows] = await db.query('SELECT * FROM empresas ORDER BY razao_social');
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
  return rows[0] || null;
}

async function buscarPorCnpj(cnpj) {
  const [rows] = await db.query('SELECT * FROM empresas WHERE cnpj = ?', [cnpj]);
  return rows[0] || null;
}

async function criar(dados) {
  const {
    cnpj,
    razao_social,
    nome_fantasia,
    tipo,
    regime_tributario,
    inscricao_estadual,
    endereco,
    telefone,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO empresas
      (cnpj, razao_social, nome_fantasia, tipo, regime_tributario, inscricao_estadual, endereco, telefone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cnpj, razao_social, nome_fantasia || null, tipo, regime_tributario || null, inscricao_estadual || null, endereco || null, telefone || null]
  );

  return buscarPorId(result.insertId);
}

async function atualizar(id, dados) {
  const {
    razao_social,
    nome_fantasia,
    tipo,
    regime_tributario,
    inscricao_estadual,
    endereco,
    telefone,
    ativa,
  } = dados;

  await db.query(
    `UPDATE empresas SET
      razao_social = ?, nome_fantasia = ?, tipo = ?, regime_tributario = ?,
      inscricao_estadual = ?, endereco = ?, telefone = ?, ativa = ?
     WHERE id = ?`,
    [razao_social, nome_fantasia || null, tipo, regime_tributario || null, inscricao_estadual || null, endereco || null, telefone || null, ativa ?? 1, id]
  );

  return buscarPorId(id);
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorCnpj,
  criar,
  atualizar,
};

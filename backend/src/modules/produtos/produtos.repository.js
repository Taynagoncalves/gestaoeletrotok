const db = require('../../config/database');

async function listar() {
  const [rows] = await db.query('SELECT * FROM produtos ORDER BY nome');
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function criar(dados) {
  const { nome, categoria, marca, tipo, descricao, estoque_minimo } = dados;

  const [result] = await db.query(
    `INSERT INTO produtos (nome, categoria, marca, tipo, descricao, estoque_minimo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nome, categoria || null, marca || null, tipo, descricao || null, estoque_minimo || 0]
  );

  return buscarPorId(result.insertId);
}

async function atualizar(id, dados) {
  const { nome, categoria, marca, descricao, estoque_minimo, ativo } = dados;

  await db.query(
    `UPDATE produtos SET
      nome = ?, categoria = ?, marca = ?, descricao = ?, estoque_minimo = ?, ativo = ?
     WHERE id = ?`,
    [nome, categoria || null, marca || null, descricao || null, estoque_minimo || 0, ativo ?? 1, id]
  );

  return buscarPorId(id);
}

async function definirPreco(produtoId, empresaId, precoVenda) {
  await db.query(
    `INSERT INTO tabela_precos (produto_id, empresa_id, preco_venda)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE preco_venda = VALUES(preco_venda)`,
    [produtoId, empresaId, precoVenda]
  );
}

async function buscarPreco(produtoId, empresaId) {
  const [rows] = await db.query(
    'SELECT preco_venda FROM tabela_precos WHERE produto_id = ? AND empresa_id = ?',
    [produtoId, empresaId]
  );
  return rows[0]?.preco_venda ?? null;
}

async function listarPrecos(produtoId) {
  const [rows] = await db.query(
    `SELECT tp.empresa_id, e.razao_social AS empresa_nome, tp.preco_venda
     FROM tabela_precos tp
     JOIN empresas e ON e.id = tp.empresa_id
     WHERE tp.produto_id = ?`,
    [produtoId]
  );
  return rows;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  definirPreco,
  buscarPreco,
  listarPrecos,
};

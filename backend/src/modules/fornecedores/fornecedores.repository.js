const db = require('../../config/database');

async function listar() {
  const [rows] = await db.query('SELECT * FROM fornecedores ORDER BY razao_social');
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query('SELECT * FROM fornecedores WHERE id = ?', [id]);
  return rows[0] || null;
}

async function criar(dados) {
  const {
    razao_social,
    cnpj,
    contato_nome,
    contato_telefone,
    contato_email,
    condicoes_pagamento,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO fornecedores
      (razao_social, cnpj, contato_nome, contato_telefone, contato_email, condicoes_pagamento)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [razao_social, cnpj || null, contato_nome || null, contato_telefone || null, contato_email || null, condicoes_pagamento || null]
  );

  return buscarPorId(result.insertId);
}

async function atualizar(id, dados) {
  const {
    razao_social,
    cnpj,
    contato_nome,
    contato_telefone,
    contato_email,
    condicoes_pagamento,
    ativo,
  } = dados;

  await db.query(
    `UPDATE fornecedores SET
      razao_social = ?, cnpj = ?, contato_nome = ?, contato_telefone = ?,
      contato_email = ?, condicoes_pagamento = ?, ativo = ?
     WHERE id = ?`,
    [razao_social, cnpj || null, contato_nome || null, contato_telefone || null, contato_email || null, condicoes_pagamento || null, ativo ?? 1, id]
  );

  return buscarPorId(id);
}

async function buscarHistoricoCompras(id) {
  const [rows] = await db.query(
    `SELECT me.id, me.produto_id, p.nome AS produto_nome, me.empresa_id, e.razao_social AS empresa_nome,
            me.quantidade, me.valor_unitario, me.data
     FROM movimentacoes_estoque me
     JOIN produtos p ON p.id = me.produto_id
     JOIN empresas e ON e.id = me.empresa_id
     WHERE me.fornecedor_id = ?
     ORDER BY me.data DESC`,
    [id]
  );
  return rows;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  buscarHistoricoCompras,
};

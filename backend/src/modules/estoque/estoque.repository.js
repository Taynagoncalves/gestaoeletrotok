const db = require('../../config/database');

async function buscarProduto(produtoId) {
  const [rows] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
  return rows[0] || null;
}

async function inserirMovimentacao(connection, dados) {
  const {
    produto_id,
    empresa_id,
    produto_item_id,
    tipo,
    quantidade,
    valor_unitario,
    fornecedor_id,
    empresa_origem_id,
    motivo,
    observacao,
    usuario_id,
  } = dados;

  await connection.query(
    `INSERT INTO movimentacoes_estoque
      (produto_id, empresa_id, produto_item_id, tipo, quantidade, valor_unitario,
       fornecedor_id, empresa_origem_id, motivo, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      produto_id,
      empresa_id,
      produto_item_id || null,
      tipo,
      quantidade,
      valor_unitario ?? null,
      fornecedor_id || null,
      empresa_origem_id || null,
      motivo,
      observacao || null,
      usuario_id || null,
    ]
  );
}

async function inserirItemSerializado(connection, { produto_id, empresa_id, imei, condicao }) {
  const [result] = await connection.query(
    `INSERT INTO produto_itens (produto_id, empresa_id, imei, condicao, status)
     VALUES (?, ?, ?, ?, 'em_estoque')`,
    [produto_id, empresa_id, imei, condicao]
  );
  return result.insertId;
}

async function ajustarSaldoNaoSerializado(connection, { produto_id, empresa_id, delta }) {
  await connection.query(
    `INSERT INTO estoque_saldos (produto_id, empresa_id, quantidade)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)`,
    [produto_id, empresa_id, delta]
  );
}

async function saldoNaoSerializado(produtoId, empresaId) {
  const [rows] = await db.query(
    'SELECT quantidade FROM estoque_saldos WHERE produto_id = ? AND empresa_id = ?',
    [produtoId, empresaId]
  );
  return rows[0]?.quantidade ?? 0;
}

async function contarItensEmEstoque(produtoId, empresaId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM produto_itens
     WHERE produto_id = ? AND empresa_id = ? AND status = 'em_estoque'`,
    [produtoId, empresaId]
  );
  return rows[0].total;
}

async function listarItensEmEstoque(produtoId, empresaId) {
  const [rows] = await db.query(
    `SELECT * FROM produto_itens
     WHERE produto_id = ? AND empresa_id = ? AND status = 'em_estoque'
     ORDER BY criado_em`,
    [produtoId, empresaId]
  );
  return rows;
}

async function custoMaisRecente(produtoId, empresaId) {
  const [rows] = await db.query(
    `SELECT valor_unitario, data, fornecedor_id, empresa_origem_id
     FROM movimentacoes_estoque
     WHERE produto_id = ? AND empresa_id = ? AND tipo = 'entrada' AND valor_unitario IS NOT NULL
     ORDER BY data DESC, id DESC
     LIMIT 1`,
    [produtoId, empresaId]
  );
  return rows[0] || null;
}

async function historico(produtoId, empresaId) {
  const [rows] = await db.query(
    `SELECT me.*, f.razao_social AS fornecedor_nome, eo.razao_social AS empresa_origem_nome
     FROM movimentacoes_estoque me
     LEFT JOIN fornecedores f ON f.id = me.fornecedor_id
     LEFT JOIN empresas eo ON eo.id = me.empresa_origem_id
     WHERE me.produto_id = ? AND me.empresa_id = ?
     ORDER BY me.data DESC, me.id DESC`,
    [produtoId, empresaId]
  );
  return rows;
}

async function saldosPorEmpresa(empresaId) {
  const [rows] = await db.query(
    `SELECT p.id AS produto_id, p.nome, p.tipo, p.estoque_minimo,
            CASE WHEN p.tipo = 'celular'
              THEN (SELECT COUNT(*) FROM produto_itens pi WHERE pi.produto_id = p.id AND pi.empresa_id = ? AND pi.status = 'em_estoque')
              ELSE COALESCE((SELECT es.quantidade FROM estoque_saldos es WHERE es.produto_id = p.id AND es.empresa_id = ?), 0)
            END AS saldo
     FROM produtos p
     WHERE p.ativo = 1
     ORDER BY p.nome`,
    [empresaId, empresaId]
  );
  return rows;
}

module.exports = {
  buscarProduto,
  inserirMovimentacao,
  inserirItemSerializado,
  ajustarSaldoNaoSerializado,
  saldoNaoSerializado,
  contarItensEmEstoque,
  listarItensEmEstoque,
  custoMaisRecente,
  historico,
  saldosPorEmpresa,
};

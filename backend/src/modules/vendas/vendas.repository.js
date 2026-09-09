const db = require('../../config/database');

async function inserirVenda(connection, { empresa_id, cliente_id, usuario_id, total, canal, desconto, status }) {
  const [result] = await connection.query(
    `INSERT INTO vendas (empresa_id, cliente_id, usuario_id, total, canal, desconto, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [empresa_id, cliente_id || null, usuario_id || null, total, canal || 'presencial', desconto || 0, status || 'concluida']
  );
  return result.insertId;
}

async function atualizarStatus(id, status) {
  await db.query('UPDATE vendas SET status = ? WHERE id = ?', [status, id]);
}

async function inserirItem(connection, { venda_id, produto_id, produto_item_id, quantidade, preco_unitario, custo_unitario_snapshot }) {
  await connection.query(
    `INSERT INTO venda_itens (venda_id, produto_id, produto_item_id, quantidade, preco_unitario, custo_unitario_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [venda_id, produto_id, produto_item_id || null, quantidade, preco_unitario, custo_unitario_snapshot]
  );
}

async function inserirPagamento(connection, { venda_id, forma, parcelas, valor }) {
  await connection.query(
    `INSERT INTO venda_pagamentos (venda_id, forma, parcelas, valor)
     VALUES (?, ?, ?, ?)`,
    [venda_id, forma, parcelas || 1, valor]
  );
}

async function buscarPorId(id) {
  const [vendas] = await db.query(
    `SELECT v.*, c.nome AS cliente_nome, e.razao_social AS empresa_nome
     FROM vendas v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     JOIN empresas e ON e.id = v.empresa_id
     WHERE v.id = ?`,
    [id]
  );
  const venda = vendas[0];
  if (!venda) return null;

  const [itens] = await db.query(
    `SELECT vi.*, p.nome AS produto_nome, pi.imei
     FROM venda_itens vi
     JOIN produtos p ON p.id = vi.produto_id
     LEFT JOIN produto_itens pi ON pi.id = vi.produto_item_id
     WHERE vi.venda_id = ?`,
    [id]
  );

  const [pagamentos] = await db.query('SELECT * FROM venda_pagamentos WHERE venda_id = ?', [id]);

  return { ...venda, itens, pagamentos };
}

async function listar(empresaId, { de, ate, status, canal } = {}) {
  const condicoes = ['v.empresa_id = ?'];
  const params = [empresaId];

  if (de) {
    condicoes.push('v.data >= ?');
    params.push(de);
  }
  if (ate) {
    condicoes.push('v.data <= ?');
    params.push(ate);
  }
  if (status) {
    condicoes.push('v.status = ?');
    params.push(status);
  }
  if (canal) {
    condicoes.push('v.canal = ?');
    params.push(canal);
  }

  const [rows] = await db.query(
    `SELECT v.id, v.data, v.total, v.desconto, v.status, v.canal, v.cliente_id, c.nome AS cliente_nome,
            (SELECT GROUP_CONCAT(DISTINCT forma) FROM venda_pagamentos WHERE venda_id = v.id) AS formas_pagamento
     FROM vendas v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY v.data DESC`,
    params
  );
  return rows;
}

async function produtosMaisVendidos(empresaId, limite) {
  const limiteSeguro = Number.isInteger(limite) ? limite : 5;
  const [rows] = await db.query(
    `SELECT vi.produto_id, p.nome, SUM(vi.quantidade) AS quantidade_vendida,
            SUM(vi.quantidade * vi.preco_unitario) AS total_vendido
     FROM venda_itens vi
     JOIN vendas v ON v.id = vi.venda_id
     JOIN produtos p ON p.id = vi.produto_id
     WHERE v.empresa_id = ? AND v.status = 'concluida'
     GROUP BY vi.produto_id, p.nome
     ORDER BY quantidade_vendida DESC
     LIMIT ${limiteSeguro}`,
    [empresaId]
  );
  return rows;
}

async function totalPorDia(empresaId, dias) {
  const [rows] = await db.query(
    `SELECT DATE(data) AS dia, SUM(total) AS total, COUNT(*) AS quantidade
     FROM vendas
     WHERE empresa_id = ? AND status = 'concluida' AND data >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(data)
     ORDER BY dia`,
    [empresaId, dias]
  );
  return rows;
}

async function resumoPeriodo(empresaId, de, ate) {
  const [[totais]] = await db.query(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS quantidade
     FROM vendas
     WHERE empresa_id = ? AND status = 'concluida' AND data BETWEEN ? AND ?`,
    [empresaId, de, ate]
  );

  const [porForma] = await db.query(
    `SELECT vp.forma, COALESCE(SUM(vp.valor), 0) AS total
     FROM venda_pagamentos vp
     JOIN vendas v ON v.id = vp.venda_id
     WHERE v.empresa_id = ? AND v.status = 'concluida' AND v.data BETWEEN ? AND ?
     GROUP BY vp.forma`,
    [empresaId, de, ate]
  );

  return { ...totais, por_forma: porForma };
}

module.exports = {
  inserirVenda,
  inserirItem,
  inserirPagamento,
  buscarPorId,
  atualizarStatus,
  listar,
  produtosMaisVendidos,
  totalPorDia,
  resumoPeriodo,
};

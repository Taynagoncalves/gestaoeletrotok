const db = require('../../config/database');

// ---------- Contas a pagar ----------

async function criarContaPagar(dados) {
  const { empresa_id, fornecedor_id, descricao, categoria, valor, data_vencimento, observacao } = dados;
  const [result] = await db.query(
    `INSERT INTO contas_pagar (empresa_id, fornecedor_id, descricao, categoria, valor, data_vencimento, observacao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [empresa_id, fornecedor_id || null, descricao, categoria || null, valor, data_vencimento, observacao || null]
  );
  return buscarContaPagarPorId(result.insertId);
}

async function buscarContaPagarPorId(id) {
  const [rows] = await db.query(
    `SELECT cp.*, f.razao_social AS fornecedor_nome
     FROM contas_pagar cp
     LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
     WHERE cp.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listarContasPagar(empresaId, { status, de, ate } = {}) {
  const condicoes = ['cp.empresa_id = ?'];
  const params = [empresaId];

  if (status) {
    condicoes.push('cp.status = ?');
    params.push(status);
  }
  if (de) {
    condicoes.push('cp.data_vencimento >= ?');
    params.push(de);
  }
  if (ate) {
    condicoes.push('cp.data_vencimento <= ?');
    params.push(ate);
  }

  const [rows] = await db.query(
    `SELECT cp.*, f.razao_social AS fornecedor_nome,
            CASE WHEN cp.status = 'pendente' AND cp.data_vencimento < CURDATE() THEN 1 ELSE 0 END AS atrasada
     FROM contas_pagar cp
     LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY cp.data_vencimento ASC`,
    params
  );
  return rows;
}

async function atualizarContaPagar(id, dados) {
  const { fornecedor_id, descricao, categoria, valor, data_vencimento, observacao } = dados;
  await db.query(
    `UPDATE contas_pagar SET fornecedor_id = ?, descricao = ?, categoria = ?, valor = ?, data_vencimento = ?, observacao = ?
     WHERE id = ?`,
    [fornecedor_id || null, descricao, categoria || null, valor, data_vencimento, observacao || null, id]
  );
  return buscarContaPagarPorId(id);
}

async function baixarContaPagar(id, { data_pagamento, forma_pagamento }) {
  await db.query(
    `UPDATE contas_pagar SET status = 'pago', data_pagamento = ?, forma_pagamento = ? WHERE id = ?`,
    [data_pagamento, forma_pagamento || null, id]
  );
  return buscarContaPagarPorId(id);
}

async function cancelarContaPagar(id) {
  await db.query(`UPDATE contas_pagar SET status = 'cancelado' WHERE id = ?`, [id]);
  return buscarContaPagarPorId(id);
}

// ---------- Contas a receber ----------

async function criarContaReceber(dados) {
  const { empresa_id, cliente_id, origem, origem_id, descricao, valor, data_vencimento, observacao } = dados;
  const [result] = await db.query(
    `INSERT INTO contas_receber (empresa_id, cliente_id, origem, origem_id, descricao, valor, data_vencimento, observacao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [empresa_id, cliente_id || null, origem || 'manual', origem_id || null, descricao, valor, data_vencimento, observacao || null]
  );
  return buscarContaReceberPorId(result.insertId);
}

async function buscarContaReceberPorId(id) {
  const [rows] = await db.query(
    `SELECT cr.*, c.nome AS cliente_nome
     FROM contas_receber cr
     LEFT JOIN clientes c ON c.id = cr.cliente_id
     WHERE cr.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listarContasReceber(empresaId, { status, de, ate } = {}) {
  const condicoes = ['cr.empresa_id = ?'];
  const params = [empresaId];

  if (status) {
    condicoes.push('cr.status = ?');
    params.push(status);
  }
  if (de) {
    condicoes.push('cr.data_vencimento >= ?');
    params.push(de);
  }
  if (ate) {
    condicoes.push('cr.data_vencimento <= ?');
    params.push(ate);
  }

  const [rows] = await db.query(
    `SELECT cr.*, c.nome AS cliente_nome,
            CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN 1 ELSE 0 END AS atrasada
     FROM contas_receber cr
     LEFT JOIN clientes c ON c.id = cr.cliente_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY cr.data_vencimento ASC`,
    params
  );
  return rows;
}

async function atualizarContaReceber(id, dados) {
  const { cliente_id, descricao, valor, data_vencimento, observacao } = dados;
  await db.query(
    `UPDATE contas_receber SET cliente_id = ?, descricao = ?, valor = ?, data_vencimento = ?, observacao = ?
     WHERE id = ?`,
    [cliente_id || null, descricao, valor, data_vencimento, observacao || null, id]
  );
  return buscarContaReceberPorId(id);
}

async function baixarContaReceber(id, { data_recebimento, forma_recebimento }) {
  await db.query(
    `UPDATE contas_receber SET status = 'recebido', data_recebimento = ?, forma_recebimento = ? WHERE id = ?`,
    [data_recebimento, forma_recebimento || null, id]
  );
  return buscarContaReceberPorId(id);
}

async function cancelarContaReceber(id) {
  await db.query(`UPDATE contas_receber SET status = 'cancelado' WHERE id = ?`, [id]);
  return buscarContaReceberPorId(id);
}

// ---------- Fluxo de caixa ----------

async function totalVendasPeriodo(empresaId, de, ate) {
  const [[linha]] = await db.query(
    `SELECT COALESCE(SUM(total), 0) AS total
     FROM vendas
     WHERE empresa_id = ? AND status = 'concluida' AND DATE(data) BETWEEN ? AND ?`,
    [empresaId, de, ate]
  );
  return Number(linha.total);
}

async function totalContasPagasPeriodo(empresaId, de, ate) {
  const [[linha]] = await db.query(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM contas_pagar
     WHERE empresa_id = ? AND status = 'pago' AND data_pagamento BETWEEN ? AND ?`,
    [empresaId, de, ate]
  );
  return Number(linha.total);
}

async function totalContasRecebidasPeriodo(empresaId, de, ate) {
  const [[linha]] = await db.query(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM contas_receber
     WHERE empresa_id = ? AND status = 'recebido' AND data_recebimento BETWEEN ? AND ?`,
    [empresaId, de, ate]
  );
  return Number(linha.total);
}

async function fluxoDiario(empresaId, de, ate) {
  const [entradasVendas] = await db.query(
    `SELECT DATE(data) AS dia, SUM(total) AS total
     FROM vendas WHERE empresa_id = ? AND status = 'concluida' AND DATE(data) BETWEEN ? AND ?
     GROUP BY DATE(data)`,
    [empresaId, de, ate]
  );
  const [entradasRecebiveis] = await db.query(
    `SELECT data_recebimento AS dia, SUM(valor) AS total
     FROM contas_receber WHERE empresa_id = ? AND status = 'recebido' AND data_recebimento BETWEEN ? AND ?
     GROUP BY data_recebimento`,
    [empresaId, de, ate]
  );
  const [saidas] = await db.query(
    `SELECT data_pagamento AS dia, SUM(valor) AS total
     FROM contas_pagar WHERE empresa_id = ? AND status = 'pago' AND data_pagamento BETWEEN ? AND ?
     GROUP BY data_pagamento`,
    [empresaId, de, ate]
  );

  return { entradasVendas, entradasRecebiveis, saidas };
}

module.exports = {
  criarContaPagar,
  buscarContaPagarPorId,
  listarContasPagar,
  atualizarContaPagar,
  baixarContaPagar,
  cancelarContaPagar,
  criarContaReceber,
  buscarContaReceberPorId,
  listarContasReceber,
  atualizarContaReceber,
  baixarContaReceber,
  cancelarContaReceber,
  totalVendasPeriodo,
  totalContasPagasPeriodo,
  totalContasRecebidasPeriodo,
  fluxoDiario,
};

const db = require('../../config/database');

async function criar({ empresa_id, origem, origem_id, cliente_id, tipo, provider, ambiente, total }) {
  const [result] = await db.query(
    `INSERT INTO notas_fiscais (empresa_id, origem, origem_id, cliente_id, tipo, provider, ambiente, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [empresa_id, origem, origem_id || null, cliente_id || null, tipo, provider, ambiente, total ?? null]
  );
  return buscarPorId(result.insertId);
}

async function criarAvulsa(dados) {
  const {
    empresa_id,
    cliente_id,
    tipo,
    provider,
    ambiente,
    total,
    desconto,
    acrescimo,
    forma_pagamento,
    observacoes,
    vendedor_usuario_id,
    natureza_operacao,
    serie,
    enviar_email,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO notas_fiscais
      (empresa_id, origem, origem_id, cliente_id, tipo, provider, ambiente, total, desconto, acrescimo,
       forma_pagamento, observacoes, vendedor_usuario_id, natureza_operacao, serie, enviar_email)
     VALUES (?, 'avulsa', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      empresa_id,
      cliente_id || null,
      tipo,
      provider,
      ambiente,
      total,
      desconto || 0,
      acrescimo || 0,
      forma_pagamento || null,
      observacoes || null,
      vendedor_usuario_id || null,
      natureza_operacao || null,
      serie || null,
      enviar_email ? 1 : 0,
    ]
  );
  return buscarPorId(result.insertId);
}

async function inserirItem(notaFiscalId, { produto_id, quantidade, valor_unitario }) {
  await db.query(
    'INSERT INTO nota_fiscal_itens (nota_fiscal_id, produto_id, quantidade, valor_unitario) VALUES (?, ?, ?, ?)',
    [notaFiscalId, produto_id, quantidade, valor_unitario]
  );
}

async function listarItens(notaFiscalId) {
  const [rows] = await db.query(
    `SELECT nfi.*, p.nome AS produto_nome, p.referencia_interna
     FROM nota_fiscal_itens nfi
     JOIN produtos p ON p.id = nfi.produto_id
     WHERE nfi.nota_fiscal_id = ?`,
    [notaFiscalId]
  );
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    `SELECT nf.*, e.razao_social AS empresa_nome, e.cnpj AS empresa_cnpj,
            c.nome AS cliente_nome, c.cpf_cnpj AS cliente_documento
     FROM notas_fiscais nf
     JOIN empresas e ON e.id = nf.empresa_id
     LEFT JOIN clientes c ON c.id = nf.cliente_id
     WHERE nf.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function buscarAtivaPorOrigem(origem, origemId) {
  const [rows] = await db.query(
    `SELECT * FROM notas_fiscais
     WHERE origem = ? AND origem_id = ? AND status IN ('pendente', 'autorizada')
     ORDER BY criado_em DESC LIMIT 1`,
    [origem, origemId]
  );
  return rows[0] || null;
}

async function listarPorOrigem(origem, origemId) {
  const [rows] = await db.query(
    'SELECT * FROM notas_fiscais WHERE origem = ? AND origem_id = ? ORDER BY criado_em DESC',
    [origem, origemId]
  );
  return rows;
}

async function listar(empresaId, { status, tipo, origem, de, ate, busca } = {}) {
  const condicoes = ['nf.empresa_id = ?'];
  const params = [empresaId];

  if (status) {
    condicoes.push('nf.status = ?');
    params.push(status);
  }
  if (tipo) {
    condicoes.push('nf.tipo = ?');
    params.push(tipo);
  }
  if (origem) {
    condicoes.push('nf.origem = ?');
    params.push(origem);
  }
  if (de) {
    condicoes.push('DATE(nf.criado_em) >= ?');
    params.push(de);
  }
  if (ate) {
    condicoes.push('DATE(nf.criado_em) <= ?');
    params.push(ate);
  }
  if (busca) {
    condicoes.push('(nf.numero LIKE ? OR c.nome LIKE ? OR c.cpf_cnpj LIKE ?)');
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  const [rows] = await db.query(
    `SELECT nf.*, c.nome AS cliente_nome, c.cpf_cnpj AS cliente_documento
     FROM notas_fiscais nf
     LEFT JOIN clientes c ON c.id = nf.cliente_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY nf.criado_em DESC`,
    params
  );
  return rows;
}

async function resumoPeriodo(empresaId, de, ate) {
  const [[linha]] = await db.query(
    `SELECT COUNT(*) AS notas_emitidas,
            COALESCE(SUM(CASE WHEN status <> 'cancelada' THEN total ELSE 0 END), 0) AS valor_total,
            SUM(CASE WHEN tipo = 'nfce' THEN 1 ELSE 0 END) AS nfce_total,
            SUM(CASE WHEN tipo = 'nfe55' THEN 1 ELSE 0 END) AS nfe_total
     FROM notas_fiscais
     WHERE empresa_id = ? AND DATE(criado_em) BETWEEN ? AND ?`,
    [empresaId, de, ate]
  );
  return linha;
}

async function atualizar(id, dados) {
  const campos = [];
  const valores = [];

  for (const campo of ['status', 'provider_referencia', 'numero', 'serie', 'chave_acesso', 'motivo']) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(dados[campo]);
    }
  }

  if (campos.length === 0) return buscarPorId(id);

  valores.push(id);
  await db.query(`UPDATE notas_fiscais SET ${campos.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

module.exports = {
  criar,
  criarAvulsa,
  inserirItem,
  listarItens,
  buscarPorId,
  buscarAtivaPorOrigem,
  listarPorOrigem,
  listar,
  resumoPeriodo,
  atualizar,
};

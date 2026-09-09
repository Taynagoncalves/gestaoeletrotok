const db = require('../../config/database');

async function criar({ empresa_id, origem, origem_id, tipo, provider, ambiente }) {
  const [result] = await db.query(
    `INSERT INTO notas_fiscais (empresa_id, origem, origem_id, tipo, provider, ambiente, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pendente')`,
    [empresa_id, origem, origem_id, tipo, provider, ambiente]
  );
  return buscarPorId(result.insertId);
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    `SELECT nf.*, e.razao_social AS empresa_nome, e.cnpj AS empresa_cnpj
     FROM notas_fiscais nf
     JOIN empresas e ON e.id = nf.empresa_id
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

async function listar(empresaId, { status, tipo, origem } = {}) {
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

  const [rows] = await db.query(
    `SELECT nf.*, e.razao_social AS empresa_nome
     FROM notas_fiscais nf
     JOIN empresas e ON e.id = nf.empresa_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY nf.criado_em DESC`,
    params
  );
  return rows;
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
  buscarPorId,
  buscarAtivaPorOrigem,
  listarPorOrigem,
  listar,
  atualizar,
};

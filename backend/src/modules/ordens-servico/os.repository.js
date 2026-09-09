const db = require('../../config/database');

async function criar(dados) {
  const {
    empresa_id,
    cliente_id,
    tecnico_id,
    aparelho_modelo,
    imei,
    senha_desbloqueio,
    condicao_entrada,
    defeito_relatado,
    prazo_estimado,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO ordens_servico
      (empresa_id, cliente_id, tecnico_id, aparelho_modelo, imei, senha_desbloqueio,
       condicao_entrada, defeito_relatado, prazo_estimado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      empresa_id,
      cliente_id,
      tecnico_id || null,
      aparelho_modelo,
      imei || null,
      senha_desbloqueio || null,
      condicao_entrada || null,
      defeito_relatado || null,
      prazo_estimado || null,
    ]
  );

  return result.insertId;
}

async function buscarBasicoPorId(id) {
  const [rows] = await db.query('SELECT * FROM ordens_servico WHERE id = ?', [id]);
  return rows[0] || null;
}

async function buscarCompletoPorId(id) {
  const [osRows] = await db.query(
    `SELECT os.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
            e.razao_social AS empresa_nome, u.nome AS tecnico_nome
     FROM ordens_servico os
     JOIN clientes c ON c.id = os.cliente_id
     JOIN empresas e ON e.id = os.empresa_id
     LEFT JOIN usuarios u ON u.id = os.tecnico_id
     WHERE os.id = ?`,
    [id]
  );
  const os = osRows[0];
  if (!os) return null;

  const [checklist] = await db.query('SELECT * FROM os_checklist WHERE os_id = ?', [id]);
  const [termoRows] = await db.query('SELECT * FROM os_termo_responsabilidade WHERE os_id = ?', [id]);
  const [orcamentos] = await db.query(
    'SELECT * FROM os_orcamentos WHERE os_id = ? ORDER BY data_criacao DESC',
    [id]
  );

  for (const orcamento of orcamentos) {
    const [itens] = await db.query(
      `SELECT oi.*, p.nome AS produto_nome
       FROM os_orcamento_itens oi
       JOIN produtos p ON p.id = oi.produto_id
       WHERE oi.orcamento_id = ?`,
      [orcamento.id]
    );
    orcamento.itens = itens;
  }

  const [historico] = await db.query(
    `SELECT h.*, u.nome AS usuario_nome
     FROM os_historico_status h
     LEFT JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.os_id = ?
     ORDER BY h.data_hora DESC`,
    [id]
  );

  const [entregaRows] = await db.query('SELECT * FROM os_entrega WHERE os_id = ?', [id]);
  const [garantiaRows] = await db.query('SELECT * FROM os_garantia WHERE os_id = ?', [id]);
  const [fotos] = await db.query('SELECT id, criado_em FROM os_fotos WHERE os_id = ? ORDER BY criado_em', [id]);

  return {
    ...os,
    checklist,
    termo_responsabilidade: termoRows[0] || null,
    orcamentos,
    historico_status: historico,
    entrega: entregaRows[0] || null,
    garantia: garantiaRows[0] || null,
    fotos,
  };
}

async function listar(empresaId, { status, tecnico_id } = {}) {
  const condicoes = ['os.empresa_id = ?'];
  const params = [empresaId];

  if (status) {
    condicoes.push('os.status = ?');
    params.push(status);
  }
  if (tecnico_id) {
    condicoes.push('os.tecnico_id = ?');
    params.push(tecnico_id);
  }

  const [rows] = await db.query(
    `SELECT os.id, os.aparelho_modelo, os.status, os.prazo_estimado, os.data_abertura,
            c.nome AS cliente_nome, u.nome AS tecnico_nome
     FROM ordens_servico os
     JOIN clientes c ON c.id = os.cliente_id
     LEFT JOIN usuarios u ON u.id = os.tecnico_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY os.data_abertura DESC`,
    params
  );
  return rows;
}

async function atualizarDadosGerais(id, dados) {
  const campos = [];
  const valores = [];

  for (const campo of ['tecnico_id', 'defeito_relatado', 'prazo_estimado']) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(dados[campo]);
    }
  }

  if (campos.length === 0) return;

  valores.push(id);
  await db.query(`UPDATE ordens_servico SET ${campos.join(', ')} WHERE id = ?`, valores);
}

async function atualizarStatus(id, status) {
  await db.query('UPDATE ordens_servico SET status = ? WHERE id = ?', [status, id]);
}

async function inserirHistoricoStatus(osId, status, usuarioId) {
  await db.query(
    'INSERT INTO os_historico_status (os_id, status, usuario_id) VALUES (?, ?, ?)',
    [osId, status, usuarioId || null]
  );
}

async function substituirChecklist(osId, itens) {
  await db.query('DELETE FROM os_checklist WHERE os_id = ?', [osId]);
  for (const item of itens) {
    await db.query(
      'INSERT INTO os_checklist (os_id, tipo, item, marcado, resultado) VALUES (?, ?, ?, ?, ?)',
      [osId, item.tipo || 'outro', item.item, item.marcado ? 1 : 0, item.resultado || null]
    );
  }
}

async function inserirFoto(osId, imagemBase64) {
  const [result] = await db.query('INSERT INTO os_fotos (os_id, imagem_base64) VALUES (?, ?)', [
    osId,
    imagemBase64,
  ]);
  return result.insertId;
}

async function listarFotos(osId) {
  const [rows] = await db.query('SELECT id, os_id, criado_em FROM os_fotos WHERE os_id = ? ORDER BY criado_em', [osId]);
  return rows;
}

async function buscarFotoPorId(id) {
  const [rows] = await db.query('SELECT * FROM os_fotos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function removerFoto(id) {
  await db.query('DELETE FROM os_fotos WHERE id = ?', [id]);
}

async function upsertTermo(osId, assinaturaBase64) {
  await db.query(
    `INSERT INTO os_termo_responsabilidade (os_id, assinatura_base64)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE assinatura_base64 = VALUES(assinatura_base64), data_hora = CURRENT_TIMESTAMP`,
    [osId, assinaturaBase64]
  );
}

async function inserirOrcamento(osId, { valor_pecas, valor_mao_obra }) {
  const [result] = await db.query(
    'INSERT INTO os_orcamentos (os_id, valor_pecas, valor_mao_obra) VALUES (?, ?, ?)',
    [osId, valor_pecas || 0, valor_mao_obra || 0]
  );
  return result.insertId;
}

async function inserirOrcamentoItem(orcamentoId, { produto_id, quantidade, valor }) {
  await db.query(
    'INSERT INTO os_orcamento_itens (orcamento_id, produto_id, quantidade, valor) VALUES (?, ?, ?, ?)',
    [orcamentoId, produto_id, quantidade || 1, valor]
  );
}

async function buscarOrcamentoPorId(orcamentoId) {
  const [rows] = await db.query('SELECT * FROM os_orcamentos WHERE id = ?', [orcamentoId]);
  return rows[0] || null;
}

async function buscarOrcamentoAprovadoPorOs(osId) {
  const [rows] = await db.query(
    `SELECT * FROM os_orcamentos WHERE os_id = ? AND status = 'aprovado' ORDER BY data_resposta DESC LIMIT 1`,
    [osId]
  );
  return rows[0] || null;
}

async function listarItensOrcamento(orcamentoId) {
  const [rows] = await db.query('SELECT * FROM os_orcamento_itens WHERE orcamento_id = ?', [orcamentoId]);
  return rows;
}

async function atualizarStatusOrcamento(orcamentoId, status) {
  await db.query(
    'UPDATE os_orcamentos SET status = ?, data_resposta = CURRENT_TIMESTAMP WHERE id = ?',
    [status, orcamentoId]
  );
}

async function inserirEntrega(osId, { retirado_por, usuario_id }) {
  await db.query('INSERT INTO os_entrega (os_id, retirado_por, usuario_id) VALUES (?, ?, ?)', [
    osId,
    retirado_por,
    usuario_id || null,
  ]);
}

async function upsertGarantia(osId, { prazo_dias, cobertura }) {
  await db.query(
    `INSERT INTO os_garantia (os_id, prazo_dias, cobertura)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE prazo_dias = VALUES(prazo_dias), cobertura = VALUES(cobertura)`,
    [osId, prazo_dias, cobertura || null]
  );
}

module.exports = {
  criar,
  buscarBasicoPorId,
  buscarCompletoPorId,
  listar,
  atualizarDadosGerais,
  atualizarStatus,
  inserirHistoricoStatus,
  substituirChecklist,
  upsertTermo,
  inserirOrcamento,
  inserirOrcamentoItem,
  buscarOrcamentoPorId,
  buscarOrcamentoAprovadoPorOs,
  listarItensOrcamento,
  atualizarStatusOrcamento,
  inserirEntrega,
  upsertGarantia,
  inserirFoto,
  listarFotos,
  buscarFotoPorId,
  removerFoto,
};

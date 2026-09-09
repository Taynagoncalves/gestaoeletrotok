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

async function buscarConfigFiscal(empresaId) {
  const [rows] = await db.query('SELECT * FROM empresas_config_fiscal WHERE empresa_id = ?', [empresaId]);
  return rows[0] || null;
}

async function salvarConfigFiscal(empresaId, dados) {
  const {
    razao_social_emitente,
    regime_tributario_emitente,
    provider,
    provider_token_criptografado,
    certificado_base64_criptografado,
    certificado_nome_arquivo,
    certificado_senha_criptografada,
    certificado_validade,
    serie_nfce,
    serie_nfe,
    ambiente,
  } = dados;

  await db.query(
    `INSERT INTO empresas_config_fiscal
      (empresa_id, razao_social_emitente, regime_tributario_emitente, provider, provider_token,
       certificado_base64, certificado_nome_arquivo, certificado_senha, certificado_validade,
       serie_nfce, serie_nfe, ambiente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       razao_social_emitente = VALUES(razao_social_emitente),
       regime_tributario_emitente = VALUES(regime_tributario_emitente),
       provider = VALUES(provider),
       provider_token = COALESCE(VALUES(provider_token), provider_token),
       certificado_base64 = COALESCE(VALUES(certificado_base64), certificado_base64),
       certificado_nome_arquivo = COALESCE(VALUES(certificado_nome_arquivo), certificado_nome_arquivo),
       certificado_senha = COALESCE(VALUES(certificado_senha), certificado_senha),
       certificado_validade = VALUES(certificado_validade),
       serie_nfce = VALUES(serie_nfce),
       serie_nfe = VALUES(serie_nfe),
       ambiente = VALUES(ambiente)`,
    [
      empresaId,
      razao_social_emitente || null,
      regime_tributario_emitente || null,
      provider || null,
      provider_token_criptografado ?? null,
      certificado_base64_criptografado ?? null,
      certificado_nome_arquivo || null,
      certificado_senha_criptografada ?? null,
      certificado_validade || null,
      serie_nfce || null,
      serie_nfe || null,
      ambiente || 'homologacao',
    ]
  );

  return buscarConfigFiscal(empresaId);
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorCnpj,
  criar,
  atualizar,
  buscarConfigFiscal,
  salvarConfigFiscal,
};

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
    logradouro,
    numero,
    complemento,
    bairro,
    municipio,
    codigo_municipio_ibge,
    uf,
    cep,
    cnae,
    inscricao_municipal,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO empresas
      (cnpj, razao_social, nome_fantasia, tipo, regime_tributario, inscricao_estadual, endereco, telefone,
       logradouro, numero, complemento, bairro, municipio, codigo_municipio_ibge, uf, cep, cnae, inscricao_municipal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cnpj,
      razao_social,
      nome_fantasia || null,
      tipo,
      regime_tributario || null,
      inscricao_estadual || null,
      endereco || null,
      telefone || null,
      logradouro || null,
      numero || null,
      complemento || null,
      bairro || null,
      municipio || null,
      codigo_municipio_ibge || null,
      uf || null,
      cep || null,
      cnae || null,
      inscricao_municipal || null,
    ]
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
    logradouro,
    numero,
    complemento,
    bairro,
    municipio,
    codigo_municipio_ibge,
    uf,
    cep,
    cnae,
    inscricao_municipal,
  } = dados;

  await db.query(
    `UPDATE empresas SET
      razao_social = ?, nome_fantasia = ?, tipo = ?, regime_tributario = ?,
      inscricao_estadual = ?, endereco = ?, telefone = ?, ativa = ?,
      logradouro = ?, numero = ?, complemento = ?, bairro = ?, municipio = ?,
      codigo_municipio_ibge = ?, uf = ?, cep = ?, cnae = ?, inscricao_municipal = ?
     WHERE id = ?`,
    [
      razao_social,
      nome_fantasia || null,
      tipo,
      regime_tributario || null,
      inscricao_estadual || null,
      endereco || null,
      telefone || null,
      ativa ?? 1,
      logradouro || null,
      numero || null,
      complemento || null,
      bairro || null,
      municipio || null,
      codigo_municipio_ibge || null,
      uf || null,
      cep || null,
      cnae || null,
      inscricao_municipal || null,
      id,
    ]
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
    csc_id,
    csc_token_criptografado,
  } = dados;

  await db.query(
    `INSERT INTO empresas_config_fiscal
      (empresa_id, razao_social_emitente, regime_tributario_emitente, provider, provider_token,
       certificado_base64, certificado_nome_arquivo, certificado_senha, certificado_validade,
       serie_nfce, serie_nfe, ambiente, csc_id, csc_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       ambiente = VALUES(ambiente),
       csc_id = COALESCE(VALUES(csc_id), csc_id),
       csc_token = COALESCE(VALUES(csc_token), csc_token)`,
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
      csc_id || null,
      csc_token_criptografado ?? null,
    ]
  );

  return buscarConfigFiscal(empresaId);
}

async function salvarRegistroProvider(empresaId, { provider_empresa_id, habilitado_nfce, habilitado_nfe }) {
  await db.query(
    `UPDATE empresas_config_fiscal SET provider_empresa_id = ?, habilitado_nfce = ?, habilitado_nfe = ?
     WHERE empresa_id = ?`,
    [provider_empresa_id || null, habilitado_nfce ? 1 : 0, habilitado_nfe ? 1 : 0, empresaId]
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
  salvarRegistroProvider,
};

const db = require('../../config/database');

async function listar() {
  const [rows] = await db.query(
    `SELECT p.*,
      (SELECT tp.preco_venda FROM tabela_precos tp JOIN empresas e ON e.id = tp.empresa_id
        WHERE tp.produto_id = p.id AND e.tipo = 'varejo' ORDER BY tp.empresa_id LIMIT 1) AS preco_varejo,
      (SELECT tp.preco_venda FROM tabela_precos tp JOIN empresas e ON e.id = tp.empresa_id
        WHERE tp.produto_id = p.id AND e.tipo = 'atacado' ORDER BY tp.empresa_id LIMIT 1) AS preco_atacado,
      (CASE WHEN p.tipo = 'celular'
        THEN (SELECT COUNT(*) FROM produto_itens pi WHERE pi.produto_id = p.id AND pi.status = 'em_estoque')
        ELSE COALESCE((SELECT SUM(es.quantidade) FROM estoque_saldos es WHERE es.produto_id = p.id), 0)
      END) AS estoque_total
    FROM produtos p
    ORDER BY p.nome`
  );
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    `SELECT p.*, f.razao_social AS fornecedor_padrao_nome
     FROM produtos p
     LEFT JOIN fornecedores f ON f.id = p.fornecedor_padrao_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function criar(dados) {
  const {
    nome,
    categoria,
    subcategoria,
    marca,
    modelo,
    referencia_interna,
    codigo_ean,
    tipo,
    descricao,
    imagem_base64,
    estoque_minimo,
    peso_kg,
    unidade_medida,
    fornecedor_padrao_id,
    codigo_fornecedor,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO produtos
      (nome, categoria, subcategoria, marca, modelo, referencia_interna, codigo_ean, tipo,
       descricao, imagem_base64, estoque_minimo, peso_kg, unidade_medida, fornecedor_padrao_id, codigo_fornecedor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome,
      categoria || null,
      subcategoria || null,
      marca || null,
      modelo || null,
      referencia_interna || null,
      codigo_ean || null,
      tipo,
      descricao || null,
      imagem_base64 || null,
      estoque_minimo || 0,
      peso_kg || null,
      unidade_medida || 'UN',
      fornecedor_padrao_id || null,
      codigo_fornecedor || null,
    ]
  );

  return buscarPorId(result.insertId);
}

async function atualizar(id, dados) {
  const {
    nome,
    categoria,
    subcategoria,
    marca,
    modelo,
    referencia_interna,
    codigo_ean,
    descricao,
    imagem_base64,
    estoque_minimo,
    peso_kg,
    unidade_medida,
    fornecedor_padrao_id,
    codigo_fornecedor,
    ativo,
  } = dados;

  await db.query(
    `UPDATE produtos SET
      nome = ?, categoria = ?, subcategoria = ?, marca = ?, modelo = ?, referencia_interna = ?,
      codigo_ean = ?, descricao = ?, imagem_base64 = ?, estoque_minimo = ?, peso_kg = ?,
      unidade_medida = ?, fornecedor_padrao_id = ?, codigo_fornecedor = ?, ativo = ?
     WHERE id = ?`,
    [
      nome,
      categoria || null,
      subcategoria || null,
      marca || null,
      modelo || null,
      referencia_interna || null,
      codigo_ean || null,
      descricao || null,
      imagem_base64 || null,
      estoque_minimo || 0,
      peso_kg || null,
      unidade_medida || 'UN',
      fornecedor_padrao_id || null,
      codigo_fornecedor || null,
      ativo ?? 1,
      id,
    ]
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

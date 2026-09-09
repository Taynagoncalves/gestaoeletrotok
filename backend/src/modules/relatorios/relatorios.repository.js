const db = require('../../config/database');

const EXPRESSOES_AGRUPAMENTO = {
  dia: 'DATE(v.data)',
  semana: "DATE_FORMAT(v.data, '%x-S%v')",
  mes: "DATE_FORMAT(v.data, '%Y-%m')",
};

function condicaoEmpresa(empresaId, consolidado) {
  if (consolidado) return { condicao: '1 = 1', params: [] };
  return { condicao: 'v.empresa_id = ?', params: [empresaId] };
}

async function vendasPorPeriodo(agrupamento, empresaId, consolidado, de, ate) {
  const expressao = EXPRESSOES_AGRUPAMENTO[agrupamento] || EXPRESSOES_AGRUPAMENTO.dia;
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);

  const [rows] = await db.query(
    `SELECT ${expressao} AS periodo, SUM(v.total) AS total, COUNT(*) AS quantidade
     FROM vendas v
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY periodo
     ORDER BY periodo`,
    [...params, de, ate]
  );
  return rows;
}

async function vendasPorEmpresa(de, ate) {
  const [rows] = await db.query(
    `SELECT e.id AS empresa_id, e.razao_social AS empresa_nome, e.tipo AS empresa_tipo,
            COALESCE(SUM(v.total), 0) AS total, COUNT(v.id) AS quantidade
     FROM empresas e
     LEFT JOIN vendas v ON v.empresa_id = e.id AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY e.id, e.razao_social, e.tipo
     ORDER BY total DESC`,
    [de, ate]
  );
  return rows;
}

async function vendasPorFormaPagamento(empresaId, consolidado, de, ate) {
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);
  const [rows] = await db.query(
    `SELECT vp.forma, COALESCE(SUM(vp.valor), 0) AS total
     FROM venda_pagamentos vp
     JOIN vendas v ON v.id = vp.venda_id
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY vp.forma`,
    [...params, de, ate]
  );
  return rows;
}

async function vendasPorCanal(empresaId, consolidado, de, ate) {
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);
  const [rows] = await db.query(
    `SELECT v.canal, COALESCE(SUM(v.total), 0) AS total, COUNT(*) AS quantidade
     FROM vendas v
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY v.canal`,
    [...params, de, ate]
  );
  return rows;
}

async function totaisGerais(empresaId, consolidado, de, ate) {
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);
  const [[linha]] = await db.query(
    `SELECT COALESCE(SUM(v.total), 0) AS total, COUNT(*) AS quantidade
     FROM vendas v
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?`,
    [...params, de, ate]
  );
  return linha;
}

async function margemPorProduto(empresaId, consolidado, de, ate) {
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);
  const [rows] = await db.query(
    `SELECT vi.produto_id, p.nome, p.categoria,
            SUM(vi.quantidade) AS quantidade_vendida,
            SUM(vi.quantidade * vi.preco_unitario) AS receita,
            SUM(vi.quantidade * COALESCE(vi.custo_unitario_snapshot, 0)) AS custo
     FROM venda_itens vi
     JOIN vendas v ON v.id = vi.venda_id
     JOIN produtos p ON p.id = vi.produto_id
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY vi.produto_id, p.nome, p.categoria
     ORDER BY (SUM(vi.quantidade * vi.preco_unitario) - SUM(vi.quantidade * COALESCE(vi.custo_unitario_snapshot, 0))) DESC`,
    [...params, de, ate]
  );
  return rows;
}

async function margemPorVenda(empresaId, consolidado, de, ate) {
  const { condicao, params } = condicaoEmpresa(empresaId, consolidado);
  const [rows] = await db.query(
    `SELECT v.id AS venda_id, v.data, v.total, e.razao_social AS empresa_nome,
            SUM(vi.quantidade * vi.preco_unitario) AS receita,
            SUM(vi.quantidade * COALESCE(vi.custo_unitario_snapshot, 0)) AS custo
     FROM vendas v
     JOIN venda_itens vi ON vi.venda_id = v.id
     JOIN empresas e ON e.id = v.empresa_id
     WHERE ${condicao} AND v.status = 'concluida' AND DATE(v.data) BETWEEN ? AND ?
     GROUP BY v.id, v.data, v.total, e.razao_social
     ORDER BY v.data DESC`,
    [...params, de, ate]
  );
  return rows;
}

async function estoqueConsolidado() {
  const [produtos] = await db.query(
    `SELECT id, nome, tipo, categoria, estoque_minimo FROM produtos WHERE ativo = 1 ORDER BY nome`
  );
  const [empresas] = await db.query(`SELECT id, razao_social, tipo FROM empresas WHERE ativa = 1`);

  const [saldosNaoSerializados] = await db.query(
    `SELECT produto_id, empresa_id, quantidade FROM estoque_saldos`
  );
  const [saldosSerializados] = await db.query(
    `SELECT produto_id, empresa_id, COUNT(*) AS quantidade
     FROM produto_itens WHERE status = 'em_estoque'
     GROUP BY produto_id, empresa_id`
  );

  const mapaSaldos = new Map();
  [...saldosNaoSerializados, ...saldosSerializados].forEach((linha) => {
    const chave = `${linha.produto_id}-${linha.empresa_id}`;
    mapaSaldos.set(chave, (mapaSaldos.get(chave) || 0) + Number(linha.quantidade));
  });

  return produtos.map((produto) => {
    const porEmpresa = empresas.map((empresa) => ({
      empresa_id: empresa.id,
      empresa_nome: empresa.razao_social,
      empresa_tipo: empresa.tipo,
      saldo: mapaSaldos.get(`${produto.id}-${empresa.id}`) || 0,
    }));
    const saldoTotal = porEmpresa.reduce((soma, e) => soma + e.saldo, 0);

    return {
      produto_id: produto.id,
      nome: produto.nome,
      tipo: produto.tipo,
      categoria: produto.categoria,
      estoque_minimo: produto.estoque_minimo,
      saldo_total: saldoTotal,
      por_empresa: porEmpresa,
    };
  });
}

module.exports = {
  vendasPorPeriodo,
  vendasPorEmpresa,
  vendasPorFormaPagamento,
  vendasPorCanal,
  totaisGerais,
  margemPorProduto,
  margemPorVenda,
  estoqueConsolidado,
};

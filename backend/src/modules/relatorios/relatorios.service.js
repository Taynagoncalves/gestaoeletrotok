const repository = require('./relatorios.repository');
const AppError = require('../../shared/errors/AppError');

const AGRUPAMENTOS_VALIDOS = ['dia', 'semana', 'mes'];

function validarPeriodo(empresaId, consolidado, de, ate) {
  if (!consolidado && !empresaId) {
    throw new AppError('Informe uma empresa ou marque a consulta como consolidada.');
  }
  if (!de || !ate) {
    throw new AppError('Período (de/até) é obrigatório.');
  }
}

function calcularMargem(receita, custo) {
  const margem = receita - custo;
  const percentual = receita > 0 ? (margem / receita) * 100 : 0;
  return { margem, percentual };
}

async function relatorioVendas({ empresa_id, consolidado, de, ate, agrupar }) {
  const ehConsolidado = consolidado === 'true' || consolidado === true;
  validarPeriodo(empresa_id, ehConsolidado, de, ate);

  const agrupamento = AGRUPAMENTOS_VALIDOS.includes(agrupar) ? agrupar : 'dia';

  const [totais, porPeriodo, porFormaPagamento, porCanal, porEmpresa] = await Promise.all([
    repository.totaisGerais(empresa_id, ehConsolidado, de, ate),
    repository.vendasPorPeriodo(agrupamento, empresa_id, ehConsolidado, de, ate),
    repository.vendasPorFormaPagamento(empresa_id, ehConsolidado, de, ate),
    repository.vendasPorCanal(empresa_id, ehConsolidado, de, ate),
    ehConsolidado ? repository.vendasPorEmpresa(de, ate) : Promise.resolve(null),
  ]);

  return {
    periodo: { de, ate, agrupamento },
    consolidado: ehConsolidado,
    total: Number(totais.total),
    quantidade: totais.quantidade,
    ticket_medio: totais.quantidade ? Number(totais.total) / totais.quantidade : 0,
    por_periodo: porPeriodo,
    por_forma_pagamento: porFormaPagamento,
    por_canal: porCanal,
    por_empresa: porEmpresa,
  };
}

async function relatorioMargem({ empresa_id, consolidado, de, ate, limite }) {
  const ehConsolidado = consolidado === 'true' || consolidado === true;
  validarPeriodo(empresa_id, ehConsolidado, de, ate);

  const produtos = await repository.margemPorProduto(empresa_id, ehConsolidado, de, ate);

  const produtosComMargem = produtos.map((p) => {
    const receita = Number(p.receita);
    const custo = Number(p.custo);
    const { margem, percentual } = calcularMargem(receita, custo);
    return {
      produto_id: p.produto_id,
      nome: p.nome,
      categoria: p.categoria,
      quantidade_vendida: p.quantidade_vendida,
      receita,
      custo,
      margem,
      margem_percentual: percentual,
    };
  });

  const limitado = limite ? produtosComMargem.slice(0, Number(limite)) : produtosComMargem;

  const receitaTotal = produtosComMargem.reduce((soma, p) => soma + p.receita, 0);
  const custoTotal = produtosComMargem.reduce((soma, p) => soma + p.custo, 0);
  const { margem: margemTotal, percentual: percentualTotal } = calcularMargem(receitaTotal, custoTotal);

  return {
    periodo: { de, ate },
    consolidado: ehConsolidado,
    totais: {
      receita: receitaTotal,
      custo: custoTotal,
      margem: margemTotal,
      margem_percentual: percentualTotal,
    },
    produtos: limitado,
  };
}

async function relatorioMargemPorVenda({ empresa_id, consolidado, de, ate }) {
  const ehConsolidado = consolidado === 'true' || consolidado === true;
  validarPeriodo(empresa_id, ehConsolidado, de, ate);

  const vendas = await repository.margemPorVenda(empresa_id, ehConsolidado, de, ate);
  return vendas.map((v) => {
    const receita = Number(v.receita);
    const custo = Number(v.custo);
    const { margem, percentual } = calcularMargem(receita, custo);
    return {
      venda_id: v.venda_id,
      data: v.data,
      empresa_nome: v.empresa_nome,
      total: Number(v.total),
      receita,
      custo,
      margem,
      margem_percentual: percentual,
    };
  });
}

async function relatorioEstoqueConsolidado() {
  return repository.estoqueConsolidado();
}

module.exports = {
  relatorioVendas,
  relatorioMargem,
  relatorioMargemPorVenda,
  relatorioEstoqueConsolidado,
};

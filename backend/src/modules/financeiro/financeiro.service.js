const repository = require('./financeiro.repository');
const AppError = require('../../shared/errors/AppError');

const FORMAS_VALIDAS = ['dinheiro', 'debito', 'credito', 'pix', 'boleto', 'transferencia'];

function validarContaComum(dados) {
  if (!dados.empresa_id) throw new AppError('Empresa é obrigatória.');
  if (!dados.descricao) throw new AppError('Descrição é obrigatória.');
  if (!dados.valor || Number(dados.valor) <= 0) throw new AppError('Valor deve ser maior que zero.');
  if (!dados.data_vencimento) throw new AppError('Data de vencimento é obrigatória.');
}

// ---------- Contas a pagar ----------

async function criarContaPagar(dados) {
  validarContaComum(dados);
  return repository.criarContaPagar(dados);
}

async function buscarContaPagarPorId(id) {
  const conta = await repository.buscarContaPagarPorId(id);
  if (!conta) throw new AppError('Conta a pagar não encontrada.', 404);
  return conta;
}

async function listarContasPagar(empresaId, filtros) {
  if (!empresaId) throw new AppError('Empresa é obrigatória.');
  return repository.listarContasPagar(empresaId, filtros);
}

async function atualizarContaPagar(id, dados) {
  const conta = await buscarContaPagarPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Só é possível editar contas pendentes.');
  }
  validarContaComum({ ...dados, empresa_id: conta.empresa_id });
  return repository.atualizarContaPagar(id, dados);
}

async function baixarContaPagar(id, dados) {
  const conta = await buscarContaPagarPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Esta conta já foi paga ou cancelada.');
  }
  if (dados.forma_pagamento && !FORMAS_VALIDAS.includes(dados.forma_pagamento)) {
    throw new AppError('Forma de pagamento inválida.');
  }
  return repository.baixarContaPagar(id, {
    data_pagamento: dados.data_pagamento || new Date().toISOString().slice(0, 10),
    forma_pagamento: dados.forma_pagamento,
  });
}

async function cancelarContaPagar(id) {
  const conta = await buscarContaPagarPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Só é possível cancelar contas pendentes.');
  }
  return repository.cancelarContaPagar(id);
}

// ---------- Contas a receber ----------

async function criarContaReceber(dados) {
  validarContaComum(dados);
  return repository.criarContaReceber(dados);
}

async function buscarContaReceberPorId(id) {
  const conta = await repository.buscarContaReceberPorId(id);
  if (!conta) throw new AppError('Conta a receber não encontrada.', 404);
  return conta;
}

async function listarContasReceber(empresaId, filtros) {
  if (!empresaId) throw new AppError('Empresa é obrigatória.');
  return repository.listarContasReceber(empresaId, filtros);
}

async function atualizarContaReceber(id, dados) {
  const conta = await buscarContaReceberPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Só é possível editar contas pendentes.');
  }
  validarContaComum({ ...dados, empresa_id: conta.empresa_id });
  return repository.atualizarContaReceber(id, dados);
}

async function baixarContaReceber(id, dados) {
  const conta = await buscarContaReceberPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Esta conta já foi recebida ou cancelada.');
  }
  if (dados.forma_recebimento && !FORMAS_VALIDAS.includes(dados.forma_recebimento)) {
    throw new AppError('Forma de recebimento inválida.');
  }
  return repository.baixarContaReceber(id, {
    data_recebimento: dados.data_recebimento || new Date().toISOString().slice(0, 10),
    forma_recebimento: dados.forma_recebimento,
  });
}

async function cancelarContaReceber(id) {
  const conta = await buscarContaReceberPorId(id);
  if (conta.status !== 'pendente') {
    throw new AppError('Só é possível cancelar contas pendentes.');
  }
  return repository.cancelarContaReceber(id);
}

// ---------- Fluxo de caixa ----------

async function resumoFluxoCaixa(empresaId, de, ate) {
  if (!empresaId || !de || !ate) {
    throw new AppError('Empresa e período são obrigatórios.');
  }

  const [totalVendas, totalPago, totalRecebido] = await Promise.all([
    repository.totalVendasPeriodo(empresaId, de, ate),
    repository.totalContasPagasPeriodo(empresaId, de, ate),
    repository.totalContasRecebidasPeriodo(empresaId, de, ate),
  ]);

  const [contasPagarPendentes, contasReceberPendentes] = await Promise.all([
    repository.listarContasPagar(empresaId, { status: 'pendente' }),
    repository.listarContasReceber(empresaId, { status: 'pendente' }),
  ]);

  const totalAPagar = contasPagarPendentes.reduce((soma, c) => soma + Number(c.valor), 0);
  const totalAReceber = contasReceberPendentes.reduce((soma, c) => soma + Number(c.valor), 0);
  const totalPagarAtrasado = contasPagarPendentes.filter((c) => c.atrasada).reduce((soma, c) => soma + Number(c.valor), 0);
  const totalReceberAtrasado = contasReceberPendentes.filter((c) => c.atrasada).reduce((soma, c) => soma + Number(c.valor), 0);

  const totalEntradas = totalVendas + totalRecebido;
  const totalSaidas = totalPago;

  return {
    periodo: { de, ate },
    entradas: { vendas: totalVendas, contas_recebidas: totalRecebido, total: totalEntradas },
    saidas: { contas_pagas: totalPago, total: totalSaidas },
    saldo_periodo: totalEntradas - totalSaidas,
    pendencias: {
      a_pagar: totalAPagar,
      a_pagar_atrasado: totalPagarAtrasado,
      a_receber: totalAReceber,
      a_receber_atrasado: totalReceberAtrasado,
    },
  };
}

async function fluxoDiario(empresaId, de, ate) {
  if (!empresaId || !de || !ate) {
    throw new AppError('Empresa e período são obrigatórios.');
  }

  const { entradasVendas, entradasRecebiveis, saidas } = await repository.fluxoDiario(empresaId, de, ate);

  const mapaEntradas = new Map();
  entradasVendas.forEach((l) => mapaEntradas.set(l.dia, (mapaEntradas.get(l.dia) || 0) + Number(l.total)));
  entradasRecebiveis.forEach((l) => mapaEntradas.set(l.dia, (mapaEntradas.get(l.dia) || 0) + Number(l.total)));

  const mapaSaidas = new Map();
  saidas.forEach((l) => mapaSaidas.set(l.dia, Number(l.total)));

  const dias = new Set([...mapaEntradas.keys(), ...mapaSaidas.keys()]);
  return [...dias]
    .sort()
    .map((dia) => ({
      dia,
      entradas: mapaEntradas.get(dia) || 0,
      saidas: mapaSaidas.get(dia) || 0,
      saldo: (mapaEntradas.get(dia) || 0) - (mapaSaidas.get(dia) || 0),
    }));
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
  resumoFluxoCaixa,
  fluxoDiario,
};

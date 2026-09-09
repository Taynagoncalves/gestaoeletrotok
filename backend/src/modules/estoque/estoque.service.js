const db = require('../../config/database');
const repository = require('./estoque.repository');
const AppError = require('../../shared/errors/AppError');

const MOTIVOS_ENTRADA = ['compra', 'transferencia', 'ajuste'];

async function registrarEntrada(dados) {
  const {
    produto_id,
    empresa_id,
    motivo,
    fornecedor_id,
    empresa_origem_id,
    valor_unitario,
    quantidade,
    itens,
    observacao,
    usuario_id,
    data,
  } = dados;

  if (!produto_id || !empresa_id || !motivo) {
    throw new AppError('Produto, empresa e motivo são obrigatórios.');
  }

  if (!MOTIVOS_ENTRADA.includes(motivo)) {
    throw new AppError('Motivo de entrada inválido.');
  }

  if (motivo === 'compra' || motivo === 'transferencia') {
    const temFornecedor = Boolean(fornecedor_id);
    const temEmpresaOrigem = Boolean(empresa_origem_id);

    if (temFornecedor === temEmpresaOrigem) {
      throw new AppError(
        'Informe exatamente uma origem: fornecedor_id (compra externa) ou empresa_origem_id (transferência interna).'
      );
    }

    if (motivo === 'compra' && !temFornecedor) {
      throw new AppError('Entrada por compra exige fornecedor_id.');
    }

    if (motivo === 'transferencia' && !temEmpresaOrigem) {
      throw new AppError('Entrada por transferência exige empresa_origem_id.');
    }

    if (motivo === 'transferencia' && Number(empresa_origem_id) === Number(empresa_id)) {
      throw new AppError('Empresa de origem não pode ser a mesma empresa de destino.');
    }
  }

  const produto = await repository.buscarProduto(produto_id);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  const ehSerializado = produto.tipo === 'celular';

  if (ehSerializado) {
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new AppError('Produtos do tipo celular exigem a lista de itens (IMEI + condição) na entrada.');
    }
    for (const item of itens) {
      if (!item.imei || !item.condicao) {
        throw new AppError('Cada item precisa de imei e condicao.');
      }
    }
  } else if (!quantidade || quantidade <= 0) {
    throw new AppError('Quantidade deve ser maior que zero.');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (ehSerializado) {
      for (const item of itens) {
        const produtoItemId = await repository.inserirItemSerializado(connection, {
          produto_id,
          empresa_id,
          imei: item.imei,
          condicao: item.condicao,
        });

        await repository.inserirMovimentacao(connection, {
          produto_id,
          empresa_id,
          produto_item_id: produtoItemId,
          tipo: 'entrada',
          quantidade: 1,
          valor_unitario: item.valor_unitario ?? valor_unitario,
          fornecedor_id,
          empresa_origem_id,
          motivo,
          observacao,
          usuario_id,
          data,
        });
      }
    } else {
      await repository.ajustarSaldoNaoSerializado(connection, {
        produto_id,
        empresa_id,
        delta: quantidade,
      });

      await repository.inserirMovimentacao(connection, {
        produto_id,
        empresa_id,
        tipo: 'entrada',
        quantidade,
        valor_unitario,
        fornecedor_id,
        empresa_origem_id,
        motivo,
        observacao,
        usuario_id,
        data,
      });
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return { sucesso: true };
}

async function consultarSaldo(produtoId, empresaId) {
  const produto = await repository.buscarProduto(produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  if (produto.tipo === 'celular') {
    const total = await repository.contarItensEmEstoque(produtoId, empresaId);
    const itens = await repository.listarItensEmEstoque(produtoId, empresaId);
    return { saldo: total, itens };
  }

  const saldo = await repository.saldoNaoSerializado(produtoId, empresaId);
  return { saldo };
}

async function consultarCustoAtual(produtoId, empresaId) {
  const custo = await repository.custoMaisRecente(produtoId, empresaId);
  if (!custo) {
    return { custo_unitario: null };
  }
  return {
    custo_unitario: custo.valor_unitario,
    data_referencia: custo.data,
    origem: custo.fornecedor_id ? 'fornecedor' : 'transferencia_interna',
  };
}

async function historico(produtoId, empresaId) {
  return repository.historico(produtoId, empresaId);
}

async function listarEstoqueBaixo(empresaId) {
  const saldos = await repository.saldosPorEmpresa(empresaId);
  return saldos.filter((item) => item.saldo <= item.estoque_minimo);
}

async function listarSaldos(empresaId) {
  return repository.saldosPorEmpresa(empresaId);
}

async function saldosDoProdutoPorEmpresa(produtoId) {
  const produto = await repository.buscarProduto(produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  return repository.saldosDoProdutoPorEmpresa(produtoId);
}

async function definirLocalizacao(produtoId, empresaId, localizacao) {
  const produto = await repository.buscarProduto(produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  if (produto.tipo === 'celular') {
    throw new AppError('Produtos controlados por IMEI não têm localização agregada. Defina por unidade.');
  }
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  await repository.definirLocalizacao(produtoId, empresaId, localizacao || null);
  return repository.saldosDoProdutoPorEmpresa(produtoId);
}

async function historicoGeral(empresaId) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.historicoGeral(empresaId);
}

module.exports = {
  registrarEntrada,
  consultarSaldo,
  consultarCustoAtual,
  historico,
  listarEstoqueBaixo,
  listarSaldos,
  saldosDoProdutoPorEmpresa,
  definirLocalizacao,
  historicoGeral,
};

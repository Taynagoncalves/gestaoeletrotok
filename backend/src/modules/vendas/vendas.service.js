const db = require('../../config/database');
const repository = require('./vendas.repository');
const produtosRepository = require('../produtos/produtos.repository');
const estoqueRepository = require('../estoque/estoque.repository');
const AppError = require('../../shared/errors/AppError');

const FORMAS_PAGAMENTO = ['dinheiro', 'debito', 'credito', 'pix'];
const TOLERANCIA_CENTAVOS = 0.01;

async function montarItemVenda(item, empresaId) {
  const produto = await estoqueRepository.buscarProduto(item.produto_id);
  if (!produto) {
    throw new AppError(`Produto ${item.produto_id} não encontrado.`);
  }

  const precoTabela = await produtosRepository.buscarPreco(item.produto_id, empresaId);
  if (precoTabela === null) {
    throw new AppError(`Produto "${produto.nome}" não tem preço cadastrado para esta empresa.`);
  }

  const custo = await estoqueRepository.custoMaisRecente(item.produto_id, empresaId);
  const custoUnitarioSnapshot = custo ? custo.valor_unitario : null;

  if (produto.tipo === 'celular') {
    if (!item.produto_item_id) {
      throw new AppError(`Produto "${produto.nome}" exige a seleção do item (IMEI) em estoque.`);
    }

    const produtoItem = await estoqueRepository.buscarItemPorId(item.produto_item_id);
    if (!produtoItem || produtoItem.produto_id !== produto.id || produtoItem.empresa_id !== Number(empresaId)) {
      throw new AppError(`Item selecionado inválido para o produto "${produto.nome}".`);
    }
    if (produtoItem.status !== 'em_estoque') {
      throw new AppError(`Item com IMEI ${produtoItem.imei} não está disponível em estoque.`);
    }

    return {
      produto,
      produto_item_id: produtoItem.id,
      quantidade: 1,
      preco_unitario: precoTabela,
      custo_unitario_snapshot: custoUnitarioSnapshot,
    };
  }

  const quantidade = Number(item.quantidade);
  if (!quantidade || quantidade <= 0) {
    throw new AppError(`Quantidade inválida para o produto "${produto.nome}".`);
  }

  const saldo = await estoqueRepository.saldoNaoSerializado(item.produto_id, empresaId);
  if (saldo < quantidade) {
    throw new AppError(`Estoque insuficiente para o produto "${produto.nome}" (saldo: ${saldo}).`);
  }

  return {
    produto,
    produto_item_id: null,
    quantidade,
    preco_unitario: precoTabela,
    custo_unitario_snapshot: custoUnitarioSnapshot,
  };
}

async function registrarVenda(dados) {
  const { empresa_id, cliente_id, itens, pagamentos, usuario_id } = dados;

  if (!empresa_id) {
    throw new AppError('Empresa é obrigatória.');
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError('A venda precisa ter pelo menos um item.');
  }
  if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
    throw new AppError('Informe ao menos uma forma de pagamento.');
  }
  for (const pagamento of pagamentos) {
    if (!FORMAS_PAGAMENTO.includes(pagamento.forma)) {
      throw new AppError(`Forma de pagamento inválida: ${pagamento.forma}.`);
    }
  }

  const itensPreparados = [];
  for (const item of itens) {
    itensPreparados.push(await montarItemVenda(item, empresa_id));
  }

  const total = itensPreparados.reduce((soma, item) => soma + item.preco_unitario * item.quantidade, 0);
  const totalPago = pagamentos.reduce((soma, p) => soma + Number(p.valor), 0);

  if (Math.abs(total - totalPago) > TOLERANCIA_CENTAVOS) {
    throw new AppError(`Total dos pagamentos (${totalPago.toFixed(2)}) não confere com o total da venda (${total.toFixed(2)}).`);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const vendaId = await repository.inserirVenda(connection, {
      empresa_id,
      cliente_id,
      usuario_id,
      total,
    });

    for (const item of itensPreparados) {
      await repository.inserirItem(connection, {
        venda_id: vendaId,
        produto_id: item.produto.id,
        produto_item_id: item.produto_item_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        custo_unitario_snapshot: item.custo_unitario_snapshot,
      });

      if (item.produto_item_id) {
        await estoqueRepository.marcarStatusItem(connection, item.produto_item_id, 'vendido');
      } else {
        await estoqueRepository.ajustarSaldoNaoSerializado(connection, {
          produto_id: item.produto.id,
          empresa_id,
          delta: -item.quantidade,
        });
      }

      await estoqueRepository.inserirMovimentacao(connection, {
        produto_id: item.produto.id,
        empresa_id,
        produto_item_id: item.produto_item_id,
        tipo: 'saida',
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario,
        motivo: 'venda',
        usuario_id,
      });
    }

    for (const pagamento of pagamentos) {
      await repository.inserirPagamento(connection, {
        venda_id: vendaId,
        forma: pagamento.forma,
        parcelas: pagamento.parcelas,
        valor: pagamento.valor,
      });
    }

    await connection.commit();
    return repository.buscarPorId(vendaId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function buscarPorId(id) {
  const venda = await repository.buscarPorId(id);
  if (!venda) {
    throw new AppError('Venda não encontrada.', 404);
  }
  return venda;
}

async function listar(empresaId, filtros) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.listar(empresaId, filtros);
}

async function produtosMaisVendidos(empresaId, limite) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.produtosMaisVendidos(empresaId, Number(limite) || 5);
}

async function totalPorDia(empresaId, dias) {
  if (!empresaId) {
    throw new AppError('Empresa é obrigatória.');
  }
  return repository.totalPorDia(empresaId, Number(dias) || 7);
}

module.exports = {
  registrarVenda,
  buscarPorId,
  listar,
  produtosMaisVendidos,
  totalPorDia,
};

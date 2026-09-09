const selectEmpresa = document.getElementById('select-empresa');
const selectCliente = document.getElementById('select-cliente');
const selectProduto = document.getElementById('select-produto');
const wrapperImei = document.getElementById('wrapper-imei');
const selectItemImei = document.getElementById('select-item-imei');
const wrapperQuantidade = document.getElementById('wrapper-quantidade');
const campoQuantidade = document.getElementById('campo-quantidade');
const formAddItem = document.getElementById('form-add-item');
const mensagemItem = document.getElementById('mensagem-item');

const tabelaCarrinho = document.getElementById('tabela-carrinho');
const totalCarrinhoEl = document.getElementById('total-carrinho');

const formPagamento = document.getElementById('form-pagamento');
const campoForma = document.getElementById('campo-forma');
const wrapperParcelas = document.getElementById('wrapper-parcelas');
const campoParcelas = document.getElementById('campo-parcelas');
const campoValorPagamento = document.getElementById('campo-valor-pagamento');
const tabelaPagamentos = document.getElementById('tabela-pagamentos');
const totalPagoEl = document.getElementById('total-pago');
const btnFinalizar = document.getElementById('btn-finalizar');
const mensagemVenda = document.getElementById('mensagem-venda');

const secaoComprovante = document.getElementById('secao-comprovante');
const comprovanteEl = document.getElementById('comprovante');
const btnNovaVenda = document.getElementById('btn-nova-venda');

let produtos = [];
let carrinho = [];
let pagamentos = [];

function formatarMoeda(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}

function totalCarrinho() {
  return carrinho.reduce((soma, item) => soma + item.preco_unitario * item.quantidade, 0);
}

function totalPago() {
  return pagamentos.reduce((soma, p) => soma + p.valor, 0);
}

async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  selectEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');
}

async function carregarClientes() {
  const clientes = await api.get('/clientes');
  selectCliente.innerHTML =
    '<option value="">Consumidor não identificado</option>' +
    clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function carregarProdutos() {
  produtos = await api.get('/produtos');
  selectProduto.innerHTML = produtos.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
  await atualizarCampoProduto();
}

function produtoSelecionado() {
  return produtos.find((p) => p.id === Number(selectProduto.value));
}

async function atualizarCampoProduto() {
  const produto = produtoSelecionado();
  const ehCelular = produto && produto.tipo === 'celular';
  wrapperImei.hidden = !ehCelular;
  wrapperQuantidade.hidden = ehCelular;

  if (ehCelular) {
    const empresaId = selectEmpresa.value;
    const resultado = await api.get(`/estoque/produtos/${produto.id}/saldo?empresa_id=${empresaId}`);
    selectItemImei.innerHTML = resultado.itens
      .map((item) => `<option value="${item.id}">${item.imei} (${item.condicao})</option>`)
      .join('');
  }
}

selectProduto.addEventListener('change', () => atualizarCampoProduto().catch((erro) => mostrarMensagemItem(erro.message)));
selectEmpresa.addEventListener('change', () => {
  carrinho = [];
  renderizarCarrinho();
  atualizarCampoProduto().catch((erro) => mostrarMensagemItem(erro.message));
});

function mostrarMensagemItem(texto, tipo = 'erro') {
  mensagemItem.textContent = texto;
  mensagemItem.className = `mensagem ${tipo}`;
}

formAddItem.addEventListener('submit', async (event) => {
  event.preventDefault();
  const produto = produtoSelecionado();
  const empresaId = selectEmpresa.value;

  try {
    const precos = await api.get(`/produtos/${produto.id}/precos`);
    const precoInfo = precos.find((p) => p.empresa_id === Number(empresaId));
    if (!precoInfo) {
      throw new Error(`Produto "${produto.nome}" sem preço cadastrado para esta empresa.`);
    }

    if (produto.tipo === 'celular') {
      const opcao = selectItemImei.selectedOptions[0];
      if (!opcao) {
        throw new Error('Não há itens em estoque para este produto nesta empresa.');
      }
      carrinho.push({
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_item_id: Number(opcao.value),
        imei: opcao.textContent,
        quantidade: 1,
        preco_unitario: Number(precoInfo.preco_venda),
      });
    } else {
      const quantidade = Number(campoQuantidade.value);
      if (!quantidade || quantidade <= 0) {
        throw new Error('Quantidade inválida.');
      }
      carrinho.push({
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_item_id: null,
        imei: '-',
        quantidade,
        preco_unitario: Number(precoInfo.preco_venda),
      });
    }

    mostrarMensagemItem('Item adicionado.', 'sucesso');
    renderizarCarrinho();
    await atualizarCampoProduto();
  } catch (erro) {
    mostrarMensagemItem(erro.message);
  }
});

function renderizarCarrinho() {
  tabelaCarrinho.innerHTML = carrinho
    .map(
      (item, indice) => `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.imei}</td>
        <td>${item.quantidade}</td>
        <td>R$ ${formatarMoeda(item.preco_unitario)}</td>
        <td>R$ ${formatarMoeda(item.preco_unitario * item.quantidade)}</td>
        <td><button type="button" class="btn-link" data-indice="${indice}">Remover</button></td>
      </tr>
    `
    )
    .join('');

  tabelaCarrinho.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      carrinho.splice(Number(botao.dataset.indice), 1);
      renderizarCarrinho();
    });
  });

  totalCarrinhoEl.textContent = formatarMoeda(totalCarrinho());
}

campoForma.addEventListener('change', () => {
  wrapperParcelas.hidden = campoForma.value !== 'credito';
});

formPagamento.addEventListener('submit', (event) => {
  event.preventDefault();
  const valor = Number(campoValorPagamento.value);
  if (!valor || valor <= 0) {
    mensagemVenda.textContent = 'Informe um valor de pagamento válido.';
    mensagemVenda.className = 'mensagem erro';
    return;
  }

  pagamentos.push({
    forma: campoForma.value,
    parcelas: campoForma.value === 'credito' ? Number(campoParcelas.value) : 1,
    valor,
  });

  renderizarPagamentos();
  formPagamento.reset();
  wrapperParcelas.hidden = true;
});

function renderizarPagamentos() {
  tabelaPagamentos.innerHTML = pagamentos
    .map(
      (p, indice) => `
      <tr>
        <td>${p.forma}</td>
        <td>${p.parcelas}</td>
        <td>R$ ${formatarMoeda(p.valor)}</td>
        <td><button type="button" class="btn-link" data-indice="${indice}">Remover</button></td>
      </tr>
    `
    )
    .join('');

  tabelaPagamentos.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      pagamentos.splice(Number(botao.dataset.indice), 1);
      renderizarPagamentos();
    });
  });

  totalPagoEl.textContent = formatarMoeda(totalPago());
}

btnFinalizar.addEventListener('click', async () => {
  if (carrinho.length === 0) {
    mensagemVenda.textContent = 'Carrinho vazio.';
    mensagemVenda.className = 'mensagem erro';
    return;
  }

  const payload = {
    empresa_id: Number(selectEmpresa.value),
    cliente_id: selectCliente.value ? Number(selectCliente.value) : null,
    itens: carrinho.map((item) => ({
      produto_id: item.produto_id,
      produto_item_id: item.produto_item_id,
      quantidade: item.quantidade,
    })),
    pagamentos: pagamentos.map((p) => ({ forma: p.forma, parcelas: p.parcelas, valor: p.valor })),
  };

  try {
    const venda = await api.post('/vendas', payload);
    mostrarComprovante(venda);
    carrinho = [];
    pagamentos = [];
    renderizarCarrinho();
    renderizarPagamentos();
    mensagemVenda.textContent = '';
  } catch (erro) {
    mensagemVenda.textContent = erro.message;
    mensagemVenda.className = 'mensagem erro';
  }
});

function mostrarComprovante(venda) {
  const linhas = [];
  linhas.push(`Eletrotok - ${venda.empresa_nome}`);
  linhas.push(`Venda #${venda.id} - ${new Date(venda.data).toLocaleString('pt-BR')}`);
  linhas.push(`Cliente: ${venda.cliente_nome || 'Consumidor não identificado'}`);
  linhas.push('--------------------------------');
  venda.itens.forEach((item) => {
    const nomeItem = item.imei ? `${item.produto_nome} (IMEI ${item.imei})` : item.produto_nome;
    linhas.push(`${item.quantidade}x ${nomeItem} - R$ ${formatarMoeda(item.preco_unitario)}`);
  });
  linhas.push('--------------------------------');
  linhas.push(`TOTAL: R$ ${formatarMoeda(venda.total)}`);
  venda.pagamentos.forEach((p) => {
    linhas.push(`Pagamento: ${p.forma} ${p.parcelas > 1 ? `(${p.parcelas}x)` : ''} - R$ ${formatarMoeda(p.valor)}`);
  });

  comprovanteEl.textContent = linhas.join('\n');
  secaoComprovante.hidden = false;
  secaoComprovante.scrollIntoView({ behavior: 'smooth' });
}

btnNovaVenda.addEventListener('click', () => {
  secaoComprovante.hidden = true;
});

async function iniciar() {
  await carregarEmpresas();
  await Promise.all([carregarClientes(), carregarProdutos()]);
}

iniciar().catch((erro) => mostrarMensagemItem(erro.message));

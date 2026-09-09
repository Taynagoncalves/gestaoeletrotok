const selectEmpresa = document.getElementById('select-empresa');
const btnCanalPresencial = document.getElementById('btn-canal-presencial');
const btnCanalOnline = document.getElementById('btn-canal-online');
const categoriasPdv = document.getElementById('categorias-pdv');
const gridProdutos = document.getElementById('grid-produtos');

const blocoCliente = document.getElementById('bloco-cliente');
const campoBuscarCliente = document.getElementById('campo-buscar-cliente');
const resultadoBuscaCliente = document.getElementById('resultado-busca-cliente');
const clienteSelecionadoBox = document.getElementById('cliente-selecionado-box');
const nomeClienteSelecionado = document.getElementById('nome-cliente-selecionado');
const subClienteSelecionado = document.getElementById('sub-cliente-selecionado');
const btnTrocarCliente = document.getElementById('btn-trocar-cliente');
const btnMostrarNovoCliente = document.getElementById('btn-mostrar-novo-cliente');
const formClienteRapido = document.getElementById('form-cliente-rapido');
const novoClienteNome = document.getElementById('novo-cliente-nome');
const novoClienteTelefone = document.getElementById('novo-cliente-telefone');
const btnSalvarNovoCliente = document.getElementById('btn-salvar-novo-cliente');

const contadorItens = document.getElementById('contador-itens');
const btnLimparCarrinho = document.getElementById('btn-limpar-carrinho');
const listaCarrinho = document.getElementById('lista-carrinho');
const campoDesconto = document.getElementById('campo-desconto');
const valorSubtotalEl = document.getElementById('valor-subtotal');
const valorDescontoEl = document.getElementById('valor-desconto');
const valorTotalEl = document.getElementById('valor-total');
const btnFinalizar = document.getElementById('btn-finalizar');
const btnSalvarOrcamento = document.getElementById('btn-salvar-orcamento');
const mensagemVenda = document.getElementById('mensagem-venda');

const modalPagamento = document.getElementById('modal-pagamento');
const modalFormaPagamento = document.getElementById('modal-forma-pagamento');
const modalWrapperParcelas = document.getElementById('modal-wrapper-parcelas');
const modalParcelas = document.getElementById('modal-parcelas');
const modalValorPagamento = document.getElementById('modal-valor-pagamento');
const modalBtnAdicionarPagamento = document.getElementById('modal-btn-adicionar-pagamento');
const modalTabelaPagamentos = document.getElementById('modal-tabela-pagamentos');
const modalTotalPagoEl = document.getElementById('modal-total-pago');
const modalTotalDevidoEl = document.getElementById('modal-total-devido');
const modalBtnCancelar = document.getElementById('modal-btn-cancelar');
const modalBtnConfirmar = document.getElementById('modal-btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

let produtos = [];
let clientes = [];
let carrinho = [];
let categoriaAtiva = '';
let modoCliente = 'cliente';
let clienteSelecionado = null;
let canal = 'presencial';
let pagamentosModal = [];

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('cart');
  document.getElementById('icone-cliente-sel').innerHTML = svgIcone('user');
  document.getElementById('icone-finalizar').innerHTML = svgIcone('credit-card');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Empresa / canal ----------
async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  selectEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

  const contexto = empresaSelecionada();
  if (contexto.id && empresas.some((e) => String(e.id) === String(contexto.id))) {
    selectEmpresa.value = contexto.id;
  }
}

selectEmpresa.addEventListener('change', () => {
  carrinho = [];
  renderizarCarrinho();
  carregarProdutos().catch((erro) => mostrarMensagem(erro.message, 'erro'));
});

btnCanalPresencial.addEventListener('click', () => {
  canal = 'presencial';
  btnCanalPresencial.classList.add('ativo');
  btnCanalOnline.classList.remove('ativo');
});
btnCanalOnline.addEventListener('click', () => {
  canal = 'online';
  btnCanalOnline.classList.add('ativo');
  btnCanalPresencial.classList.remove('ativo');
});

// ---------- Produtos / categorias ----------
async function carregarProdutos() {
  produtos = await api.get(`/produtos?empresa_id=${selectEmpresa.value}`);
  renderizarCategorias();
  renderizarGrade();
}

function renderizarCategorias() {
  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))].sort();
  const todasOpcoes = ['', ...categorias];

  categoriasPdv.innerHTML = todasOpcoes
    .map((c) => `<button type="button" data-categoria="${c}" class="${c === categoriaAtiva ? 'ativo' : ''}">${c || 'Todos'}</button>`)
    .join('');

  categoriasPdv.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      categoriaAtiva = botao.dataset.categoria;
      categoriasPdv.querySelectorAll('button').forEach((b) => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      renderizarGrade();
    });
  });
}

function renderizarGrade() {
  const filtrados = produtos.filter((p) => p.ativo && (!categoriaAtiva || p.categoria === categoriaAtiva));

  gridProdutos.innerHTML = filtrados
    .map((produto) => {
      const preco = produto.preco_empresa;
      const estoque = produto.estoque_empresa ?? 0;
      const baixo = estoque <= (produto.estoque_minimo || 0);
      return `
        <div class="cartao-produto-pdv">
          <div class="miniatura-produto">
            ${produto.imagem_base64 ? `<img src="${produto.imagem_base64}" alt="${produto.nome}" />` : svgIcone('box')}
          </div>
          <div class="cartao-produto-pdv-nome">${produto.nome}</div>
          <div class="cartao-produto-pdv-codigo">${produto.referencia_interna || ''}</div>
          <div class="cartao-produto-pdv-estoque ${baixo ? 'baixo' : ''}">Estoque: ${estoque}</div>
          <div class="cartao-produto-pdv-rodape">
            <span class="cartao-produto-pdv-preco">${preco !== null ? formatarMoeda(preco) : 'sem preço'}</span>
            <button type="button" class="cartao-produto-pdv-add" data-id="${produto.id}" ${preco === null || estoque <= 0 ? 'disabled' : ''}>${svgIcone('plus')}</button>
          </div>
        </div>
      `;
    })
    .join('');

  gridProdutos.querySelectorAll('button[data-id]').forEach((botao) => {
    botao.addEventListener('click', () => adicionarAoCarrinho(Number(botao.dataset.id)));
  });
}

async function adicionarAoCarrinho(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  if (produto.tipo === 'celular') {
    const resultado = await api.get(`/estoque/produtos/${produtoId}/saldo?empresa_id=${selectEmpresa.value}`);
    if (!resultado.itens || resultado.itens.length === 0) {
      mostrarMensagem('Sem unidades disponíveis em estoque.', 'erro');
      return;
    }
    const opcoes = resultado.itens.map((item) => `${item.id} - IMEI ${item.imei} (${item.condicao})`).join('\n');
    const escolha = prompt(`Escolha o item (digite o número do ID):\n${opcoes}`);
    if (!escolha) return;
    const item = resultado.itens.find((i) => String(i.id) === escolha.trim());
    if (!item) {
      mostrarMensagem('Item inválido.', 'erro');
      return;
    }
    carrinho.push({
      produto_id: produto.id,
      nome: produto.nome,
      imagem: produto.imagem_base64,
      produto_item_id: item.id,
      codigo: `IMEI ${item.imei}`,
      quantidade: 1,
      preco_unitario: produto.preco_empresa,
    });
  } else {
    const existente = carrinho.find((i) => i.produto_id === produtoId && !i.produto_item_id);
    if (existente) {
      existente.quantidade += 1;
    } else {
      carrinho.push({
        produto_id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem_base64,
        produto_item_id: null,
        codigo: produto.referencia_interna || '-',
        quantidade: 1,
        preco_unitario: produto.preco_empresa,
      });
    }
  }

  renderizarCarrinho();
}

// ---------- Cliente ----------
document.querySelectorAll('.pdv-lateral-abas button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.pdv-lateral-abas button').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    modoCliente = botao.dataset.modo;
    blocoCliente.hidden = modoCliente !== 'cliente';
    if (modoCliente === 'avulsa') {
      clienteSelecionado = null;
      clienteSelecionadoBox.hidden = true;
    }
  });
});

async function carregarClientes() {
  clientes = await api.get('/clientes');
}

campoBuscarCliente.addEventListener('input', () => {
  const termo = campoBuscarCliente.value.trim().toLowerCase();
  if (!termo) {
    resultadoBuscaCliente.hidden = true;
    return;
  }
  const encontrados = clientes
    .filter((c) => `${c.nome} ${c.cpf_cnpj || ''} ${c.telefone || ''}`.toLowerCase().includes(termo))
    .slice(0, 8);

  resultadoBuscaCliente.innerHTML = encontrados
    .map((c) => `<button type="button" data-id="${c.id}">${svgIcone('user')} <span>${c.nome}</span></button>`)
    .join('');
  resultadoBuscaCliente.hidden = encontrados.length === 0;

  resultadoBuscaCliente.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => selecionarCliente(Number(botao.dataset.id)));
  });
});

function selecionarCliente(id) {
  clienteSelecionado = clientes.find((c) => c.id === id);
  resultadoBuscaCliente.hidden = true;
  campoBuscarCliente.value = '';
  clienteSelecionadoBox.hidden = false;
  nomeClienteSelecionado.textContent = clienteSelecionado.nome;
  subClienteSelecionado.textContent = clienteSelecionado.telefone || clienteSelecionado.cpf_cnpj || '';
}

btnTrocarCliente.addEventListener('click', () => {
  clienteSelecionado = null;
  clienteSelecionadoBox.hidden = true;
});

btnMostrarNovoCliente.addEventListener('click', () => {
  formClienteRapido.hidden = !formClienteRapido.hidden;
});

btnSalvarNovoCliente.addEventListener('click', async () => {
  if (!novoClienteNome.value) {
    mostrarMensagem('Informe o nome do cliente.', 'erro');
    return;
  }
  const cliente = await api.post('/clientes', { nome: novoClienteNome.value, telefone: novoClienteTelefone.value });
  clientes.push(cliente);
  selecionarCliente(cliente.id);
  formClienteRapido.hidden = true;
  novoClienteNome.value = '';
  novoClienteTelefone.value = '';
});

// ---------- Carrinho ----------
function mostrarMensagem(texto, tipo) {
  mensagemVenda.textContent = texto;
  mensagemVenda.className = `mensagem ${tipo}`;
}

function renderizarCarrinho() {
  contadorItens.textContent = carrinho.length;

  listaCarrinho.innerHTML =
    carrinho
      .map(
        (item, indice) => `
      <div class="pdv-carrinho-item">
        <div class="miniatura-produto">${item.imagem ? `<img src="${item.imagem}" style="width:100%;height:100%;object-fit:cover;" />` : svgIcone('box')}</div>
        <div class="pdv-carrinho-item-info">
          <div class="pdv-carrinho-item-nome">${item.nome}</div>
          <div class="pdv-carrinho-item-codigo">${item.codigo}</div>
          ${!item.produto_item_id ? `
            <div class="stepper" style="margin-top:4px;">
              <button type="button" data-acao="menos" data-indice="${indice}">${svgIcone('minus')}</button>
              <input type="number" value="${item.quantidade}" data-indice="${indice}" class="campo-qtd-carrinho" />
              <button type="button" data-acao="mais" data-indice="${indice}">${svgIcone('plus')}</button>
            </div>
          ` : ''}
        </div>
        <div class="pdv-carrinho-item-preco">${formatarMoeda(item.preco_unitario * item.quantidade)}</div>
        <button type="button" class="btn-link" data-remover="${indice}">${svgIcone('trash')}</button>
      </div>
    `
      )
      .join('') || '<p style="color:#6b7280; font-size:13px;">Carrinho vazio.</p>';

  listaCarrinho.querySelectorAll('[data-remover]').forEach((botao) => {
    botao.addEventListener('click', () => {
      carrinho.splice(Number(botao.dataset.remover), 1);
      renderizarCarrinho();
    });
  });
  listaCarrinho.querySelectorAll('[data-acao="mais"]').forEach((botao) => {
    botao.addEventListener('click', () => {
      carrinho[Number(botao.dataset.indice)].quantidade += 1;
      renderizarCarrinho();
    });
  });
  listaCarrinho.querySelectorAll('[data-acao="menos"]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const item = carrinho[Number(botao.dataset.indice)];
      item.quantidade = Math.max(1, item.quantidade - 1);
      renderizarCarrinho();
    });
  });
  listaCarrinho.querySelectorAll('.campo-qtd-carrinho').forEach((input) => {
    input.addEventListener('change', () => {
      const item = carrinho[Number(input.dataset.indice)];
      item.quantidade = Math.max(1, Number(input.value) || 1);
      renderizarCarrinho();
    });
  });

  atualizarResumo();
}

function subtotalCarrinho() {
  return carrinho.reduce((soma, item) => soma + item.preco_unitario * item.quantidade, 0);
}

function atualizarResumo() {
  const subtotal = subtotalCarrinho();
  const desconto = Math.min(Number(campoDesconto.value) || 0, subtotal);
  valorSubtotalEl.textContent = formatarMoeda(subtotal);
  valorDescontoEl.textContent = formatarMoeda(desconto);
  valorTotalEl.textContent = formatarMoeda(subtotal - desconto);
}

campoDesconto.addEventListener('input', atualizarResumo);

btnLimparCarrinho.addEventListener('click', () => {
  carrinho = [];
  renderizarCarrinho();
});

function montarPayloadItens() {
  return carrinho.map((item) => ({
    produto_id: item.produto_id,
    produto_item_id: item.produto_item_id,
    quantidade: item.quantidade,
  }));
}

// ---------- Salvar orçamento ----------
btnSalvarOrcamento.addEventListener('click', async () => {
  if (carrinho.length === 0) {
    mostrarMensagem('Carrinho vazio.', 'erro');
    return;
  }
  try {
    await api.post('/vendas', {
      empresa_id: Number(selectEmpresa.value),
      cliente_id: clienteSelecionado ? clienteSelecionado.id : null,
      canal,
      desconto: Number(campoDesconto.value) || 0,
      itens: montarPayloadItens(),
      status: 'orcamento',
    });
    mostrarMensagem('Orçamento salvo com sucesso.', 'sucesso');
    carrinho = [];
    renderizarCarrinho();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

// ---------- Finalizar venda (modal de pagamento) ----------
function abrirModalPagamento() {
  if (carrinho.length === 0) {
    mostrarMensagem('Carrinho vazio.', 'erro');
    return;
  }
  pagamentosModal = [];
  renderizarPagamentosModal();
  modalValorPagamento.value = (subtotalCarrinho() - (Number(campoDesconto.value) || 0)).toFixed(2);
  modalMensagem.textContent = '';
  modalPagamento.hidden = false;
}

btnFinalizar.addEventListener('click', abrirModalPagamento);
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'F10') {
    evento.preventDefault();
    abrirModalPagamento();
  }
});

modalFormaPagamento.addEventListener('change', () => {
  modalWrapperParcelas.hidden = modalFormaPagamento.value !== 'credito';
});

modalBtnAdicionarPagamento.addEventListener('click', () => {
  const valor = Number(modalValorPagamento.value);
  if (!valor || valor <= 0) return;
  pagamentosModal.push({
    forma: modalFormaPagamento.value,
    parcelas: modalFormaPagamento.value === 'credito' ? Number(modalParcelas.value) : 1,
    valor,
  });
  modalValorPagamento.value = '';
  renderizarPagamentosModal();
});

function renderizarPagamentosModal() {
  modalTabelaPagamentos.innerHTML = pagamentosModal
    .map(
      (p, indice) => `<tr><td>${p.forma}</td><td>${formatarMoeda(p.valor)}</td><td><button type="button" class="btn-link" data-indice="${indice}">x</button></td></tr>`
    )
    .join('');

  modalTabelaPagamentos.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      pagamentosModal.splice(Number(botao.dataset.indice), 1);
      renderizarPagamentosModal();
    });
  });

  const totalPago = pagamentosModal.reduce((soma, p) => soma + p.valor, 0);
  const totalDevido = subtotalCarrinho() - (Number(campoDesconto.value) || 0);
  modalTotalPagoEl.textContent = formatarMoeda(totalPago);
  modalTotalDevidoEl.textContent = formatarMoeda(totalDevido);
}

modalBtnCancelar.addEventListener('click', () => {
  modalPagamento.hidden = true;
});

modalBtnConfirmar.addEventListener('click', async () => {
  try {
    const venda = await api.post('/vendas', {
      empresa_id: Number(selectEmpresa.value),
      cliente_id: clienteSelecionado ? clienteSelecionado.id : null,
      canal,
      desconto: Number(campoDesconto.value) || 0,
      itens: montarPayloadItens(),
      pagamentos: pagamentosModal,
    });
    modalPagamento.hidden = true;
    mostrarMensagem(`Venda #${venda.id} concluída com sucesso.`, 'sucesso');
    carrinho = [];
    campoDesconto.value = 0;
    clienteSelecionado = null;
    clienteSelecionadoBox.hidden = true;
    renderizarCarrinho();
    await carregarProdutos();
  } catch (erro) {
    modalMensagem.textContent = erro.message;
    modalMensagem.className = 'mensagem erro';
  }
});

async function iniciar() {
  renderizarIcones();
  await carregarEmpresas();
  await Promise.all([carregarProdutos(), carregarClientes()]);
  renderizarCarrinho();
}

iniciar().catch((erro) => mostrarMensagem(erro.message, 'erro'));

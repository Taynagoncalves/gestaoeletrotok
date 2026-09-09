const selectEmpresa = document.getElementById('select-empresa');
const selectProduto = document.getElementById('select-produto');
const resumoSaldo = document.getElementById('resumo-saldo');

const formEntrada = document.getElementById('form-entrada');
const campoMotivo = document.getElementById('campo-motivo');
const campoFornecedorWrapper = document.getElementById('campo-fornecedor-wrapper');
const campoFornecedor = document.getElementById('campo-fornecedor');
const campoEmpresaOrigemWrapper = document.getElementById('campo-empresa-origem-wrapper');
const campoEmpresaOrigem = document.getElementById('campo-empresa-origem');
const campoQuantidadeWrapper = document.getElementById('campo-quantidade-wrapper');
const campoQuantidade = document.getElementById('campo-quantidade');
const areaItensSerializados = document.getElementById('area-itens-serializados');
const listaItens = document.getElementById('lista-itens');
const btnAddItem = document.getElementById('btn-add-item');
const mensagemEntrada = document.getElementById('mensagem-entrada');

const tabelaHistorico = document.getElementById('tabela-historico');
const tabelaEstoqueBaixo = document.getElementById('tabela-estoque-baixo');

let produtos = [];
let empresas = [];

function produtoSelecionado() {
  return produtos.find((p) => p.id === Number(selectProduto.value));
}

function atualizarVisibilidadeOrigem() {
  const motivo = campoMotivo.value;
  campoFornecedorWrapper.hidden = motivo !== 'compra';
  campoEmpresaOrigemWrapper.hidden = motivo !== 'transferencia';
}

function atualizarVisibilidadeSerializado() {
  const produto = produtoSelecionado();
  const ehCelular = produto && produto.tipo === 'celular';
  areaItensSerializados.hidden = !ehCelular;
  campoQuantidadeWrapper.hidden = ehCelular;
  campoQuantidade.required = !ehCelular;

  if (ehCelular && listaItens.children.length === 0) {
    adicionarLinhaItem();
  }
}

function adicionarLinhaItem() {
  const linha = document.createElement('div');
  linha.style.display = 'flex';
  linha.style.gap = '8px';
  linha.style.marginBottom = '8px';
  linha.innerHTML = `
    <input type="text" placeholder="IMEI" class="campo-imei" required />
    <select class="campo-condicao" required>
      <option value="novo">Novo</option>
      <option value="seminovo">Seminovo</option>
      <option value="vitrine">Vitrine</option>
    </select>
    <button type="button" class="btn-link">Remover</button>
  `;
  linha.querySelector('button').addEventListener('click', () => linha.remove());
  listaItens.appendChild(linha);
}

btnAddItem.addEventListener('click', adicionarLinhaItem);
campoMotivo.addEventListener('change', atualizarVisibilidadeOrigem);
selectProduto.addEventListener('change', () => {
  atualizarVisibilidadeSerializado();
  carregarResumo();
});
selectEmpresa.addEventListener('change', () => {
  carregarResumo();
  carregarHistorico();
  carregarEstoqueBaixo();
});

async function carregarEmpresas() {
  empresas = await api.get('/empresas');
  selectEmpresa.innerHTML = empresas
    .map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`)
    .join('');
  campoEmpresaOrigem.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social}</option>`).join('');
}

async function carregarFornecedores() {
  const fornecedores = await api.get('/fornecedores');
  campoFornecedor.innerHTML = fornecedores.map((f) => `<option value="${f.id}">${f.razao_social}</option>`).join('');
}

async function carregarProdutos() {
  produtos = await api.get('/produtos');
  selectProduto.innerHTML = produtos.map((p) => `<option value="${p.id}">${p.nome} (${p.tipo})</option>`).join('');
}

async function carregarResumo() {
  const produtoId = selectProduto.value;
  const empresaId = selectEmpresa.value;
  if (!produtoId || !empresaId) return;

  const [saldo, custo] = await Promise.all([
    api.get(`/estoque/produtos/${produtoId}/saldo?empresa_id=${empresaId}`),
    api.get(`/estoque/produtos/${produtoId}/custo-atual?empresa_id=${empresaId}`),
  ]);

  const custoTexto = custo.custo_unitario !== null ? `R$ ${Number(custo.custo_unitario).toFixed(2)} (${custo.origem})` : 'sem entradas registradas';
  resumoSaldo.className = 'mensagem';
  resumoSaldo.textContent = `Saldo atual: ${saldo.saldo} | Custo mais recente: ${custoTexto}`;
}

async function carregarHistorico() {
  const produtoId = selectProduto.value;
  const empresaId = selectEmpresa.value;
  if (!produtoId || !empresaId) return;

  const historico = await api.get(`/estoque/produtos/${produtoId}/historico?empresa_id=${empresaId}`);
  tabelaHistorico.innerHTML = historico
    .map((mov) => {
      const origem = mov.fornecedor_nome || mov.empresa_origem_nome || '-';
      return `
        <tr>
          <td>${new Date(mov.data).toLocaleString('pt-BR')}</td>
          <td>${mov.tipo}</td>
          <td>${mov.motivo}</td>
          <td>${mov.quantidade}</td>
          <td>${mov.valor_unitario ? `R$ ${Number(mov.valor_unitario).toFixed(2)}` : '-'}</td>
          <td>${origem}</td>
        </tr>
      `;
    })
    .join('');
}

async function carregarEstoqueBaixo() {
  const empresaId = selectEmpresa.value;
  if (!empresaId) return;

  const itens = await api.get(`/estoque/saldos/baixo?empresa_id=${empresaId}`);
  tabelaEstoqueBaixo.innerHTML = itens
    .map((item) => `<tr><td>${item.nome}</td><td>${item.saldo}</td><td>${item.estoque_minimo}</td></tr>`)
    .join('');
}

formEntrada.addEventListener('submit', async (event) => {
  event.preventDefault();

  const produto = produtoSelecionado();
  const dados = Object.fromEntries(new FormData(formEntrada));

  const payload = {
    produto_id: Number(selectProduto.value),
    empresa_id: Number(selectEmpresa.value),
    motivo: dados.motivo,
    valor_unitario: dados.valor_unitario || null,
    observacao: dados.observacao || null,
  };

  if (dados.motivo === 'compra') {
    payload.fornecedor_id = Number(campoFornecedor.value);
  } else if (dados.motivo === 'transferencia') {
    payload.empresa_origem_id = Number(campoEmpresaOrigem.value);
  }

  if (produto && produto.tipo === 'celular') {
    const linhas = [...listaItens.children];
    payload.itens = linhas.map((linha) => ({
      imei: linha.querySelector('.campo-imei').value,
      condicao: linha.querySelector('.campo-condicao').value,
    }));
  } else {
    payload.quantidade = Number(dados.quantidade);
  }

  try {
    await api.post('/estoque/entradas', payload);
    mensagemEntrada.textContent = 'Entrada registrada com sucesso.';
    mensagemEntrada.className = 'mensagem sucesso';
    formEntrada.reset();
    listaItens.innerHTML = '';
    atualizarVisibilidadeOrigem();
    atualizarVisibilidadeSerializado();
    await Promise.all([carregarResumo(), carregarHistorico(), carregarEstoqueBaixo()]);
  } catch (erro) {
    mensagemEntrada.textContent = erro.message;
    mensagemEntrada.className = 'mensagem erro';
  }
});

async function iniciar() {
  await Promise.all([carregarEmpresas(), carregarFornecedores(), carregarProdutos()]);
  atualizarVisibilidadeOrigem();
  atualizarVisibilidadeSerializado();
  await Promise.all([carregarResumo(), carregarHistorico(), carregarEstoqueBaixo()]);
}

iniciar().catch((erro) => {
  mensagemEntrada.textContent = erro.message;
  mensagemEntrada.className = 'mensagem erro';
});

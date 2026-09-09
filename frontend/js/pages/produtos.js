const form = document.getElementById('form-produto');
const tabela = document.getElementById('tabela-produtos');
const mensagem = document.getElementById('mensagem-produto');
const campoTipo = document.getElementById('campo-tipo');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const secaoPrecos = document.getElementById('secao-precos');
const produtoSelecionadoNome = document.getElementById('produto-selecionado-nome');
const tabelaPrecos = document.getElementById('tabela-precos');
const mensagemPrecos = document.getElementById('mensagem-precos');

let produtoEmEdicaoId = null;
let produtoPrecosId = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  produtoEmEdicaoId = null;
  campoTipo.disabled = false;
  btnCancelarEdicao.hidden = true;
}

function preencherFormularioParaEdicao(produto) {
  produtoEmEdicaoId = produto.id;
  form.nome.value = produto.nome;
  form.categoria.value = produto.categoria || '';
  form.marca.value = produto.marca || '';
  form.tipo.value = produto.tipo;
  form.estoque_minimo.value = produto.estoque_minimo;
  form.descricao.value = produto.descricao || '';
  campoTipo.disabled = true;
  btnCancelarEdicao.hidden = false;
}

async function carregarProdutos() {
  const produtos = await api.get('/produtos');
  tabela.innerHTML = '';

  produtos.forEach((produto) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.tipo}</td>
      <td>${produto.categoria || '-'}</td>
      <td>${produto.estoque_minimo}</td>
      <td>
        <button type="button" class="btn-link" data-acao="editar">Editar</button>
        <button type="button" class="btn-link" data-acao="precos">Preços</button>
      </td>
    `;
    linha.querySelector('[data-acao="editar"]').addEventListener('click', () => preencherFormularioParaEdicao(produto));
    linha.querySelector('[data-acao="precos"]').addEventListener('click', () => abrirPrecos(produto));
    tabela.appendChild(linha);
  });
}

async function abrirPrecos(produto) {
  produtoPrecosId = produto.id;
  produtoSelecionadoNome.textContent = produto.nome;
  secaoPrecos.hidden = false;
  secaoPrecos.scrollIntoView({ behavior: 'smooth' });

  const [empresas, precos] = await Promise.all([api.get('/empresas'), api.get(`/produtos/${produto.id}/precos`)]);

  tabelaPrecos.innerHTML = '';
  empresas.forEach((empresa) => {
    const precoAtual = precos.find((p) => p.empresa_id === empresa.id);
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${empresa.razao_social} (${empresa.tipo})</td>
      <td><input type="number" step="0.01" min="0" value="${precoAtual ? precoAtual.preco_venda : ''}" data-empresa-id="${empresa.id}" /></td>
      <td><button type="button" class="btn-link" data-empresa-id="${empresa.id}">Salvar</button></td>
    `;
    linha.querySelector('button').addEventListener('click', () => salvarPreco(empresa.id, linha.querySelector('input').value));
    tabelaPrecos.appendChild(linha);
  });
}

async function salvarPreco(empresaId, precoVenda) {
  try {
    await api.put(`/produtos/${produtoPrecosId}/precos`, { empresa_id: empresaId, preco_venda: precoVenda });
    mensagemPrecos.textContent = 'Preço salvo.';
    mensagemPrecos.className = 'mensagem sucesso';
  } catch (erro) {
    mensagemPrecos.textContent = erro.message;
    mensagemPrecos.className = 'mensagem erro';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  try {
    if (produtoEmEdicaoId) {
      await api.put(`/produtos/${produtoEmEdicaoId}`, dados);
      mostrarMensagem('Produto atualizado com sucesso.', 'sucesso');
    } else {
      await api.post('/produtos', dados);
      mostrarMensagem('Produto cadastrado com sucesso.', 'sucesso');
    }
    limparFormulario();
    await carregarProdutos();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

btnCancelarEdicao.addEventListener('click', limparFormulario);

carregarProdutos().catch((erro) => mostrarMensagem(erro.message, 'erro'));

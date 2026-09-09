const form = document.getElementById('form-empresa');
const tabela = document.getElementById('tabela-empresas');
const mensagem = document.getElementById('mensagem-empresa');
const campoCnpj = document.getElementById('campo-cnpj');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

let empresaEmEdicaoId = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  empresaEmEdicaoId = null;
  campoCnpj.disabled = false;
  btnCancelarEdicao.hidden = true;
}

function preencherFormularioParaEdicao(empresa) {
  empresaEmEdicaoId = empresa.id;
  form.razao_social.value = empresa.razao_social;
  form.nome_fantasia.value = empresa.nome_fantasia || '';
  form.cnpj.value = empresa.cnpj;
  form.tipo.value = empresa.tipo;
  form.regime_tributario.value = empresa.regime_tributario || '';
  form.inscricao_estadual.value = empresa.inscricao_estadual || '';
  form.endereco.value = empresa.endereco || '';
  form.telefone.value = empresa.telefone || '';
  campoCnpj.disabled = true;
  btnCancelarEdicao.hidden = false;
}

async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  tabela.innerHTML = '';

  empresas.forEach((empresa) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${empresa.razao_social}</td>
      <td>${empresa.cnpj}</td>
      <td>${empresa.tipo}</td>
      <td>${empresa.ativa ? 'Sim' : 'Não'}</td>
      <td><button type="button" class="btn-link" data-id="${empresa.id}">Editar</button></td>
    `;
    linha.querySelector('button').addEventListener('click', () => preencherFormularioParaEdicao(empresa));
    tabela.appendChild(linha);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  try {
    if (empresaEmEdicaoId) {
      await api.put(`/empresas/${empresaEmEdicaoId}`, dados);
      mostrarMensagem('Empresa atualizada com sucesso.', 'sucesso');
    } else {
      await api.post('/empresas', dados);
      mostrarMensagem('Empresa cadastrada com sucesso.', 'sucesso');
    }
    limparFormulario();
    await carregarEmpresas();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

btnCancelarEdicao.addEventListener('click', limparFormulario);

carregarEmpresas().catch((erro) => mostrarMensagem(erro.message, 'erro'));

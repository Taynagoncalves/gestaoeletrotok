const form = document.getElementById('form-usuario');
const tabela = document.getElementById('tabela-usuarios');
const mensagem = document.getElementById('mensagem-usuario');
const campoLogin = document.getElementById('campo-login');
const campoSenha = document.getElementById('campo-senha');
const wrapperSenha = document.getElementById('wrapper-senha');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const listaEmpresasCheckbox = document.getElementById('lista-empresas-checkbox');

let usuarioEmEdicaoId = null;
let empresas = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  usuarioEmEdicaoId = null;
  campoLogin.disabled = false;
  wrapperSenha.hidden = false;
  campoSenha.required = true;
  btnCancelarEdicao.hidden = true;
  listaEmpresasCheckbox.querySelectorAll('input').forEach((c) => (c.checked = false));
}

async function carregarEmpresas() {
  empresas = await api.get('/empresas');
  listaEmpresasCheckbox.innerHTML = empresas
    .map(
      (e) => `<label style="display:flex; align-items:center; gap:6px; font-size:13px;">
        <input type="checkbox" value="${e.id}" /> ${e.razao_social}
      </label>`
    )
    .join('');
}

async function preencherFormularioParaEdicao(usuario) {
  usuarioEmEdicaoId = usuario.id;
  form.nome.value = usuario.nome;
  campoLogin.value = usuario.login;
  campoLogin.disabled = true;
  wrapperSenha.hidden = true;
  campoSenha.required = false;
  form.perfil.value = usuario.perfil;
  btnCancelarEdicao.hidden = false;

  const empresasDoUsuario = await api.get(`/usuarios/${usuario.id}/empresas`);
  const idsVinculados = new Set(empresasDoUsuario.map((e) => e.id));
  listaEmpresasCheckbox.querySelectorAll('input').forEach((c) => {
    c.checked = idsVinculados.has(Number(c.value));
  });
}

async function carregarUsuarios() {
  const usuarios = await api.get('/usuarios');
  tabela.innerHTML = usuarios
    .map(
      (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.login}</td>
        <td>${u.perfil}</td>
        <td>${u.ativo ? 'Sim' : 'Não'}</td>
        <td><button type="button" class="btn-link" data-id="${u.id}">Editar</button></td>
      </tr>
    `
    )
    .join('');

  tabela.querySelectorAll('button').forEach((botao) => {
    const usuario = usuarios.find((u) => u.id === Number(botao.dataset.id));
    botao.addEventListener('click', () => preencherFormularioParaEdicao(usuario));
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  const empresaIds = [...listaEmpresasCheckbox.querySelectorAll('input:checked')].map((c) => Number(c.value));

  try {
    if (usuarioEmEdicaoId) {
      await api.put(`/usuarios/${usuarioEmEdicaoId}`, { nome: dados.nome, perfil: dados.perfil, empresa_ids: empresaIds });
      mostrarMensagem('Usuário atualizado com sucesso.', 'sucesso');
    } else {
      await api.post('/usuarios', { ...dados, empresa_ids: empresaIds });
      mostrarMensagem('Usuário cadastrado com sucesso.', 'sucesso');
    }
    limparFormulario();
    await carregarUsuarios();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

btnCancelarEdicao.addEventListener('click', limparFormulario);

async function iniciar() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('user');
  await carregarEmpresas();
  await carregarUsuarios();
}

iniciar().catch((erro) => mostrarMensagem(erro.message, 'erro'));

const form = document.getElementById('form-usuario');
const tabela = document.getElementById('tabela-usuarios');
const mensagem = document.getElementById('mensagem-usuario');
const campoLogin = document.getElementById('campo-login');
const campoSenha = document.getElementById('campo-senha');
const wrapperSenha = document.getElementById('wrapper-senha');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const listaEmpresasCheckbox = document.getElementById('lista-empresas-checkbox');

const tituloForm = document.getElementById('titulo-form');

let usuarioEmEdicaoId = null;
let empresas = [];

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('user');
  document.getElementById('icone-form').innerHTML = svgIcone('user');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
  document.getElementById('icone-total').innerHTML = svgIcone('users');
  document.getElementById('icone-admin').innerHTML = svgIcone('settings');
  document.getElementById('icone-caixa').innerHTML = svgIcone('cart');
  document.getElementById('icone-tecnico').innerHTML = svgIcone('wrench');
}

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
  tituloForm.textContent = 'Novo usuário';
  listaEmpresasCheckbox.querySelectorAll('input').forEach((c) => (c.checked = false));
}

async function carregarEmpresas() {
  empresas = await api.get('/empresas');
  listaEmpresasCheckbox.innerHTML = empresas
    .map((e) => `<label class="checkbox-item"><input type="checkbox" value="${e.id}" /> ${e.razao_social}</label>`)
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
  tituloForm.textContent = `Editando: ${usuario.nome}`;

  const empresasDoUsuario = await api.get(`/usuarios/${usuario.id}/empresas`);
  const idsVinculados = new Set(empresasDoUsuario.map((e) => e.id));
  listaEmpresasCheckbox.querySelectorAll('input').forEach((c) => {
    c.checked = idsVinculados.has(Number(c.value));
  });
}

const ROTULOS_PERFIL = { admin: 'Administrador', caixa: 'Operador de caixa', tecnico: 'Técnico' };
const BADGE_PERFIL = { admin: 'roxo', caixa: 'pendente', tecnico: 'info' };

async function carregarUsuarios() {
  const usuarios = await api.get('/usuarios');

  document.getElementById('valor-total').textContent = usuarios.length;
  document.getElementById('valor-admin').textContent = usuarios.filter((u) => u.perfil === 'admin').length;
  document.getElementById('valor-caixa').textContent = usuarios.filter((u) => u.perfil === 'caixa').length;
  document.getElementById('valor-tecnico').textContent = usuarios.filter((u) => u.perfil === 'tecnico').length;

  tabela.innerHTML =
    usuarios
      .map(
        (u) => `
      <tr>
        <td><strong>${u.nome}</strong></td>
        <td>${u.login}</td>
        <td><span class="badge-tag ${BADGE_PERFIL[u.perfil] || 'info'}">${ROTULOS_PERFIL[u.perfil] || u.perfil}</span></td>
        <td><span class="badge-tag ${u.ativo ? 'ativo' : 'inativo'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td><button type="button" class="btn-link" data-id="${u.id}">Editar</button></td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="5" style="text-align:center; color:var(--text-secundario); padding:24px;">Nenhum usuário cadastrado ainda.</td></tr>';

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
  renderizarIcones();
  await carregarEmpresas();
  await carregarUsuarios();
}

iniciar().catch((erro) => mostrarMensagem(erro.message, 'erro'));

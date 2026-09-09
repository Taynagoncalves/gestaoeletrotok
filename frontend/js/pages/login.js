const formLogin = document.getElementById('form-login');
const mensagemLogin = document.getElementById('mensagem-login');
const btnEntrar = document.getElementById('btn-entrar');

if (localStorage.getItem('usuarioLogado')) {
  window.location.href = 'index.html';
}

formLogin.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagemLogin.hidden = true;
  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  const dados = Object.fromEntries(new FormData(formLogin));

  try {
    const usuario = await api.post('/auth/login', dados);
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    window.location.href = 'index.html';
  } catch (erro) {
    mensagemLogin.textContent = erro.message;
    mensagemLogin.className = 'mensagem erro';
    mensagemLogin.hidden = false;
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
  }
});

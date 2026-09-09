const form = document.getElementById('form-cliente');
const tabela = document.getElementById('tabela-clientes');
const mensagem = document.getElementById('mensagem-cliente');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const campoBusca = document.getElementById('campo-busca');

let clienteEmEdicaoId = null;
let temporizadorBusca = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  clienteEmEdicaoId = null;
  btnCancelarEdicao.hidden = true;
}

function preencherFormularioParaEdicao(cliente) {
  clienteEmEdicaoId = cliente.id;
  form.nome.value = cliente.nome;
  form.cpf_cnpj.value = cliente.cpf_cnpj || '';
  form.telefone.value = cliente.telefone || '';
  form.endereco.value = cliente.endereco || '';
  btnCancelarEdicao.hidden = false;
}

async function carregarClientes(busca) {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  const clientes = await api.get(`/clientes${query}`);
  tabela.innerHTML =
    clientes
      .map(
        (cliente) => `
        <tr>
          <td>${cliente.nome}</td>
          <td>${cliente.cpf_cnpj || '-'}</td>
          <td>${cliente.telefone || '-'}</td>
          <td><button type="button" class="btn-link" data-id="${cliente.id}">Editar</button></td>
        </tr>
      `
      )
      .join('') || '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>';

  tabela.querySelectorAll('button').forEach((botao) => {
    const cliente = clientes.find((c) => c.id === Number(botao.dataset.id));
    botao.addEventListener('click', () => preencherFormularioParaEdicao(cliente));
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  try {
    if (clienteEmEdicaoId) {
      await api.put(`/clientes/${clienteEmEdicaoId}`, dados);
      mostrarMensagem('Cliente atualizado com sucesso.', 'sucesso');
    } else {
      await api.post('/clientes', dados);
      mostrarMensagem('Cliente cadastrado com sucesso.', 'sucesso');
    }
    limparFormulario();
    await carregarClientes(campoBusca.value);
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

btnCancelarEdicao.addEventListener('click', limparFormulario);

campoBusca.addEventListener('input', () => {
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(() => {
    carregarClientes(campoBusca.value).catch((erro) => mostrarMensagem(erro.message, 'erro'));
  }, 300);
});

carregarClientes().catch((erro) => mostrarMensagem(erro.message, 'erro'));

const form = document.getElementById('form-cliente');
const tabela = document.getElementById('tabela-clientes');
const mensagem = document.getElementById('mensagem-cliente');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const campoBusca = document.getElementById('campo-busca');
const tituloForm = document.getElementById('titulo-form');

let clienteEmEdicaoId = null;
let temporizadorBusca = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('users');
  document.getElementById('icone-form').innerHTML = svgIcone('users');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-total').innerHTML = svgIcone('users');
  document.getElementById('icone-com-telefone').innerHTML = svgIcone('zap');
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  clienteEmEdicaoId = null;
  btnCancelarEdicao.hidden = true;
  tituloForm.textContent = 'Novo cliente';
}

function preencherFormularioParaEdicao(cliente) {
  clienteEmEdicaoId = cliente.id;
  form.nome.value = cliente.nome;
  form.cpf_cnpj.value = cliente.cpf_cnpj || '';
  form.telefone.value = cliente.telefone || '';
  form.endereco.value = cliente.endereco || '';
  form.email.value = cliente.email || '';
  form.logradouro.value = cliente.logradouro || '';
  form.numero.value = cliente.numero || '';
  form.complemento.value = cliente.complemento || '';
  form.bairro.value = cliente.bairro || '';
  form.municipio.value = cliente.municipio || '';
  form.codigo_municipio_ibge.value = cliente.codigo_municipio_ibge || '';
  form.uf.value = cliente.uf || '';
  form.cep.value = cliente.cep || '';
  btnCancelarEdicao.hidden = false;
  tituloForm.textContent = `Editando: ${cliente.nome}`;
}

async function carregarClientes(busca) {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  const clientes = await api.get(`/clientes${query}`);

  document.getElementById('valor-total').textContent = clientes.length;
  document.getElementById('valor-com-telefone').textContent = clientes.filter((c) => c.telefone).length;

  tabela.innerHTML =
    clientes
      .map(
        (cliente) => `
        <tr>
          <td><strong>${cliente.nome}</strong></td>
          <td>${cliente.cpf_cnpj || '-'}</td>
          <td>${cliente.telefone || '-'}</td>
          <td><button type="button" class="btn-link" data-id="${cliente.id}">Editar</button></td>
        </tr>
      `
      )
      .join('') || '<tr><td colspan="4" style="text-align:center; color:var(--text-secundario); padding:24px;">Nenhum cliente encontrado.</td></tr>';

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

renderizarIcones();
carregarClientes().catch((erro) => mostrarMensagem(erro.message, 'erro'));

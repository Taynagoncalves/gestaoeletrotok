const form = document.getElementById('form-fornecedor');
const tabela = document.getElementById('tabela-fornecedores');
const mensagem = document.getElementById('mensagem-fornecedor');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

let fornecedorEmEdicaoId = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  fornecedorEmEdicaoId = null;
  btnCancelarEdicao.hidden = true;
}

function preencherFormularioParaEdicao(fornecedor) {
  fornecedorEmEdicaoId = fornecedor.id;
  form.razao_social.value = fornecedor.razao_social;
  form.cnpj.value = fornecedor.cnpj || '';
  form.contato_nome.value = fornecedor.contato_nome || '';
  form.contato_telefone.value = fornecedor.contato_telefone || '';
  form.contato_email.value = fornecedor.contato_email || '';
  form.condicoes_pagamento.value = fornecedor.condicoes_pagamento || '';
  btnCancelarEdicao.hidden = false;
}

async function carregarFornecedores() {
  const fornecedores = await api.get('/fornecedores');
  tabela.innerHTML = '';

  fornecedores.forEach((fornecedor) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${fornecedor.razao_social}</td>
      <td>${fornecedor.cnpj || '-'}</td>
      <td>${fornecedor.contato_nome || '-'}</td>
      <td>${fornecedor.ativo ? 'Sim' : 'Não'}</td>
      <td><button type="button" class="btn-link" data-id="${fornecedor.id}">Editar</button></td>
    `;
    linha.querySelector('button').addEventListener('click', () => preencherFormularioParaEdicao(fornecedor));
    tabela.appendChild(linha);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  try {
    if (fornecedorEmEdicaoId) {
      await api.put(`/fornecedores/${fornecedorEmEdicaoId}`, dados);
      mostrarMensagem('Fornecedor atualizado com sucesso.', 'sucesso');
    } else {
      await api.post('/fornecedores', dados);
      mostrarMensagem('Fornecedor cadastrado com sucesso.', 'sucesso');
    }
    limparFormulario();
    await carregarFornecedores();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

btnCancelarEdicao.addEventListener('click', limparFormulario);

carregarFornecedores().catch((erro) => mostrarMensagem(erro.message, 'erro'));

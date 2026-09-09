const form = document.getElementById('form-fornecedor');
const tabela = document.getElementById('tabela-fornecedores');
const mensagem = document.getElementById('mensagem-fornecedor');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const tituloForm = document.getElementById('titulo-form');
const painelHistorico = document.getElementById('painel-historico');

let fornecedorEmEdicaoId = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('truck');
  document.getElementById('icone-form').innerHTML = svgIcone('truck');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
  document.getElementById('icone-total').innerHTML = svgIcone('truck');
  document.getElementById('icone-ativos').innerHTML = svgIcone('check-circle');
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  fornecedorEmEdicaoId = null;
  btnCancelarEdicao.hidden = true;
  tituloForm.textContent = 'Novo fornecedor';
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
  tituloForm.textContent = `Editando: ${fornecedor.razao_social}`;
}

async function mostrarHistorico(fornecedor) {
  painelHistorico.innerHTML = `<p class="painel-form-titulo">Histórico — ${fornecedor.razao_social}</p><p style="color:var(--text-secundario); font-size:13px;">Carregando...</p>`;
  const historico = await api.get(`/fornecedores/${fornecedor.id}/historico-compras`);

  painelHistorico.innerHTML = `
    <p class="painel-form-titulo">Histórico — ${fornecedor.razao_social}</p>
    ${
      historico.length === 0
        ? '<p style="color:var(--text-secundario); font-size:13px;">Nenhuma compra registrada com este fornecedor ainda.</p>'
        : `<div style="max-height:360px; overflow-y:auto;">${historico
            .map(
              (item) => `
            <div style="border-bottom:1px solid var(--border); padding:8px 0; font-size:13px;">
              <strong>${item.produto_nome}</strong>
              <div style="color:var(--text-secundario); font-size:11px;">${item.empresa_nome} • ${new Date(item.data).toLocaleDateString('pt-BR')}</div>
              <div>${item.quantidade} un. × R$ ${Number(item.valor_unitario).toFixed(2)}</div>
            </div>
          `
            )
            .join('')}</div>`
    }
  `;
}

function atualizarCards(fornecedores) {
  document.getElementById('valor-total').textContent = fornecedores.length;
  document.getElementById('valor-ativos').textContent = fornecedores.filter((f) => f.ativo).length;
}

async function carregarFornecedores() {
  const fornecedores = await api.get('/fornecedores');
  atualizarCards(fornecedores);

  tabela.innerHTML =
    fornecedores
      .map(
        (fornecedor) => `
      <tr>
        <td><strong>${fornecedor.razao_social}</strong></td>
        <td>${fornecedor.cnpj || '-'}</td>
        <td>${fornecedor.contato_nome || '-'}</td>
        <td><span class="badge-tag ${fornecedor.ativo ? 'ativo' : 'inativo'}">${fornecedor.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button type="button" class="btn-link" data-editar="${fornecedor.id}">Editar</button>
          <button type="button" class="btn-link" data-historico="${fornecedor.id}">Histórico</button>
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="5" style="text-align:center; color:var(--text-secundario); padding:24px;">Nenhum fornecedor cadastrado ainda.</td></tr>';

  tabela.querySelectorAll('[data-editar]').forEach((botao) => {
    const fornecedor = fornecedores.find((f) => f.id === Number(botao.dataset.editar));
    botao.addEventListener('click', () => preencherFormularioParaEdicao(fornecedor));
  });
  tabela.querySelectorAll('[data-historico]').forEach((botao) => {
    const fornecedor = fornecedores.find((f) => f.id === Number(botao.dataset.historico));
    botao.addEventListener('click', () => mostrarHistorico(fornecedor));
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

renderizarIcones();
carregarFornecedores().catch((erro) => mostrarMensagem(erro.message, 'erro'));

const form = document.getElementById('form-empresa');
const tabela = document.getElementById('tabela-empresas');
const mensagem = document.getElementById('mensagem-empresa');
const campoCnpj = document.getElementById('campo-cnpj');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const tituloForm = document.getElementById('titulo-form');

let empresaEmEdicaoId = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('building');
  document.getElementById('icone-form').innerHTML = svgIcone('building');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
  document.getElementById('icone-total').innerHTML = svgIcone('building');
  document.getElementById('icone-ativas').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-varejo').innerHTML = svgIcone('cart');
  document.getElementById('icone-atacado').innerHTML = svgIcone('truck');
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparFormulario() {
  form.reset();
  empresaEmEdicaoId = null;
  campoCnpj.disabled = false;
  btnCancelarEdicao.hidden = true;
  tituloForm.textContent = 'Nova empresa';
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
  tituloForm.textContent = `Editando: ${empresa.razao_social}`;
  document.getElementById('painel-filtros')?.scrollIntoView?.({ behavior: 'smooth' });
}

function atualizarCards(empresas) {
  document.getElementById('valor-total').textContent = empresas.length;
  document.getElementById('valor-ativas').textContent = empresas.filter((e) => e.ativa).length;
  document.getElementById('valor-varejo').textContent = empresas.filter((e) => e.tipo === 'varejo').length;
  document.getElementById('valor-atacado').textContent = empresas.filter((e) => e.tipo === 'atacado').length;
}

async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  atualizarCards(empresas);

  tabela.innerHTML =
    empresas
      .map(
        (empresa) => `
      <tr>
        <td><strong>${empresa.razao_social}</strong>${empresa.nome_fantasia ? `<div style="font-size:11px; color:var(--text-secundario);">${empresa.nome_fantasia}</div>` : ''}</td>
        <td>${empresa.cnpj}</td>
        <td><span class="badge-tag ${empresa.tipo === 'atacado' ? 'roxo' : 'info'}">${empresa.tipo === 'atacado' ? 'Atacado' : 'Varejo'}</span></td>
        <td><span class="badge-tag ${empresa.ativa ? 'ativo' : 'inativo'}">${empresa.ativa ? 'Ativa' : 'Inativa'}</span></td>
        <td><button type="button" class="btn-link" data-id="${empresa.id}">Editar</button></td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="5" style="text-align:center; color:var(--text-secundario); padding:24px;">Nenhuma empresa cadastrada ainda.</td></tr>';

  tabela.querySelectorAll('button[data-id]').forEach((botao) => {
    const empresa = empresas.find((e) => e.id === Number(botao.dataset.id));
    botao.addEventListener('click', () => preencherFormularioParaEdicao(empresa));
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

renderizarIcones();
carregarEmpresas().catch((erro) => mostrarMensagem(erro.message, 'erro'));

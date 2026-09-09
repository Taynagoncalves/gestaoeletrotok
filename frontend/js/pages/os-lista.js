const campoBusca = document.getElementById('campo-busca');
const filtroStatus = document.getElementById('filtro-status');
const filtroTecnico = document.getElementById('filtro-tecnico');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaOs = document.getElementById('tabela-os');
const textoPaginacao = document.getElementById('texto-paginacao');
const paginacao = document.getElementById('paginacao');
const painelDetalhes = document.getElementById('painel-detalhes');

const ITENS_POR_PAGINA = 10;
const STATUS_ANDAMENTO = ['recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca', 'em_reparo', 'pronto'];
const STATUS_NEGATIVO = ['recusado', 'devolvido_sem_reparo'];

let ordens = [];
let paginaAtual = 1;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('wrench');
  document.getElementById('icone-nova').innerHTML = svgIcone('plus');
  document.getElementById('icone-total').innerHTML = svgIcone('file-text');
  document.getElementById('icone-andamento').innerHTML = svgIcone('settings');
  document.getElementById('icone-concluidas').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-canceladas').innerHTML = svgIcone('x-circle');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
}

async function carregarTecnicos() {
  const usuarios = await api.get('/usuarios');
  const tecnicos = usuarios.filter((u) => u.perfil === 'tecnico');
  filtroTecnico.innerHTML = '<option value="">Todos</option>' + tecnicos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join('');
}

async function carregarOrdens() {
  const contexto = empresaSelecionada();
  if (!contexto.id) {
    ordens = [];
    renderizarTabela();
    return;
  }

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (filtroStatus.value) params.set('status', filtroStatus.value);
  if (filtroTecnico.value) params.set('tecnico_id', filtroTecnico.value);

  ordens = await api.get(`/ordens-servico?${params.toString()}`);
  atualizarCards();
  renderizarTabela();
}

function atualizarCards() {
  const andamento = ordens.filter((o) => STATUS_ANDAMENTO.includes(o.status)).length;
  const entregues = ordens.filter((o) => o.status === 'entregue').length;
  const negativas = ordens.filter((o) => STATUS_NEGATIVO.includes(o.status)).length;

  document.getElementById('valor-total').textContent = ordens.length;
  document.getElementById('valor-andamento').textContent = andamento;
  document.getElementById('valor-concluidas').textContent = entregues;
  document.getElementById('valor-canceladas').textContent = negativas;
}

function ordensFiltradas() {
  const termo = campoBusca.value.trim().toLowerCase();
  if (!termo) return ordens;
  return ordens.filter((o) => `${o.id} ${o.cliente_nome} ${o.aparelho_modelo}`.toLowerCase().includes(termo));
}

function renderizarTabela() {
  const filtradas = ordensFiltradas();
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  tabelaOs.innerHTML =
    pagina
      .map(
        (o) => `
      <tr data-id="${o.id}" style="cursor:pointer;">
        <td>#${String(o.id).padStart(5, '0')}</td>
        <td>${o.cliente_nome}</td>
        <td>${o.aparelho_modelo}</td>
        <td>${badgeStatusOS(o.status)}</td>
        <td>${new Date(o.data_abertura).toLocaleDateString('pt-BR')}</td>
        <td>${o.prazo_estimado ? new Date(o.prazo_estimado).toLocaleDateString('pt-BR') : '-'}</td>
        <td><a href="os-form.html?id=${o.id}" class="btn-link">Abrir</a></td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:24px;">Nenhuma OS encontrada.</td></tr>';

  textoPaginacao.textContent = filtradas.length
    ? `Exibindo ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, filtradas.length)} de ${filtradas.length} OS`
    : 'Nenhuma OS encontrada.';

  renderizarPaginacao(totalPaginas);

  tabelaOs.querySelectorAll('tr[data-id]').forEach((linha) => {
    linha.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) return;
      mostrarDetalhes(Number(linha.dataset.id));
    });
  });
}

function renderizarPaginacao(totalPaginas) {
  const botoes = [];
  for (let i = 1; i <= totalPaginas; i += 1) {
    botoes.push(`<button type="button" class="${i === paginaAtual ? 'ativo' : ''}" data-pagina="${i}">${i}</button>`);
  }
  paginacao.innerHTML = botoes.join('');
  paginacao.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      paginaAtual = Number(botao.dataset.pagina);
      renderizarTabela();
    });
  });
}

async function mostrarDetalhes(id) {
  const os = await api.get(`/ordens-servico/${id}`);
  painelDetalhes.innerHTML = `
    <p class="painel-form-titulo">OS #${String(os.id).padStart(5, '0')} ${badgeStatusOS(os.status)}</p>
    <p><strong>Cliente:</strong> ${os.cliente_nome}<br><small style="color:#6b7280;">${os.cliente_telefone || ''}</small></p>
    <p><strong>Aparelho:</strong> ${os.aparelho_modelo}${os.imei ? ` (IMEI ${os.imei})` : ''}</p>
    <p><strong>Técnico:</strong> ${os.tecnico_nome || 'Não atribuído'}</p>
    <p><strong>Problema relatado:</strong> ${os.defeito_relatado || '-'}</p>
    <p><strong>Data de entrada:</strong> ${new Date(os.data_abertura).toLocaleString('pt-BR')}</p>
    <p><strong>Prazo:</strong> ${os.prazo_estimado ? new Date(os.prazo_estimado).toLocaleDateString('pt-BR') : '-'}</p>
    <a href="os-form.html?id=${os.id}" class="botao primario" style="width:100%; justify-content:center; margin-top:10px;">Abrir OS</a>
  `;
}

[campoBusca].forEach((el) => el.addEventListener('input', () => { paginaAtual = 1; renderizarTabela(); }));
filtroStatus.addEventListener('change', () => carregarOrdens().catch((erro) => mostrarErro(erro.message)));
filtroTecnico.addEventListener('change', () => carregarOrdens().catch((erro) => mostrarErro(erro.message)));

btnLimparFiltros.addEventListener('click', () => {
  campoBusca.value = '';
  filtroStatus.value = '';
  filtroTecnico.value = '';
  carregarOrdens().catch((erro) => mostrarErro(erro.message));
});

function mostrarErro(texto) {
  tabelaOs.innerHTML = `<tr><td colspan="7" style="color:#b00020;">${texto}</td></tr>`;
}

window.addEventListener('empresa-alterada', () => carregarOrdens().catch((erro) => mostrarErro(erro.message)));

async function iniciar() {
  renderizarIcones();
  await initLayout('os');
  await carregarTecnicos();
  await carregarOrdens();
}

iniciar().catch((erro) => mostrarErro(erro.message));

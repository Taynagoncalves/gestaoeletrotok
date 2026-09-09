const campoBusca = document.getElementById('campo-busca');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroStatus = document.getElementById('filtro-status');
const campoDe = document.getElementById('campo-de');
const campoAte = document.getElementById('campo-ate');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaNotas = document.getElementById('tabela-notas');
const textoPaginacao = document.getElementById('texto-paginacao');
const paginacao = document.getElementById('paginacao');

const ITENS_POR_PAGINA = 10;
let notas = [];
let paginaAtual = 1;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('file-text');
  document.getElementById('icone-config').innerHTML = svgIcone('settings');
  document.getElementById('icone-nova').innerHTML = svgIcone('plus');
  document.getElementById('icone-total').innerHTML = svgIcone('file-text');
  document.getElementById('icone-valor').innerHTML = svgIcone('dollar');
  document.getElementById('icone-nfce').innerHTML = svgIcone('cart');
  document.getElementById('icone-nfe').innerHTML = svgIcone('truck');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function periodoPadrao() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { de: inicioMes.toISOString().slice(0, 10), ate: hoje.toISOString().slice(0, 10) };
}

function badgeStatusNota(status) {
  const mapa = {
    pendente: ['pendente', 'Em processamento'],
    autorizada: ['ativo', 'Autorizada'],
    rejeitada: ['erro', 'Rejeitada'],
    cancelada: ['inativo', 'Cancelada'],
    erro: ['erro', 'Erro'],
  };
  const [classe, rotulo] = mapa[status] || ['inativo', status];
  return `<span class="badge-tag ${classe}">${rotulo}</span>`;
}

async function carregarResumo() {
  const contexto = empresaSelecionada();
  if (!contexto.id) return;

  const resumo = await api.get(`/notas-fiscais/resumo-periodo?empresa_id=${contexto.id}&de=${campoDe.value}&ate=${campoAte.value}`);
  document.getElementById('valor-total').textContent = resumo.notas_emitidas;
  document.getElementById('valor-total-rs').textContent = formatarMoeda(resumo.valor_total);
  document.getElementById('valor-nfce').textContent = resumo.nfce_total || 0;
  document.getElementById('valor-nfe').textContent = resumo.nfe_total || 0;
}

async function carregarNotas() {
  const contexto = empresaSelecionada();
  if (!contexto.id) {
    notas = [];
    renderizarTabela();
    return;
  }

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (filtroTipo.value) params.set('tipo', filtroTipo.value);
  if (filtroStatus.value) params.set('status', filtroStatus.value);
  if (campoBusca.value) params.set('busca', campoBusca.value);

  notas = await api.get(`/notas-fiscais?${params.toString()}`);
  paginaAtual = 1;
  renderizarTabela();
}

function renderizarTabela() {
  const totalPaginas = Math.max(1, Math.ceil(notas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = notas.slice(inicio, inicio + ITENS_POR_PAGINA);

  tabelaNotas.innerHTML =
    pagina
      .map(
        (nota) => `
      <tr>
        <td>${nota.numero || `#${String(nota.id).padStart(6, '0')}`}</td>
        <td>${new Date(nota.criado_em).toLocaleString('pt-BR')}</td>
        <td><span class="badge-tag info">${nota.tipo === 'nfce' ? 'NFC-e' : 'NF-e'}</span></td>
        <td>${nota.cliente_nome || 'Consumidor não identificado'}</td>
        <td>${nota.cliente_documento || '-'}</td>
        <td>${formatarMoeda(nota.total)}</td>
        <td>${badgeStatusNota(nota.status)}</td>
        <td>
          <div class="acoes-tabela">
            <button type="button" data-ver="${nota.id}" title="Ver detalhes">${svgIcone('info')}</button>
            ${['erro', 'rejeitada'].includes(nota.status) ? `<button type="button" data-reemitir="${nota.id}" title="Reemitir">${svgIcone('save')}</button>` : ''}
            ${['autorizada', 'pendente'].includes(nota.status) ? `<button type="button" data-consultar="${nota.id}" title="Consultar status">${svgIcone('refresh-cw')}</button>` : ''}
            ${['pendente', 'erro', 'autorizada'].includes(nota.status) ? `<button type="button" class="perigo" data-cancelar="${nota.id}" title="Cancelar">${svgIcone('x-circle')}</button>` : ''}
          </div>
          ${nota.motivo ? `<div style="font-size:11px; color:#b91c1c; margin-top:4px; max-width:200px;">${nota.motivo}</div>` : ''}
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="8" style="text-align:center; color:var(--text-secundario); padding:24px;">Nenhuma nota fiscal encontrada.</td></tr>';

  textoPaginacao.textContent = notas.length
    ? `Exibindo ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, notas.length)} de ${notas.length} notas fiscais`
    : 'Nenhuma nota fiscal encontrada.';

  renderizarPaginacao(totalPaginas);

  tabelaNotas.querySelectorAll('[data-ver]').forEach((botao) => {
    botao.addEventListener('click', () => mostrarDetalhes(Number(botao.dataset.ver)));
  });
  tabelaNotas.querySelectorAll('[data-consultar]').forEach((botao) => {
    botao.addEventListener('click', () => executarAcao(() => api.post(`/notas-fiscais/${botao.dataset.consultar}/consultar`, {})));
  });
  tabelaNotas.querySelectorAll('[data-reemitir]').forEach((botao) => {
    botao.addEventListener('click', () => executarAcao(() => api.post(`/notas-fiscais/${botao.dataset.reemitir}/reemitir`, {})));
  });
  tabelaNotas.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const justificativa = prompt('Motivo do cancelamento:');
      if (justificativa === null) return;
      executarAcao(() => api.post(`/notas-fiscais/${botao.dataset.cancelar}/cancelar`, { justificativa }));
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
  const nota = await api.get(`/notas-fiscais/${id}`);
  const itensHtml = nota.itens
    ? `<ul class="lista-produtos">${nota.itens.map((i) => `<li><span>${i.quantidade}x ${i.produto_nome}</span><strong>${formatarMoeda(i.quantidade * i.valor_unitario)}</strong></li>`).join('')}</ul>`
    : `<p style="font-size:12px; color:var(--text-secundario);">Nota vinculada a ${nota.origem === 'venda' ? 'venda' : 'ordem de serviço'} #${nota.origem_id}.</p>`;

  alert(
    `Nota ${nota.numero || `#${nota.id}`}\n` +
      `Tipo: ${nota.tipo === 'nfce' ? 'NFC-e' : 'NF-e'}\n` +
      `Cliente: ${nota.cliente_nome || 'Consumidor não identificado'}\n` +
      `Total: ${formatarMoeda(nota.total)}\n` +
      `Status: ${nota.status}${nota.motivo ? `\nMotivo: ${nota.motivo}` : ''}\n` +
      (nota.chave_acesso ? `Chave: ${nota.chave_acesso}` : '')
  );
}

async function executarAcao(chamada) {
  try {
    await chamada();
  } catch (erro) {
    alert(erro.message);
  }
  await Promise.all([carregarNotas(), carregarResumo()]);
}

[campoBusca].forEach((el) => el.addEventListener('input', () => carregarNotas().catch((erro) => mostrarErro(erro.message))));
[filtroTipo, filtroStatus].forEach((el) => el.addEventListener('change', () => carregarNotas().catch((erro) => mostrarErro(erro.message))));
[campoDe, campoAte].forEach((el) =>
  el.addEventListener('change', () => Promise.all([carregarNotas(), carregarResumo()]).catch((erro) => mostrarErro(erro.message)))
);

btnLimparFiltros.addEventListener('click', () => {
  campoBusca.value = '';
  filtroTipo.value = '';
  filtroStatus.value = '';
  const { de, ate } = periodoPadrao();
  campoDe.value = de;
  campoAte.value = ate;
  Promise.all([carregarNotas(), carregarResumo()]).catch((erro) => mostrarErro(erro.message));
});

function mostrarErro(texto) {
  tabelaNotas.innerHTML = `<tr><td colspan="8" style="color:#b00020;">${texto}</td></tr>`;
}

window.addEventListener('empresa-alterada', () => Promise.all([carregarNotas(), carregarResumo()]).catch((erro) => mostrarErro(erro.message)));

async function iniciar() {
  renderizarIcones();
  await initLayout('notas');

  const { de, ate } = periodoPadrao();
  campoDe.value = de;
  campoAte.value = ate;

  await Promise.all([carregarNotas(), carregarResumo()]);
}

iniciar().catch((erro) => mostrarErro(erro.message));

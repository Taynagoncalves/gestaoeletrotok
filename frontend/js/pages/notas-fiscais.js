const filtroStatus = document.getElementById('filtro-status');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroOrigem = document.getElementById('filtro-origem');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaNotas = document.getElementById('tabela-notas');

let notas = [];

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('file-text');
  document.getElementById('icone-config').innerHTML = svgIcone('settings');
  document.getElementById('icone-total').innerHTML = svgIcone('file-text');
  document.getElementById('icone-autorizadas').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-pendentes').innerHTML = svgIcone('alert-triangle');
  document.getElementById('icone-erro').innerHTML = svgIcone('x-circle');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
}

function badgeStatusNota(status) {
  const mapa = {
    pendente: ['#ffe8d1', '#b45309', 'Pendente'],
    autorizada: ['#dcfce7', '#15803d', 'Autorizada'],
    rejeitada: ['#fee2e2', '#b91c1c', 'Rejeitada'],
    cancelada: ['#e5e7eb', '#374151', 'Cancelada'],
    erro: ['#fee2e2', '#b91c1c', 'Erro'],
  };
  const [bg, cor, rotulo] = mapa[status] || ['#e5e7eb', '#374151', status];
  return `<span class="badge-tag" style="background:${bg}; color:${cor};">${rotulo}</span>`;
}

async function carregarNotas() {
  const contexto = empresaSelecionada();
  if (!contexto.id) {
    notas = [];
    renderizarTabela();
    return;
  }

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (filtroStatus.value) params.set('status', filtroStatus.value);
  if (filtroTipo.value) params.set('tipo', filtroTipo.value);
  if (filtroOrigem.value) params.set('origem', filtroOrigem.value);

  notas = await api.get(`/notas-fiscais?${params.toString()}`);
  atualizarCards();
  renderizarTabela();
}

function atualizarCards() {
  document.getElementById('valor-total').textContent = notas.length;
  document.getElementById('valor-autorizadas').textContent = notas.filter((n) => n.status === 'autorizada').length;
  document.getElementById('valor-pendentes').textContent = notas.filter((n) => n.status === 'pendente').length;
  document.getElementById('valor-erro').textContent = notas.filter((n) => ['erro', 'rejeitada'].includes(n.status)).length;
}

function renderizarTabela() {
  tabelaNotas.innerHTML =
    notas
      .map(
        (nota) => `
      <tr>
        <td>#${String(nota.id).padStart(5, '0')}</td>
        <td>${nota.origem === 'venda' ? 'Venda' : 'OS'} #${nota.origem_id}</td>
        <td>${nota.tipo === 'nfce' ? 'NFC-e' : 'NFe 55'}</td>
        <td>${badgeStatusNota(nota.status)}</td>
        <td style="font-family:monospace; font-size:11px;">${nota.chave_acesso || '-'}</td>
        <td>${new Date(nota.criado_em).toLocaleString('pt-BR')}</td>
        <td>
          <div class="acoes-tabela">
            ${nota.status === 'autorizada' || nota.status === 'pendente' ? `<button type="button" data-consultar="${nota.id}" title="Consultar status">${svgIcone('refresh-cw')}</button>` : ''}
            ${['erro', 'rejeitada'].includes(nota.status) ? `<button type="button" data-reemitir="${nota.id}" title="Reemitir">${svgIcone('save')}</button>` : ''}
            ${['pendente', 'erro', 'autorizada'].includes(nota.status) ? `<button type="button" class="perigo" data-cancelar="${nota.id}" title="Cancelar">${svgIcone('x-circle')}</button>` : ''}
          </div>
          ${nota.motivo ? `<div style="font-size:11px; color:#b91c1c; margin-top:4px; max-width:220px;">${nota.motivo}</div>` : ''}
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:24px;">Nenhuma nota fiscal emitida ainda.</td></tr>';

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

async function executarAcao(chamada) {
  try {
    await chamada();
  } catch (erro) {
    alert(erro.message);
  }
  await carregarNotas();
}

[filtroStatus, filtroTipo, filtroOrigem].forEach((el) => el.addEventListener('change', () => carregarNotas().catch((erro) => mostrarErro(erro.message))));
btnLimparFiltros.addEventListener('click', () => {
  filtroStatus.value = '';
  filtroTipo.value = '';
  filtroOrigem.value = '';
  carregarNotas().catch((erro) => mostrarErro(erro.message));
});

function mostrarErro(texto) {
  tabelaNotas.innerHTML = `<tr><td colspan="7" style="color:#b00020;">${texto}</td></tr>`;
}

window.addEventListener('empresa-alterada', () => carregarNotas().catch((erro) => mostrarErro(erro.message)));

async function iniciar() {
  renderizarIcones();
  await initLayout('notas');
  await carregarNotas();
}

iniciar().catch((erro) => mostrarErro(erro.message));

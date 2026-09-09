const campoBusca = document.getElementById('campo-busca');
const filtroForma = document.getElementById('filtro-forma');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaVendas = document.getElementById('tabela-vendas');
const textoPaginacao = document.getElementById('texto-paginacao');
const paginacao = document.getElementById('paginacao');
const painelDetalhes = document.getElementById('painel-detalhes');

const ITENS_POR_PAGINA = 10;

let vendas = [];
let periodo = 'hoje';
let abaStatus = '';
let paginaAtual = 1;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('cart');
  document.getElementById('icone-nova-venda').innerHTML = svgIcone('plus');
  document.getElementById('icone-total').innerHTML = svgIcone('cart');
  document.getElementById('icone-ticket').innerHTML = svgIcone('tag');
  document.getElementById('icone-dinheiro').innerHTML = svgIcone('dollar');
  document.getElementById('icone-cartao').innerHTML = svgIcone('credit-card');
  document.getElementById('icone-pix').innerHTML = svgIcone('zap');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function intervaloPeriodo() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  if (periodo === 'hoje') {
    inicio.setHours(0, 0, 0, 0);
  } else {
    inicio.setDate(hoje.getDate() - Number(periodo));
  }
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);
  return { de: formatarData(inicio), ate: formatarData(fim) };
}

function formatarData(data) {
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

document.querySelectorAll('[data-periodo]').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('[data-periodo]').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    periodo = botao.dataset.periodo;
    carregarTudo().catch((erro) => mostrarErro(erro.message));
  });
});

document.querySelectorAll('[data-status-tab]').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('[data-status-tab]').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    abaStatus = botao.dataset.statusTab;
    paginaAtual = 1;
    carregarVendas().catch((erro) => mostrarErro(erro.message));
  });
});

async function carregarResumo() {
  const contexto = empresaSelecionada();
  if (!contexto.id) return;

  const { de, ate } = intervaloPeriodo();
  const resumo = await api.get(`/vendas/relatorios/resumo?empresa_id=${contexto.id}&de=${de}&ate=${ate}`);

  document.getElementById('valor-total-vendas').textContent = formatarMoeda(resumo.total);
  document.getElementById('qtd-vendas').textContent = `${resumo.quantidade} venda(s) realizada(s)`;
  document.getElementById('valor-ticket-medio').textContent = formatarMoeda(resumo.quantidade ? resumo.total / resumo.quantidade : 0);

  const porForma = Object.fromEntries((resumo.por_forma || []).map((f) => [f.forma, Number(f.total)]));
  document.getElementById('valor-dinheiro').textContent = formatarMoeda(porForma.dinheiro || 0);
  document.getElementById('valor-cartao').textContent = formatarMoeda((porForma.debito || 0) + (porForma.credito || 0));
  document.getElementById('valor-pix').textContent = formatarMoeda(porForma.pix || 0);
}

async function carregarVendas() {
  const contexto = empresaSelecionada();
  if (!contexto.id) {
    vendas = [];
    renderizarTabela();
    return;
  }

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (abaStatus === 'presencial' || abaStatus === 'online') {
    params.set('canal', abaStatus);
  } else if (abaStatus) {
    params.set('status', abaStatus);
  }

  vendas = await api.get(`/vendas?${params.toString()}`);
  renderizarTabela();
}

function badgeStatus(status) {
  if (status === 'concluida') return '<span class="badge-tag ativo">Concluída</span>';
  if (status === 'cancelada') return '<span class="badge-tag inativo" style="background:#fee2e2;color:#b91c1c;">Cancelada</span>';
  return '<span class="badge-tag" style="background:#dbeafe;color:#1d4ed8;">Orçamento</span>';
}

function vendasFiltradas() {
  const termo = campoBusca.value.trim().toLowerCase();
  const forma = filtroForma.value;

  return vendas.filter((v) => {
    if (termo) {
      const alvo = `${v.id} ${v.cliente_nome || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    if (forma && !(v.formas_pagamento || '').split(',').includes(forma)) return false;
    return true;
  });
}

function renderizarTabela() {
  const filtradas = vendasFiltradas();
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  tabelaVendas.innerHTML =
    pagina
      .map(
        (v) => `
      <tr data-id="${v.id}" style="cursor:pointer;">
        <td>#${String(v.id).padStart(6, '0')}</td>
        <td>${new Date(v.data).toLocaleString('pt-BR')}</td>
        <td>${v.cliente_nome || 'Consumidor não identificado'}</td>
        <td>${v.canal === 'online' ? 'Online' : 'Presencial'}</td>
        <td>${v.formas_pagamento || '-'}</td>
        <td>${formatarMoeda(v.total)}</td>
        <td>${badgeStatus(v.status)}</td>
        <td>
          ${v.status === 'concluida' ? `<button type="button" class="btn-link" data-cancelar="${v.id}">Cancelar</button>` : ''}
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="8" style="text-align:center; color:#6b7280; padding:24px;">Nenhuma venda encontrada.</td></tr>';

  textoPaginacao.textContent = filtradas.length
    ? `Exibindo ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, filtradas.length)} de ${filtradas.length} vendas`
    : 'Nenhuma venda encontrada.';

  renderizarPaginacao(totalPaginas);

  tabelaVendas.querySelectorAll('tr[data-id]').forEach((linha) => {
    linha.addEventListener('click', (evento) => {
      if (evento.target.closest('button')) return;
      mostrarDetalhes(Number(linha.dataset.id));
    });
  });

  tabelaVendas.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', async (evento) => {
      evento.stopPropagation();
      if (!confirm('Cancelar esta venda? O estoque será estornado.')) return;
      await api.put(`/vendas/${botao.dataset.cancelar}/cancelar`, {});
      await carregarTudo();
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
  const [venda, notas] = await Promise.all([
    api.get(`/vendas/${id}`),
    api.get(`/notas-fiscais/origem/venda/${id}`).catch(() => []),
  ]);

  painelDetalhes.innerHTML = `
    <p class="painel-form-titulo">Detalhes da venda #${String(venda.id).padStart(6, '0')} ${badgeStatus(venda.status)}</p>
    <p><strong>Cliente:</strong> ${venda.cliente_nome || 'Consumidor não identificado'}</p>
    <p><strong>Tipo de venda:</strong> ${venda.canal === 'online' ? 'Online' : 'Presencial (Balcão)'}</p>
    <p><strong>Data:</strong> ${new Date(venda.data).toLocaleString('pt-BR')}</p>
    <p><strong>Itens (${venda.itens.length})</strong></p>
    <ul class="lista-produtos">
      ${venda.itens
        .map(
          (item) => `<li><span>${item.quantidade}x ${item.produto_nome}${item.imei ? ` (IMEI ${item.imei})` : ''}</span><strong>${formatarMoeda(item.preco_unitario * item.quantidade)}</strong></li>`
        )
        .join('')}
    </ul>
    <div class="pdv-resumo-linha"><span>Subtotal</span><span>${formatarMoeda(Number(venda.total) + Number(venda.desconto))}</span></div>
    <div class="pdv-resumo-linha"><span>Desconto</span><span>${formatarMoeda(venda.desconto)}</span></div>
    <div class="pdv-resumo-linha total"><span>Total</span><span>${formatarMoeda(venda.total)}</span></div>
    ${venda.pagamentos
      .map((p) => `<p style="font-size:12px; color:#6b7280;">Pagamento: ${p.forma} ${p.parcelas > 1 ? `(${p.parcelas}x)` : ''} - ${formatarMoeda(p.valor)}</p>`)
      .join('')}
    <div id="bloco-nota-fiscal-venda" style="margin-top:12px; border-top:1px solid #e5e7eb; padding-top:10px;"></div>
  `;

  renderizarBlocoNotaFiscal(
    document.getElementById('bloco-nota-fiscal-venda'),
    'venda',
    venda.id,
    notas,
    venda.status !== 'concluida',
    'Só é possível emitir nota de vendas concluídas'
  );
}

async function carregarTudo() {
  await Promise.all([carregarResumo(), carregarVendas()]);
}

function mostrarErro(texto) {
  tabelaVendas.innerHTML = `<tr><td colspan="8" style="color:#b00020;">${texto}</td></tr>`;
}

[campoBusca, filtroForma].forEach((elemento) => {
  elemento.addEventListener('input', () => {
    paginaAtual = 1;
    renderizarTabela();
  });
});

btnLimparFiltros.addEventListener('click', () => {
  campoBusca.value = '';
  filtroForma.value = '';
  paginaAtual = 1;
  renderizarTabela();
});

window.addEventListener('empresa-alterada', () => carregarTudo().catch((erro) => mostrarErro(erro.message)));

async function iniciar() {
  renderizarIcones();
  await initLayout('pdv');
  await carregarTudo();
}

iniciar().catch((erro) => mostrarErro(erro.message));

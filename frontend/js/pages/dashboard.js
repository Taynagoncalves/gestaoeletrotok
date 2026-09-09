const CORES = {
  laranja: '#f5821f',
  laranjaSuave: '#fde3c4',
  verde: '#16a34a',
  azul: '#2563eb',
  roxo: '#7c3aed',
  vermelho: '#dc2626',
  cinza: '#9ca3af',
};

let graficoSemana = null;
let graficoFormas = null;
let graficoProdutos = null;

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarIconesEAcoes() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('home');
  document.getElementById('icone-card-vendas').innerHTML = svgIcone('cart');
  document.getElementById('icone-card-clientes').innerHTML = svgIcone('users');
  document.getElementById('icone-card-estoque').innerHTML = svgIcone('archive');
  document.getElementById('icone-card-os').innerHTML = svgIcone('wrench');

  document.getElementById('acoes-rapidas').innerHTML = `
    <a class="acao-rapida verde" href="venda-nova.html">${svgIcone('cart')} Nova Venda (PDV)</a>
    <a class="acao-rapida azul" href="os-form.html">${svgIcone('wrench')} Abrir Ordem de Serviço</a>
    <a class="acao-rapida roxo" href="notas-fiscais.html">${svgIcone('file-text')} Emitir Nota Fiscal</a>
    <a class="acao-rapida laranja" href="produto-form.html">${svgIcone('box')} Cadastrar Produto</a>
    <a class="acao-rapida cinza" href="relatorios.html">${svgIcone('bar-chart')} Ver Relatórios</a>
  `;
}

function renderizarTendencia(elementoId, atual, anterior, sufixo = '') {
  const el = document.getElementById(elementoId);
  if (!el) return;

  if (anterior === 0 && atual === 0) {
    el.innerHTML = `<span class="card-resumo-tendencia neutro">sem variação</span>`;
    return;
  }
  if (anterior === 0) {
    el.innerHTML = `<span class="card-resumo-tendencia subiu">▲ novo</span>`;
    return;
  }

  const variacao = ((atual - anterior) / anterior) * 100;
  const subiu = variacao >= 0;
  el.innerHTML = `
    <span class="card-resumo-tendencia ${subiu ? 'subiu' : 'desceu'}">
      ${subiu ? '▲' : '▼'} ${Math.abs(variacao).toFixed(0)}%${sufixo}
    </span>
  `;
}

function atualizarSaudacaoEHora() {
  const hora = new Date();
  document.getElementById('saudacao').textContent = 'Olá, bem-vindo(a)!';
  document.getElementById('data-hora-atual').textContent = hora.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function inicioDoDia(offsetDias = 0) {
  const data = new Date();
  data.setDate(data.getDate() + offsetDias);
  data.setHours(0, 0, 0, 0);
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

function fimDoDia(offsetDias = 0) {
  const data = new Date();
  data.setDate(data.getDate() + offsetDias);
  data.setHours(23, 59, 59, 999);
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

async function empresasParaConsulta() {
  const contexto = empresaSelecionada();
  if (!contexto.consolidado) {
    return contexto.id ? [contexto.id] : [];
  }
  const empresas = await api.get('/empresas');
  return empresas.map((e) => e.id);
}

// ---------- Card: vendas do dia (com tendência vs ontem) ----------
async function carregarVendasDoDia() {
  const ids = await empresasParaConsulta();
  let totalHoje = 0;
  let totalOntem = 0;
  let quantidade = 0;
  const clientesUnicos = new Set();

  for (const empresaId of ids) {
    const [vendasHoje, vendasOntem] = await Promise.all([
      api.get(`/vendas?empresa_id=${empresaId}&de=${inicioDoDia()}`),
      api.get(`/vendas?empresa_id=${empresaId}&de=${inicioDoDia(-1)}&ate=${fimDoDia(-1)}`),
    ]);

    vendasHoje.forEach((venda) => {
      totalHoje += Number(venda.total);
      quantidade += 1;
      if (venda.cliente_id) clientesUnicos.add(venda.cliente_id);
    });
    vendasOntem.forEach((venda) => {
      totalOntem += Number(venda.total);
    });
  }

  document.getElementById('valor-vendas-dia').textContent = formatarMoeda(totalHoje);
  document.getElementById('qtd-vendas-dia').textContent = `${quantidade} venda(s)`;
  renderizarTendencia('tendencia-vendas-dia', totalHoje, totalOntem, ' vs ontem');

  document.getElementById('valor-clientes-dia').textContent = clientesUnicos.size;
  document.getElementById('tendencia-clientes-dia').innerHTML = '';
}

// ---------- Card + tabela: estoque baixo ----------
async function carregarEstoqueBaixo() {
  const ids = await empresasParaConsulta();
  let itens = [];

  for (const empresaId of ids) {
    const baixo = await api.get(`/estoque/saldos/baixo?empresa_id=${empresaId}`);
    itens = itens.concat(baixo);
  }

  document.getElementById('valor-estoque-baixo').textContent = itens.length;

  const tabela = document.getElementById('tabela-dashboard-estoque-baixo');
  tabela.innerHTML =
    itens
      .slice(0, 6)
      .map((item) => `<tr><td>${item.nome}</td><td>${item.saldo}</td><td>${item.estoque_minimo}</td></tr>`)
      .join('') || '<tr><td colspan="3" style="text-align:center; color:var(--text-secundario); padding:16px;">Nenhum produto abaixo do mínimo.</td></tr>';
}

// ---------- Card + tabela: OS em andamento ----------
const STATUS_OS_ANDAMENTO = ['recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca', 'em_reparo', 'pronto'];

async function carregarOsPendentes() {
  const ids = await empresasParaConsulta();
  let ordens = [];

  for (const empresaId of ids) {
    const lista = await api.get(`/ordens-servico?empresa_id=${empresaId}`).catch(() => []);
    ordens = ordens.concat(lista.filter((o) => STATUS_OS_ANDAMENTO.includes(o.status)));
  }

  document.getElementById('valor-os-pendentes').textContent = ordens.length;

  ordens.sort((a, b) => new Date(a.data_abertura) - new Date(b.data_abertura));

  const tabela = document.getElementById('tabela-dashboard-os');
  tabela.innerHTML =
    ordens
      .slice(0, 6)
      .map(
        (os) => `
      <tr>
        <td>#${String(os.id).padStart(5, '0')}</td>
        <td>${os.cliente_nome}</td>
        <td>${os.aparelho_modelo}</td>
        <td>${typeof badgeStatusOS === 'function' ? badgeStatusOS(os.status) : os.status}</td>
        <td>${os.prazo_estimado ? new Date(os.prazo_estimado).toLocaleDateString('pt-BR') : '-'}</td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="5" style="text-align:center; color:var(--text-secundario); padding:16px;">Nenhuma OS em andamento.</td></tr>';
}

// ---------- Gráfico: vendas 7 dias ----------
async function carregarVendasSemana() {
  const contexto = empresaSelecionada();
  const canvas = document.getElementById('grafico-vendas-semana');

  if (contexto.consolidado || !contexto.id) {
    canvas.parentElement.innerHTML = '<p style="color:var(--text-secundario); font-size:13px; padding-top:16px;">Selecione uma loja específica para ver este gráfico.</p>';
    return;
  }

  const dados = await api.get(`/vendas/relatorios/por-dia?empresa_id=${contexto.id}&dias=7`);
  const porDia = new Map(dados.map((d) => [d.dia, Number(d.total)]));

  const hoje = new Date();
  const rotulos = [];
  const valores = [];
  for (let i = 6; i >= 0; i -= 1) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    const chave = data.toISOString().slice(0, 10);
    rotulos.push(data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''));
    valores.push(porDia.get(chave) || 0);
  }

  if (graficoSemana) graficoSemana.destroy();
  graficoSemana = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: rotulos,
      datasets: [
        {
          label: 'Vendas',
          data: valores,
          backgroundColor: valores.map((_, i) => (i === valores.length - 1 ? CORES.laranja : CORES.laranjaSuave)),
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => formatarMoeda(ctx.parsed.y) } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => formatarMoeda(v) } },
      },
    },
  });
}

// ---------- Gráfico: formas de pagamento (hoje) ----------
async function carregarFormasPagamento() {
  const contexto = empresaSelecionada();
  const canvas = document.getElementById('grafico-formas-pagamento');

  if (contexto.consolidado || !contexto.id) {
    canvas.parentElement.innerHTML = '<p style="color:var(--text-secundario); font-size:13px; padding-top:16px;">Selecione uma loja específica para ver este gráfico.</p>';
    return;
  }

  const resumo = await api.get(`/vendas/relatorios/resumo?empresa_id=${contexto.id}&de=${inicioDoDia()}&ate=${fimDoDia()}`);
  const porForma = resumo.por_forma || [];

  const rotulos = { dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito', pix: 'PIX' };
  const cores = { dinheiro: CORES.verde, debito: CORES.azul, credito: CORES.roxo, pix: CORES.laranja };

  if (porForma.length === 0) {
    canvas.parentElement.innerHTML = '<p style="color:var(--text-secundario); font-size:13px; padding-top:16px;">Nenhuma venda registrada hoje ainda.</p>';
    return;
  }

  if (graficoFormas) graficoFormas.destroy();
  graficoFormas = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: porForma.map((f) => rotulos[f.forma] || f.forma),
      datasets: [
        {
          data: porForma.map((f) => Number(f.total)),
          backgroundColor: porForma.map((f) => cores[f.forma] || CORES.cinza),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatarMoeda(ctx.parsed)}` } },
      },
    },
  });
}

// ---------- Gráfico: produtos mais vendidos ----------
async function carregarProdutosMaisVendidos() {
  const contexto = empresaSelecionada();
  const canvas = document.getElementById('grafico-produtos-mais-vendidos');

  if (contexto.consolidado || !contexto.id) {
    canvas.parentElement.innerHTML = '<p style="color:var(--text-secundario); font-size:13px; padding-top:16px;">Selecione uma loja específica para ver este gráfico.</p>';
    return;
  }

  const produtos = await api.get(`/vendas/relatorios/produtos-mais-vendidos?empresa_id=${contexto.id}&limite=5`);

  if (produtos.length === 0) {
    canvas.parentElement.innerHTML = '<p style="color:var(--text-secundario); font-size:13px; padding-top:16px;">Nenhuma venda registrada ainda.</p>';
    return;
  }

  if (graficoProdutos) graficoProdutos.destroy();
  graficoProdutos = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: produtos.map((p) => p.nome),
      datasets: [
        {
          label: 'Unidades vendidas',
          data: produtos.map((p) => p.quantidade_vendida),
          backgroundColor: CORES.azul,
          borderRadius: 6,
          maxBarThickness: 22,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

async function carregarDashboard() {
  await Promise.all([
    carregarVendasDoDia().catch(() => {}),
    carregarEstoqueBaixo().catch(() => {}),
    carregarOsPendentes().catch(() => {}),
    carregarVendasSemana().catch(() => {}),
    carregarFormasPagamento().catch(() => {}),
    carregarProdutosMaisVendidos().catch(() => {}),
  ]);
}

async function iniciar() {
  atualizarSaudacaoEHora();
  renderizarIconesEAcoes();
  await initLayout('dashboard');
  await carregarDashboard();
  window.addEventListener('empresa-alterada', carregarDashboard);
}

iniciar();

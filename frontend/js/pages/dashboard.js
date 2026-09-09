function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarSaudacaoEHora() {
  const hora = new Date();
  document.getElementById('saudacao').textContent = 'Olá, Tayna!';
  document.getElementById('data-hora-atual').textContent = hora.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function inicioDoDia() {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
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

async function carregarVendasDoDia() {
  const ids = await empresasParaConsulta();
  let total = 0;
  let quantidade = 0;
  const clientesUnicos = new Set();

  for (const empresaId of ids) {
    const vendas = await api.get(`/vendas?empresa_id=${empresaId}&de=${inicioDoDia()}`);
    vendas.forEach((venda) => {
      total += Number(venda.total);
      quantidade += 1;
      if (venda.cliente_id) clientesUnicos.add(venda.cliente_id);
    });
  }

  document.getElementById('valor-vendas-dia').textContent = formatarMoeda(total);
  document.getElementById('qtd-vendas-dia').textContent = `${quantidade} venda(s) realizada(s)`;
  document.getElementById('valor-clientes-dia').textContent = clientesUnicos.size;
}

async function carregarEstoqueBaixo() {
  const ids = await empresasParaConsulta();
  let itens = [];

  for (const empresaId of ids) {
    const baixo = await api.get(`/estoque/saldos/baixo?empresa_id=${empresaId}`);
    itens = itens.concat(baixo);
  }

  document.getElementById('valor-estoque-baixo').textContent = itens.length;

  const tabela = document.getElementById('tabela-dashboard-estoque-baixo');
  tabela.innerHTML = itens
    .slice(0, 6)
    .map((item) => `<tr><td>${item.nome}</td><td>${item.saldo}</td><td>${item.estoque_minimo}</td></tr>`)
    .join('') || '<tr><td colspan="3">Nenhum produto abaixo do mínimo.</td></tr>';
}

async function carregarVendasSemana() {
  const contexto = empresaSelecionada();
  const grafico = document.getElementById('grafico-vendas-semana');

  if (contexto.consolidado || !contexto.id) {
    grafico.innerHTML = '<p style="color:#6b7280; font-size:13px;">Selecione uma loja específica para ver este gráfico.</p>';
    return;
  }

  const dados = await api.get(`/vendas/relatorios/por-dia?empresa_id=${contexto.id}&dias=7`);
  const porDia = new Map(dados.map((d) => [d.dia, Number(d.total)]));
  const maiorValor = Math.max(1, ...Array.from(porDia.values()));

  const hoje = new Date();
  const colunas = [];
  for (let i = 6; i >= 0; i -= 1) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    const chave = data.toISOString().slice(0, 10);
    const valor = porDia.get(chave) || 0;
    const rotulo = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    colunas.push({ rotulo, valor, hoje: i === 0 });
  }

  grafico.innerHTML = colunas
    .map(
      (coluna) => `
      <div class="grafico-barra-coluna">
        <div class="grafico-barra ${coluna.hoje ? 'destaque' : ''}" style="height:${Math.max(6, (coluna.valor / maiorValor) * 100)}%" title="R$ ${coluna.valor.toFixed(2)}"></div>
        <span class="grafico-barra-rotulo">${coluna.rotulo}</span>
      </div>
    `
    )
    .join('');
}

async function carregarProdutosMaisVendidos() {
  const contexto = empresaSelecionada();
  const lista = document.getElementById('lista-produtos-mais-vendidos');

  if (contexto.consolidado || !contexto.id) {
    lista.innerHTML = '<li>Selecione uma loja específica para ver este ranking.</li>';
    return;
  }

  const produtos = await api.get(`/vendas/relatorios/produtos-mais-vendidos?empresa_id=${contexto.id}&limite=5`);
  lista.innerHTML =
    produtos
      .map(
        (produto) => `
        <li>
          <span>${produto.nome}</span>
          <strong>${produto.quantidade_vendida} un.</strong>
        </li>
      `
      )
      .join('') || '<li>Nenhuma venda registrada ainda.</li>';
}

async function carregarDashboard() {
  await Promise.all([
    carregarVendasDoDia().catch(() => {}),
    carregarEstoqueBaixo().catch(() => {}),
    carregarVendasSemana().catch(() => {}),
    carregarProdutosMaisVendidos().catch(() => {}),
  ]);
}

async function iniciar() {
  atualizarSaudacaoEHora();
  await initLayout('dashboard');
  await carregarDashboard();
  window.addEventListener('empresa-alterada', carregarDashboard);
}

iniciar();

const campoEmpresa = document.getElementById('campo-empresa');
const campoDe = document.getElementById('campo-de');
const campoAte = document.getElementById('campo-ate');
const campoAgrupar = document.getElementById('campo-agrupar');
const wrapperAgrupar = document.getElementById('wrapper-agrupar');
const btnGerar = document.getElementById('btn-gerar');
const btnExportar = document.getElementById('btn-exportar-relatorio');

let relatorioAtivo = 'vendas';
let ultimoResultado = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('bar-chart');
  document.getElementById('icone-gerar').innerHTML = svgIcone('refresh-cw');
  document.getElementById('icone-exportar').innerHTML = svgIcone('download');
  document.getElementById('icone-total-vendas').innerHTML = svgIcone('cart');
  document.getElementById('icone-qtd-vendas').innerHTML = svgIcone('tag');
  document.getElementById('icone-ticket').innerHTML = svgIcone('dollar');
  document.getElementById('icone-receita').innerHTML = svgIcone('dollar');
  document.getElementById('icone-custo').innerHTML = svgIcone('box');
  document.getElementById('icone-margem').innerHTML = svgIcone('check-circle');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function periodoPadrao() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { de: inicioMes.toISOString().slice(0, 10), ate: hoje.toISOString().slice(0, 10) };
}

// ---------- Navegação entre abas ----------
document.querySelectorAll('.relatorios-abas button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.relatorios-abas button').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    relatorioAtivo = botao.dataset.relatorio;

    document.querySelectorAll('[data-relatorio-conteudo]').forEach((div) => {
      div.hidden = div.dataset.relatorioConteudo !== relatorioAtivo;
    });

    wrapperAgrupar.hidden = relatorioAtivo !== 'vendas';
    document.getElementById('painel-filtros').hidden = relatorioAtivo === 'estoque';

    gerarRelatorio().catch((erro) => alert(erro.message));
  });
});

// ---------- Empresas ----------
async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  campoEmpresa.innerHTML =
    '<option value="todas">Todas as empresas (consolidado)</option>' +
    empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

  const contexto = empresaSelecionada();
  if (contexto.id && !contexto.consolidado) {
    campoEmpresa.value = contexto.id;
  }
}

// ---------- Geração ----------
async function gerarRelatorio() {
  if (relatorioAtivo === 'vendas') return gerarRelatorioVendas();
  if (relatorioAtivo === 'margem') return gerarRelatorioMargem();
  return gerarRelatorioEstoque();
}

function parametrosComuns() {
  const empresaValor = campoEmpresa.value;
  const consolidado = empresaValor === 'todas';
  return { empresa_id: consolidado ? '' : empresaValor, consolidado, de: campoDe.value, ate: campoAte.value };
}

async function gerarRelatorioVendas() {
  const { empresa_id, consolidado, de, ate } = parametrosComuns();
  const params = new URLSearchParams({ de, ate, consolidado, agrupar: campoAgrupar.value });
  if (empresa_id) params.set('empresa_id', empresa_id);

  const resultado = await api.get(`/relatorios/vendas?${params.toString()}`);
  ultimoResultado = { tipo: 'vendas', dados: resultado };

  document.getElementById('valor-total-vendas').textContent = formatarMoeda(resultado.total);
  document.getElementById('valor-qtd-vendas').textContent = resultado.quantidade;
  document.getElementById('valor-ticket').textContent = formatarMoeda(resultado.ticket_medio);

  const painelPorEmpresa = document.getElementById('painel-por-empresa');
  if (resultado.por_empresa) {
    painelPorEmpresa.hidden = false;
    document.getElementById('tabela-por-empresa').innerHTML = resultado.por_empresa
      .map((e) => `<tr><td>${e.empresa_nome}</td><td>${e.empresa_tipo}</td><td>${formatarMoeda(e.total)}</td><td>${e.quantidade}</td></tr>`)
      .join('');
  } else {
    painelPorEmpresa.hidden = true;
  }

  document.getElementById('tabela-por-periodo').innerHTML = resultado.por_periodo
    .map((p) => `<tr><td>${p.periodo}</td><td>${formatarMoeda(p.total)}</td><td>${p.quantidade}</td></tr>`)
    .join('') || '<tr><td colspan="3" style="text-align:center; color:#6b7280;">Sem vendas no período.</td></tr>';

  document.getElementById('tabela-por-forma').innerHTML = resultado.por_forma_pagamento
    .map((f) => `<tr><td>${f.forma}</td><td>${formatarMoeda(f.total)}</td></tr>`)
    .join('') || '<tr><td colspan="2" style="text-align:center; color:#6b7280;">-</td></tr>';

  document.getElementById('tabela-por-canal').innerHTML = resultado.por_canal
    .map((c) => `<tr><td>${c.canal === 'online' ? 'Online' : 'Presencial'}</td><td>${formatarMoeda(c.total)}</td><td>${c.quantidade}</td></tr>`)
    .join('') || '<tr><td colspan="3" style="text-align:center; color:#6b7280;">-</td></tr>';
}

async function gerarRelatorioMargem() {
  const { empresa_id, consolidado, de, ate } = parametrosComuns();
  const params = new URLSearchParams({ de, ate, consolidado });
  if (empresa_id) params.set('empresa_id', empresa_id);

  const resultado = await api.get(`/relatorios/margem?${params.toString()}`);
  ultimoResultado = { tipo: 'margem', dados: resultado };

  document.getElementById('valor-receita').textContent = formatarMoeda(resultado.totais.receita);
  document.getElementById('valor-custo').textContent = formatarMoeda(resultado.totais.custo);
  document.getElementById('valor-margem').textContent = formatarMoeda(resultado.totais.margem);
  document.getElementById('valor-margem-percentual').textContent = `${resultado.totais.margem_percentual.toFixed(1)}% sobre a receita`;

  document.getElementById('tabela-margem-produto').innerHTML =
    resultado.produtos
      .map(
        (p) => `
      <tr>
        <td>${p.nome}</td>
        <td>${p.categoria || '-'}</td>
        <td>${p.quantidade_vendida}</td>
        <td>${formatarMoeda(p.receita)}</td>
        <td>${formatarMoeda(p.custo)}</td>
        <td class="${p.margem >= 0 ? 'margem-positiva' : 'margem-negativa'}">${formatarMoeda(p.margem)}</td>
        <td class="${p.margem_percentual >= 0 ? 'margem-positiva' : 'margem-negativa'}">${p.margem_percentual.toFixed(1)}%</td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280;">Sem vendas no período.</td></tr>';
}

async function gerarRelatorioEstoque() {
  const resultado = await api.get('/relatorios/estoque-consolidado');
  ultimoResultado = { tipo: 'estoque', dados: resultado };

  const empresas = resultado[0]?.por_empresa || [];
  document.getElementById('cabecalho-estoque-consolidado').innerHTML = `
    <tr>
      <th>Produto</th><th>Tipo</th><th>Categoria</th>
      ${empresas.map((e) => `<th>${e.empresa_nome}</th>`).join('')}
      <th>Total</th><th>Mínimo</th>
    </tr>
  `;

  document.getElementById('tabela-estoque-consolidado').innerHTML =
    resultado
      .map(
        (p) => `
      <tr class="${p.saldo_total <= p.estoque_minimo ? 'linha-atrasada' : ''}">
        <td>${p.nome}</td>
        <td>${p.tipo}</td>
        <td>${p.categoria || '-'}</td>
        ${p.por_empresa.map((e) => `<td>${e.saldo}</td>`).join('')}
        <td><strong>${p.saldo_total}</strong></td>
        <td>${p.estoque_minimo}</td>
      </tr>
    `
      )
      .join('') || `<tr><td colspan="${4 + empresas.length}" style="text-align:center; color:#6b7280;">Nenhum produto cadastrado.</td></tr>`;
}

// ---------- Exportação ----------
function baixarCsv(nomeArquivo, colunas, linhas) {
  const csv = [colunas, ...linhas]
    .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

function exportarRelatorioAtual() {
  if (!ultimoResultado) {
    alert('Gere o relatório antes de exportar.');
    return;
  }

  if (ultimoResultado.tipo === 'vendas') {
    const d = ultimoResultado.dados;
    baixarCsv(
      `relatorio-vendas-${d.periodo.de}-a-${d.periodo.ate}.csv`,
      ['Período', 'Total', 'Quantidade'],
      d.por_periodo.map((p) => [p.periodo, p.total, p.quantidade])
    );
  } else if (ultimoResultado.tipo === 'margem') {
    const d = ultimoResultado.dados;
    baixarCsv(
      `relatorio-margem-${d.periodo.de}-a-${d.periodo.ate}.csv`,
      ['Produto', 'Categoria', 'Qtd. vendida', 'Receita', 'Custo', 'Margem', 'Margem %'],
      d.produtos.map((p) => [p.nome, p.categoria || '', p.quantidade_vendida, p.receita.toFixed(2), p.custo.toFixed(2), p.margem.toFixed(2), p.margem_percentual.toFixed(1)])
    );
  } else {
    const d = ultimoResultado.dados;
    const empresas = d[0]?.por_empresa || [];
    baixarCsv(
      'relatorio-estoque-consolidado.csv',
      ['Produto', 'Tipo', 'Categoria', ...empresas.map((e) => e.empresa_nome), 'Total', 'Mínimo'],
      d.map((p) => [p.nome, p.tipo, p.categoria || '', ...p.por_empresa.map((e) => e.saldo), p.saldo_total, p.estoque_minimo])
    );
  }
}

btnGerar.addEventListener('click', () => gerarRelatorio().catch((erro) => alert(erro.message)));
btnExportar.addEventListener('click', exportarRelatorioAtual);
[campoEmpresa, campoDe, campoAte, campoAgrupar].forEach((el) => {
  el.addEventListener('change', () => gerarRelatorio().catch((erro) => alert(erro.message)));
});

async function iniciar() {
  renderizarIcones();
  await initLayout('relatorios');

  const { de, ate } = periodoPadrao();
  campoDe.value = de;
  campoAte.value = ate;

  await carregarEmpresas();
  await gerarRelatorio();
}

iniciar().catch((erro) => alert(erro.message));

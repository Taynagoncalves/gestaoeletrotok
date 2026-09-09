const campoFluxoDe = document.getElementById('campo-fluxo-de');
const campoFluxoAte = document.getElementById('campo-fluxo-ate');
const filtroStatusPagar = document.getElementById('filtro-status-pagar');
const filtroStatusReceber = document.getElementById('filtro-status-receber');
const formContaPagar = document.getElementById('form-conta-pagar');
const formContaReceber = document.getElementById('form-conta-receber');

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('dollar');
  document.getElementById('icone-entradas').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-saidas').innerHTML = svgIcone('x-circle');
  document.getElementById('icone-saldo').innerHTML = svgIcone('dollar');
  document.getElementById('icone-a-pagar').innerHTML = svgIcone('alert-triangle');
  document.getElementById('icone-a-receber').innerHTML = svgIcone('tag');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Navegação entre seções ----------
document.querySelectorAll('.financeiro-abas-principais button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.financeiro-abas-principais button').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    document.querySelectorAll('[data-secao-conteudo]').forEach((div) => {
      div.hidden = div.dataset.secaoConteudo !== botao.dataset.secao;
    });
  });
});

// ---------- Fluxo de caixa ----------
function periodoPadrao() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return {
    de: inicioMes.toISOString().slice(0, 10),
    ate: hoje.toISOString().slice(0, 10),
  };
}

async function carregarFluxoCaixa() {
  const contexto = empresaSelecionada();
  if (!contexto.id) return;

  const de = campoFluxoDe.value;
  const ate = campoFluxoAte.value;

  const [resumo, diario] = await Promise.all([
    api.get(`/financeiro/fluxo-caixa/resumo?empresa_id=${contexto.id}&de=${de}&ate=${ate}`),
    api.get(`/financeiro/fluxo-caixa/diario?empresa_id=${contexto.id}&de=${de}&ate=${ate}`),
  ]);

  document.getElementById('valor-entradas').textContent = formatarMoeda(resumo.entradas.total);
  document.getElementById('valor-saidas').textContent = formatarMoeda(resumo.saidas.total);

  const saldoEl = document.getElementById('valor-saldo');
  saldoEl.textContent = formatarMoeda(resumo.saldo_periodo);
  saldoEl.style.color = resumo.saldo_periodo >= 0 ? '#15803d' : '#b91c1c';

  document.getElementById('valor-a-pagar').textContent = formatarMoeda(resumo.pendencias.a_pagar);
  document.getElementById('sub-a-pagar').textContent = resumo.pendencias.a_pagar_atrasado > 0
    ? `${formatarMoeda(resumo.pendencias.a_pagar_atrasado)} atrasado`
    : '';

  document.getElementById('valor-a-receber').textContent = formatarMoeda(resumo.pendencias.a_receber);
  document.getElementById('sub-a-receber').textContent = resumo.pendencias.a_receber_atrasado > 0
    ? `${formatarMoeda(resumo.pendencias.a_receber_atrasado)} atrasado`
    : '';

  renderizarGraficoFluxo(diario);
}

function renderizarGraficoFluxo(diario) {
  const grafico = document.getElementById('grafico-fluxo');
  if (diario.length === 0) {
    grafico.innerHTML = '<p style="color:#6b7280; font-size:13px;">Sem movimentações no período.</p>';
    return;
  }

  const maiorValor = Math.max(1, ...diario.map((d) => Math.max(d.entradas, d.saidas)));

  grafico.innerHTML = diario
    .map((d) => {
      const dataFormatada = new Date(`${d.dia}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `
        <div class="grafico-fluxo-coluna">
          <div class="grafico-fluxo-barras">
            <div class="barra-entrada" style="height:${Math.max(2, (d.entradas / maiorValor) * 100)}%" title="Entradas: ${formatarMoeda(d.entradas)}"></div>
            <div class="barra-saida" style="height:${Math.max(2, (d.saidas / maiorValor) * 100)}%" title="Saídas: ${formatarMoeda(d.saidas)}"></div>
          </div>
          <span class="grafico-fluxo-rotulo">${dataFormatada}</span>
        </div>
      `;
    })
    .join('');
}

[campoFluxoDe, campoFluxoAte].forEach((el) => el.addEventListener('change', () => carregarFluxoCaixa().catch((erro) => alert(erro.message))));

// ---------- Contas a pagar ----------
async function carregarFornecedoresSelect() {
  const fornecedores = await api.get('/fornecedores');
  document.querySelector('#form-conta-pagar [name="fornecedor_id"]').innerHTML =
    '<option value="">Nenhum</option>' + fornecedores.map((f) => `<option value="${f.id}">${f.razao_social}</option>`).join('');
}

async function carregarClientesSelect() {
  const clientes = await api.get('/clientes');
  document.querySelector('#form-conta-receber [name="cliente_id"]').innerHTML =
    '<option value="">Nenhum</option>' + clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function badgeStatusFinanceiro(status, atrasada) {
  if (status === 'pendente' && atrasada) return '<span class="badge-tag inativo" style="background:#fee2e2; color:#b91c1c;">Atrasada</span>';
  if (status === 'pendente') return '<span class="badge-tag" style="background:#ffe8d1; color:#b45309;">Pendente</span>';
  if (status === 'pago' || status === 'recebido') return '<span class="badge-tag ativo">Paga</span>';
  return '<span class="badge-tag inativo">Cancelada</span>';
}

async function carregarContasPagar() {
  const contexto = empresaSelecionada();
  const tabela = document.getElementById('tabela-contas-pagar');
  if (!contexto.id) return;

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (filtroStatusPagar.value) params.set('status', filtroStatusPagar.value);

  const contas = await api.get(`/financeiro/contas-pagar?${params.toString()}`);

  tabela.innerHTML =
    contas
      .map(
        (c) => `
      <tr class="${c.atrasada ? 'linha-atrasada' : ''}">
        <td>${c.descricao}</td>
        <td>${c.fornecedor_nome || '-'}</td>
        <td>${c.categoria || '-'}</td>
        <td>${formatarMoeda(c.valor)}</td>
        <td>${new Date(`${c.data_vencimento}T12:00:00`).toLocaleDateString('pt-BR')}</td>
        <td>${badgeStatusFinanceiro(c.status, c.atrasada)}</td>
        <td>
          ${c.status === 'pendente' ? `
            <button type="button" class="btn-link" data-baixar-pagar="${c.id}">Marcar como paga</button>
            <button type="button" class="btn-link" data-cancelar-pagar="${c.id}">Cancelar</button>
          ` : '-'}
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:20px;">Nenhuma conta cadastrada.</td></tr>';

  tabela.querySelectorAll('[data-baixar-pagar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const formaPagamento = prompt('Forma de pagamento (dinheiro, debito, credito, pix, boleto, transferencia):', 'pix');
      if (formaPagamento === null) return;
      try {
        await api.put(`/financeiro/contas-pagar/${botao.dataset.baixarPagar}/baixar`, { forma_pagamento: formaPagamento });
        await Promise.all([carregarContasPagar(), carregarFluxoCaixa()]);
      } catch (erro) {
        alert(erro.message);
      }
    });
  });
  tabela.querySelectorAll('[data-cancelar-pagar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      if (!confirm('Cancelar esta conta?')) return;
      await api.put(`/financeiro/contas-pagar/${botao.dataset.cancelarPagar}/cancelar`, {});
      await carregarContasPagar();
    });
  });
}

formContaPagar.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const contexto = empresaSelecionada();
  const dados = Object.fromEntries(new FormData(formContaPagar));

  try {
    await api.post('/financeiro/contas-pagar', { ...dados, empresa_id: contexto.id });
    document.getElementById('mensagem-pagar').textContent = 'Conta adicionada.';
    document.getElementById('mensagem-pagar').className = 'mensagem sucesso';
    formContaPagar.reset();
    await Promise.all([carregarContasPagar(), carregarFluxoCaixa()]);
  } catch (erro) {
    document.getElementById('mensagem-pagar').textContent = erro.message;
    document.getElementById('mensagem-pagar').className = 'mensagem erro';
  }
});

filtroStatusPagar.addEventListener('change', () => carregarContasPagar().catch((erro) => alert(erro.message)));

// ---------- Contas a receber ----------
async function carregarContasReceber() {
  const contexto = empresaSelecionada();
  const tabela = document.getElementById('tabela-contas-receber');
  if (!contexto.id) return;

  const params = new URLSearchParams({ empresa_id: contexto.id });
  if (filtroStatusReceber.value) params.set('status', filtroStatusReceber.value);

  const contas = await api.get(`/financeiro/contas-receber?${params.toString()}`);

  tabela.innerHTML =
    contas
      .map(
        (c) => `
      <tr class="${c.atrasada ? 'linha-atrasada' : ''}">
        <td>${c.descricao}</td>
        <td>${c.cliente_nome || '-'}</td>
        <td>${c.origem}</td>
        <td>${formatarMoeda(c.valor)}</td>
        <td>${new Date(`${c.data_vencimento}T12:00:00`).toLocaleDateString('pt-BR')}</td>
        <td>${badgeStatusFinanceiro(c.status, c.atrasada)}</td>
        <td>
          ${c.status === 'pendente' ? `
            <button type="button" class="btn-link" data-baixar-receber="${c.id}">Marcar como recebida</button>
            <button type="button" class="btn-link" data-cancelar-receber="${c.id}">Cancelar</button>
          ` : '-'}
        </td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:20px;">Nenhuma conta cadastrada.</td></tr>';

  tabela.querySelectorAll('[data-baixar-receber]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const formaRecebimento = prompt('Forma de recebimento (dinheiro, debito, credito, pix, boleto, transferencia):', 'pix');
      if (formaRecebimento === null) return;
      try {
        await api.put(`/financeiro/contas-receber/${botao.dataset.baixarReceber}/baixar`, { forma_recebimento: formaRecebimento });
        await Promise.all([carregarContasReceber(), carregarFluxoCaixa()]);
      } catch (erro) {
        alert(erro.message);
      }
    });
  });
  tabela.querySelectorAll('[data-cancelar-receber]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      if (!confirm('Cancelar esta conta?')) return;
      await api.put(`/financeiro/contas-receber/${botao.dataset.cancelarReceber}/cancelar`, {});
      await carregarContasReceber();
    });
  });
}

formContaReceber.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const contexto = empresaSelecionada();
  const dados = Object.fromEntries(new FormData(formContaReceber));

  try {
    await api.post('/financeiro/contas-receber', { ...dados, empresa_id: contexto.id, origem: 'manual' });
    document.getElementById('mensagem-receber').textContent = 'Conta adicionada.';
    document.getElementById('mensagem-receber').className = 'mensagem sucesso';
    formContaReceber.reset();
    await Promise.all([carregarContasReceber(), carregarFluxoCaixa()]);
  } catch (erro) {
    document.getElementById('mensagem-receber').textContent = erro.message;
    document.getElementById('mensagem-receber').className = 'mensagem erro';
  }
});

filtroStatusReceber.addEventListener('change', () => carregarContasReceber().catch((erro) => alert(erro.message)));

window.addEventListener('empresa-alterada', () => {
  Promise.all([carregarFluxoCaixa(), carregarContasPagar(), carregarContasReceber()]).catch((erro) => alert(erro.message));
});

async function iniciar() {
  renderizarIcones();
  await initLayout('financeiro');

  const { de, ate } = periodoPadrao();
  campoFluxoDe.value = de;
  campoFluxoAte.value = ate;

  await Promise.all([carregarFornecedoresSelect(), carregarClientesSelect()]);
  await Promise.all([carregarFluxoCaixa(), carregarContasPagar(), carregarContasReceber()]);
}

iniciar().catch((erro) => alert(erro.message));

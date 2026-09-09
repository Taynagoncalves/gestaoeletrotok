const campoBusca = document.getElementById('campo-busca');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroSituacao = document.getElementById('filtro-situacao');
const filtroEmpresa = document.getElementById('filtro-empresa');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaEstoque = document.getElementById('tabela-estoque');
const textoPaginacao = document.getElementById('texto-paginacao');
const paginacao = document.getElementById('paginacao');

const ITENS_POR_PAGINA = 10;

let saldos = [];
let paginaAtual = 1;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('archive');
  document.getElementById('icone-entrada').innerHTML = svgIcone('plus');
  document.getElementById('icone-total').innerHTML = svgIcone('box');
  document.getElementById('icone-em-estoque').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-baixo').innerHTML = svgIcone('alert-triangle');
  document.getElementById('icone-sem').innerHTML = svgIcone('x-circle');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
  document.getElementById('icone-exportar').innerHTML = svgIcone('upload');
  document.getElementById('icone-imprimir').innerHTML = svgIcone('file-text');
  document.getElementById('icone-transferir').innerHTML = svgIcone('truck');
}

function situacaoDoItem(item) {
  if (item.saldo <= 0) return 'sem';
  if (item.saldo <= item.estoque_minimo) return 'baixo';
  return 'normal';
}

async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  filtroEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

  const contexto = empresaSelecionada();
  if (contexto.id && empresas.some((e) => String(e.id) === String(contexto.id))) {
    filtroEmpresa.value = contexto.id;
  }
}

async function carregarSaldos() {
  saldos = await api.get(`/estoque/saldos?empresa_id=${filtroEmpresa.value}`);
  popularFiltroCategoria();
  atualizarCards();
  paginaAtual = 1;
  renderizarTabela();
}

function popularFiltroCategoria() {
  const categorias = [...new Set(saldos.map((s) => s.categoria).filter(Boolean))].sort();
  const selecionada = filtroCategoria.value;
  filtroCategoria.innerHTML = '<option value="">Todas</option>' + categorias.map((c) => `<option value="${c}">${c}</option>`).join('');
  filtroCategoria.value = selecionada;
}

function atualizarCards() {
  const emEstoque = saldos.filter((s) => s.saldo > 0).length;
  const baixo = saldos.filter((s) => situacaoDoItem(s) === 'baixo').length;
  const sem = saldos.filter((s) => s.saldo <= 0).length;

  document.getElementById('valor-total').textContent = saldos.length;
  document.getElementById('valor-em-estoque').textContent = emEstoque;
  document.getElementById('valor-baixo').textContent = baixo;
  document.getElementById('valor-sem').textContent = sem;
}

function itensFiltrados() {
  const termo = campoBusca.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;
  const situacao = filtroSituacao.value;

  return saldos.filter((item) => {
    if (termo) {
      const alvo = `${item.nome} ${item.referencia_interna || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    if (categoria && item.categoria !== categoria) return false;
    if (situacao && situacaoDoItem(item) !== situacao) return false;
    return true;
  });
}

function badgeSituacao(situacao) {
  if (situacao === 'sem') return '<span class="badge-tag inativo" style="background:#fee2e2; color:#b91c1c;">Sem estoque</span>';
  if (situacao === 'baixo') return '<span class="badge-tag" style="background:#ffe8d1; color:#b45309;">Estoque baixo</span>';
  return '<span class="badge-tag ativo">Normal</span>';
}

function renderizarTabela() {
  const filtrados = itensFiltrados();
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  tabelaEstoque.innerHTML =
    pagina
      .map((item) => {
        const situacao = situacaoDoItem(item);
        return `
        <tr>
          <td><input type="checkbox" /></td>
          <td>
            <div class="miniatura-produto">
              ${item.imagem_base64 ? `<img src="${item.imagem_base64}" alt="${item.nome}" />` : svgIcone('box')}
            </div>
          </td>
          <td>
            <div class="celula-produto-nome">${item.nome}</div>
            <div class="celula-produto-sub">${item.referencia_interna || ''}</div>
          </td>
          <td>${item.categoria || '-'}</td>
          <td>${item.marca || '-'}</td>
          <td>${item.modelo || '-'}</td>
          <td>${item.saldo}</td>
          <td>${item.estoque_minimo}</td>
          <td>
            ${item.tipo === 'celular' ? '<span style="color:#9ca3af;">Por IMEI</span>' : (item.localizacao || '<span style="color:#9ca3af;">-</span>')}
          </td>
          <td>${badgeSituacao(situacao)}</td>
          <td>
            <div class="acoes-tabela">
              <button type="button" data-acao="historico" data-id="${item.produto_id}" title="Histórico">${svgIcone('bar-chart')}</button>
              ${item.tipo !== 'celular' ? `<button type="button" data-acao="localizacao" data-id="${item.produto_id}" title="Definir localização">${svgIcone('edit')}</button>` : ''}
            </div>
          </td>
        </tr>
      `;
      })
      .join('') || `<tr><td colspan="11" style="text-align:center; color:#6b7280; padding:24px;">Nenhum produto encontrado.</td></tr>`;

  textoPaginacao.textContent = filtrados.length
    ? `Exibindo ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, filtrados.length)} de ${filtrados.length} produtos`
    : 'Nenhum produto encontrado.';

  renderizarPaginacao(totalPaginas);
  ligarAcoes();
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

function ligarAcoes() {
  tabelaEstoque.querySelectorAll('button[data-acao]').forEach((botao) => {
    const produtoId = Number(botao.dataset.id);
    if (botao.dataset.acao === 'historico') {
      botao.addEventListener('click', () => {
        window.location.href = `produto-form.html?id=${produtoId}`;
      });
    } else if (botao.dataset.acao === 'localizacao') {
      botao.addEventListener('click', () => definirLocalizacao(produtoId));
    }
  });
}

async function definirLocalizacao(produtoId) {
  const item = saldos.find((s) => s.produto_id === produtoId);
  const valor = prompt('Localização no estoque (ex: Prateleira A1):', item?.localizacao || '');
  if (valor === null) return;

  await api.put(`/estoque/produtos/${produtoId}/localizacao`, {
    empresa_id: filtroEmpresa.value,
    localizacao: valor,
  });
  await carregarSaldos();
}

function exportarCsv() {
  const linhas = [['Produto', 'Categoria', 'Marca', 'Modelo', 'Estoque atual', 'Estoque mínimo', 'Localização']];
  itensFiltrados().forEach((item) => {
    linhas.push([item.nome, item.categoria || '', item.marca || '', item.modelo || '', item.saldo, item.estoque_minimo, item.localizacao || '']);
  });
  const csv = linhas.map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'estoque.csv';
  link.click();
  URL.revokeObjectURL(url);
}

[campoBusca, filtroCategoria, filtroSituacao].forEach((elemento) => {
  elemento.addEventListener('input', () => {
    paginaAtual = 1;
    renderizarTabela();
  });
});

filtroEmpresa.addEventListener('change', () => carregarSaldos().catch((erro) => mostrarErro(erro.message)));

btnLimparFiltros.addEventListener('click', () => {
  campoBusca.value = '';
  filtroCategoria.value = '';
  filtroSituacao.value = '';
  paginaAtual = 1;
  renderizarTabela();
});

document.getElementById('btn-exportar').addEventListener('click', exportarCsv);
document.getElementById('btn-imprimir').addEventListener('click', () => {
  montarAreaImpressao();
  window.print();
});

function montarAreaImpressao() {
  const itens = itensFiltrados();
  const empresaTexto = filtroEmpresa.selectedOptions[0]?.textContent || '';
  const agora = new Date().toLocaleString('pt-BR');

  document.getElementById('area-impressao').innerHTML = `
    <div class="impressao-cabecalho">
      <img src="img/logo-eletrotok.png" alt="Eletrotok" />
      <div class="impressao-cabecalho-titulo">
        <h1>Estoque de Produtos</h1>
        <p>${empresaTexto} • Gerado em ${agora}</p>
      </div>
    </div>
    <div class="impressao-indicadores">
      <div class="impressao-indicador"><strong>${saldos.length}</strong>Total de produtos</div>
      <div class="impressao-indicador"><strong>${saldos.filter((s) => s.saldo > 0).length}</strong>Em estoque</div>
      <div class="impressao-indicador"><strong>${saldos.filter((s) => situacaoDoItem(s) === 'baixo').length}</strong>Estoque baixo</div>
      <div class="impressao-indicador"><strong>${saldos.filter((s) => s.saldo <= 0).length}</strong>Sem estoque</div>
    </div>
    <table>
      <thead>
        <tr><th>Produto</th><th>Categoria</th><th>Marca</th><th>Modelo</th><th>Estoque atual</th><th>Estoque mínimo</th><th>Localização</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${itens
          .map(
            (item) => `
          <tr>
            <td>${item.nome}${item.referencia_interna ? ` (${item.referencia_interna})` : ''}</td>
            <td>${item.categoria || '-'}</td>
            <td>${item.marca || '-'}</td>
            <td>${item.modelo || '-'}</td>
            <td>${item.saldo}</td>
            <td>${item.estoque_minimo}</td>
            <td>${item.tipo === 'celular' ? 'Por IMEI' : item.localizacao || '-'}</td>
            <td>${badgeSituacao(situacaoDoItem(item))}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function mostrarErro(texto) {
  tabelaEstoque.innerHTML = `<tr><td colspan="11" style="color:#b00020;">${texto}</td></tr>`;
}

async function iniciar() {
  renderizarIcones();
  await carregarEmpresas();
  await carregarSaldos();
}

iniciar().catch((erro) => mostrarErro(erro.message));

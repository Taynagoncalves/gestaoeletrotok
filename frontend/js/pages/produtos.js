const campoBusca = document.getElementById('campo-busca');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroMarca = document.getElementById('filtro-marca');
const filtroStatus = document.getElementById('filtro-status');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
const tabelaProdutos = document.getElementById('tabela-produtos');
const textoPaginacao = document.getElementById('texto-paginacao');
const paginacao = document.getElementById('paginacao');

const ITENS_POR_PAGINA = 10;

let produtos = [];
let paginaAtual = 1;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('box');
  document.getElementById('icone-total').innerHTML = svgIcone('box');
  document.getElementById('icone-ativos').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-inativos').innerHTML = svgIcone('x-circle');
  document.getElementById('icone-categorias').innerHTML = svgIcone('tag');
  document.getElementById('icone-busca').innerHTML = svgIcone('search');
  document.getElementById('icone-limpar').innerHTML = svgIcone('refresh-cw');
  document.getElementById('icone-novo').innerHTML = svgIcone('plus');
  document.getElementById('icone-importar').innerHTML = svgIcone('upload');
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '-';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function carregarProdutos() {
  produtos = await api.get('/produtos');
  popularFiltros();
  atualizarCardsResumo();
  paginaAtual = 1;
  renderizarTabela();
}

function popularFiltros() {
  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))].sort();
  const marcas = [...new Set(produtos.map((p) => p.marca).filter(Boolean))].sort();

  const categoriaSelecionada = filtroCategoria.value;
  const marcaSelecionada = filtroMarca.value;

  filtroCategoria.innerHTML = '<option value="">Todas</option>' + categorias.map((c) => `<option value="${c}">${c}</option>`).join('');
  filtroMarca.innerHTML = '<option value="">Todas</option>' + marcas.map((m) => `<option value="${m}">${m}</option>`).join('');

  filtroCategoria.value = categoriaSelecionada;
  filtroMarca.value = marcaSelecionada;
}

function atualizarCardsResumo() {
  const ativos = produtos.filter((p) => p.ativo).length;
  const categorias = new Set(produtos.map((p) => p.categoria).filter(Boolean));

  document.getElementById('valor-total').textContent = produtos.length;
  document.getElementById('valor-ativos').textContent = ativos;
  document.getElementById('valor-inativos').textContent = produtos.length - ativos;
  document.getElementById('valor-categorias').textContent = categorias.size;
}

function produtosFiltrados() {
  const termo = campoBusca.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;
  const marca = filtroMarca.value;
  const status = filtroStatus.value;

  return produtos.filter((p) => {
    if (termo) {
      const alvo = `${p.nome} ${p.referencia_interna || ''} ${p.marca || ''} ${p.categoria || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    if (categoria && p.categoria !== categoria) return false;
    if (marca && p.marca !== marca) return false;
    if (status !== '' && Number(p.ativo) !== Number(status)) return false;
    return true;
  });
}

function renderizarTabela() {
  const filtrados = produtosFiltrados();
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  tabelaProdutos.innerHTML =
    pagina
      .map(
        (produto) => `
        <tr>
          <td><input type="checkbox" /></td>
          <td>
            <div class="miniatura-produto">
              ${produto.imagem_base64 ? `<img src="${produto.imagem_base64}" alt="${produto.nome}" />` : svgIcone('box')}
            </div>
          </td>
          <td>${produto.referencia_interna || '-'}</td>
          <td>
            <div class="celula-produto-nome">${produto.nome}</div>
            <div class="celula-produto-sub">${produto.modelo || produto.subcategoria || ''}</div>
          </td>
          <td>${produto.categoria || '-'}</td>
          <td>${produto.marca || '-'}</td>
          <td>${formatarMoeda(produto.preco_varejo)}</td>
          <td>${formatarMoeda(produto.preco_atacado)}</td>
          <td>${produto.estoque_total}</td>
          <td><span class="badge-tag ${produto.ativo ? 'ativo' : 'inativo'}">${produto.ativo ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <div class="acoes-tabela">
              <button type="button" data-acao="editar" data-id="${produto.id}" title="Editar">${svgIcone('edit')}</button>
              <button type="button" data-acao="duplicar" data-id="${produto.id}" title="Duplicar">${svgIcone('copy')}</button>
              <button type="button" data-acao="alternar-status" data-id="${produto.id}" class="perigo" title="${produto.ativo ? 'Desativar' : 'Ativar'}">${svgIcone('trash')}</button>
            </div>
          </td>
        </tr>
      `
      )
      .join('') || `<tr><td colspan="11" style="text-align:center; color:#6b7280; padding:24px;">Nenhum produto cadastrado ainda.</td></tr>`;

  textoPaginacao.textContent = filtrados.length
    ? `Exibindo ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, filtrados.length)} de ${filtrados.length} produtos`
    : 'Nenhum produto encontrado.';

  renderizarPaginacao(totalPaginas);
  ligarAcoesTabela();
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

function ligarAcoesTabela() {
  tabelaProdutos.querySelectorAll('button[data-acao]').forEach((botao) => {
    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === 'editar') {
      botao.addEventListener('click', () => {
        window.location.href = `produto-form.html?id=${id}`;
      });
    } else if (botao.dataset.acao === 'duplicar') {
      botao.addEventListener('click', () => duplicarProduto(id));
    } else if (botao.dataset.acao === 'alternar-status') {
      botao.addEventListener('click', () => alternarStatus(id));
    }
  });
}

async function duplicarProduto(id) {
  const produto = produtos.find((p) => p.id === id);
  if (!produto) return;

  const copia = { ...produto, nome: `${produto.nome} (cópia)` };
  delete copia.id;
  delete copia.criado_em;
  delete copia.atualizado_em;
  delete copia.preco_varejo;
  delete copia.preco_atacado;
  delete copia.estoque_total;
  delete copia.fornecedor_padrao_nome;

  const novo = await api.post('/produtos', copia);
  window.location.href = `produto-form.html?id=${novo.id}`;
}

async function alternarStatus(id) {
  const produto = produtos.find((p) => p.id === id);
  if (!produto) return;

  const novoStatus = produto.ativo ? 0 : 1;
  const confirmacao = confirm(
    novoStatus ? `Reativar o produto "${produto.nome}"?` : `Desativar o produto "${produto.nome}"? Ele deixa de aparecer no PDV.`
  );
  if (!confirmacao) return;

  await api.put(`/produtos/${id}`, { ...produto, ativo: novoStatus });
  await carregarProdutos();
}

[campoBusca, filtroCategoria, filtroMarca, filtroStatus].forEach((elemento) => {
  elemento.addEventListener('input', () => {
    paginaAtual = 1;
    renderizarTabela();
  });
});

btnLimparFiltros.addEventListener('click', () => {
  campoBusca.value = '';
  filtroCategoria.value = '';
  filtroMarca.value = '';
  filtroStatus.value = '';
  paginaAtual = 1;
  renderizarTabela();
});

renderizarIcones();
carregarProdutos().catch((erro) => {
  tabelaProdutos.innerHTML = `<tr><td colspan="11" style="color:#b00020;">${erro.message}</td></tr>`;
});

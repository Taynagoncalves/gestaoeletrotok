const campoTipoEntrada = document.getElementById('campo-tipo-entrada');
const campoEmpresaDestino = document.getElementById('campo-empresa-destino');
const wrapperFornecedor = document.getElementById('wrapper-fornecedor');
const campoFornecedor = document.getElementById('campo-fornecedor');
const wrapperEmpresaOrigem = document.getElementById('wrapper-empresa-origem');
const campoEmpresaOrigem = document.getElementById('campo-empresa-origem');
const campoNumeroNota = document.getElementById('campo-numero-nota');
const campoDataEntrada = document.getElementById('campo-data-entrada');
const campoObservacoes = document.getElementById('campo-observacoes');

const campoBuscarProduto = document.getElementById('campo-buscar-produto');
const resultadoBusca = document.getElementById('resultado-busca-produto');
const produtoSelecionadoBox = document.getElementById('produto-selecionado-box');
const miniaturaProdutoSelecionado = document.getElementById('miniatura-produto-selecionado');
const nomeProdutoSelecionado = document.getElementById('nome-produto-selecionado');
const subProdutoSelecionado = document.getElementById('sub-produto-selecionado');
const btnTrocarProduto = document.getElementById('btn-trocar-produto');

const blocoQuantidadeSimples = document.getElementById('bloco-quantidade-simples');
const campoQuantidade = document.getElementById('campo-quantidade');
const campoValorUnitario = document.getElementById('campo-valor-unitario');
const btnDiminuir = document.getElementById('btn-diminuir');
const btnAumentar = document.getElementById('btn-aumentar');

const blocoImei = document.getElementById('bloco-imei');
const campoImei = document.getElementById('campo-imei');
const campoCondicao = document.getElementById('campo-condicao');
const campoValorUnitarioImei = document.getElementById('campo-valor-unitario-imei');

const btnAdicionarItem = document.getElementById('btn-adicionar-item');
const mensagemItem = document.getElementById('mensagem-item');
const tabelaItensEntrada = document.getElementById('tabela-itens-entrada');
const totalEntradaEl = document.getElementById('total-entrada');
const btnSalvarEntrada = document.getElementById('btn-salvar-entrada');
const mensagemEntrada = document.getElementById('mensagem-entrada');
const tabelaHistoricoEntradas = document.getElementById('tabela-historico-entradas');

let produtos = [];
let produtoSelecionado = null;
let itensEntrada = [];

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('box');
  document.getElementById('icone-info').innerHTML = svgIcone('info');
  document.getElementById('icone-produtos').innerHTML = svgIcone('box');
  document.getElementById('icone-carrinho').innerHTML = svgIcone('archive');
  document.getElementById('icone-adicionar').innerHTML = svgIcone('plus');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
  miniaturaProdutoSelecionado.innerHTML = svgIcone('box');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Abas ----------
document.querySelectorAll('.abas button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.abas button').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    const aba = botao.dataset.aba;

    document.querySelector('[data-aba-conteudo="nova"]').hidden = aba === 'historico';
    document.querySelector('[data-aba-conteudo="historico"]').hidden = aba !== 'historico';

    if (aba === 'transferencia') {
      campoTipoEntrada.value = 'transferencia';
      campoTipoEntrada.disabled = true;
      atualizarVisibilidadeOrigem();
    } else if (aba === 'nova') {
      campoTipoEntrada.disabled = false;
    }

    if (aba === 'historico') {
      carregarHistorico().catch((erro) => mostrarErroHistorico(erro.message));
    }
  });
});

function atualizarVisibilidadeOrigem() {
  const tipo = campoTipoEntrada.value;
  wrapperFornecedor.hidden = tipo !== 'compra';
  wrapperEmpresaOrigem.hidden = tipo !== 'transferencia';
  document.getElementById('link-cadastrar-fornecedor').hidden = tipo !== 'compra';
}

campoTipoEntrada.addEventListener('change', atualizarVisibilidadeOrigem);

// ---------- Carregamento inicial ----------
async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  campoEmpresaDestino.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');
  campoEmpresaOrigem.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

  const contexto = empresaSelecionada();
  if (contexto.id && empresas.some((e) => String(e.id) === String(contexto.id))) {
    campoEmpresaDestino.value = contexto.id;
  }
}

async function carregarFornecedores() {
  const fornecedores = await api.get('/fornecedores');
  campoFornecedor.innerHTML = fornecedores.map((f) => `<option value="${f.id}">${f.razao_social}</option>`).join('');
}

async function carregarProdutos() {
  produtos = await api.get('/produtos');
}

// ---------- Busca de produto ----------
campoBuscarProduto.addEventListener('input', () => {
  const termo = campoBuscarProduto.value.trim().toLowerCase();
  if (!termo) {
    resultadoBusca.hidden = true;
    return;
  }

  const encontrados = produtos
    .filter((p) => `${p.nome} ${p.referencia_interna || ''} ${p.codigo_ean || ''}`.toLowerCase().includes(termo))
    .slice(0, 8);

  resultadoBusca.innerHTML = encontrados
    .map(
      (p) => `<button type="button" data-id="${p.id}">${svgIcone('box')} <span>${p.nome} <small style="color:#9ca3af;">${p.referencia_interna || ''}</small></span></button>`
    )
    .join('');
  resultadoBusca.hidden = encontrados.length === 0;

  resultadoBusca.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => selecionarProduto(Number(botao.dataset.id)));
  });
});

function selecionarProduto(id) {
  produtoSelecionado = produtos.find((p) => p.id === id);
  resultadoBusca.hidden = true;
  campoBuscarProduto.value = '';

  produtoSelecionadoBox.hidden = false;
  nomeProdutoSelecionado.textContent = produtoSelecionado.nome;
  subProdutoSelecionado.textContent = `Cód. ${produtoSelecionado.referencia_interna || '-'} | ${produtoSelecionado.marca || 'sem marca'}`;
  miniaturaProdutoSelecionado.innerHTML = produtoSelecionado.imagem_base64
    ? `<img src="${produtoSelecionado.imagem_base64}" style="width:100%;height:100%;object-fit:cover;" />`
    : svgIcone('box');

  const ehCelular = produtoSelecionado.tipo === 'celular';
  blocoQuantidadeSimples.hidden = ehCelular;
  blocoImei.hidden = !ehCelular;
}

btnTrocarProduto.addEventListener('click', () => {
  produtoSelecionado = null;
  produtoSelecionadoBox.hidden = true;
  blocoQuantidadeSimples.hidden = true;
  blocoImei.hidden = true;
});

btnDiminuir.addEventListener('click', () => {
  campoQuantidade.value = Math.max(1, Number(campoQuantidade.value) - 1);
});
btnAumentar.addEventListener('click', () => {
  campoQuantidade.value = Number(campoQuantidade.value) + 1;
});

// ---------- Adicionar item ao carrinho ----------
function mostrarMensagemItem(texto, tipo) {
  mensagemItem.textContent = texto;
  mensagemItem.className = `mensagem ${tipo}`;
}

btnAdicionarItem.addEventListener('click', () => {
  if (!produtoSelecionado) {
    mostrarMensagemItem('Selecione um produto.', 'erro');
    return;
  }

  if (produtoSelecionado.tipo === 'celular') {
    if (!campoImei.value || !campoValorUnitarioImei.value) {
      mostrarMensagemItem('Informe o IMEI e o valor unitário.', 'erro');
      return;
    }
    itensEntrada.push({
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      codigo: campoImei.value,
      tipo: 'celular',
      imei: campoImei.value,
      condicao: campoCondicao.value,
      quantidade: 1,
      valor_unitario: Number(campoValorUnitarioImei.value),
    });
    campoImei.value = '';
    campoValorUnitarioImei.value = '';
  } else {
    const quantidade = Number(campoQuantidade.value);
    const valorUnitario = Number(campoValorUnitario.value);
    if (!quantidade || quantidade <= 0 || !valorUnitario) {
      mostrarMensagemItem('Informe quantidade e valor unitário válidos.', 'erro');
      return;
    }
    itensEntrada.push({
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      codigo: produtoSelecionado.referencia_interna || '-',
      tipo: produtoSelecionado.tipo,
      quantidade,
      valor_unitario: valorUnitario,
    });
    campoQuantidade.value = 1;
    campoValorUnitario.value = '';
  }

  mostrarMensagemItem('', '');
  renderizarCarrinho();
});

function renderizarCarrinho() {
  tabelaItensEntrada.innerHTML = itensEntrada
    .map(
      (item, indice) => `
      <tr>
        <td>${indice + 1}</td>
        <td>${item.produto_nome}</td>
        <td>${item.codigo}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoeda(item.valor_unitario)}</td>
        <td>${formatarMoeda(item.valor_unitario * item.quantidade)}</td>
        <td><button type="button" class="btn-link" data-indice="${indice}">${svgIcone('trash')}</button></td>
      </tr>
    `
    )
    .join('') || '<tr><td colspan="7" style="text-align:center; color:#6b7280;">Nenhum produto adicionado ainda.</td></tr>';

  tabelaItensEntrada.querySelectorAll('button[data-indice]').forEach((botao) => {
    botao.addEventListener('click', () => {
      itensEntrada.splice(Number(botao.dataset.indice), 1);
      renderizarCarrinho();
    });
  });

  const total = itensEntrada.reduce((soma, item) => soma + item.valor_unitario * item.quantidade, 0);
  totalEntradaEl.textContent = formatarMoeda(total);
}

// ---------- Salvar entrada ----------
btnSalvarEntrada.addEventListener('click', async () => {
  if (itensEntrada.length === 0) {
    mensagemEntrada.textContent = 'Adicione ao menos um produto.';
    mensagemEntrada.className = 'mensagem erro';
    return;
  }

  const motivo = campoTipoEntrada.value;
  const empresaId = Number(campoEmpresaDestino.value);
  const observacaoBase = [
    campoNumeroNota.value ? `Nota nº ${campoNumeroNota.value}.` : '',
    campoObservacoes.value || '',
  ]
    .filter(Boolean)
    .join(' ');
  const dataEntrada = campoDataEntrada.value ? `${campoDataEntrada.value} 12:00:00` : null;

  try {
    for (const item of itensEntrada) {
      const payload = {
        produto_id: item.produto_id,
        empresa_id: empresaId,
        motivo,
        valor_unitario: item.valor_unitario,
        observacao: observacaoBase || null,
        data: dataEntrada,
      };

      if (motivo === 'compra') payload.fornecedor_id = Number(campoFornecedor.value);
      if (motivo === 'transferencia') payload.empresa_origem_id = Number(campoEmpresaOrigem.value);

      if (item.tipo === 'celular') {
        payload.itens = [{ imei: item.imei, condicao: item.condicao, valor_unitario: item.valor_unitario }];
      } else {
        payload.quantidade = item.quantidade;
      }

      await api.post('/estoque/entradas', payload);
    }

    mensagemEntrada.textContent = 'Entrada registrada com sucesso.';
    mensagemEntrada.className = 'mensagem sucesso';
    itensEntrada = [];
    renderizarCarrinho();
    campoObservacoes.value = '';
    campoNumeroNota.value = '';
  } catch (erro) {
    mensagemEntrada.textContent = erro.message;
    mensagemEntrada.className = 'mensagem erro';
  }
});

// ---------- Histórico ----------
async function carregarHistorico() {
  const resultado = await api.get(`/estoque/entradas?empresa_id=${campoEmpresaDestino.value}`);
  tabelaHistoricoEntradas.innerHTML =
    resultado
      .map(
        (mov) => `
        <tr>
          <td>${new Date(mov.data).toLocaleString('pt-BR')}</td>
          <td>${mov.produto_nome}</td>
          <td>${mov.quantidade}</td>
          <td>${mov.valor_unitario ? formatarMoeda(mov.valor_unitario) : '-'}</td>
          <td>${mov.motivo}</td>
          <td>${mov.fornecedor_nome || mov.empresa_origem_nome || '-'}</td>
        </tr>
      `
      )
      .join('') || '<tr><td colspan="6" style="text-align:center; color:#6b7280;">Nenhuma entrada registrada ainda.</td></tr>';
}

function mostrarErroHistorico(texto) {
  tabelaHistoricoEntradas.innerHTML = `<tr><td colspan="6" style="color:#b00020;">${texto}</td></tr>`;
}

async function iniciar() {
  renderizarIcones();
  campoDataEntrada.value = new Date().toISOString().slice(0, 10);
  atualizarVisibilidadeOrigem();

  if (new URLSearchParams(window.location.search).get('transferencia') === '1') {
    document.querySelector('.abas button[data-aba="transferencia"]').click();
  }

  await Promise.all([carregarEmpresas(), carregarFornecedores(), carregarProdutos()]);
}

iniciar().catch((erro) => {
  mensagemEntrada.textContent = erro.message;
  mensagemEntrada.className = 'mensagem erro';
});

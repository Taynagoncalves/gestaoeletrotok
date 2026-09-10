const form = document.getElementById('form-produto');
const mensagem = document.getElementById('mensagem-produto');
const campoTipo = document.getElementById('campo-tipo');
const campoPossuiImei = document.getElementById('campo-possui-imei');
const campoDescricao = document.getElementById('campo-descricao');
const contadorDescricao = document.getElementById('contador-descricao');
const campoImagem = document.getElementById('campo-imagem');
const zonaUpload = document.getElementById('zona-upload');
const previewImagem = document.getElementById('preview-imagem');
const campoAtivo = document.getElementById('campo-ativo');
const rotuloStatus = document.getElementById('rotulo-status');
const campoFornecedor = document.getElementById('campo-fornecedor');
const avisoTipoEstoque = document.getElementById('aviso-tipo-estoque');
const blocoSaldoEmpresas = document.getElementById('bloco-saldo-empresas');
const blocoEstoqueInicial = document.getElementById('bloco-estoque-inicial');
const blocoPrecos = document.getElementById('bloco-precos');
const mensagemPrecos = document.getElementById('mensagem-precos');

let produtoId = new URLSearchParams(window.location.search).get('id');
let imagemBase64 = null;
let empresasCache = [];

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('box');
  document.getElementById('icone-info').innerHTML = svgIcone('info');
  document.getElementById('icone-caracteristicas').innerHTML = svgIcone('settings');
  document.getElementById('icone-imagem').innerHTML = svgIcone('camera');
  document.getElementById('icone-fornecedor').innerHTML = svgIcone('truck');
  document.getElementById('icone-upload').innerHTML = svgIcone('upload');
  document.getElementById('icone-plus').innerHTML = svgIcone('plus');
  document.getElementById('icone-voltar').innerHTML = svgIcone('arrow-left');
  document.getElementById('icone-salvar-1').innerHTML = svgIcone('save');
  document.getElementById('icone-salvar-2').innerHTML = svgIcone('save');
  previewImagem.innerHTML = svgIcone('camera');
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

// ---------- Abas ----------
document.querySelectorAll('.abas button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.abas button').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    const aba = botao.dataset.aba;
    document.querySelectorAll('.aba-conteudo').forEach((conteudo) => {
      conteudo.hidden = conteudo.dataset.abaConteudo !== aba;
    });
  });
});

// ---------- Descrição (contador) ----------
campoDescricao.addEventListener('input', () => {
  contadorDescricao.textContent = campoDescricao.value.length;
});

// ---------- Tipo -> possui IMEI ----------
campoTipo.addEventListener('change', () => {
  campoPossuiImei.checked = campoTipo.value === 'celular';
  atualizarAvisoTipoEstoque();
  atualizarBlocoEstoqueInicial();
});

function atualizarAvisoTipoEstoque() {
  if (campoTipo.value === 'celular') {
    avisoTipoEstoque.innerHTML = produtoId
      ? 'Este produto controla estoque por IMEI: cada unidade é lançada individualmente na tela <a href="entrada-estoque.html">Entrada de Estoque</a>.'
      : 'Este produto controla estoque por IMEI. Salve o produto primeiro; depois lance cada unidade (IMEI) na tela <a href="entrada-estoque.html">Entrada de Estoque</a>.';
  } else if (campoTipo.value) {
    avisoTipoEstoque.textContent = 'Este produto controla estoque por quantidade (saldo agregado por empresa). Informe a quantidade inicial de cada loja abaixo.';
  } else {
    avisoTipoEstoque.textContent = 'Selecione o tipo de produto na aba "Informações principais" para ver como o estoque é controlado.';
  }
}

// ---------- Estoque inicial (só na criação, para produtos por quantidade) ----------
function renderizarTabelaEstoqueInicial() {
  const corpo = document.getElementById('tabela-estoque-inicial');
  corpo.innerHTML = empresasCache
    .map(
      (empresa) => `
        <tr>
          <td>${empresa.razao_social} (${empresa.tipo})</td>
          <td><input type="number" min="0" step="1" value="0" data-empresa-id="${empresa.id}" class="campo-qtd-estoque-inicial" /></td>
          <td><input type="number" min="0" step="0.01" data-empresa-id="${empresa.id}" class="campo-custo-estoque-inicial" /></td>
        </tr>
      `
    )
    .join('');
}

function atualizarBlocoEstoqueInicial() {
  const podeMostrar = !produtoId && campoTipo.value && campoTipo.value !== 'celular';
  blocoEstoqueInicial.hidden = !podeMostrar;
}

function coletarEstoqueInicial() {
  const linhas = [];
  document.querySelectorAll('.campo-qtd-estoque-inicial').forEach((input) => {
    const quantidade = Number(input.value) || 0;
    if (quantidade <= 0) return;
    const empresaId = input.dataset.empresaId;
    const custo = document.querySelector(`.campo-custo-estoque-inicial[data-empresa-id="${empresaId}"]`);
    linhas.push({
      empresa_id: Number(empresaId),
      quantidade,
      valor_unitario: custo && custo.value ? Number(custo.value) : null,
    });
  });
  return linhas;
}

// ---------- Imagem ----------
zonaUpload.addEventListener('click', () => campoImagem.click());

campoImagem.addEventListener('change', () => {
  const arquivo = campoImagem.files[0];
  if (!arquivo) return;

  if (!['image/png', 'image/jpeg'].includes(arquivo.type)) {
    mostrarMensagem('Envie uma imagem JPG ou PNG.', 'erro');
    return;
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    mostrarMensagem('A imagem deve ter no máximo 5MB.', 'erro');
    return;
  }

  const leitor = new FileReader();
  leitor.onload = () => {
    imagemBase64 = leitor.result;
    previewImagem.innerHTML = `<img src="${imagemBase64}" alt="Prévia do produto" />`;
  };
  leitor.readAsDataURL(arquivo);
});

// ---------- Status ----------
campoAtivo.addEventListener('change', () => {
  rotuloStatus.textContent = campoAtivo.checked ? 'Ativo (disponível para venda)' : 'Inativo';
});

// ---------- Listas auxiliares ----------
async function carregarSugestoes() {
  const produtos = await api.get('/produtos');
  const marcas = [...new Set(produtos.map((p) => p.marca).filter(Boolean))];
  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
  const subcategorias = [...new Set(produtos.map((p) => p.subcategoria).filter(Boolean))];

  document.getElementById('lista-marcas').innerHTML = marcas.map((m) => `<option value="${m}">`).join('');
  document.getElementById('lista-categorias').innerHTML = categorias.map((c) => `<option value="${c}">`).join('');
  document.getElementById('lista-subcategorias').innerHTML = subcategorias.map((s) => `<option value="${s}">`).join('');
}

async function carregarFornecedores() {
  const fornecedores = await api.get('/fornecedores');
  campoFornecedor.innerHTML =
    '<option value="">Nenhum</option>' + fornecedores.map((f) => `<option value="${f.id}">${f.razao_social}</option>`).join('');
}

async function carregarEmpresasParaEstoqueInicial() {
  empresasCache = await api.get('/empresas');
  renderizarTabelaEstoqueInicial();
}

// ---------- Preços por empresa ----------
async function carregarAbaPrecos() {
  if (!produtoId) return;

  const [empresas, precos] = await Promise.all([api.get('/empresas'), api.get(`/produtos/${produtoId}/precos`)]);

  blocoPrecos.innerHTML = `
    <table>
      <thead><tr><th>Empresa</th><th>Preço de venda (R$)</th><th></th></tr></thead>
      <tbody id="tabela-precos-produto"></tbody>
    </table>
  `;

  const corpo = document.getElementById('tabela-precos-produto');
  empresas.forEach((empresa) => {
    const precoAtual = precos.find((p) => p.empresa_id === empresa.id);
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${empresa.razao_social} (${empresa.tipo})</td>
      <td><input type="number" step="0.01" min="0" value="${precoAtual ? precoAtual.preco_venda : ''}" /></td>
      <td><button type="button" class="btn-link">Salvar</button></td>
    `;
    linha.querySelector('button').addEventListener('click', () =>
      salvarPreco(empresa.id, linha.querySelector('input').value)
    );
    corpo.appendChild(linha);
  });
}

async function salvarPreco(empresaId, precoVenda) {
  try {
    await api.put(`/produtos/${produtoId}/precos`, { empresa_id: empresaId, preco_venda: precoVenda });
    mensagemPrecos.textContent = 'Preço salvo.';
    mensagemPrecos.className = 'mensagem sucesso';
  } catch (erro) {
    mensagemPrecos.textContent = erro.message;
    mensagemPrecos.className = 'mensagem erro';
  }
}

// ---------- Saldo por empresa (aba Estoque) ----------
async function carregarSaldoPorEmpresa() {
  if (!produtoId) return;

  const saldos = await api.get(`/estoque/produtos/${produtoId}/saldo-por-empresa`);
  blocoSaldoEmpresas.innerHTML = `
    <table class="tabela-saldo-empresas">
      <thead><tr><th>Empresa</th><th>Saldo atual</th></tr></thead>
      <tbody>
        ${saldos.map((s) => `<tr><td>${s.empresa_nome} (${s.empresa_tipo})</td><td>${s.saldo}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

// ---------- Carregar produto existente ----------
async function carregarProdutoExistente() {
  const produto = await api.get(`/produtos/${produtoId}`);

  form.nome.value = produto.nome;
  form.marca.value = produto.marca || '';
  form.categoria.value = produto.categoria || '';
  form.subcategoria.value = produto.subcategoria || '';
  form.modelo.value = produto.modelo || '';
  form.referencia_interna.value = produto.referencia_interna || '';
  form.codigo_ean.value = produto.codigo_ean || '';
  campoDescricao.value = produto.descricao || '';
  contadorDescricao.textContent = campoDescricao.value.length;
  campoTipo.value = produto.tipo;
  campoTipo.disabled = true;
  campoPossuiImei.checked = produto.tipo === 'celular';
  form.unidade_medida.value = produto.unidade_medida || 'UN';
  form.peso_kg.value = produto.peso_kg || '';
  form.estoque_minimo.value = produto.estoque_minimo || 0;
  form.fornecedor_padrao_id.value = produto.fornecedor_padrao_id || '';
  form.codigo_fornecedor.value = produto.codigo_fornecedor || '';
  form.ncm.value = produto.ncm || '';
  form.cest.value = produto.cest || '';
  form.cfop_padrao.value = produto.cfop_padrao || '';
  form.origem_mercadoria.value = produto.origem_mercadoria ?? 0;
  form.icms_situacao_tributaria.value = produto.icms_situacao_tributaria || '';
  form.pis_situacao_tributaria.value = produto.pis_situacao_tributaria || '07';
  form.cofins_situacao_tributaria.value = produto.cofins_situacao_tributaria || '07';
  campoAtivo.checked = !!produto.ativo;
  rotuloStatus.textContent = produto.ativo ? 'Ativo (disponível para venda)' : 'Inativo';

  if (produto.imagem_base64) {
    imagemBase64 = produto.imagem_base64;
    previewImagem.innerHTML = `<img src="${imagemBase64}" alt="Prévia do produto" />`;
  }

  document.getElementById('campo-criado-em').value = new Date(produto.criado_em).toLocaleString('pt-BR');
  document.getElementById('campo-atualizado-em').value = new Date(produto.atualizado_em).toLocaleString('pt-BR');

  atualizarAvisoTipoEstoque();

  document.getElementById('titulo-pagina').textContent = 'Editar Produto';
  document.getElementById('breadcrumb-atual').textContent = 'Editar';
  document.querySelector('#app-main p').textContent = 'Atualize as informações deste produto.';
}

function montarPayload() {
  const dados = Object.fromEntries(new FormData(form));
  dados.estoque_minimo = Number(dados.estoque_minimo) || 0;
  dados.peso_kg = dados.peso_kg ? Number(dados.peso_kg) : null;
  dados.fornecedor_padrao_id = dados.fornecedor_padrao_id || null;
  dados.ativo = campoAtivo.checked ? 1 : 0;
  dados.imagem_base64 = imagemBase64;
  return dados;
}

function limparFormularioParaNovoProduto() {
  form.reset();
  produtoId = null;
  imagemBase64 = null;
  previewImagem.innerHTML = svgIcone('camera');
  contadorDescricao.textContent = '0';
  campoTipo.disabled = false;
  campoAtivo.checked = true;
  rotuloStatus.textContent = 'Ativo (disponível para venda)';
  atualizarAvisoTipoEstoque();
  atualizarBlocoEstoqueInicial();
  blocoSaldoEmpresas.innerHTML = '<p style="color:#6b7280; font-size:13px;">Salve o produto para ver o saldo por loja.</p>';
  blocoPrecos.innerHTML = '<p style="color:#6b7280; font-size:13px;">Salve o produto primeiro para configurar os preços por empresa.</p>';
  window.history.replaceState({}, '', 'produto-form.html');
  document.getElementById('titulo-pagina').textContent = 'Cadastrar Produto';
  document.getElementById('breadcrumb-atual').textContent = 'Cadastrar';
}

let botaoClicado = null;
form.querySelectorAll('button[type="submit"]').forEach((botao) => {
  botao.addEventListener('click', () => {
    botaoClicado = botao.id;
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = montarPayload();

  try {
    let produtoSalvo;
    const criandoAgora = !produtoId;
    if (produtoId) {
      produtoSalvo = await api.put(`/produtos/${produtoId}`, payload);
    } else {
      produtoSalvo = await api.post('/produtos', payload);
    }

    if (criandoAgora) {
      const usuario = usuarioLogado();
      for (const linha of coletarEstoqueInicial()) {
        await api.post('/estoque/entradas', {
          produto_id: produtoSalvo.id,
          empresa_id: linha.empresa_id,
          motivo: 'ajuste',
          quantidade: linha.quantidade,
          valor_unitario: linha.valor_unitario,
          usuario_id: usuario ? usuario.id : null,
          observacao: 'Estoque inicial informado no cadastro do produto.',
        });
      }
    }

    if (botaoClicado === 'btn-salvar-e-novo') {
      mostrarMensagem('Produto salvo. Formulário limpo para o próximo cadastro.', 'sucesso');
      limparFormularioParaNovoProduto();
    } else {
      window.location.href = `produto-form.html?id=${produtoSalvo.id}`;
    }
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

async function iniciar() {
  renderizarIcones();
  atualizarAvisoTipoEstoque();
  await Promise.all([carregarSugestoes(), carregarFornecedores(), carregarEmpresasParaEstoqueInicial()]);
  atualizarBlocoEstoqueInicial();

  if (produtoId) {
    await carregarProdutoExistente();
    await Promise.all([carregarAbaPrecos(), carregarSaldoPorEmpresa()]);
  }
}

iniciar().catch((erro) => mostrarMensagem(erro.message, 'erro'));

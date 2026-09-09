const CAMPOS_DESTINO = [
  { chave: 'nome', rotulo: 'Nome do produto', obrigatorio: true },
  { chave: 'categoria', rotulo: 'Categoria', obrigatorio: false },
  { chave: 'subcategoria', rotulo: 'Subcategoria', obrigatorio: false },
  { chave: 'marca', rotulo: 'Marca', obrigatorio: false },
  { chave: 'modelo', rotulo: 'Modelo', obrigatorio: false },
  { chave: 'referencia_interna', rotulo: 'Referência / código interno', obrigatorio: false },
  { chave: 'codigo_ean', rotulo: 'Código de barras (EAN)', obrigatorio: false },
  { chave: 'descricao', rotulo: 'Descrição', obrigatorio: false },
  { chave: 'estoque_minimo', rotulo: 'Estoque mínimo (alerta)', obrigatorio: false },
  { chave: 'peso_kg', rotulo: 'Peso (kg)', obrigatorio: false },
  { chave: 'preco', rotulo: 'Preço de venda', obrigatorio: false },
];

let dadosArquivo = null; // { colunas, linhas, total, mapeamento_sugerido }
let mapeamentoAtual = {};

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('upload');
  document.getElementById('icone-upload').innerHTML = svgIcone('upload');
  document.getElementById('icone-voltar-2').innerHTML = svgIcone('arrow-left');
  document.getElementById('icone-voltar-3').innerHTML = svgIcone('arrow-left');
  document.getElementById('icone-confirmar').innerHTML = svgIcone('save');
  document.getElementById('icone-processadas').innerHTML = svgIcone('file-text');
  document.getElementById('icone-importadas').innerHTML = svgIcone('check-circle');
  document.getElementById('icone-puladas').innerHTML = svgIcone('x-circle');
}

function irParaEtapa(numero) {
  document.querySelectorAll('[data-etapa]').forEach((div) => {
    div.hidden = div.dataset.etapa !== String(numero);
  });
  document.querySelectorAll('[data-etapa-indicador]').forEach((indicador) => {
    const n = Number(indicador.dataset.etapaIndicador);
    indicador.classList.remove('ativa', 'concluida');
    if (n === numero) indicador.classList.add('ativa');
    else if (n < numero) indicador.classList.add('concluida');
  });
}

// ---------- Etapa 1: upload ----------
const zonaUpload = document.getElementById('zona-upload');
const campoArquivo = document.getElementById('campo-arquivo');

zonaUpload.addEventListener('click', () => campoArquivo.click());
zonaUpload.addEventListener('dragover', (evento) => {
  evento.preventDefault();
  zonaUpload.style.background = '#fff4e5';
});
zonaUpload.addEventListener('dragleave', () => {
  zonaUpload.style.background = '#fafafa';
});
zonaUpload.addEventListener('drop', (evento) => {
  evento.preventDefault();
  zonaUpload.style.background = '#fafafa';
  if (evento.dataTransfer.files[0]) processarArquivo(evento.dataTransfer.files[0]);
});
campoArquivo.addEventListener('change', () => {
  if (campoArquivo.files[0]) processarArquivo(campoArquivo.files[0]);
});

function mostrarMensagem(idElemento, texto, tipo) {
  const el = document.getElementById(idElemento);
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
}

async function processarArquivo(arquivo) {
  mostrarMensagem('mensagem-upload', 'Lendo arquivo...', '');

  const leitor = new FileReader();
  leitor.onload = async () => {
    try {
      const resultado = await api.post('/importacao/preview', {
        arquivo_base64: leitor.result,
        nome_arquivo: arquivo.name,
      });
      dadosArquivo = resultado;
      mapeamentoAtual = { ...resultado.mapeamento_sugerido };
      montarTabelaMapeamento();
      mostrarMensagem('mensagem-upload', '', '');
      irParaEtapa(2);
    } catch (erro) {
      mostrarMensagem('mensagem-upload', erro.message, 'erro');
    }
  };
  leitor.readAsDataURL(arquivo);
}

// ---------- Etapa 2: mapeamento ----------
async function carregarEmpresasParaPreco() {
  const empresas = await api.get('/empresas');
  const select = document.getElementById('campo-empresa-preco');
  select.innerHTML = '<option value="">Não importar preço</option>' + empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');
}

function montarTabelaMapeamento() {
  const corpo = document.getElementById('tabela-mapeamento');
  corpo.innerHTML = CAMPOS_DESTINO.map((campo) => {
    const opcoes = ['<option value="">Não importar este campo</option>']
      .concat(
        dadosArquivo.colunas.map(
          (coluna) => `<option value="${coluna}" ${mapeamentoAtual[campo.chave] === coluna ? 'selected' : ''}>${coluna}</option>`
        )
      )
      .join('');

    return `
      <tr>
        <td>${campo.rotulo}${campo.obrigatorio ? '<span class="campo-obrigatorio-tag">*obrigatório</span>' : ''}</td>
        <td><select data-campo="${campo.chave}">${opcoes}</select></td>
      </tr>
    `;
  }).join('');

  corpo.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', () => {
      if (select.value) mapeamentoAtual[select.dataset.campo] = select.value;
      else delete mapeamentoAtual[select.dataset.campo];
    });
  });
}

document.getElementById('btn-voltar-etapa2').addEventListener('click', () => irParaEtapa(1));

document.getElementById('btn-avancar-etapa2').addEventListener('click', () => {
  const tipoPadrao = document.getElementById('campo-tipo-padrao').value;
  if (!tipoPadrao) {
    mostrarMensagem('mensagem-mapeamento', 'Selecione o tipo de produto para este lote.', 'erro');
    return;
  }
  if (!mapeamentoAtual.nome) {
    mostrarMensagem('mensagem-mapeamento', 'É obrigatório mapear a coluna de Nome.', 'erro');
    return;
  }
  if (mapeamentoAtual.preco && !document.getElementById('campo-empresa-preco').value) {
    mostrarMensagem('mensagem-mapeamento', 'Selecione a empresa para aplicar os preços, ou remova o mapeamento de preço.', 'erro');
    return;
  }
  mostrarMensagem('mensagem-mapeamento', '', '');
  montarPreview();
  irParaEtapa(3);
});

// ---------- Etapa 3: preview ----------
function montarPreview() {
  document.getElementById('total-linhas-preview').textContent = dadosArquivo.total;

  const camposMapeados = CAMPOS_DESTINO.filter((campo) => mapeamentoAtual[campo.chave]);
  document.getElementById('cabecalho-preview').innerHTML = `<tr>${camposMapeados.map((c) => `<th>${c.rotulo}</th>`).join('')}</tr>`;

  document.getElementById('corpo-preview').innerHTML = dadosArquivo.amostra
    .map(
      (linha) =>
        `<tr>${camposMapeados.map((c) => `<td>${linha[mapeamentoAtual[c.chave]] || '<span style="color:#9ca3af;">vazio</span>'}</td>`).join('')}</tr>`
    )
    .join('');
}

document.getElementById('btn-voltar-etapa3').addEventListener('click', () => irParaEtapa(2));

document.getElementById('btn-confirmar-importacao').addEventListener('click', async () => {
  const botao = document.getElementById('btn-confirmar-importacao');
  botao.disabled = true;
  mostrarMensagem('mensagem-preview', 'Importando, isso pode levar alguns instantes...', '');

  try {
    const resultado = await api.post('/importacao/produtos/executar', {
      linhas: dadosArquivo.linhas,
      mapeamento: mapeamentoAtual,
      tipo_padrao: document.getElementById('campo-tipo-padrao').value,
      empresa_preco_id: document.getElementById('campo-empresa-preco').value || null,
    });
    mostrarResultado(resultado);
    irParaEtapa(4);
  } catch (erro) {
    mostrarMensagem('mensagem-preview', erro.message, 'erro');
  } finally {
    botao.disabled = false;
  }
});

// ---------- Etapa 4: resultado ----------
function mostrarResultado(resultado) {
  document.getElementById('valor-processadas').textContent = resultado.total_processadas;
  document.getElementById('valor-importadas').textContent = resultado.total_importadas;
  document.getElementById('valor-puladas').textContent = resultado.total_puladas;

  const blocoErros = document.getElementById('bloco-erros');
  if (resultado.erros.length > 0) {
    blocoErros.hidden = false;
    document.getElementById('tabela-erros').innerHTML = resultado.erros
      .map((erro) => `<tr><td>${erro.linha}</td><td>${erro.motivo}</td></tr>`)
      .join('');
  } else {
    blocoErros.hidden = true;
  }
}

async function iniciar() {
  renderizarIcones();
  await initLayout('produtos');
  await carregarEmpresasParaPreco();
}

iniciar().catch((erro) => mostrarMensagem('mensagem-upload', erro.message, 'erro'));

const XLSX = require('xlsx');
const produtosRepository = require('../produtos/produtos.repository');
const AppError = require('../../shared/errors/AppError');

const TIPOS_VALIDOS = ['celular', 'acessorio', 'eletronico'];
const LIMITE_LINHAS = 5000;

function decodificarArquivo(arquivoBase64) {
  const base64Limpo = arquivoBase64.includes(',') ? arquivoBase64.split(',')[1] : arquivoBase64;
  return Buffer.from(base64Limpo, 'base64');
}

// Parser de CSV proprio: usado para .csv em vez do parser embutido do XLSX,
// que interpreta numeros com virgula decimal (formato brasileiro, ex:
// "99,90") como separador de milhar e corrompe o valor, alem de exigir BOM
// para nao confundir a codificacao UTF-8 dos acentos.
function analisarCsv(buffer) {
  let texto = buffer.toString('utf8');
  if (texto.charCodeAt(0) === 0xfeff) {
    texto = texto.slice(1);
  }

  const linhasTexto = texto.split(/\r\n|\r|\n/).filter((linha) => linha.trim() !== '');
  if (linhasTexto.length === 0) return [];

  const amostraDelimitador = linhasTexto[0];
  const delimitador = (amostraDelimitador.match(/;/g) || []).length >= (amostraDelimitador.match(/,/g) || []).length ? ';' : ',';

  function dividirLinha(linha) {
    const campos = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i += 1) {
      const char = linha[i];
      if (char === '"') {
        if (dentroAspas && linha[i + 1] === '"') {
          atual += '"';
          i += 1;
        } else {
          dentroAspas = !dentroAspas;
        }
      } else if (char === delimitador && !dentroAspas) {
        campos.push(atual);
        atual = '';
      } else {
        atual += char;
      }
    }
    campos.push(atual);
    return campos.map((campo) => campo.trim());
  }

  const cabecalho = dividirLinha(linhasTexto[0]);
  return linhasTexto.slice(1).map((linhaTexto) => {
    const valores = dividirLinha(linhaTexto);
    const objeto = {};
    cabecalho.forEach((coluna, indice) => {
      objeto[coluna] = valores[indice] ?? '';
    });
    return objeto;
  });
}

function analisarPlanilha(arquivoBase64, nomeArquivo) {
  const buffer = decodificarArquivo(arquivoBase64);
  const ehCsv = (nomeArquivo || '').toLowerCase().endsWith('.csv');

  let linhas;
  try {
    if (ehCsv) {
      linhas = analisarCsv(buffer);
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const primeiraAba = workbook.SheetNames[0];
      if (!primeiraAba) {
        throw new AppError('O arquivo não tem nenhuma planilha/aba.');
      }
      linhas = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba], { defval: '', raw: false });
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Não foi possível ler o arquivo. Verifique se é um CSV ou Excel válido.');
  }

  if (linhas.length === 0) {
    throw new AppError('Nenhuma linha de dados encontrada no arquivo.');
  }
  if (linhas.length > LIMITE_LINHAS) {
    throw new AppError(`O arquivo tem ${linhas.length} linhas. O limite por importação é ${LIMITE_LINHAS}.`);
  }

  const colunas = Object.keys(linhas[0]);

  return {
    colunas,
    linhas,
    total: linhas.length,
    amostra: linhas.slice(0, 10),
  };
}

function sugerirMapeamento(colunas) {
  const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const candidatos = {
    nome: ['nome', 'produto', 'descricao produto', 'titulo'],
    categoria: ['categoria'],
    subcategoria: ['subcategoria'],
    marca: ['marca', 'fabricante'],
    modelo: ['modelo'],
    referencia_interna: ['codigo', 'referencia', 'sku', 'codigo interno'],
    codigo_ean: ['ean', 'codigo de barras', 'gtin'],
    descricao: ['descricao', 'observacao', 'obs'],
    estoque_minimo: ['estoque minimo', 'minimo'],
    peso_kg: ['peso'],
    preco: ['preco', 'valor', 'preco de venda'],
  };

  const mapeamento = {};
  for (const [campo, sinonimos] of Object.entries(candidatos)) {
    const encontrada = colunas.find((coluna) => sinonimos.includes(normalizar(coluna)));
    if (encontrada) mapeamento[campo] = encontrada;
  }
  return mapeamento;
}

function preview(arquivoBase64, nomeArquivo) {
  if (!arquivoBase64) {
    throw new AppError('Envie um arquivo para importar.');
  }
  const resultado = analisarPlanilha(arquivoBase64, nomeArquivo);
  return {
    ...resultado,
    mapeamento_sugerido: sugerirMapeamento(resultado.colunas),
  };
}

function valorDaColuna(linha, mapeamento, campo) {
  const coluna = mapeamento[campo];
  if (!coluna) return null;
  const valor = linha[coluna];
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

function paraNumero(texto) {
  if (texto === null) return null;

  let limpo = texto.replace(/[^\d,.-]/g, '');
  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');

  if (temVirgula && temPonto) {
    // O separador que aparece por ultimo e o decimal (ex: "1.234,56" ou "1,234.56").
    limpo = limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '');
  } else if (temVirgula) {
    limpo = limpo.replace(',', '.');
  }

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

async function executar(dados) {
  const { linhas, mapeamento, tipo_padrao, empresa_preco_id } = dados;

  if (!Array.isArray(linhas) || linhas.length === 0) {
    throw new AppError('Nenhuma linha para importar.');
  }
  if (!mapeamento || !mapeamento.nome) {
    throw new AppError('É obrigatório mapear a coluna de Nome do produto.');
  }
  if (!TIPOS_VALIDOS.includes(tipo_padrao)) {
    throw new AppError('Selecione um tipo de produto válido para aplicar a este lote.');
  }
  if (mapeamento.preco && !empresa_preco_id) {
    throw new AppError('Selecione a empresa para aplicar os preços importados.');
  }

  const erros = [];
  let importadas = 0;

  for (let i = 0; i < linhas.length; i += 1) {
    const numeroLinha = i + 2; // +1 cabecalho, +1 base 1
    const linha = linhas[i];

    const nome = valorDaColuna(linha, mapeamento, 'nome');
    if (!nome) {
      erros.push({ linha: numeroLinha, motivo: 'Nome vazio — linha ignorada.' });
      continue;
    }

    try {
      const produto = await produtosRepository.criar({
        nome,
        categoria: valorDaColuna(linha, mapeamento, 'categoria'),
        subcategoria: valorDaColuna(linha, mapeamento, 'subcategoria'),
        marca: valorDaColuna(linha, mapeamento, 'marca'),
        modelo: valorDaColuna(linha, mapeamento, 'modelo'),
        referencia_interna: valorDaColuna(linha, mapeamento, 'referencia_interna'),
        codigo_ean: valorDaColuna(linha, mapeamento, 'codigo_ean'),
        tipo: tipo_padrao,
        descricao: valorDaColuna(linha, mapeamento, 'descricao'),
        estoque_minimo: paraNumero(valorDaColuna(linha, mapeamento, 'estoque_minimo')) || 0,
        peso_kg: paraNumero(valorDaColuna(linha, mapeamento, 'peso_kg')),
      });

      if (mapeamento.preco && empresa_preco_id) {
        const preco = paraNumero(valorDaColuna(linha, mapeamento, 'preco'));
        if (preco !== null && preco >= 0) {
          await produtosRepository.definirPreco(produto.id, empresa_preco_id, preco);
        }
      }

      importadas += 1;
    } catch (err) {
      erros.push({ linha: numeroLinha, motivo: err.message || 'Erro ao importar esta linha.' });
    }
  }

  return {
    total_processadas: linhas.length,
    total_importadas: importadas,
    total_puladas: linhas.length - importadas,
    erros,
  };
}

module.exports = {
  preview,
  executar,
};

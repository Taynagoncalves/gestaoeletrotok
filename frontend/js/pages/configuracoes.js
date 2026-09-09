const selectEmpresa = document.getElementById('select-empresa');
let certificadoBase64Novo = null;
let certificadoNomeArquivoNovo = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('settings');
  document.getElementById('icone-emitente').innerHTML = svgIcone('building');
  document.getElementById('icone-provider').innerHTML = svgIcone('zap');
  document.getElementById('icone-certificado').innerHTML = svgIcone('file-text');
  document.getElementById('icone-upload-certificado').innerHTML = svgIcone('upload');
  document.getElementById('icone-salvar').innerHTML = svgIcone('save');
}

function mostrarMensagem(texto, tipo) {
  const el = document.getElementById('mensagem-config');
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
}

async function carregarEmpresas() {
  const empresas = await api.get('/empresas');
  selectEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo}) — CNPJ ${e.cnpj}</option>`).join('');

  const contexto = empresaSelecionada();
  if (contexto.id && empresas.some((e) => String(e.id) === String(contexto.id))) {
    selectEmpresa.value = contexto.id;
  }
}

async function carregarConfig() {
  certificadoBase64Novo = null;
  certificadoNomeArquivoNovo = null;
  document.getElementById('campo-token').value = '';
  document.getElementById('campo-senha-certificado').value = '';

  const config = await api.get(`/empresas/${selectEmpresa.value}/config-fiscal`);

  document.getElementById('campo-razao-emitente').value = config.razao_social_emitente || '';
  document.getElementById('campo-regime-emitente').value = config.regime_tributario_emitente || '';
  document.getElementById('campo-provider').value = config.provider || '';
  document.getElementById('campo-ambiente').value = config.ambiente || 'homologacao';
  document.getElementById('campo-serie-nfce').value = config.serie_nfce || '';
  document.getElementById('campo-serie-nfe').value = config.serie_nfe || '';
  document.getElementById('campo-validade-certificado').value = config.certificado_validade
    ? String(config.certificado_validade).slice(0, 10)
    : '';

  document.getElementById('texto-token-atual').textContent = config.provider_token_mascarado
    ? `Token atual: ${config.provider_token_mascarado}`
    : 'Nenhum token configurado ainda.';

  document.getElementById('texto-certificado-atual').textContent = config.certificado_configurado
    ? `Certificado atual: ${config.certificado_nome_arquivo || 'arquivo enviado'}`
    : 'Nenhum certificado enviado ainda.';

  const aviso = document.getElementById('aviso-status-config');
  if (config.configurado) {
    aviso.style.background = '#dcfce7';
    aviso.style.borderColor = '#86efac';
    aviso.style.color = '#15803d';
    aviso.textContent = `Configuração completa (${config.provider}, ambiente ${config.ambiente}).`;
  } else {
    aviso.style.background = '#fff4e5';
    aviso.style.borderColor = '#fbd9a8';
    aviso.style.color = '#92400e';
    aviso.textContent = 'Configuração incompleta: faltam provedor e/ou certificado digital para emitir notas desta empresa.';
  }

  document.getElementById('resumo-status-config').innerHTML = `
    <p><strong>Provedor:</strong> ${config.provider || 'não configurado'}</p>
    <p><strong>Ambiente:</strong> ${config.ambiente === 'producao' ? 'Produção' : 'Homologação'}</p>
    <p><strong>Certificado:</strong> ${config.certificado_configurado ? 'Enviado' : 'Não enviado'}</p>
    <p><strong>Última atualização:</strong> ${config.atualizada_em ? new Date(config.atualizada_em).toLocaleString('pt-BR') : '-'}</p>
  `;
}

selectEmpresa.addEventListener('change', () => carregarConfig().catch((erro) => mostrarMensagem(erro.message, 'erro')));

const zonaUploadCertificado = document.getElementById('zona-upload-certificado');
const campoCertificado = document.getElementById('campo-certificado');
zonaUploadCertificado.addEventListener('click', () => campoCertificado.click());
campoCertificado.addEventListener('change', () => {
  const arquivo = campoCertificado.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    certificadoBase64Novo = leitor.result;
    certificadoNomeArquivoNovo = arquivo.name;
    document.getElementById('texto-certificado-atual').textContent = `Novo certificado selecionado: ${arquivo.name} (será salvo ao clicar em Salvar).`;
  };
  leitor.readAsDataURL(arquivo);
});

document.getElementById('btn-salvar-config').addEventListener('click', async () => {
  const payload = {
    razao_social_emitente: document.getElementById('campo-razao-emitente').value || null,
    regime_tributario_emitente: document.getElementById('campo-regime-emitente').value || null,
    provider: document.getElementById('campo-provider').value || null,
    ambiente: document.getElementById('campo-ambiente').value,
    serie_nfce: document.getElementById('campo-serie-nfce').value || null,
    serie_nfe: document.getElementById('campo-serie-nfe').value || null,
    certificado_validade: document.getElementById('campo-validade-certificado').value || null,
  };

  const token = document.getElementById('campo-token').value;
  if (token) payload.provider_token = token;

  const senhaCertificado = document.getElementById('campo-senha-certificado').value;
  if (senhaCertificado) payload.certificado_senha = senhaCertificado;

  if (certificadoBase64Novo) {
    payload.certificado_base64 = certificadoBase64Novo;
    payload.certificado_nome_arquivo = certificadoNomeArquivoNovo;
  }

  try {
    await api.put(`/empresas/${selectEmpresa.value}/config-fiscal`, payload);
    mostrarMensagem('Configuração fiscal salva com sucesso.', 'sucesso');
    await carregarConfig();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
});

async function iniciar() {
  renderizarIcones();
  await initLayout('config');
  await carregarEmpresas();
  await carregarConfig();
}

iniciar().catch((erro) => mostrarMensagem(erro.message, 'erro'));

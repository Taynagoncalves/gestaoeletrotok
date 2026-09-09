const osId = new URLSearchParams(window.location.search).get('id');
const modoCriacao = document.getElementById('modo-criacao');
const modoGestao = document.getElementById('modo-gestao');

const ACESSORIOS_PADRAO = ['Carregador', 'Cabo', 'Capinha', 'Chip', 'Caixa', 'Cartão de memória', 'Outros'];
const CONDICOES_PADRAO = ['Tela trincada', 'Oxidação', 'Sem sinais visíveis', 'Marcas de uso', 'Não testado'];

let clientes = [];
let usuarios = [];
let produtos = [];
let clienteSelecionado = null;
let fotosNovaOs = [];
let osAtual = null;
let itensOrcamentoNovo = [];

function renderizarIconesComuns() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('wrench');
}

// =========================================================
// Carregamento de listas auxiliares
// =========================================================
async function carregarAuxiliares() {
  const [empresas, listaUsuarios, listaProdutos] = await Promise.all([
    api.get('/empresas'),
    api.get('/usuarios'),
    api.get('/produtos'),
  ]);
  usuarios = listaUsuarios;
  produtos = listaProdutos;

  const campoEmpresa = document.getElementById('campo-empresa');
  if (campoEmpresa) {
    campoEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');
    const contexto = empresaSelecionada();
    if (contexto.id && empresas.some((e) => String(e.id) === String(contexto.id))) {
      campoEmpresa.value = contexto.id;
    }
  }

  const tecnicos = usuarios.filter((u) => u.perfil === 'tecnico');
  const opcoesTecnico = '<option value="">Selecione...</option>' + tecnicos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join('');
  document.querySelectorAll('#campo-tecnico, #campo-tecnico-diagnostico').forEach((select) => {
    if (select) select.innerHTML = opcoesTecnico;
  });

  const campoItemProduto = document.getElementById('campo-item-produto');
  if (campoItemProduto) {
    campoItemProduto.innerHTML = produtos.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
  }
}

async function carregarClientes() {
  clientes = await api.get('/clientes');
}

// =========================================================
// MODO CRIACAO
// =========================================================
function iniciarModoCriacao() {
  document.getElementById('grid-acessorios').innerHTML = ACESSORIOS_PADRAO.map(
    (item, i) => `<label class="checkbox-item"><input type="checkbox" data-tipo="acessorio" value="${item}" id="acessorio-${i}" /> ${item}</label>`
  ).join('');

  document.getElementById('grid-condicoes').innerHTML = CONDICOES_PADRAO.map(
    (item, i) => `<label class="checkbox-item"><input type="checkbox" data-tipo="condicao_entrada" value="${item}" id="condicao-${i}" /> ${item}</label>`
  ).join('');

  document.getElementById('icone-cliente').innerHTML = svgIcone('user');
  document.getElementById('icone-cliente-sel').innerHTML = svgIcone('user');
  document.getElementById('icone-aparelho').innerHTML = svgIcone('box');
  document.getElementById('icone-fotos').innerHTML = svgIcone('camera');
  document.getElementById('icone-voltar').innerHTML = svgIcone('arrow-left');
  document.getElementById('icone-abrir').innerHTML = svgIcone('save');

  const campoBuscarCliente = document.getElementById('campo-buscar-cliente');
  const resultadoBusca = document.getElementById('resultado-busca-cliente');

  campoBuscarCliente.addEventListener('input', () => {
    const termo = campoBuscarCliente.value.trim().toLowerCase();
    if (!termo) {
      resultadoBusca.hidden = true;
      return;
    }
    const encontrados = clientes.filter((c) => `${c.nome} ${c.cpf_cnpj || ''} ${c.telefone || ''}`.toLowerCase().includes(termo)).slice(0, 8);
    resultadoBusca.innerHTML = encontrados.map((c) => `<button type="button" data-id="${c.id}">${svgIcone('user')} <span>${c.nome}</span></button>`).join('');
    resultadoBusca.hidden = encontrados.length === 0;
    resultadoBusca.querySelectorAll('button').forEach((botao) => {
      botao.addEventListener('click', () => selecionarClienteCriacao(Number(botao.dataset.id)));
    });
  });

  document.getElementById('btn-trocar-cliente').addEventListener('click', () => {
    clienteSelecionado = null;
    document.getElementById('cliente-selecionado-box').hidden = true;
  });

  document.getElementById('btn-mostrar-novo-cliente').addEventListener('click', () => {
    const form = document.getElementById('form-cliente-rapido');
    form.hidden = !form.hidden;
  });

  document.getElementById('btn-salvar-novo-cliente').addEventListener('click', async () => {
    const nome = document.getElementById('novo-cliente-nome').value;
    if (!nome) {
      mostrarMensagem('mensagem-criacao', 'Informe o nome do cliente.', 'erro');
      return;
    }
    const cliente = await api.post('/clientes', {
      nome,
      telefone: document.getElementById('novo-cliente-telefone').value,
      cpf_cnpj: document.getElementById('novo-cliente-cpf').value,
    });
    clientes.push(cliente);
    selecionarClienteCriacao(cliente.id);
    document.getElementById('form-cliente-rapido').hidden = true;
  });

  const gridFotos = document.getElementById('grid-fotos-nova');
  const campoFoto = document.getElementById('campo-foto');
  document.getElementById('btn-add-foto').addEventListener('click', () => campoFoto.click());
  campoFoto.addEventListener('change', async () => {
    for (const arquivo of campoFoto.files) {
      const base64 = await lerArquivoBase64(arquivo);
      fotosNovaOs.push(base64);
    }
    renderizarFotosNovaOs();
  });

  document.getElementById('btn-abrir-os').addEventListener('click', enviarNovaOs);
}

function selecionarClienteCriacao(id) {
  clienteSelecionado = clientes.find((c) => c.id === id);
  document.getElementById('resultado-busca-cliente').hidden = true;
  document.getElementById('campo-buscar-cliente').value = '';
  document.getElementById('cliente-selecionado-box').hidden = false;
  document.getElementById('nome-cliente-selecionado').textContent = clienteSelecionado.nome;
  document.getElementById('sub-cliente-selecionado').textContent = clienteSelecionado.telefone || clienteSelecionado.cpf_cnpj || '';
}

function renderizarFotosNovaOs() {
  const grid = document.getElementById('grid-fotos-nova');
  const miniaturas = fotosNovaOs
    .map(
      (foto, indice) => `
      <div class="foto-item">
        <img src="${foto}" />
        <button type="button" data-indice="${indice}">×</button>
      </div>
    `
    )
    .join('');
  grid.innerHTML = miniaturas + '<div class="foto-add" id="btn-add-foto">+</div>';
  document.getElementById('btn-add-foto').addEventListener('click', () => document.getElementById('campo-foto').click());
  grid.querySelectorAll('button[data-indice]').forEach((botao) => {
    botao.addEventListener('click', () => {
      fotosNovaOs.splice(Number(botao.dataset.indice), 1);
      renderizarFotosNovaOs();
    });
  });
}

function lerArquivoBase64(arquivo) {
  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.readAsDataURL(arquivo);
  });
}

async function enviarNovaOs() {
  const marca = document.getElementById('campo-marca').value;
  const modelo = document.getElementById('campo-modelo').value;
  const cor = document.getElementById('campo-cor').value;
  const defeito = document.getElementById('campo-defeito').value;

  if (!marca || !modelo || !defeito) {
    mostrarMensagem('mensagem-criacao', 'Preencha marca, modelo e defeito relatado.', 'erro');
    return;
  }
  if (!clienteSelecionado) {
    mostrarMensagem('mensagem-criacao', 'Selecione ou cadastre um cliente.', 'erro');
    return;
  }

  const checklist = [];
  document.querySelectorAll('#grid-acessorios input:checked, #grid-condicoes input:checked').forEach((input) => {
    checklist.push({ tipo: input.dataset.tipo, item: input.value, marcado: true });
  });

  const payload = {
    empresa_id: Number(document.getElementById('campo-empresa').value),
    cliente_id: clienteSelecionado.id,
    aparelho_modelo: `${marca} ${modelo}${cor ? ` (${cor})` : ''}`,
    imei: document.getElementById('campo-imei').value || null,
    senha_desbloqueio: document.getElementById('campo-senha').value || null,
    condicao_entrada: document.getElementById('campo-observacoes-entrada').value || null,
    defeito_relatado: defeito,
    tecnico_id: document.getElementById('campo-tecnico').value || null,
    prazo_estimado: document.getElementById('campo-prazo').value || null,
    checklist,
    fotos: fotosNovaOs,
  };

  try {
    const os = await api.post('/ordens-servico', payload);
    window.location.href = `os-form.html?id=${os.id}`;
  } catch (erro) {
    mostrarMensagem('mensagem-criacao', erro.message, 'erro');
  }
}

function mostrarMensagem(idElemento, texto, tipo) {
  const el = document.getElementById(idElemento);
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
}

// =========================================================
// MODO GESTAO
// =========================================================
async function iniciarModoGestao() {
  modoCriacao.hidden = true;
  modoGestao.hidden = false;
  document.getElementById('titulo-pagina').textContent = `Ordem de Serviço #${String(osId).padStart(5, '0')}`;
  document.getElementById('subtitulo-pagina').textContent = 'Acompanhe e gerencie as informações da ordem de serviço.';
  document.getElementById('breadcrumb-atual').textContent = `OS #${osId}`;

  ['icone-info-data', 'icone-info-cliente', 'icone-info-aparelho', 'icone-info-garantia'].forEach((id, i) => {
    document.getElementById(id).innerHTML = svgIcone(['file-text', 'user', 'box', 'check-circle'][i]);
  });

  document.querySelectorAll('.abas button').forEach((botao) => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.abas button').forEach((b) => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      document.querySelectorAll('[data-aba-conteudo]').forEach((conteudo) => {
        conteudo.hidden = conteudo.dataset.abaConteudo !== botao.dataset.aba;
      });
    });
  });

  document.getElementById('btn-salvar-diagnostico').addEventListener('click', salvarDiagnostico);
  document.getElementById('btn-add-item-orcamento').addEventListener('click', adicionarItemOrcamento);
  document.getElementById('btn-criar-orcamento').addEventListener('click', enviarOrcamento);
  document.getElementById('btn-atualizar-status').addEventListener('click', atualizarStatusManual);
  document.getElementById('btn-registrar-entrega').addEventListener('click', registrarEntregaOs);
  document.getElementById('btn-salvar-garantia').addEventListener('click', salvarGarantia);
  document.getElementById('btn-limpar-assinatura').addEventListener('click', limparAssinatura);
  document.getElementById('btn-salvar-assinatura').addEventListener('click', salvarAssinatura);

  const campoFotoGestao = document.getElementById('campo-foto-gestao');
  document.getElementById('btn-add-foto-gestao').addEventListener('click', () => campoFotoGestao.click());
  campoFotoGestao.addEventListener('change', async () => {
    for (const arquivo of campoFotoGestao.files) {
      const base64 = await lerArquivoBase64(arquivo);
      await api.post(`/ordens-servico/${osId}/fotos`, { imagem_base64: base64 });
    }
    await carregarFotosGestao();
  });

  configurarCanvasAssinatura();
  await carregarOs();
}

async function carregarOs() {
  osAtual = await api.get(`/ordens-servico/${osId}`);
  preencherInfoTopo();
  preencherAbaInformacoes();
  preencherAbaDiagnostico();
  preencherHistorico();
  preencherTimeline();
  preencherPainelEntrega();
  await carregarFotosGestao();
}

function preencherInfoTopo() {
  document.getElementById('info-data-abertura').textContent = new Date(osAtual.data_abertura).toLocaleString('pt-BR');
  document.getElementById('info-cliente').textContent = osAtual.cliente_nome;
  document.getElementById('info-aparelho').textContent = osAtual.aparelho_modelo;
  document.getElementById('info-garantia').textContent = osAtual.garantia
    ? `${osAtual.garantia.prazo_dias} dias de garantia`
    : 'Sem garantia registrada';
}

function preencherAbaInformacoes() {
  document.getElementById('detalhe-cliente-nome').textContent = osAtual.cliente_nome;
  document.getElementById('detalhe-cliente-telefone').textContent = osAtual.cliente_telefone || '';
  document.getElementById('detalhe-aparelho').textContent = osAtual.aparelho_modelo;
  document.getElementById('detalhe-imei').textContent = osAtual.imei || '-';
  document.getElementById('detalhe-condicao').textContent = osAtual.condicao_entrada || '-';

  const grupos = { acessorio: [], condicao_entrada: [], outro: [] };
  osAtual.checklist.forEach((item) => grupos[item.tipo || 'outro'].push(item));

  document.getElementById('detalhe-checklist').innerHTML = `
    <p style="font-size:13px;"><strong>Acessórios entregues:</strong> ${grupos.acessorio.filter((i) => i.marcado).map((i) => i.item).join(', ') || 'Nenhum'}</p>
    <p style="font-size:13px;"><strong>Condições de entrada:</strong> ${grupos.condicao_entrada.filter((i) => i.marcado).map((i) => i.item).join(', ') || 'Nenhuma observação'}</p>
  `;

  const termoExistente = document.getElementById('termo-existente');
  const termoNovo = document.getElementById('termo-novo');
  if (osAtual.termo_responsabilidade) {
    termoExistente.hidden = false;
    termoNovo.hidden = true;
    document.getElementById('termo-data').textContent = new Date(osAtual.termo_responsabilidade.data_hora).toLocaleString('pt-BR');
    document.getElementById('termo-assinatura-preview').src = osAtual.termo_responsabilidade.assinatura_base64;
  } else {
    termoExistente.hidden = true;
    termoNovo.hidden = false;
  }
}

function preencherAbaDiagnostico() {
  document.getElementById('campo-defeito-diagnostico').value = osAtual.defeito_relatado || '';
  document.getElementById('campo-tecnico-diagnostico').value = osAtual.tecnico_id || '';

  document.getElementById('lista-orcamentos').innerHTML =
    osAtual.orcamentos
      .map((orc) => {
        const total = Number(orc.valor_pecas) + Number(orc.valor_mao_obra);
        return `
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:10px; margin-bottom:8px;">
          <p style="margin:0 0 6px; font-size:13px;"><strong>Peças:</strong> R$ ${Number(orc.valor_pecas).toFixed(2)} | <strong>Mão de obra:</strong> R$ ${Number(orc.valor_mao_obra).toFixed(2)} | <strong>Total:</strong> R$ ${total.toFixed(2)}</p>
          <p style="margin:0 0 6px; font-size:12px; color:#6b7280;">${orc.itens.map((i) => `${i.produto_nome} (R$ ${Number(i.valor).toFixed(2)})`).join(', ') || 'Sem peças'}</p>
          <span class="badge-tag ${orc.status === 'aprovado' ? 'ativo' : orc.status === 'recusado' ? 'inativo' : ''}" style="${orc.status === 'pendente' ? 'background:#ffe8d1;color:#b45309;' : ''}">${orc.status}</span>
          ${orc.status === 'pendente' ? `
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button type="button" class="botao primario" data-aprovar="${orc.id}">Aprovar</button>
              <button type="button" class="botao secundario" data-recusar="${orc.id}">Recusar</button>
            </div>
          ` : ''}
        </div>
      `;
      })
      .join('') || '<p style="color:#6b7280; font-size:13px;">Nenhum orçamento registrado ainda.</p>';

  document.getElementById('lista-orcamentos').querySelectorAll('[data-aprovar]').forEach((botao) => {
    botao.addEventListener('click', () => responderOrcamentoUi(botao.dataset.aprovar, 'aprovado'));
  });
  document.getElementById('lista-orcamentos').querySelectorAll('[data-recusar]').forEach((botao) => {
    botao.addEventListener('click', () => responderOrcamentoUi(botao.dataset.recusar, 'recusado'));
  });
}

async function salvarDiagnostico() {
  try {
    osAtual = await api.put(`/ordens-servico/${osId}/diagnostico`, {
      defeito_relatado: document.getElementById('campo-defeito-diagnostico').value,
      tecnico_id: document.getElementById('campo-tecnico-diagnostico').value || null,
    });
    mostrarMensagem('mensagem-gestao', 'Diagnóstico salvo.', 'sucesso');
    preencherTimeline();
    preencherHistorico();
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

function adicionarItemOrcamento() {
  const produtoId = Number(document.getElementById('campo-item-produto').value);
  const valor = Number(document.getElementById('campo-item-valor').value);
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto || !valor) return;

  itensOrcamentoNovo.push({ produto_id: produtoId, nome: produto.nome, quantidade: 1, valor });
  renderizarItensOrcamentoNovo();
  document.getElementById('campo-item-valor').value = '';
}

function renderizarItensOrcamentoNovo() {
  document.getElementById('tabela-itens-orcamento').innerHTML = itensOrcamentoNovo
    .map((item, i) => `<tr><td>${item.nome}</td><td>R$ ${item.valor.toFixed(2)}</td><td><button type="button" class="btn-link" data-i="${i}">remover</button></td></tr>`)
    .join('');
  document.querySelectorAll('#tabela-itens-orcamento [data-i]').forEach((botao) => {
    botao.addEventListener('click', () => {
      itensOrcamentoNovo.splice(Number(botao.dataset.i), 1);
      renderizarItensOrcamentoNovo();
    });
  });
}

async function enviarOrcamento() {
  const valorMaoObra = Number(document.getElementById('campo-mao-obra').value) || 0;
  const valorPecas = itensOrcamentoNovo.reduce((soma, i) => soma + i.valor, 0);

  try {
    osAtual = await api.post(`/ordens-servico/${osId}/orcamentos`, {
      valor_pecas: valorPecas,
      valor_mao_obra: valorMaoObra,
      itens: itensOrcamentoNovo.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade, valor: i.valor })),
    });
    itensOrcamentoNovo = [];
    renderizarItensOrcamentoNovo();
    document.getElementById('campo-mao-obra').value = 0;
    mostrarMensagem('mensagem-orcamento', 'Orçamento enviado para aprovação.', 'sucesso');
    preencherAbaDiagnostico();
    preencherTimeline();
    preencherHistorico();
  } catch (erro) {
    mostrarMensagem('mensagem-orcamento', erro.message, 'erro');
  }
}

async function responderOrcamentoUi(orcamentoId, status) {
  if (status === 'aprovado' && !confirm('Aprovar este orçamento vai baixar as peças do estoque. Confirmar?')) return;
  try {
    osAtual = await api.put(`/ordens-servico/orcamentos/${orcamentoId}/resposta`, { status });
    preencherAbaDiagnostico();
    preencherTimeline();
    preencherHistorico();
    preencherPainelEntrega();
    mostrarMensagem('mensagem-gestao', `Orçamento ${status}.`, 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

function preencherHistorico() {
  document.getElementById('lista-historico').innerHTML = osAtual.historico_status
    .map(
      (h) => `<p style="font-size:13px; border-bottom:1px solid #e5e7eb; padding:6px 0;">${badgeStatusOS(h.status)} <span style="color:#6b7280;">por ${h.usuario_nome || 'sistema'} em ${new Date(h.data_hora).toLocaleString('pt-BR')}</span></p>`
    )
    .join('');

  const painelEntrega = document.getElementById('painel-entrega-info');
  if (osAtual.entrega) {
    painelEntrega.hidden = false;
    document.getElementById('texto-entrega').textContent = `Retirado por ${osAtual.entrega.retirado_por} em ${new Date(osAtual.entrega.data_hora).toLocaleString('pt-BR')}`;
  } else {
    painelEntrega.hidden = true;
  }
}

function preencherTimeline() {
  const timeline = document.getElementById('timeline-status');
  const statusAtualIndex = SEQUENCIA_STATUS.indexOf(osAtual.status);
  const terminalNegativo = ['recusado', 'devolvido_sem_reparo'].includes(osAtual.status);

  const passos = terminalNegativo ? [...SEQUENCIA_STATUS.slice(0, 3), osAtual.status] : SEQUENCIA_STATUS;

  timeline.innerHTML = passos
    .map((status, i) => {
      const indexReal = terminalNegativo ? (i === passos.length - 1 ? 999 : i) : i;
      const concluido = terminalNegativo ? i < passos.length - 1 : i < statusAtualIndex;
      const atual = terminalNegativo ? i === passos.length - 1 : i === statusAtualIndex;
      return `
        <div class="timeline-item ${concluido ? 'concluido' : ''} ${atual ? 'atual' : ''}">
          <div class="timeline-marcador">${concluido ? '✓' : i + 1}</div>
          <div class="timeline-texto">${rotuloStatusOS(status)}</div>
        </div>
      `;
    })
    .join('');

  const selectManual = document.getElementById('campo-status-manual');
  selectManual.innerHTML = Object.keys(STATUS_OS)
    .map((s) => `<option value="${s}" ${s === osAtual.status ? 'selected' : ''}>${rotuloStatusOS(s)}</option>`)
    .join('');
}

async function atualizarStatusManual() {
  const novoStatus = document.getElementById('campo-status-manual').value;
  try {
    osAtual = await api.put(`/ordens-servico/${osId}/status`, { status: novoStatus });
    preencherTimeline();
    preencherHistorico();
    preencherPainelEntrega();
    mostrarMensagem('mensagem-gestao', 'Status atualizado.', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

function preencherPainelEntrega() {
  const painel = document.getElementById('painel-entrega');
  painel.hidden = !['pronto', 'entregue'].includes(osAtual.status);
  if (osAtual.garantia) {
    document.getElementById('campo-garantia-dias').value = osAtual.garantia.prazo_dias;
    document.getElementById('campo-garantia-cobertura').value = osAtual.garantia.cobertura || '';
  }
  atualizarBlocoNotaFiscalOs();
}

async function atualizarBlocoNotaFiscalOs() {
  const notas = await api.get(`/notas-fiscais/origem/os/${osId}`).catch(() => []);
  renderizarBlocoNotaFiscal(
    document.getElementById('bloco-nota-fiscal-os'),
    'os',
    Number(osId),
    notas,
    osAtual.status !== 'entregue',
    'Só é possível emitir nota depois que a OS for entregue'
  );
}

async function registrarEntregaOs() {
  const retiradoPor = document.getElementById('campo-retirado-por').value;
  if (!retiradoPor) {
    mostrarMensagem('mensagem-gestao', 'Informe quem retirou o aparelho.', 'erro');
    return;
  }
  try {
    osAtual = await api.post(`/ordens-servico/${osId}/entrega`, { retirado_por: retiradoPor });
    preencherTimeline();
    preencherHistorico();
    preencherInfoTopo();
    mostrarMensagem('mensagem-gestao', 'Entrega registrada.', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

async function salvarGarantia() {
  try {
    osAtual = await api.put(`/ordens-servico/${osId}/garantia`, {
      prazo_dias: Number(document.getElementById('campo-garantia-dias').value),
      cobertura: document.getElementById('campo-garantia-cobertura').value,
    });
    preencherInfoTopo();
    mostrarMensagem('mensagem-gestao', 'Garantia salva.', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

async function carregarFotosGestao() {
  const grid = document.getElementById('grid-fotos-gestao');
  const fotosDetalhadas = await Promise.all((osAtual.fotos || []).map((f) => api.get(`/ordens-servico/${osId}/fotos/${f.id}`)));

  grid.innerHTML =
    fotosDetalhadas
      .map((foto) => `<div class="foto-item"><img src="${foto.imagem_base64}" /><button type="button" data-id="${foto.id}">×</button></div>`)
      .join('') + '<div class="foto-add" id="btn-add-foto-gestao">+</div>';

  document.getElementById('btn-add-foto-gestao').addEventListener('click', () => document.getElementById('campo-foto-gestao').click());
  grid.querySelectorAll('button[data-id]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      osAtual.fotos = await api.delete(`/ordens-servico/${osId}/fotos/${botao.dataset.id}`);
      await carregarFotosGestao();
    });
  });
}

// ---------- Assinatura (canvas) ----------
let desenhando = false;
let contextoAssinatura = null;

function configurarCanvasAssinatura() {
  const canvas = document.getElementById('canvas-assinatura');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  contextoAssinatura = canvas.getContext('2d');
  contextoAssinatura.strokeStyle = '#1f2430';
  contextoAssinatura.lineWidth = 2;
  contextoAssinatura.lineCap = 'round';

  function posicao(evento) {
    const rect = canvas.getBoundingClientRect();
    const ponto = evento.touches ? evento.touches[0] : evento;
    return { x: ponto.clientX - rect.left, y: ponto.clientY - rect.top };
  }

  function iniciar(evento) {
    desenhando = true;
    const { x, y } = posicao(evento);
    contextoAssinatura.beginPath();
    contextoAssinatura.moveTo(x, y);
  }
  function desenhar(evento) {
    if (!desenhando) return;
    evento.preventDefault();
    const { x, y } = posicao(evento);
    contextoAssinatura.lineTo(x, y);
    contextoAssinatura.stroke();
  }
  function parar() {
    desenhando = false;
  }

  canvas.addEventListener('mousedown', iniciar);
  canvas.addEventListener('mousemove', desenhar);
  canvas.addEventListener('mouseup', parar);
  canvas.addEventListener('mouseleave', parar);
  canvas.addEventListener('touchstart', iniciar);
  canvas.addEventListener('touchmove', desenhar);
  canvas.addEventListener('touchend', parar);
}

function limparAssinatura() {
  const canvas = document.getElementById('canvas-assinatura');
  contextoAssinatura.clearRect(0, 0, canvas.width, canvas.height);
}

async function salvarAssinatura() {
  const canvas = document.getElementById('canvas-assinatura');
  const base64 = canvas.toDataURL('image/png');
  try {
    osAtual = await api.put(`/ordens-servico/${osId}/termo`, { assinatura_base64: base64 });
    preencherAbaInformacoes();
    mostrarMensagem('mensagem-gestao', 'Termo assinado com sucesso.', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagem-gestao', erro.message, 'erro');
  }
}

// =========================================================
// Inicialização
// =========================================================
async function iniciar() {
  renderizarIconesComuns();
  await initLayout('os');
  await Promise.all([carregarAuxiliares(), carregarClientes()]);

  if (osId) {
    await iniciarModoGestao();
  } else {
    iniciarModoCriacao();
  }
}

iniciar().catch((erro) => console.error(erro));

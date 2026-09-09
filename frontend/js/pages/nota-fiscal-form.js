const FORMAS_PAGAMENTO = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'PIX' },
  { valor: 'credito', rotulo: 'Cartão de Crédito' },
  { valor: 'debito', rotulo: 'Cartão de Débito' },
  { valor: 'outros', rotulo: 'Outros' },
];

let tipoNota = 'nfce';
let produtos = [];
let clientes = [];
let clienteSelecionadoId = null;
let carrinho = [];
let empresaAtual = null;

function renderizarIcones() {
  document.getElementById('icone-pagina').innerHTML = svgIcone('file-text');
  document.getElementById('icone-config').innerHTML = svgIcone('settings');
  document.getElementById('icone-cliente').innerHTML = svgIcone('user');
  document.getElementById('icone-produtos').innerHTML = svgIcone('box');
  document.getElementById('icone-adicionar').innerHTML = svgIcone('plus');
  document.getElementById('icone-importar').innerHTML = svgIcone('download');
  document.getElementById('icone-info').innerHTML = svgIcone('info');
  document.getElementById('icone-resumo').innerHTML = svgIcone('bar-chart');
  document.getElementById('icone-pagamento').innerHTML = svgIcone('credit-card');
  document.getElementById('icone-emissao').innerHTML = svgIcone('file-text');
  document.getElementById('icone-emitir').innerHTML = svgIcone('save');
  document.getElementById('icone-voltar').innerHTML = svgIcone('arrow-left');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Toggle NFC-e / NF-e ----------
document.getElementById('btn-tipo-nfce').addEventListener('click', () => {
  tipoNota = 'nfce';
  document.getElementById('btn-tipo-nfce').classList.add('ativo');
  document.getElementById('btn-tipo-nfe').classList.remove('ativo');
});
document.getElementById('btn-tipo-nfe').addEventListener('click', () => {
  tipoNota = 'nfe55';
  document.getElementById('btn-tipo-nfe').classList.add('ativo');
  document.getElementById('btn-tipo-nfce').classList.remove('ativo');
});

// ---------- Dados do cliente ----------
const campoNomeCliente = document.getElementById('campo-nome-cliente');
const resultadoBuscaCliente = document.getElementById('resultado-busca-cliente');

campoNomeCliente.addEventListener('input', () => {
  clienteSelecionadoId = null;
  const termo = campoNomeCliente.value.trim().toLowerCase();
  if (termo.length < 2) {
    resultadoBuscaCliente.hidden = true;
    return;
  }
  const encontrados = clientes.filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 6);
  resultadoBuscaCliente.innerHTML = encontrados
    .map((c) => `<button type="button" data-id="${c.id}">${svgIcone('user')} <span>${c.nome} ${c.cpf_cnpj ? `— ${c.cpf_cnpj}` : ''}</span></button>`)
    .join('');
  resultadoBuscaCliente.hidden = encontrados.length === 0;

  resultadoBuscaCliente.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      const cliente = clientes.find((c) => c.id === Number(botao.dataset.id));
      clienteSelecionadoId = cliente.id;
      campoNomeCliente.value = cliente.nome;
      document.getElementById('campo-cpf-cnpj').value = cliente.cpf_cnpj || '';
      resultadoBuscaCliente.hidden = true;
    });
  });
});

// ---------- Produtos da nota ----------
const campoBuscarProduto = document.getElementById('campo-buscar-produto');
const resultadoBuscaProduto = document.getElementById('resultado-busca-produto');
let produtoSelecionadoParaAdicionar = null;

campoBuscarProduto.addEventListener('input', () => {
  produtoSelecionadoParaAdicionar = null;
  const termo = campoBuscarProduto.value.trim().toLowerCase();
  if (!termo) {
    resultadoBuscaProduto.hidden = true;
    return;
  }
  const encontrados = produtos
    .filter((p) => `${p.nome} ${p.referencia_interna || ''} ${p.codigo_ean || ''}`.toLowerCase().includes(termo))
    .slice(0, 8);
  resultadoBuscaProduto.innerHTML = encontrados
    .map((p) => `<button type="button" data-id="${p.id}">${svgIcone('box')} <span>${p.nome} <small style="color:#9ca3af;">${p.referencia_interna || ''}</small></span></button>`)
    .join('');
  resultadoBuscaProduto.hidden = encontrados.length === 0;

  resultadoBuscaProduto.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => {
      produtoSelecionadoParaAdicionar = produtos.find((p) => p.id === Number(botao.dataset.id));
      campoBuscarProduto.value = produtoSelecionadoParaAdicionar.nome;
      resultadoBuscaProduto.hidden = true;
    });
  });
});

document.getElementById('btn-adicionar-item').addEventListener('click', () => {
  const mensagem = document.getElementById('mensagem-produtos');
  if (!produtoSelecionadoParaAdicionar) {
    mensagem.textContent = 'Busque e selecione um produto na lista antes de adicionar.';
    mensagem.className = 'mensagem erro';
    return;
  }

  const produto = produtoSelecionadoParaAdicionar;
  const existente = carrinho.find((i) => i.produto_id === produto.id);
  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push({
      produto_id: produto.id,
      nome: produto.nome,
      codigo: produto.referencia_interna || '-',
      quantidade: 1,
      valor_unitario: Number(produto.preco_empresa) || 0,
    });
  }

  mensagem.textContent = '';
  produtoSelecionadoParaAdicionar = null;
  campoBuscarProduto.value = '';
  renderizarCarrinho();
});

function renderizarCarrinho() {
  document.getElementById('contador-itens').textContent = carrinho.length;

  document.getElementById('tabela-itens-nota').innerHTML =
    carrinho
      .map(
        (item, indice) => `
      <tr>
        <td>${item.nome}</td>
        <td>${item.codigo}</td>
        <td>
          <div class="stepper">
            <button type="button" data-menos="${indice}">${svgIcone('minus')}</button>
            <input type="number" value="${item.quantidade}" data-qtd="${indice}" style="width:44px;" />
            <button type="button" data-mais="${indice}">${svgIcone('plus')}</button>
          </div>
        </td>
        <td><input type="number" value="${item.valor_unitario}" data-valor="${indice}" step="0.01" min="0" style="width:90px; border:1px solid var(--border); border-radius:6px; padding:4px 6px;" /></td>
        <td>${formatarMoeda(item.quantidade * item.valor_unitario)}</td>
        <td><button type="button" class="btn-link" data-remover="${indice}">${svgIcone('trash')}</button></td>
      </tr>
    `
      )
      .join('') || '<tr><td colspan="6" style="text-align:center; color:var(--text-secundario); padding:16px;">Nenhum produto adicionado ainda.</td></tr>';

  document.querySelectorAll('[data-remover]').forEach((b) => b.addEventListener('click', () => { carrinho.splice(Number(b.dataset.remover), 1); renderizarCarrinho(); }));
  document.querySelectorAll('[data-mais]').forEach((b) => b.addEventListener('click', () => { carrinho[Number(b.dataset.mais)].quantidade += 1; renderizarCarrinho(); }));
  document.querySelectorAll('[data-menos]').forEach((b) => b.addEventListener('click', () => {
    const item = carrinho[Number(b.dataset.menos)];
    item.quantidade = Math.max(1, item.quantidade - 1);
    renderizarCarrinho();
  }));
  document.querySelectorAll('[data-qtd]').forEach((input) => input.addEventListener('change', () => {
    carrinho[Number(input.dataset.qtd)].quantidade = Math.max(1, Number(input.value) || 1);
    renderizarCarrinho();
  }));
  document.querySelectorAll('[data-valor]').forEach((input) => input.addEventListener('change', () => {
    carrinho[Number(input.dataset.valor)].valor_unitario = Math.max(0, Number(input.value) || 0);
    renderizarCarrinho();
  }));

  atualizarResumo();
}

function atualizarResumo() {
  const subtotal = carrinho.reduce((soma, item) => soma + item.quantidade * item.valor_unitario, 0);
  const desconto = Number(document.getElementById('campo-desconto').value) || 0;
  const acrescimo = Number(document.getElementById('campo-acrescimo').value) || 0;
  const total = Math.max(0, subtotal - desconto + acrescimo);

  document.getElementById('valor-subtotal').textContent = formatarMoeda(subtotal);
  document.getElementById('valor-total').textContent = formatarMoeda(total);
}

document.getElementById('campo-desconto').addEventListener('input', atualizarResumo);
document.getElementById('campo-acrescimo').addEventListener('input', atualizarResumo);

// ---------- Observações (contador) ----------
const campoObservacoes = document.getElementById('campo-observacoes');
campoObservacoes.addEventListener('input', () => {
  document.getElementById('contador-observacoes').textContent = campoObservacoes.value.length;
});

// ---------- Forma de pagamento ----------
function renderizarFormasPagamento() {
  document.getElementById('lista-formas-pagamento').innerHTML = FORMAS_PAGAMENTO.map(
    (forma, i) => `
    <label class="checkbox-item">
      <input type="radio" name="forma-pagamento" value="${forma.valor}" ${i === 0 ? 'checked' : ''} /> ${forma.rotulo}
    </label>
  `
  ).join('');
}

// ---------- Importar do PDV ----------
const modalImportarPdv = document.getElementById('modal-importar-pdv');
document.getElementById('btn-importar-pdv').addEventListener('click', abrirModalImportarPdv);
document.getElementById('btn-fechar-modal-pdv').addEventListener('click', () => (modalImportarPdv.hidden = true));

async function abrirModalImportarPdv() {
  if (!empresaAtual) return;
  const vendas = await api.get(`/vendas?empresa_id=${empresaAtual}&status=concluida`);
  document.getElementById('lista-vendas-importar').innerHTML =
    vendas
      .slice(0, 20)
      .map(
        (v) => `
      <button type="button" class="btn-link" data-venda="${v.id}" style="display:block; width:100%; text-align:left; padding:8px 0; border-bottom:1px solid var(--border);">
        #${String(v.id).padStart(6, '0')} — ${v.cliente_nome || 'Consumidor não identificado'} — ${formatarMoeda(v.total)} — ${new Date(v.data).toLocaleDateString('pt-BR')}
      </button>
    `
      )
      .join('') || '<p style="color:var(--text-secundario); font-size:13px;">Nenhuma venda concluída encontrada.</p>';

  document.querySelectorAll('[data-venda]').forEach((botao) => {
    botao.addEventListener('click', () => importarVenda(Number(botao.dataset.venda)));
  });

  modalImportarPdv.hidden = false;
}

async function importarVenda(vendaId) {
  const venda = await api.get(`/vendas/${vendaId}`);

  if (venda.cliente_id) {
    clienteSelecionadoId = venda.cliente_id;
    campoNomeCliente.value = venda.cliente_nome || '';
  }

  carrinho = venda.itens.map((item) => ({
    produto_id: item.produto_id,
    nome: item.produto_nome,
    codigo: item.imei ? `IMEI ${item.imei}` : '-',
    quantidade: item.quantidade,
    valor_unitario: Number(item.preco_unitario),
  }));

  renderizarCarrinho();
  modalImportarPdv.hidden = true;
}

// ---------- Carregamento inicial ----------
async function carregarProdutos() {
  produtos = await api.get(`/produtos?empresa_id=${empresaAtual}`);
}

async function carregarClientes() {
  clientes = await api.get('/clientes');
}

async function carregarVendedores() {
  const usuarios = await api.get('/usuarios');
  document.getElementById('campo-vendedor').innerHTML =
    '<option value="">Selecione o vendedor</option>' + usuarios.map((u) => `<option value="${u.id}">${u.nome}</option>`).join('');
}

async function carregarEmpresaAtual() {
  const contexto = empresaSelecionada();
  const empresas = await api.get('/empresas');
  const empresa = empresas.find((e) => String(e.id) === String(contexto.id)) || empresas[0];
  empresaAtual = empresa ? empresa.id : null;

  document.getElementById('texto-cnpj-emitente').textContent = empresa
    ? `A nota será emitida usando o CNPJ da loja selecionada: ${empresa.razao_social} — ${empresa.cnpj}`
    : 'Selecione uma empresa no topo da página.';

  if (empresa) {
    tipoNota = empresa.tipo === 'varejo' ? 'nfce' : 'nfe55';
    document.getElementById(tipoNota === 'nfce' ? 'btn-tipo-nfce' : 'btn-tipo-nfe').classList.add('ativo');
    document.getElementById(tipoNota === 'nfce' ? 'btn-tipo-nfe' : 'btn-tipo-nfce').classList.remove('ativo');
  }
}

// ---------- Emissão ----------
document.getElementById('btn-emitir').addEventListener('click', async () => {
  const mensagem = document.getElementById('mensagem-emissao');
  const botao = document.getElementById('btn-emitir');

  if (!campoNomeCliente.value.trim()) {
    mensagem.textContent = 'Informe o nome do cliente.';
    mensagem.className = 'mensagem erro';
    return;
  }
  if (carrinho.length === 0) {
    mensagem.textContent = 'Adicione ao menos um produto à nota.';
    mensagem.className = 'mensagem erro';
    return;
  }
  if (!empresaAtual) {
    mensagem.textContent = 'Selecione uma empresa no topo da página.';
    mensagem.className = 'mensagem erro';
    return;
  }

  botao.disabled = true;
  mensagem.textContent = 'Emitindo nota fiscal...';
  mensagem.className = 'mensagem';

  try {
    if (!clienteSelecionadoId) {
      const novoCliente = await api.post('/clientes', {
        nome: campoNomeCliente.value.trim(),
        cpf_cnpj: document.getElementById('campo-cpf-cnpj').value || null,
      });
      clienteSelecionadoId = novoCliente.id;
    }

    const formaPagamento = document.querySelector('input[name="forma-pagamento"]:checked')?.value;

    await api.post('/notas-fiscais/emitir-avulsa', {
      empresa_id: empresaAtual,
      cliente_id: clienteSelecionadoId,
      tipo: tipoNota,
      itens: carrinho.map((item) => ({ produto_id: item.produto_id, quantidade: item.quantidade, valor_unitario: item.valor_unitario })),
      desconto: Number(document.getElementById('campo-desconto').value) || 0,
      acrescimo: Number(document.getElementById('campo-acrescimo').value) || 0,
      forma_pagamento: formaPagamento,
      observacoes: campoObservacoes.value || null,
      vendedor_usuario_id: document.getElementById('campo-vendedor').value || null,
      natureza_operacao: document.getElementById('campo-natureza').value,
      serie: document.getElementById('campo-serie').value,
      enviar_email: document.getElementById('campo-enviar-email').checked,
    });

    mensagem.textContent = 'Nota fiscal autorizada com sucesso!';
    mensagem.className = 'mensagem sucesso';
    setTimeout(() => (window.location.href = 'notas-fiscais.html'), 1200);
  } catch (erro) {
    mensagem.textContent = `${erro.message} A tentativa foi registrada em Notas Fiscais.`;
    mensagem.className = 'mensagem erro';
  } finally {
    botao.disabled = false;
  }
});

async function iniciar() {
  renderizarIcones();
  renderizarFormasPagamento();
  await initLayout('notas');
  await carregarEmpresaAtual();
  await Promise.all([carregarProdutos(), carregarClientes(), carregarVendedores()]);
  renderizarCarrinho();

  window.addEventListener('empresa-alterada', async () => {
    await carregarEmpresaAtual();
    await carregarProdutos();
  });
}

iniciar().catch((erro) => {
  document.getElementById('mensagem-emissao').textContent = erro.message;
  document.getElementById('mensagem-emissao').className = 'mensagem erro';
});

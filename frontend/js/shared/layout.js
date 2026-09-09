const ICONES = {
  home: ['M3 11.5 12 4l9 7.5', 'M5 10v10h14V10'],
  box: ['M3 7l9-4 9 4-9 4-9-4z', 'M3 7v10l9 4 9-4V7', 'M12 11v10'],
  archive: ['M3 3h18v4H3z', 'M5 7v13h14V7', 'M9.5 12h5'],
  truck: ['M1 4h13v10H1z', 'M14 9h4l3 3v2h-7z', 'M5.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  cart: ['M6 6h15l-2 9H8L6 2H2', 'M8.5 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M18 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  wrench: ['M14.7 6.3a4 4 0 1 1-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-3 3-2-2z'],
  'file-text': ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h8'],
  dollar: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  'bar-chart': ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  building: ['M5 21V7l7-4 7 4v14', 'M3 21h18', 'M9 9h1', 'M9 13h1', 'M14 9h1', 'M14 13h1', 'M9 21v-4h6v4'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.07.66.24 1 .33H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z', 'M13.73 21a2 2 0 0 1-3.46 0'],
  headset: ['M3 18v-6a9 9 0 0 1 18 0v6', 'M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z', 'M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z'],
  'alert-triangle': ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  toggle: ['M17 4H7a8 8 0 0 0 0 16h10a8 8 0 0 0 0-16z', 'M17 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  barcode: ['M3 4v16', 'M7 4v16', 'M11 4v16', 'M14 4v16', 'M18 4v16', 'M21 4v16'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'],
  'arrow-left': ['M19 12H5', 'M12 19l-7-7 7-7'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  edit: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
  copy: ['M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  'refresh-cw': ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10', 'M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'check-circle': ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3'],
  'x-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M15 9l-6 6', 'M9 9l6 6'],
  tag: ['M20.59 13.41 13.42 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  'credit-card': ['M1 4h22v16H1z', 'M1 10h22'],
  zap: ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  'more-vertical': ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  'chevron-down': ['M6 9l6 6 6-6'],
  printer: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'],
  minus: ['M5 12h14'],
};

function svgIcone(nome) {
  const paths = (ICONES[nome] || []).map((d) => `<path d="${d}"/>`).join('');
  return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

const MENU_ITENS = [
  { chave: 'dashboard', rotulo: 'Início / Dashboard', href: 'index.html', icone: 'home' },
  { chave: 'produtos', rotulo: 'Produtos', href: 'produtos.html', icone: 'box', submenu: true },
  { chave: 'estoque', rotulo: 'Estoque', href: 'estoque.html', icone: 'archive', submenu: true },
  { chave: 'fornecedores', rotulo: 'Fornecedores', href: 'fornecedores.html', icone: 'truck' },
  { chave: 'pdv', rotulo: 'Vendas (PDV)', href: 'pdv.html', icone: 'cart' },
  { chave: 'os', rotulo: 'Ordem de Serviço', href: 'ordem-servico.html', icone: 'wrench' },
  { chave: 'notas', rotulo: 'Notas Fiscais', href: 'notas-fiscais.html', icone: 'file-text' },
  { chave: 'financeiro', rotulo: 'Financeiro', href: 'financeiro.html', icone: 'dollar' },
  { chave: 'clientes', rotulo: 'Clientes', href: 'clientes.html', icone: 'users' },
  { chave: 'relatorios', rotulo: 'Relatórios', href: 'relatorios.html', icone: 'bar-chart' },
  { chave: 'empresas', rotulo: 'Empresas / CNPJs', href: 'empresas.html', icone: 'building' },
  { chave: 'usuarios', rotulo: 'Usuários', href: 'usuarios.html', icone: 'user' },
  { chave: 'config', rotulo: 'Configurações', href: 'configuracoes.html', icone: 'settings' },
];

function renderSidebar(chaveAtiva) {
  const itens = MENU_ITENS.map(
    (item) => `
      <li>
        <a href="${item.href}" class="${item.chave === chaveAtiva ? 'ativo' : ''}">
          ${svgIcone(item.icone)}
          <span>${item.rotulo}</span>
          ${item.submenu ? `<span class="sidebar-nav-chevron">${svgIcone('chevron-right')}</span>` : ''}
        </a>
      </li>
    `
  ).join('');

  document.getElementById('app-sidebar').innerHTML = `
    <div>
      <div class="sidebar-topo">
        <div class="sidebar-logo">
          <img src="img/logo-eletrotok.png" alt="Eletrotok" class="sidebar-logo-imagem" />
        </div>
      </div>
      <ul class="sidebar-nav">${itens}</ul>
    </div>
    <div class="sidebar-rodape">
      <div class="sidebar-suporte">
        ${svgIcone('headset')}
        <div>
          <div>Precisa de ajuda?</div>
        </div>
      </div>
    </div>
  `;
}

function empresaAtualStorage() {
  return {
    get id() {
      return localStorage.getItem('empresaAtualId') || '';
    },
    set id(valor) {
      localStorage.setItem('empresaAtualId', valor);
    },
    get consolidado() {
      return localStorage.getItem('modoConsolidado') === '1';
    },
    set consolidado(valor) {
      localStorage.setItem('modoConsolidado', valor ? '1' : '0');
    },
  };
}

async function renderTopbar() {
  document.getElementById('app-topbar').innerHTML = `
    <div class="topbar-busca">
      <span class="topbar-busca-icone">${svgIcone('search')}</span>
      <input type="text" placeholder="Buscar no sistema..." />
    </div>
    <div class="topbar-empresa">
      <span class="topbar-empresa-icone">${svgIcone('building')}</span>
      <div class="topbar-empresa-info">
        <select id="topbar-select-empresa"></select>
        <small id="topbar-empresa-cnpj"></small>
      </div>
    </div>
    <div class="topbar-toggle">
      <button type="button" id="btn-modo-loja" class="ativo">Apenas esta loja</button>
      <button type="button" id="btn-modo-todas">Todas as lojas</button>
    </div>
    <button type="button" class="topbar-icone-btn" title="Notificações">
      ${svgIcone('bell')}
    </button>
    <div class="topbar-usuario">
      <div class="topbar-usuario-avatar">${svgIcone('user')}</div>
      <div>
        <div>Usuário</div>
        <small>Login ainda não configurado</small>
      </div>
    </div>
  `;

  const store = empresaAtualStorage();
  const selectEmpresa = document.getElementById('topbar-select-empresa');
  const cnpjLabel = document.getElementById('topbar-empresa-cnpj');
  const btnLoja = document.getElementById('btn-modo-loja');
  const btnTodas = document.getElementById('btn-modo-todas');

  let empresas = [];
  try {
    empresas = await api.get('/empresas');
  } catch {
    empresas = [];
  }

  if (empresas.length === 0) {
    selectEmpresa.innerHTML = '<option value="">Nenhuma empresa cadastrada</option>';
    cnpjLabel.textContent = '';
  } else {
    selectEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

    const idSalvo = store.id;
    const existe = empresas.some((e) => String(e.id) === String(idSalvo));
    selectEmpresa.value = existe ? idSalvo : empresas[0].id;
    if (!existe) store.id = selectEmpresa.value;
  }

  function atualizarCnpjLabel() {
    const empresa = empresas.find((e) => String(e.id) === String(selectEmpresa.value));
    cnpjLabel.textContent = empresa ? `CNPJ: ${empresa.cnpj}` : '';
  }
  atualizarCnpjLabel();

  function atualizarModoVisual() {
    const consolidado = store.consolidado;
    btnLoja.classList.toggle('ativo', !consolidado);
    btnTodas.classList.toggle('ativo', consolidado);
    selectEmpresa.disabled = consolidado;
    renderFaixaContexto(empresas, store);
  }

  selectEmpresa.addEventListener('change', () => {
    store.id = selectEmpresa.value;
    atualizarCnpjLabel();
    renderFaixaContexto(empresas, store);
    window.dispatchEvent(new CustomEvent('empresa-alterada'));
  });

  btnLoja.addEventListener('click', () => {
    store.consolidado = false;
    atualizarModoVisual();
    window.dispatchEvent(new CustomEvent('empresa-alterada'));
  });

  btnTodas.addEventListener('click', () => {
    store.consolidado = true;
    atualizarModoVisual();
    window.dispatchEvent(new CustomEvent('empresa-alterada'));
  });

  atualizarModoVisual();
}

function renderFaixaContexto(empresas, store) {
  const faixa = document.getElementById('app-faixa-contexto');
  if (!faixa) return;

  const iconeBox = `<span class="faixa-contexto-icone">${svgIcone('box')}</span>`;

  if (store.consolidado) {
    faixa.innerHTML = `${iconeBox} Exibindo dados de <strong>todas as lojas</strong> (consolidado).`;
    faixa.hidden = false;
    return;
  }

  const empresa = empresas.find((e) => String(e.id) === String(store.id));
  if (!empresa) {
    faixa.hidden = true;
    return;
  }

  faixa.innerHTML = `${iconeBox} Exibindo dados da loja: <strong>${empresa.razao_social}</strong> | CNPJ: ${empresa.cnpj} | Altere a loja ou veja todas no topo da página.`;
  faixa.hidden = false;
}

function empresaSelecionada() {
  const store = empresaAtualStorage();
  return { id: store.id, consolidado: store.consolidado };
}

async function initLayout(chaveAtiva) {
  renderSidebar(chaveAtiva);
  await renderTopbar();
}

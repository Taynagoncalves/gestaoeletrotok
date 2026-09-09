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
};

function svgIcone(nome) {
  const paths = (ICONES[nome] || []).map((d) => `<path d="${d}"/>`).join('');
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

const MENU_ITENS = [
  { chave: 'dashboard', rotulo: 'Início / Dashboard', href: 'index.html', icone: 'home' },
  { chave: 'produtos', rotulo: 'Produtos', href: 'produtos.html', icone: 'box' },
  { chave: 'estoque', rotulo: 'Estoque', href: 'estoque.html', icone: 'archive' },
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
        </a>
      </li>
    `
  ).join('');

  document.getElementById('app-sidebar').innerHTML = `
    <div>
      <div class="sidebar-topo">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icone"></div>
          <div>
            <div class="sidebar-logo-texto">Eletrotok</div>
            <p class="sidebar-logo-sub">CELULARES E ELETRÔNICOS</p>
          </div>
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
      ${svgIcone('search')}
      <input type="text" placeholder="Buscar no sistema..." />
    </div>
    <div class="topbar-empresa">
      <select id="topbar-select-empresa"></select>
    </div>
    <div class="topbar-toggle">
      <button type="button" id="btn-modo-loja" class="ativo">Apenas esta loja</button>
      <button type="button" id="btn-modo-todas">Todas as lojas</button>
    </div>
    <button type="button" class="topbar-icone-btn" title="Notificações">
      ${svgIcone('bell')}
      <span class="topbar-badge">3</span>
    </button>
    <div class="topbar-usuario">
      <div class="topbar-usuario-avatar">T</div>
      <div>
        <div>Tayna</div>
        <small>Administrador</small>
      </div>
    </div>
  `;

  const store = empresaAtualStorage();
  const selectEmpresa = document.getElementById('topbar-select-empresa');
  const btnLoja = document.getElementById('btn-modo-loja');
  const btnTodas = document.getElementById('btn-modo-todas');

  let empresas = [];
  try {
    empresas = await api.get('/empresas');
  } catch {
    empresas = [];
  }

  selectEmpresa.innerHTML = empresas.map((e) => `<option value="${e.id}">${e.razao_social} (${e.tipo})</option>`).join('');

  if (empresas.length > 0) {
    const idSalvo = store.id;
    const existe = empresas.some((e) => String(e.id) === String(idSalvo));
    selectEmpresa.value = existe ? idSalvo : empresas[0].id;
    if (!existe) store.id = selectEmpresa.value;
  }

  function atualizarModoVisual() {
    const consolidado = store.consolidado;
    btnLoja.classList.toggle('ativo', !consolidado);
    btnTodas.classList.toggle('ativo', consolidado);
    selectEmpresa.disabled = consolidado;
    renderFaixaContexto(empresas, store);
  }

  selectEmpresa.addEventListener('change', () => {
    store.id = selectEmpresa.value;
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

  if (store.consolidado) {
    faixa.innerHTML = '📦 Exibindo dados de <strong>todas as lojas</strong> (consolidado).';
    faixa.hidden = false;
    return;
  }

  const empresa = empresas.find((e) => String(e.id) === String(store.id));
  if (!empresa) {
    faixa.hidden = true;
    return;
  }

  faixa.innerHTML = `📦 Exibindo dados da loja: <strong>${empresa.razao_social}</strong> | CNPJ: ${empresa.cnpj} | Altere a loja ou veja todas no topo da página.`;
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

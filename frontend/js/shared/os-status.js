const STATUS_OS = {
  recebido: { rotulo: 'Recebido', cor: '#dbeafe', texto: '#1d4ed8' },
  em_diagnostico: { rotulo: 'Em diagnóstico', cor: '#dbeafe', texto: '#1d4ed8' },
  aguardando_aprovacao: { rotulo: 'Aguardando aprovação', cor: '#ffe8d1', texto: '#b45309' },
  aguardando_peca: { rotulo: 'Aguardando peça', cor: '#ffe8d1', texto: '#b45309' },
  em_reparo: { rotulo: 'Em reparo', cor: '#ede9fe', texto: '#6d28d9' },
  pronto: { rotulo: 'Pronto', cor: '#dcfce7', texto: '#15803d' },
  entregue: { rotulo: 'Entregue', cor: '#e5e7eb', texto: '#374151' },
  recusado: { rotulo: 'Recusado', cor: '#fee2e2', texto: '#b91c1c' },
  devolvido_sem_reparo: { rotulo: 'Devolvido sem reparo', cor: '#fee2e2', texto: '#b91c1c' },
};

const SEQUENCIA_STATUS = [
  'recebido',
  'em_diagnostico',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_reparo',
  'pronto',
  'entregue',
];

function badgeStatusOS(status) {
  const info = STATUS_OS[status] || { rotulo: status, cor: '#e5e7eb', texto: '#374151' };
  return `<span class="badge-tag" style="background:${info.cor}; color:${info.texto};">${info.rotulo}</span>`;
}

function rotuloStatusOS(status) {
  return (STATUS_OS[status] || {}).rotulo || status;
}

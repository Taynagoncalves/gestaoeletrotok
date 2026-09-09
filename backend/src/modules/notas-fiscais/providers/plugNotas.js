// Adaptador para a API do PlugNotas (https://plugnotas.com.br).
//
// Mesmo contrato do adaptador do Focus NFe (veja focusNfe.js): emitir(),
// consultarStatus() e cancelar(). Implemente aqui as chamadas HTTP reais
// quando a credencial do PlugNotas estiver disponivel.
//
// Documentacao de referencia (para quando for implementar):
// - Emissao de NFC-e: POST /nfce
// - Emissao de NFe: POST /nfe
// - Consulta: GET /nfce/:id ou /nfe/:id
// - Cancelamento: DELETE /nfce/:id ou /nfe/:id

const AppError = require('../../../shared/errors/AppError');

function erroNaoImplementado(acao) {
  return new AppError(
    `Integração com PlugNotas ainda não implementada (${acao}). ` +
      'O adaptador está em backend/src/modules/notas-fiscais/providers/plugNotas.js — ' +
      'implemente a chamada HTTP real usando o token salvo na configuração fiscal desta empresa.',
    501
  );
}

async function emitir() {
  throw erroNaoImplementado('emissão');
}

async function consultarStatus() {
  throw erroNaoImplementado('consulta de status');
}

async function cancelar() {
  throw erroNaoImplementado('cancelamento');
}

module.exports = { emitir, consultarStatus, cancelar };

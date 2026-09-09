// Adaptador para a API do Focus NFe (https://focusnfe.com.br).
//
// Esta e a UNICA camada que deve saber como falar com o Focus NFe. O resto
// do sistema (service, controller, rotas) so conhece o contrato generico
// definido em providers/index.js: emitir(), consultarStatus(), cancelar().
//
// Para ativar de verdade, implemente as 3 funcoes abaixo fazendo as
// chamadas HTTP reais (a lib nativa `fetch` do Node 18+ ja esta disponivel,
// nao precisa instalar cliente HTTP). Use `configFiscal.provider_token`
// (ja descriptografado pelo service antes de chegar aqui) no header
// Authorization, e o CNPJ da empresa como identificador do emitente.
//
// Documentacao de referencia (para quando for implementar):
// - Emissao de NFC-e: POST /v2/nfce
// - Emissao de NFe: POST /v2/nfe
// - Consulta: GET /v2/nfce/:ref ou /v2/nfe/:ref
// - Cancelamento: DELETE /v2/nfce/:ref ou /v2/nfe/:ref

const AppError = require('../../../shared/errors/AppError');

function erroNaoImplementado(acao) {
  return new AppError(
    `Integração com Focus NFe ainda não implementada (${acao}). ` +
      'O adaptador está em backend/src/modules/notas-fiscais/providers/focusNfe.js — ' +
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

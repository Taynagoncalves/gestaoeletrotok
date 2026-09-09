const focusNfe = require('./focusNfe');
const plugNotas = require('./plugNotas');
const AppError = require('../../../shared/errors/AppError');

const PROVIDERS = {
  focus_nfe: focusNfe,
  plugnotas: plugNotas,
};

function obterProvider(nomeProvider) {
  const provider = PROVIDERS[nomeProvider];
  if (!provider) {
    throw new AppError(`Provedor de nota fiscal desconhecido: ${nomeProvider}.`);
  }
  return provider;
}

module.exports = { obterProvider };

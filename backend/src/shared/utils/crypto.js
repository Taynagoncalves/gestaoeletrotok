const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

function obterChave() {
  const segredo = process.env.APP_SECRET_KEY;
  if (!segredo) {
    throw new Error(
      'APP_SECRET_KEY não configurada. Defina uma chave de 32+ caracteres no .env para armazenar credenciais fiscais com segurança.'
    );
  }
  return crypto.createHash('sha256').update(segredo).digest();
}

function criptografar(textoPlano) {
  if (textoPlano === null || textoPlano === undefined || textoPlano === '') return null;

  const chave = obterChave();
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv(ALGORITMO, chave, iv);
  const criptografado = Buffer.concat([cifra.update(String(textoPlano), 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();

  return Buffer.concat([iv, tag, criptografado]).toString('base64');
}

function descriptografar(textoCriptografado) {
  if (!textoCriptografado) return null;

  const chave = obterChave();
  const dados = Buffer.from(textoCriptografado, 'base64');
  const iv = dados.subarray(0, 12);
  const tag = dados.subarray(12, 28);
  const criptografado = dados.subarray(28);

  const decifra = crypto.createDecipheriv(ALGORITMO, chave, iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(criptografado), decifra.final()]).toString('utf8');
}

function mascarar(textoPlano) {
  if (!textoPlano) return null;
  const texto = String(textoPlano);
  if (texto.length <= 4) return '••••';
  return `••••${texto.slice(-4)}`;
}

module.exports = { criptografar, descriptografar, mascarar };

const fs = require('fs');
const mysql = require('mysql2/promise');
const env = require('./env');

function resolverSsl() {
  if (!env.db.ssl) return undefined;

  if (process.env.DB_SSL_CA_PATH) {
    return { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH) };
  }

  // Sem CA fornecido: mantem a conexao criptografada, mas sem validar o
  // certificado do servidor. Prefira sempre configurar DB_SSL_CA_PATH.
  return { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  ssl: resolverSsl(),
});

module.exports = pool;

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

const MIGRATIONS_DIR = __dirname;

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE,
      aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT nome FROM migrations');
  return new Set(rows.map((row) => row.nome));
}

function resolverSsl() {
  if (!env.db.ssl) return undefined;

  if (process.env.DB_SSL_CA_PATH) {
    return { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH) };
  }

  return { rejectUnauthorized: false };
}

async function run() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    ssl: resolverSsl(),
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
  } catch (err) {
    console.warn(
      `Não foi possível criar o database automaticamente (${err.message}). ` +
        'Prosseguindo assumindo que ele já existe (comum em provedores gerenciados como Aiven).'
    );
  }

  await connection.changeUser({ database: env.db.database });

  await ensureMigrationsTable(connection);
  const applied = await getAppliedMigrations(connection);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Aplicando migration: ${file}`);
    await connection.query(sql);
    await connection.query('INSERT INTO migrations (nome) VALUES (?)', [file]);
  }

  console.log('Migrations em dia.');
  await connection.end();
}

run().catch((err) => {
  console.error('Falha ao rodar migrations:', err);
  process.exit(1);
});

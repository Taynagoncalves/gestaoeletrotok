const app = require('./src/app');
const env = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`Servidor rodando em http://localhost:${env.port}`);
});

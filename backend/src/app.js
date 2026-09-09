const express = require('express');
const cors = require('cors');
const empresasRoutes = require('./modules/empresas/empresas.routes');
const fornecedoresRoutes = require('./modules/fornecedores/fornecedores.routes');
const produtosRoutes = require('./modules/produtos/produtos.routes');
const estoqueRoutes = require('./modules/estoque/estoque.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const vendasRoutes = require('./modules/vendas/vendas.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/empresas', empresasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vendas', vendasRoutes);

app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const empresasRoutes = require('./modules/empresas/empresas.routes');
const fornecedoresRoutes = require('./modules/fornecedores/fornecedores.routes');
const produtosRoutes = require('./modules/produtos/produtos.routes');
const estoqueRoutes = require('./modules/estoque/estoque.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const vendasRoutes = require('./modules/vendas/vendas.routes');
const osRoutes = require('./modules/ordens-servico/os.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
// Limite maior que o padrao (100kb) por causa de imagens de produto e
// assinaturas de termo de responsabilidade em base64.
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/empresas', empresasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/ordens-servico', osRoutes);

app.use(errorHandler);

module.exports = app;

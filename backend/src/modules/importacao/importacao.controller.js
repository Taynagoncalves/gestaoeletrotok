const service = require('./importacao.service');

function preview(req, res) {
  const resultado = service.preview(req.body.arquivo_base64, req.body.nome_arquivo);
  res.json(resultado);
}

async function executarProdutos(req, res) {
  const resultado = await service.executar(req.body);
  res.json(resultado);
}

module.exports = {
  preview,
  executarProdutos,
};

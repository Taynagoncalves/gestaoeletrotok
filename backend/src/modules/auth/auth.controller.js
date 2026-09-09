const service = require('./auth.service');

async function login(req, res) {
  const usuario = await service.login(req.body);
  res.json(usuario);
}

module.exports = { login };

const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensagem: 'Token não enviado'
    });
  }

  const partes = authHeader.trim().split(/\s+/);

  if (
    partes.length !== 2 ||
    partes[0] !== 'Bearer'
  ) {
    return res.status(401).json({
      mensagem: 'Authorization deve usar o formato Bearer <token>'
    });
  }

  const token = partes[1];

  try {
    const dados = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = dados;
    req.cliente = dados;

    next();

  } catch (erro) {
    return res.status(401).json({
      mensagem: 'Token inválido ou expirado'
    });
  }
}

module.exports = autenticar;
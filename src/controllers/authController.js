const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        mensagem: 'Email e senha são obrigatórios'
      });
    }

    const usuario = await Usuario.findOne({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({
        mensagem: 'Email ou senha inválidos'
      });
    }

    const senhaConfere = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaConfere) {
      return res.status(401).json({
        mensagem: 'Email ou senha inválidos'
      });
    }

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso',
      token
    });

  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro ao fazer login',
      erro: erro.message
    });
  }
}

module.exports = {
  login
};
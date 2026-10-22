const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');

async function cadastrar(req, res) {
    try {
        const { nome, email, senha, tipo } = req.body;

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({
                mensagem: 'Nome, email, senha e tipo são obrigatórios',
            });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const usuario = await Usuario.create({
            nome,
            email,
            senha: senhaCriptografada,
            tipo,
        });

        res.status(201).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
        });
    } catch (erro) {
        res.status(400).json({
            mensagem: 'Erro ao cadastrar usuário',
            erro: erro.message,
        });
    }
}

module.exports = { cadastrar };
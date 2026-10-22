const Movimentacao = require('../models/Movimentacao');
const Produto = require('../models/produtos');
const Usuario = require('../models/Usuario');
const sequelize = require('../config/database');

async function cadastrar(req, res) {
    let transacao;

    try {
        const { produtos_id, tipo, quantidade } = req.body;

        if (!['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({
                mensagem: 'O tipo deve ser entrada ou saida',
            });
        }

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({
                mensagem: 'A quantidade deve ser um número inteiro maior que zero',
            });
        }

        transacao = await sequelize.transaction();

        const produto = await Produto.findByPk(produtos_id, {
            transaction: transacao,
            lock: transacao.LOCK.UPDATE,
        });

        if (!produto) {
            await transacao.rollback();
            return res.status(404).json({
                mensagem: 'Produto não encontrado',
            });
        }

        if (tipo === 'saida' && produto.quantidade_estoque < quantidade) {
            await transacao.rollback();
            return res.status(400).json({
                mensagem: 'Quantidade insuficiente em estoque',
            });
        }

        const novaQuantidade = tipo === 'entrada'
            ? produto.quantidade_estoque + quantidade
            : produto.quantidade_estoque - quantidade;

        await produto.update(
            { quantidade_estoque: novaQuantidade },
            { transaction: transacao },
        );

        const movimentacao = await Movimentacao.create({
            produtos_id,
            tipo,
            quantidade,
            usuario_id: req.usuario.id,
            data: new Date(),
        }, { transaction: transacao });

        await transacao.commit();

        return res.status(201).json(movimentacao);
    } catch (erro) {
        if (transacao && !transacao.finished) {
            await transacao.rollback();
        }

        return res.status(400).json({
            mensagem: 'Erro ao cadastrar movimentação',
            erro: erro.message,
        });
    }
}

async function listar(req, res) {
    try {
        const movimentacoes = await Movimentacao.findAll({
            include: [
                {
                    model: Produto,
                    attributes: ['id', 'nome'],
                },
                {
                    model: Usuario,
                    attributes: ['id', 'nome'],
                },
            ],
            order: [['data', 'DESC']],
            limit: 50,
        });

        return res.json(movimentacoes);
    } catch (erro) {
        return res.status(400).json({
            mensagem: 'Erro ao listar movimentações',
            erro: erro.message,
        });
    }
}

module.exports = { cadastrar, listar };

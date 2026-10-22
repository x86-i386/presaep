const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./produtos');
const Usuario = require('./Usuario');

const Movimentacao = sequelize.define('Movimentacao', {
    tipo: {
        type: DataTypes.ENUM('entrada', 'saida'),
        allowNull: false,
    },
    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    data: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    produtos_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'movimentacaos',
});

Produto.hasMany(Movimentacao, { foreignKey: 'produtos_id' });
Movimentacao.belongsTo(Produto, { foreignKey: 'produtos_id' });
Usuario.hasMany(Movimentacao, { foreignKey: 'usuario_id' });
Movimentacao.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = Movimentacao;

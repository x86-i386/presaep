const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');
const produtos = sequelize.define('produtos', {
nome: {
type: DataTypes.STRING,
allowNull: false,
},
quantidade_estoque: {
type: DataTypes.INTEGER,
allowNull: false,
defaultValue: 0,
},
}, {
tableName: 'produtos',
});
module.exports = produtos;
const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');

const Log = db.define('log', {
    acao: { type: DataTypes.STRING, allowNull: false }, // Ex: "Ajuste de KM"
    descricao: { type: DataTypes.TEXT }, // Detalhes do que mudou
    usuario: { type: DataTypes.STRING }, // Quem fez
    veiculoId: { type: DataTypes.INTEGER } // Qual carro (opcional)
});

module.exports = Log;
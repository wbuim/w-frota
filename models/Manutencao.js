const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');
const Veiculo = require('./Veiculo'); // Importa o Pai

const Manutencao = db.define('manutencao', {
    data: { type: DataTypes.DATE, allowNull: false },
    oficina: { type: DataTypes.STRING, allowNull: false },
    descricao: { type: DataTypes.STRING },
    valor: { type: DataTypes.FLOAT, allowNull: false },
    km_momento: { type: DataTypes.INTEGER },
    foto: { type: DataTypes.STRING }
});

// Define as duas pontas
Manutencao.belongsTo(Veiculo);
Veiculo.hasMany(Manutencao);

module.exports = Manutencao;
const Sequelize = require('sequelize');
const db = require('../config/database');
const Veiculo = require('./Veiculo'); // Importa o Pai

const Movimentacao = db.define('movimentacao', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    motorista: { type: Sequelize.STRING, allowNull: false },
    destino: { type: Sequelize.STRING, allowNull: false },
    data_saida: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    km_saida: { type: Sequelize.INTEGER, allowNull: false },
    data_volta: { type: Sequelize.DATE, allowNull: true },
    km_volta: { type: Sequelize.INTEGER, allowNull: true },
    km_rodados: { type: Sequelize.INTEGER, defaultValue: 0 },
    observacao: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.STRING, defaultValue: 'Aberto' }
});

// Define as duas pontas da relação aqui
Movimentacao.belongsTo(Veiculo);
Veiculo.hasMany(Movimentacao);

module.exports = Movimentacao;
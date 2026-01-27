const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');
const Departamento = require('./Departamento'); 

const Veiculo = db.define('veiculo', {
    modelo: { type: DataTypes.STRING, allowNull: false },
    marca: { type: DataTypes.STRING, allowNull: false },
    placa: { type: DataTypes.STRING, allowNull: false, unique: true },
    km_atual: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'Disponível' },
    km_ultima_troca_oleo: { type: DataTypes.INTEGER, defaultValue: 0 },

    // FK Explícita para Departamento
    departamentoId: {
        type: DataTypes.INTEGER,
        references: { model: Departamento, key: 'id' },
        allowNull: true
    }
});

// Associações
Veiculo.belongsTo(Departamento, { foreignKey: 'departamentoId' });
Departamento.hasMany(Veiculo, { foreignKey: 'departamentoId' });

module.exports = Veiculo;
const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');
const Veiculo = require('./Veiculo'); // Importa o Pai

const Abastecimento = db.define('abastecimento', {
    data: { type: DataTypes.DATE, allowNull: false },
    litros: { type: DataTypes.FLOAT, allowNull: false },
    valor_total: { type: DataTypes.FLOAT, allowNull: false },
    tipo_combustivel: { type: DataTypes.STRING },
    km_momento: { type: DataTypes.INTEGER },
    posto: { type: DataTypes.STRING },
    motorista: { type: DataTypes.STRING },
    foto: { type: DataTypes.STRING }
});

// Define as duas pontas
Abastecimento.belongsTo(Veiculo);
Veiculo.hasMany(Abastecimento);

module.exports = Abastecimento;
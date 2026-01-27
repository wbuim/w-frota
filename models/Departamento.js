const Sequelize = require('sequelize');
const database = require('../config/database');

const Departamento = database.define('departamento', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Departamento;
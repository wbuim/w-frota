const Sequelize = require('sequelize');
const database = require('../config/database');
const Departamento = require('./Departamento'); // Mudou aqui

const Usuario = database.define('usuario', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: Sequelize.STRING, allowNull: false },
    login: { type: Sequelize.STRING, allowNull: false, unique: true },
    senha: { type: Sequelize.STRING, allowNull: false },
    
    // Nível: 0=Motorista, 1=Gestor, 99=Geral/Diretor
    nivel: { type: Sequelize.INTEGER, defaultValue: 0 },

    // FK Explícita para Departamento
    departamentoId: {
        type: Sequelize.INTEGER,
        references: { model: Departamento, key: 'id' },
        allowNull: true
    },

    tipo: { type: Sequelize.STRING, defaultValue: 'comum' } 
});

// Associações
Usuario.belongsTo(Departamento, { foreignKey: 'departamentoId' });
Departamento.hasMany(Usuario, { foreignKey: 'departamentoId' });

module.exports = Usuario;
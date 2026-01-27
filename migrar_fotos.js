const db = require('./config/database');
const { DataTypes } = require('sequelize');

async function atualizarBanco() {
    const queryInterface = db.getQueryInterface();
    try {
        console.log("📸 Criando colunas de fotos...");
        await queryInterface.addColumn('abastecimentos', 'foto', { type: DataTypes.STRING, allowNull: true });
        await queryInterface.addColumn('manutencoes', 'foto', { type: DataTypes.STRING, allowNull: true });
        console.log("✅ Sucesso! Colunas de fotos criadas.");
    } catch (error) {
        console.log("ℹ️ Colunas já existem ou erro: " + error.message);
    }
    process.exit();
}
atualizarBanco();

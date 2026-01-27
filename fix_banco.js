const db = require('./config/database');
const { DataTypes } = require('sequelize');

async function consertar() {
    const queryInterface = db.getQueryInterface();
    try {
        console.log("⏳ Tentando adicionar a coluna 'motorista'...");
        await queryInterface.addColumn('abastecimentos', 'motorista', {
            type: DataTypes.STRING
        });
        console.log("✅ SUCESSO! Coluna criada.");
    } catch (error) {
        console.log("⚠️ AVISO: " + error.message);
    }
    process.exit();
}

consertar();

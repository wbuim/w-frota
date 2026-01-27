const db = require('./config/database');
const { DataTypes } = require('sequelize');

async function adicionarColuna() {
    const queryInterface = db.getQueryInterface();
    try {
        console.log("🛢️ Verificando tabela de veículos...");
        await queryInterface.addColumn('veiculos', 'km_ultima_troca_oleo', {
            type: DataTypes.INTEGER,
            defaultValue: 0
        });
        console.log("✅ Sucesso! Coluna 'km_ultima_troca_oleo' criada.");
    } catch (error) {
        console.log("ℹ️ A coluna provavelmente já existe. Tudo certo!");
    }
}

adicionarColuna();

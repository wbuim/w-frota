const db = require('./config/database');
const { QueryTypes } = require('sequelize');

async function consertar() {
    try {
        console.log("🔨 Iniciando reparo no banco de dados...");

        // Tenta adicionar na tabela de MANUTENÇÃO (nome: manutencaos)
        try {
            await db.query("ALTER TABLE manutencaos ADD COLUMN foto TEXT;");
            console.log("✅ Coluna 'foto' criada na tabela 'manutencaos'.");
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log("ℹ️ Coluna 'foto' já existia em 'manutencaos'.");
            } else {
                console.log("❌ Erro em manutencaos: " + e.message);
            }
        }

        // Tenta adicionar na tabela de ABASTECIMENTO (nome: abastecimentos)
        try {
            await db.query("ALTER TABLE abastecimentos ADD COLUMN foto TEXT;");
            console.log("✅ Coluna 'foto' criada na tabela 'abastecimentos'.");
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log("ℹ️ Coluna 'foto' já existia em 'abastecimentos'.");
            } else {
                console.log("❌ Erro em abastecimentos: " + e.message);
            }
        }

        console.log("🏁 Reparo finalizado.");
    } catch (error) {
        console.error("Erro fatal:", error);
    }
}

consertar();

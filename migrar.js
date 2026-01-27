const db = require('./config/database');
// Importa o modelo para o Sequelize saber que ele existe
const Log = require('./models/Log');

async function atualizarBanco() {
    try {
        // O comando .sync() verifica se a tabela existe. Se não existir, ele cria.
        await db.sync(); 
        console.log("✅ Tabela de Logs verificada/criada com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro:", error.message);
        process.exit(1);
    }
}

atualizarBanco();
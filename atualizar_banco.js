const db = require('./config/database');
const Manutencao = require('./models/Manutencao');
// Importamos os outros para garantir que o relacionamento funcione
const Abastecimento = require('./models/Abastecimento'); 
const Movimentacao = require('./models/Movimentacao');

(async () => {
    try {
        await db.sync({ alter: true });
        console.log("✅ Banco atualizado! Tabela de Manutenção criada.");
    } catch (error) {
        console.error("Erro:", error);
    }
})();
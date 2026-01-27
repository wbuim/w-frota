const db = require('./config/database');
const Departamento = require('./models/Departamento');
const Usuario = require('./models/Usuario');
const Veiculo = require('./models/Veiculo');
const Movimentacao = require('./models/Movimentacao');
const Abastecimento = require('./models/Abastecimento');
const Manutencao = require('./models/Manutencao');
const Log = require('./models/Log');

async function migrar() {
    console.log("🏢 Iniciando RECRIAÇÃO TOTAL do banco...");
    
    try {
        // 1. Zera o banco e recria as tabelas
        await db.sync({ force: true }); 
        console.log("✅ Tabelas limpas e recriadas.");

        // 2. Cria o Departamento Padrão (Matriz)
        const departamento = await Departamento.create({ 
            id: 1, 
            nome: 'Matriz / Administrativo' 
        });
        console.log("✅ Departamento 'Matriz' criado.");

        // 3. CRIA O USUÁRIO ADMIN (Aqui estava faltando!)
        await Usuario.create({
            nome: 'Administrador Geral',
            login: 'admin',
            senha: '123', // O sistema vai criptografar no primeiro login
            nivel: 99,
            departamentoId: 1
        });
        console.log("✅ Usuário 'admin' (senha: 123) recriado com sucesso.");

        console.log("🚀 ESTRUTURA PRONTA!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro fatal:", error);
        process.exit(1);
    }
}

migrar();
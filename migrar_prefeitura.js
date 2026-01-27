const db = require('./config/database');
const Secretaria = require('./models/Secretaria');
const Usuario = require('./models/Usuario');
const Veiculo = require('./models/Veiculo');
const { DataTypes } = require('sequelize');

async function migrar() {
    console.log("🏛️ Iniciando transformação para W-Frota Prefeitura...");
    const queryInterface = db.getQueryInterface();

    try {
        // 1. Criar Tabela Secretarias
        await Secretaria.sync();
        console.log("✅ Tabela Secretarias criada.");

        // 2. Criar a Secretaria Padrão (ID 1)
        const [secGeral] = await Secretaria.findOrCreate({
            where: { id: 1 },
            defaults: { nome: 'Prefeitura Municipal (Geral)' }
        });
        console.log("✅ Secretaria 'Prefeitura Municipal' garantida.");

        // 3. Atualizar Tabela Usuários (Adicionar colunas se não existirem)
        try {
            await queryInterface.addColumn('usuarios', 'nivel', { type: DataTypes.INTEGER, defaultValue: 0 });
            await queryInterface.addColumn('usuarios', 'secretariaId', { type: DataTypes.INTEGER, defaultValue: 1 });
            console.log("✅ Colunas adicionadas em Usuários.");
        } catch (e) { console.log("ℹ️ Colunas de usuário já existiam."); }

        // 4. Atualizar Tabela Veículos
        try {
            await queryInterface.addColumn('veiculos', 'secretariaId', { type: DataTypes.INTEGER, defaultValue: 1 });
            console.log("✅ Colunas adicionadas em Veículos.");
        } catch (e) { console.log("ℹ️ Colunas de veículo já existiam."); }

        // 5. Migrar Permissões Antigas (Admin antigo vira Nível 99)
        // Todo mundo vai para a secretaria 1 por padrão
        await Usuario.update(
            { nivel: 99, secretariaId: 1 }, 
            { where: { tipo: 'admin' } }
        );
        await Usuario.update(
            { nivel: 0, secretariaId: 1 }, 
            { where: { tipo: 'comum' } } // Ou 'padrao' se usou outro nome
        );
        
        // Todos os carros atuais vão para a prefeitura geral
        await Veiculo.update({ secretariaId: 1 }, { where: {} });

        console.log("🚀 MIGRAÇÃO CONCLUÍDA! O sistema agora é Multi-Secretaria.");

    } catch (error) {
        console.error("❌ Erro na migração:", error);
    }
}

migrar();
const db = require('./config/database');
const Usuario = require('./models/Usuario');
const Veiculo = require('./models/Veiculo');
const Abastecimento = require('./models/Abastecimento');
const Manutencao = require('./models/Manutencao');
const bcrypt = require('bcryptjs');

async function popular() {
    try {
        console.log("🌱 Plantando dados fictícios...");

        const senhaPadrao = await bcrypt.hash('1234', 10);
        
        // 1. Cria Motoristas
        await Usuario.findOrCreate({ where: { login: 'joao' }, defaults: { nome: 'João da Silva', senha: senhaPadrao, tipo: 'comum', departamentoId: 1 } });
        await Usuario.findOrCreate({ where: { login: 'maria' }, defaults: { nome: 'Maria Oliveira', senha: senhaPadrao, tipo: 'comum', departamentoId: 1 } });
        await Usuario.findOrCreate({ where: { login: 'carlos' }, defaults: { nome: 'Carlos Souza', senha: senhaPadrao, tipo: 'comum', departamentoId: 1 } });
        
        console.log("✅ Motoristas criados (Senha: 1234)");

        // 2. Cria Veículos (INCLUINDO A VAN QUE FALTVAVA)
        await Veiculo.findOrCreate({ where: { placa: 'ABC-1234' }, defaults: { modelo: 'Fiat Strada', marca: 'Fiat', km_atual: 45000, status: 'Disponível', departamentoId: 1 } });
        
        await Veiculo.findOrCreate({ where: { placa: 'XYZ-9876' }, defaults: { modelo: 'VW Gol', marca: 'VW', km_atual: 82000, status: 'Disponível', departamentoId: 1 } });
        
        // A VAN QUE O RECHEIO PEDE:
        await Veiculo.findOrCreate({ where: { placa: 'FRO-2024' }, defaults: { modelo: 'Renault Master Escolar', marca: 'Renault', km_atual: 110500, status: 'Manutenção', departamentoId: 1 } });
        
        await Veiculo.findOrCreate({ where: { placa: 'ADM-0001' }, defaults: { modelo: 'Onix Turbo', marca: 'GM', km_atual: 15000, status: 'Em Uso', departamentoId: 1 } });

        console.log("✅ Veículos criados (Incluindo a Van Escolar).");
        console.log("🚀 Tudo pronto!");

    } catch (error) {
        console.error("Erro ao popular:", error);
    }
}

popular();
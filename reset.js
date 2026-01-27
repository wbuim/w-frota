const db = require('./config/database');
const Movimentacao = require('./models/Movimentacao');
const Abastecimento = require('./models/Abastecimento');
const Manutencao = require('./models/Manutencao');
const Log = require('./models/Log');
const Veiculo = require('./models/Veiculo');

async function limparBanco() {
    try {
        console.log("⏳ Iniciando limpeza do histórico...");

        // 1. Apaga todo o histórico de operações
        await Movimentacao.destroy({ where: {}, truncate: false });
        console.log("✅ Histórico de Viagens apagado.");

        await Abastecimento.destroy({ where: {}, truncate: false });
        console.log("✅ Histórico de Abastecimentos apagado.");

        await Manutencao.destroy({ where: {}, truncate: false });
        console.log("✅ Histórico de Manutenções apagado.");

        await Log.destroy({ where: {}, truncate: false });
        console.log("✅ Logs de Auditoria apagados.");

        // 2. Reseta o status dos veículos para evitar travamentos
        // Mantém a quilometragem (km_atual), só muda o status para liberar o carro
        await Veiculo.update({ status: 'Disponível' }, { where: {} });
        console.log("✅ Todos os veículos definidos como 'Disponível'.");

        console.log("🚀 BANCO DE DADOS LIMPO E PRONTO PARA USO!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro ao limpar banco:", error);
        process.exit(1);
    }
}

limparBanco();
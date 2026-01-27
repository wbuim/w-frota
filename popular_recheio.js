const db = require('./config/database');
const Veiculo = require('./models/Veiculo');
const Abastecimento = require('./models/Abastecimento');
const Manutencao = require('./models/Manutencao');
const Movimentacao = require('./models/Movimentacao');

async function rechearBanco() {
    try {
        console.log("🚚 Iniciando a simulação de frota ativa...");

        // 1. Buscar os veículos pelo modelo/placa para pegar os IDs certos
        const gol = await Veiculo.findOne({ where: { placa: 'XYZ-9876' } });
        const master = await Veiculo.findOne({ where: { placa: 'FRO-2024' } });
        const onix = await Veiculo.findOne({ where: { placa: 'ADM-0001' } });

        if (!gol || !master || !onix) {
            console.log("❌ Erro: Rode o script 'popular_banco.js' anterior primeiro para criar os carros.");
            return;
        }

        // --- CENÁRIO 1: O GOL DA FIRMA (Uso Intenso) ---
        // Motorista: Maria | Roda muito, gasta pouco
        console.log("... Simulando rotina do Gol");
        
        // Viagem 1
        await Movimentacao.create({ veiculoId: gol.id, motorista: 'Maria Oliveira', destino: 'Visita Clientes Centro', km_saida: 82000, km_volta: 82150, km_rodados: 150, status: 'Concluido', data_saida: '2026-01-05 08:00', data_volta: '2026-01-05 18:00' });
        // Abasteceu depois da viagem
        await Abastecimento.create({ veiculoId: gol.id, motorista: 'Maria Oliveira', data: '2026-01-06', litros: 15, valor_total: 85.90, tipo_combustivel: 'Gasolina', km_momento: 82150, posto: 'Posto Centro' });

        // Viagem 2
        await Movimentacao.create({ veiculoId: gol.id, motorista: 'Maria Oliveira', destino: 'Viagem Regional', km_saida: 82150, km_volta: 82500, km_rodados: 350, status: 'Concluido', data_saida: '2026-01-10 07:00', data_volta: '2026-01-10 20:00' });
        // Abasteceu tanque cheio
        await Abastecimento.create({ veiculoId: gol.id, motorista: 'Maria Oliveira', data: '2026-01-11', litros: 35, valor_total: 199.50, tipo_combustivel: 'Gasolina', km_momento: 82500, posto: 'Posto Estradeiro' });

        // Atualiza KM atual do Gol
        await Veiculo.update({ km_atual: 82500 }, { where: { id: gol.id } });


        // --- CENÁRIO 2: A VAN ESCOLAR (Gasto Alto) ---
        // Motorista: Carlos | Diesel e Manutenção
        console.log("... Simulando rotina da Van Escolar");

        // Rota Semanal
        await Movimentacao.create({ veiculoId: master.id, motorista: 'Carlos Souza', destino: 'Rota Escolar Manhã/Tarde', km_saida: 110500, km_volta: 110900, km_rodados: 400, status: 'Concluido', data_saida: '2026-01-15 06:00', data_volta: '2026-01-19 18:00' });
        
        // Abastecimento Pesado (Diesel)
        await Abastecimento.create({ veiculoId: master.id, motorista: 'Carlos Souza', data: '2026-01-18', litros: 65, valor_total: 390.00, tipo_combustivel: 'Diesel', km_momento: 110800, posto: 'Posto Ipiranga' });

        // Manutenção Preventiva
        await Manutencao.create({ veiculoId: master.id, data: '2026-01-20', oficina: 'Mecânica Diesel Pro', descricao: 'Troca de Óleo 10w40 + Filtro de Ar', valor: 650.00, km_momento: 110900 });

        // Atualiza KM atual da Master
        await Veiculo.update({ km_atual: 110900 }, { where: { id: master.id } });


        // --- CENÁRIO 3: O CARRO DA DIRETORIA (Pouco Uso) ---
        // Motorista: João | Carro Novo, só lavagem
        console.log("... Simulando rotina do Onix");

        // Viagem Curta
        await Movimentacao.create({ veiculoId: onix.id, motorista: 'João da Silva', destino: 'Reunião Prefeitura', km_saida: 15000, km_volta: 15040, km_rodados: 40, status: 'Concluido', data_saida: '2026-01-12 14:00', data_volta: '2026-01-12 16:00' });

        // Abastecimento pequeno (Etanol)
        await Abastecimento.create({ veiculoId: onix.id, motorista: 'João da Silva', data: '2026-01-12', litros: 10, valor_total: 39.90, tipo_combustivel: 'Etanol', km_momento: 15010, posto: 'Posto Shell' });
        
        // Estética
        await Manutencao.create({ veiculoId: onix.id, data: '2026-01-21', oficina: 'Lava Jato VIP', descricao: 'Lavagem Completa + Cera', valor: 80.00, km_momento: 15040 });

        // Atualiza KM atual do Onix
        await Veiculo.update({ km_atual: 15040 }, { where: { id: onix.id } });

        console.log("✅ Dados inseridos com sucesso!");
        console.log("📊 Vá conferir o Relatório Geral agora.");

    } catch (error) {
        console.error("Erro:", error);
    }
}

rechearBanco();
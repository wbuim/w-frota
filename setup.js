const db = require('./config/database');
const Usuario = require('./models/Usuario');
const Veiculo = require('./models/Veiculo');
const Movimentacao = require('./models/Movimentacao');

(async () => {
    try {
        await db.sync({ force: true });
        
        await Usuario.create({
            nome: 'Administrador Frota',
            login: 'admin',
            senha: '123',
            tipo: 'admin'
        });

        await Veiculo.create({
            modelo: 'Fiat Strada 1.4',
            placa: 'ABC-1234',
            marca: 'Fiat',
            km_atual: 50000,
            status: 'Disponível'
        });

        console.log("✅ Banco de Dados Criado!");
        console.log("🔑 Login: admin | Senha: 123");
    } catch (error) {
        console.error(error);
    }
})();
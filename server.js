require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const { Op } = require('sequelize'); 
const bcrypt = require('bcryptjs'); 
const multer = require('multer');

// Configuração de Upload de Fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// --- IMPORTAÇÃO DOS MODELOS (REFATORADOS) ---
const Usuario = require('./models/Usuario');
const Veiculo = require('./models/Veiculo');
const Movimentacao = require('./models/Movimentacao');
const Abastecimento = require('./models/Abastecimento');
const Manutencao = require('./models/Manutencao');
const Log = require('./models/Log');
const Departamento = require('./models/Departamento'); // Substitui Secretaria

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo-frota-corporativo',
    resave: false,
    saveUninitialized: false
}));

// Middleware de Autenticação
function auth(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

// --- ROTA DE LOGIN ---
app.get('/login', (req, res) => res.render('login', { erro: null }));

app.post('/login', async (req, res) => {
    try {
        console.log("--- TENTATIVA DE LOGIN ---");
        const { login, senha } = req.body;
        
        // Busca usuário trazendo o Departamento junto
        const user = await Usuario.findOne({ 
            where: { login },
            include: [{ model: Departamento }] 
        });

        if (!user) return res.render('login', { erro: 'Usuário não encontrado.' });

        // Verifica senha (criptografada ou texto puro antigo)
        const senhaBate = await bcrypt.compare(senha, user.senha);
        const senhaSimples = user.senha === senha;

        if (senhaBate || senhaSimples) {
            // Atualiza senha antiga se necessário
            if(senhaSimples) {
                const hash = await bcrypt.hash(senha, 10);
                await Usuario.update({ senha: hash }, { where: { id: user.id } });
            }

            // Cria a sessão com os dados do Departamento
            req.session.user = {
                id: user.id,
                nome: user.nome,
                login: user.login,
                nivel: user.nivel, 
                departamentoId: user.departamentoId,
                nomeDepartamento: user.departamento ? user.departamento.nome : 'Matriz / Geral'
            };
            
            return res.redirect('/');
        } else {
            return res.render('login', { erro: 'Senha incorreta.' });
        }

    } catch (error) {
        console.error("Erro Crítico no Login:", error);
        res.send("Erro no servidor: " + error.message);
    }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

// --- DASHBOARD (HOME) ---
app.get('/', auth, async (req, res) => {
    try {
        const user = req.session.user;
        let filtroGeral = {}; 

        // Se não for Admin (99), filtra pelo departamento do usuário
        if (user.nivel !== 99) {
            filtroGeral = { where: { departamentoId: user.departamentoId } };
        }
        filtroGeral.include = [{ model: Departamento }];

        const veiculos = await Veiculo.findAll(filtroGeral);
        
        // Filtra movimentações em aberto
        let filtroTransito = { 
            where: { status: 'Aberto' }, 
            include: [{ model: Veiculo, include: [Departamento] }] 
        };
        
        if (user.nivel !== 99) {
            filtroTransito.include = [{ 
                model: Veiculo, 
                where: { departamentoId: user.departamentoId },
                include: [Departamento]
            }];
        }
        
        const em_transito = await Movimentacao.findAll(filtroTransito);

        // Se for motorista, manda para o painel simplificado
        if (user.nivel === 0) {
            return res.render('painel_motorista', { veiculos, em_transito, user });
        }

        // --- DADOS PARA O PAINEL ADMIN ---
        const idsVeiculosVisiveis = veiculos.map(v => v.id);
        
        let totalAbastecimentos = 0;
        let totalManutencao = 0;

        if (idsVeiculosVisiveis.length > 0) {
            totalAbastecimentos = await Abastecimento.sum('valor_total', { where: { veiculoId: idsVeiculosVisiveis } }) || 0;
            totalManutencao = await Manutencao.sum('valor', { where: { veiculoId: idsVeiculosVisiveis } }) || 0;
        }

        const ativos = veiculos.filter(v => v.status === 'Disponível').length;
        const ocupados = veiculos.filter(v => v.status === 'Em Uso').length;
        const oficina = veiculos.filter(v => v.status === 'Manutenção').length;

        // Alerta de troca de óleo (9500km após a última troca)
        const alertas_oleo = veiculos.filter(v => {
            const km_desde_troca = v.km_atual - (v.km_ultima_troca_oleo || 0);
            return km_desde_troca >= 9500; 
        });

        // Carrega departamentos para o select de novo veículo
        let departamentos = [];
        if (user.nivel === 99) {
            departamentos = await Departamento.findAll();
        }

        const filtroUsuarios = user.nivel === 99 ? {} : { where: { departamentoId: user.departamentoId } };
        const usuarios = await Usuario.findAll(filtroUsuarios);

        res.render('painel_admin', { 
            veiculos, em_transito, user, alertas_oleo, usuarios, departamentos,
            stats: { totalAbastecimentos, totalManutencao, ativos, ocupados, oficina }
        });

    } catch (error) {
        console.error(error);
        res.send("Erro ao carregar sistema: " + error.message);
    }
});

// --- NOVO VEÍCULO ---
app.post('/novo_veiculo', auth, async (req, res) => {
    const user = req.session.user;
    if (user.nivel === 0) return res.redirect('/'); 
    
    const { modelo, placa, marca, km_atual, km_ultima_troca_oleo, departamento_destino } = req.body;
    
    let idDeptoFinal = user.departamentoId; 

    // Se for admin, pode escolher o departamento destino
    if (user.nivel === 99 && departamento_destino) {
        idDeptoFinal = departamento_destino;
    }

    const trocaOleoInicial = km_ultima_troca_oleo ? parseInt(km_ultima_troca_oleo) : 0;

    await Veiculo.create({ 
        modelo, placa, marca, km_atual, 
        status: 'Disponível',
        km_ultima_troca_oleo: trocaOleoInicial,
        departamentoId: idDeptoFinal
    });
    
    res.redirect('/');
});

// --- NOVO DEPARTAMENTO (ANTIGA SECRETARIA) ---
app.post('/novo_departamento', auth, async (req, res) => { // MUDAMOS O NOME DA ROTA
    try {
        if (req.session.user.nivel !== 99) return res.send("Acesso Negado.");
        if (!req.body.nome) return res.redirect('/usuarios');

        await Departamento.create({ nome: req.body.nome });
        res.redirect('/usuarios'); // Volta para a tela de equipe
    } catch (error) {
        res.send("Erro ao criar departamento: " + error.message);
    }
});

// --- EDITAR DEPARTAMENTO ---
app.post('/editar_departamento', auth, async (req, res) => {
    try {
        if (req.session.user.nivel !== 99) return res.send("Acesso Negado.");
        
        const { id, nome } = req.body;
        await Departamento.update({ nome }, { where: { id } });
        
        res.redirect('/usuarios');
    } catch (error) {
        res.send("Erro ao editar: " + error.message);
    }
});

// --- DELETAR DEPARTAMENTO ---
app.get('/deletar_departamento/:id', auth, async (req, res) => {
    try {
        if (req.session.user.nivel !== 99) return res.send("Acesso Negado.");
        
        const id = req.params.id;

        // 🔒 Proteção: Não deixa apagar a Matriz/Geral (ID 1)
        if (id == 1) {
            return res.send("<script>alert('A Matriz não pode ser excluída!'); window.location.href='/usuarios';</script>");
        }

        // Tenta apagar
        await Departamento.destroy({ where: { id } });
        res.redirect('/usuarios');

    } catch (error) {
        // Se cair aqui, é porque tem usuários ou carros vinculados (Erro de Foreign Key)
        res.send("<script>alert('Não é possível excluir este departamento pois existem Usuários ou Veículos vinculados a ele. Mude-os de setor primeiro.'); window.location.href='/usuarios';</script>");
    }
});

// --- GESTÃO DE EQUIPE (USUÁRIOS) ---
app.get('/usuarios', auth, async (req, res) => {
    const user = req.session.user;
    if (user.nivel === 0) return res.redirect('/');

    let filtro = { include: [{ model: Departamento }] };
    
    if (user.nivel !== 99) {
        filtro.where = { departamentoId: user.departamentoId };
    }

    const usuarios = await Usuario.findAll(filtro);
    
    let departamentos = [];
    if (user.nivel === 99) departamentos = await Departamento.findAll();

    res.render('usuarios', { usuarios, usuarioLogado: user, departamentos });
});

app.post('/salvar_usuario', auth, async (req, res) => {
    const user = req.session.user;
    if (user.nivel === 0) return res.redirect('/');

    const { nome, login, senha, nivel_acesso, departamento_id } = req.body;
    
    let deptId = user.departamentoId;
    if (user.nivel === 99 && departamento_id) deptId = departamento_id;

    try {
        const hash = await bcrypt.hash(senha, 10);
        await Usuario.create({ 
            nome, login, senha: hash, 
            nivel: parseInt(nivel_acesso), 
            departamentoId: deptId,
            tipo: parseInt(nivel_acesso) === 99 ? 'admin' : 'comum' 
        });
        res.redirect('/usuarios');
    } catch (e) {
        res.send("Erro ao criar usuário. Login já existe?");
    }
});

app.get('/deletar_usuario/:id', auth, async (req, res) => {
    await Usuario.destroy({ where: { id: req.params.id } });
    res.redirect('/usuarios');
});

// --- EDITAR USUÁRIO (Senha, Login, Nome, Depto) ---
app.post('/editar_usuario', auth, async (req, res) => {
    try {
        if (req.session.user.nivel !== 99) return res.send("Acesso Negado.");

        const { id, nome, login, senha, nivel_acesso, departamento_id } = req.body;

        // Monta o objeto de atualização
        let dadosAtualizar = {
            nome: nome,
            login: login,
            nivel: parseInt(nivel_acesso),
            departamentoId: departamento_id
        };

        // Regra da Senha: Só atualiza se o campo não estiver vazio
        if (senha && senha.trim() !== "") {
            const hash = await bcrypt.hash(senha, 10);
            dadosAtualizar.senha = hash; // Adiciona a nova senha criptografada
        }

        // Atualiza no banco
        await Usuario.update(dadosAtualizar, { where: { id: id } });

        res.redirect('/usuarios');

    } catch (error) {
        res.send("Erro ao editar usuário (Login duplicado?): " + error.message);
    }
});

// --- OPERAÇÕES DIÁRIAS (SAÍDA / CHEGADA) ---

app.post('/registrar_saida', auth, async (req, res) => {
    const { veiculo_id, destino } = req.body;
    const user = req.session.user;
    
    let nomeCondutor = user.nome; 
    if (user.nivel > 0 && req.body.motorista) nomeCondutor = req.body.motorista;

    const veiculo = await Veiculo.findByPk(veiculo_id);
    if (veiculo && veiculo.status === 'Disponível') {
        await Movimentacao.create({ veiculoId: veiculo.id, motorista: nomeCondutor, destino, km_saida: veiculo.km_atual, status: 'Aberto' });
        await Veiculo.update({ status: 'Em Uso' }, { where: { id: veiculo.id }});
    }
    res.redirect('/');
});

app.post('/registrar_chegada', auth, async (req, res) => {
    const { mov_id, km_chegada, observacao } = req.body;
    const mov = await Movimentacao.findByPk(mov_id);
    const veiculo = await Veiculo.findByPk(mov.veiculoId);
    
    if (parseInt(km_chegada) < veiculo.km_atual) return res.send(`Erro: KM menor que o atual!`);

    const kmRodados = parseInt(km_chegada) - veiculo.km_atual;
    await Movimentacao.update({ data_volta: new Date(), km_volta: km_chegada, km_rodados: kmRodados, observacao, status: 'Concluido' }, { where: { id: mov_id } });
    await Veiculo.update({ status: 'Disponível', km_atual: km_chegada }, { where: { id: veiculo.id } });
    res.redirect('/');
});

// --- OPERAÇÕES FINANCEIRAS ---

app.post('/registrar_abastecimento', auth, upload.single('foto'), async (req, res) => {
    const { veiculo_id, data, litros, valor_total, tipo_combustivel, km_momento, posto } = req.body;
    const user = req.session.user;
    let motorista = user.nome;
    if (user.nivel > 0 && req.body.motorista) motorista = req.body.motorista;
    
    const foto = req.file ? req.file.filename : null;
    await Abastecimento.create({ veiculoId: veiculo_id, data: data || new Date(), litros, valor_total, tipo_combustivel, km_momento, posto, motorista, foto });
    await Veiculo.update({ km_atual: km_momento }, { where: { id: veiculo_id } }); 
    res.redirect('/');
});

app.post('/registrar_manutencao', auth, upload.single('foto'), async (req, res) => {
    const { veiculo_id, data, oficina, descricao, valor, km_momento } = req.body;
    const foto = req.file ? req.file.filename : null;
    await Manutencao.create({ veiculoId: veiculo_id, data, oficina, descricao, valor, km_momento, foto });
    res.redirect('/');
});

// --- FERRAMENTAS ADMIN (Correções) ---
app.post('/admin/ajustar_km', auth, async (req, res) => {
    if(req.session.user.nivel === 0) return res.redirect('/');
    const { veiculo_id, novo_km, justificativa } = req.body;
    await Veiculo.update({ km_atual: novo_km }, { where: { id: veiculo_id } });
    await Log.create({ acao: 'Correção KM', descricao: `Novo KM: ${novo_km}. Motivo: ${justificativa}`, usuario: req.session.user.nome, veiculoId: veiculo_id });
    res.redirect('/veiculo/' + veiculo_id);
});

app.post('/admin/registrar_troca_oleo', auth, async (req, res) => {
    if(req.session.user.nivel === 0) return res.redirect('/');
    const { veiculo_id, km_troca, tipo_oleo, litros, valor_total, posto, observacao } = req.body;
    await Veiculo.update({ km_ultima_troca_oleo: km_troca }, { where: { id: veiculo_id } });
    await Manutencao.create({ veiculoId: veiculo_id, oficina: posto, descricao: `Troca Óleo: ${tipo_oleo}`, valor: valor_total, km_momento: km_troca, data: new Date() });
    res.redirect('/veiculo/' + veiculo_id);
});

// --- DETALHES DO VEÍCULO ---
app.get('/veiculo/:id', auth, async (req, res) => {
    const veiculo = await Veiculo.findByPk(req.params.id, { include: [Departamento] });
    
    // Proteção: Só vê carro do próprio departamento (se não for admin 99)
    if (req.session.user.nivel !== 99 && veiculo.departamentoId !== req.session.user.departamentoId) {
        return res.send("Acesso negado a este veículo.");
    }

    const abastecimentos = await Abastecimento.findAll({ where: { veiculoId: veiculo.id }, order: [['data', 'DESC']] });
    const manutencoes = await Manutencao.findAll({ where: { veiculoId: veiculo.id }, order: [['data', 'DESC']] });
    const viagens = await Movimentacao.findAll({ where: { veiculoId: veiculo.id, status: 'Concluido' }, order: [['data_saida', 'DESC']] });
    
    let totalCombustivel = 0; abastecimentos.forEach(a => totalCombustivel += a.valor_total);
    let totalManutencao = 0; manutencoes.forEach(m => totalManutencao += m.valor);

    res.render('veiculo', { veiculo, abastecimentos, manutencoes, viagens, totalCombustivel, totalManutencao });
});

// --- RELATÓRIOS GERAIS ---
app.get('/relatorio_geral', auth, async (req, res) => {
    if(req.session.user.nivel === 0) return res.redirect('/');
    
    let whereGeral = {};
    if (req.session.user.nivel !== 99) whereGeral = { departamentoId: req.session.user.departamentoId };

    const veiculos = await Veiculo.findAll({ where: whereGeral });
    
    const relatorio = [];
    for (const v of veiculos) {
        const totalC = await Abastecimento.sum('valor_total', { where: { veiculoId: v.id } }) || 0;
        const totalM = await Manutencao.sum('valor', { where: { veiculoId: v.id } }) || 0;
        const litros = await Abastecimento.sum('litros', { where: { veiculoId: v.id } }) || 0;
        const km = await Movimentacao.sum('km_rodados', { where: { veiculoId: v.id, status: 'Concluido' } }) || 0;
        relatorio.push({
            modelo: v.modelo, placa: v.placa, km: v.km_atual,
            combustivel: totalC, litros: litros, oficina: totalM,
            km_percorridos: km, consumo: litros > 0 ? (km/litros).toFixed(2) : 0,
            total: totalC + totalM
        });
    }
    const totalGeral = relatorio.reduce((acc, i) => acc + i.total, 0);
    
    res.render('relatorio_geral', { relatorio, totalGeral, data: new Date(), filtro: {} });
});

// --- RELATÓRIO MOTORISTA ---
app.get('/relatorio_motorista', auth, async (req, res) => {
    if(req.session.user.nivel === 0) return res.redirect('/');
    
    const user = req.session.user;
    // Filtra usuários pelo departamento
    const filtroUsuarios = user.nivel === 99 ? {} : { where: { departamentoId: user.departamentoId } };
    const usuarios = await Usuario.findAll(filtroUsuarios);

    const motoristaSelecionado = req.query.motorista || '';
    let dados = null;

    if (motoristaSelecionado) {
        const viagens = await Movimentacao.findAll({ where: { motorista: motoristaSelecionado, status: 'Concluido' }, include: [{ model: Veiculo }] });
        const abastecimentos = await Abastecimento.findAll({ where: { motorista: motoristaSelecionado }, include: [{ model: Veiculo }] });
        
        let totalKm = 0; viagens.forEach(v => totalKm += v.km_rodados);
        let totalGastoCombustivel = 0; abastecimentos.forEach(a => totalGastoCombustivel += a.valor_total);
        
        dados = { viagens, abastecimentos, totalKm, tempoFormatado: "0h", totalGastoCombustivel };
    }
    res.render('relatorio_motorista', { usuarios, motoristaSelecionado, dados });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 W-Frota Corporativo rodando em: http://localhost:${PORT}`));
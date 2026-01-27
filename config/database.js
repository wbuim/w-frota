const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'banco_frota.sqlite',
    logging: false
});
module.exports = sequelize;
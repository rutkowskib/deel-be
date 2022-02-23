const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite3'
});

module.exports = {
  sequelize
}

const {Profile} = require('./models/profile');
const {Job} = require('./models/job');
const {Contract} = require('./models/contract');

Profile.associate(sequelize.models)
Job.associate(sequelize.models)
Contract.associate(sequelize.models)
const {sequelize} = require('../db');
const Sequelize = require('sequelize');

class Contract extends Sequelize.Model {
  static associate(models) {
    Contract.belongsTo(models.Profile, {as: 'Contractor'})
    Contract.belongsTo(models.Profile, {as: 'Client'})
    Contract.hasMany(models.Job)
  }
}
Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status:{
      type: Sequelize.ENUM('new','in_progress','terminated')
    }
  },
  {
    sequelize,
    modelName: 'Contract'
  }
);

module.exports = {
  Contract,
}
const express = require('express');
const router = express.Router();
const {getProfile} = require('../middleware/getProfile');
const validator = require('express-joi-validation').createValidator({});
const Joi = require('joi');
const { Op } = require('sequelize');
const { Contract } = require('../models/contract');

router.use(getProfile);

router.get('/', async (req, res) => {
  const {id: userId} = req.profile;
  const { rows: contracts, count } = await Contract.findAndCountAll({
    where: {
      [Op.or]: [{'ClientId': userId}, {'ContractorId': userId}],
      [Op.not]: { status: 'terminated' }
    }
  });
  res.json({ contracts, count });
});

router.get('/:id', validator.params(Joi.object({ id: Joi.number() })), async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.profile;
  const contract = await Contract.findOne({where: {
    id,
    [Op.or]: [{'ClientId': userId}, {'ContractorId': userId} ]
  }});
  if (!contract) {
    return res.status(403).end();
  }
  res.json(contract);
});

module.exports = {
  router,
};
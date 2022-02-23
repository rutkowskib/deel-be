const express = require('express')
const router = express.Router()
const {getProfile} = require('../middleware/getProfile')
const validator = require('express-joi-validation').createValidator({})
const Joi = require('joi')
const { Op } = require("sequelize");

router.use(getProfile);

router.get('/:id' ,validator.params(Joi.object({ id: Joi.number() })), async (req, res) =>{
  const {Contract} = req.app.get('models')
  const {id} = req.params
  const {id: userId} = req.profile
  const contract = await Contract.findOne({where: {id, [Op.or]: [{'ClientId': userId}, {'ContractorId': userId} ]}})
  if(!contract) return res.status(403).end()
  res.json(contract)
})

module.exports = {
  router,
};
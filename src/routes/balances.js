const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({});
const Joi = require('joi').extend(require('@joi/date'));
const { sequelize } = require('../db');
const { Profile } = require('../models/profile');
const { Job } = require('../models/job');
const { Contract } = require('../models/contract');
const { UserDoesNotExistError, ToBigDepositError } = require('../errors');
const { Transaction } = require('sequelize');

router.post('/deposit/:userId', validator.params(Joi.object({ userId: Joi.number().required() })), validator.body(Joi.object({ money: Joi.number().required() })), async (req, res) => {
  try {
    await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (transaction) => {
      const user = await Profile.findOne({
        attributes: {
          include: [
            [sequelize.fn('SUM', sequelize.col('price')), 'price']
          ]
        },
        where: {
          id: req.params.userId,
        },
        include: {
          model: Contract,
          as: 'Client',
          include: {
            model: Job,
            where: {
              paid: false,
            }
          }
        }
      }, {
        transaction,
      });
      if (!user.id) {
        throw new UserDoesNotExistError();
      }
      if ((user.dataValues.price / 4) < req.body.money) {
        throw new ToBigDepositError();
      }
      await Profile.update({
        balance: sequelize.literal(`balance + ${req.body.money}`)
      }, {
        where: { id: req.params.userId },
        transaction,
      });
    });
    res.status(200).end();
  } catch (e) {
    if (e instanceof UserDoesNotExistError) {
      return res.status(400).end();
    }
    if (e instanceof ToBigDepositError) {
      return res.status(409).end();
    }
    res.status(500).end();
  }
});
module.exports = {
  router,
};
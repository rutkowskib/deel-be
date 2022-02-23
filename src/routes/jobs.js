const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Job } = require('../models/job');
const { Contract } = require('../models/contract');
const { Profile } = require('../models/profile');
const { Op, Transaction } = require('sequelize');
const validator = require('express-joi-validation').createValidator({});
const Joi = require('joi');
const { sequelize } = require('../db');
const { NotEnoughMoneyError, AlreadyPaidError, DoesntExistError } = require('../errors');

router.use(getProfile);

router.get('/unpaid', async (req, res) => {
  const { id: userId } = req.profile;
  const { count, rows: jobs } = await Job.findAndCountAll({
    where: {
      paid: false,
    },
    include: [{
      model: Contract,
      where: {
        status: 'in_progress',
        [Op.or]: [
          { ContractorId: userId },
          { ClientId: userId }
        ],
      },
    }],
  });
  res.json({ jobs, count });
});

router.post('/:id/pay', validator.params(Joi.object({ id: Joi.number() })), async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (transaction) => {
      const job = await Job.findOne({
        where: {
          id,
        },
        include: [{
          model: Contract,
          where: {
            ClientId: req.profile.id,
          },
          include: [ 'Client', 'Contractor' ],
        }],
        transaction,
      });
      if (!job) {
        throw new DoesntExistError();
      }
      if (job.paid) {
        throw new AlreadyPaidError();
      }
      if (job.price > job.Contract.Client.balance) {
        throw new NotEnoughMoneyError();
      }
      await Promise.all([
        Job.update({
          paid: true
        }, {
          where: { id },
          transaction,
        }),
        Profile.update({
          balance: sequelize.literal(`balance - ${job.price}`)
        }, {
          where: { id: job.Contract.ClientId },
          transaction,
        }),
        Profile.update({
          balance: sequelize.literal(`balance + ${job.price}`)
        }, {
          where: { id: job.Contract.ContractorId },
          transaction,
        }),
      ]);
    });
  } catch (e) {
    if (e instanceof DoesntExistError) {
      return res.status(403).end();
    }
    if (e instanceof AlreadyPaidError) {
      return res.status(409).end();
    }
    if (e instanceof NotEnoughMoneyError) {
      return res.status(402).end();
    }
    return res.status(500).end();
  }
  res.json({});
});

module.exports = {
  router,
};
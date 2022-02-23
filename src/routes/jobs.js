const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Job } = require('../models/job');
const { Contract } = require('../models/contract');
const { Op } = require('sequelize');

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

module.exports = {
  router,
};
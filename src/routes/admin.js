const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({});
const Joi = require('joi').extend(require('@joi/date'));
const { sequelize } = require('../db');
const { QueryTypes } = require('sequelize');

router.get('/best-profession/', validator.query(Joi.object({ 'start-date': Joi.date().format('YYYY-MM-DD').required(), 'end-date': Joi.date().format('YYYY-MM-DD').required() })), async (req, res) => {
  // Sum of every contractor earned money in given range of dates
  const querySumContractorMoney = `
    (SELECT "ContractorId", SUM("price") AS "earned"
    FROM "Jobs"
    LEFT JOIN "Contracts"
    ON "Contracts"."id" = "Jobs"."ContractId"
    WHERE "Jobs"."paid" = true
    AND date("Jobs"."paymentDate") BETWEEN date(:startDate) AND date(:endDate)
    GROUP BY "ContractorId") AS "EarnedByContractor"
  `;
  // Aggregated sum of each profession calculated as sum of contractor earned money
  const querySumProfessionMoney = `
    (SELECT "profession", SUM("earned") AS "professionEarned"
    FROM ${querySumContractorMoney}
    LEFT JOIN "Profiles"
    ON "Profiles"."id" = "EarnedByContractor"."ContractorId"
    GROUP BY "profession")
  `;
  // Aggregated sum of each profession calculated as sum of contractor earned money
  const queryGetMaxProfession = `
    SELECT "profession", MAX("professionEarned")
    FROM ${querySumProfessionMoney}
  `;
  const queryResult = await sequelize.query(queryGetMaxProfession, {
    replacements: {
      startDate: req.originalQuery['start-date'],
      endDate: req.originalQuery['end-date'],
    },
    type: QueryTypes.SELECT
  });
  res.json({
    profession: queryResult[0] ? queryResult[0].profession: '',
  });
});

router.get('/best-clients/', validator.query(Joi.object({
  start: Joi.date().format('YYYY-MM-DD').required(),
  end: Joi.date().format('YYYY-MM-DD').required(),
  limit: Joi.number().integer().positive().default(2)
})), async (req, res) => {
  const biggestPayersQuery = `
    (SELECT "ClientId", SUM("price") AS "paid"
    FROM "Jobs"
    LEFT JOIN "Contracts"
    ON "Contracts"."id" = "Jobs"."ContractId"
    WHERE "Jobs"."paid" = true
    AND date("Jobs"."paymentDate") BETWEEN date(:start) AND date(:end)
    GROUP BY "ClientId"
    ORDER BY "paid" DESC
    LIMIT :limit
    ) AS "PaidByClients"
  `;
  const clientsProfilesQuery = `
    SELECT "paid", "id", "firstName" || ' ' || "lastName" AS "fullName"
    FROM ${biggestPayersQuery}
    LEFT JOIN "Profiles"
    ON "PaidByClients"."ClientId" = "Profiles"."id"
  `;
  const queryResult = await sequelize.query(clientsProfilesQuery, {
    replacements: {
      start: req.originalQuery['start'],
      end: req.originalQuery['end'],
      limit: req.query.limit,
    },
    type: QueryTypes.SELECT,
  });
  res.json({
    clients: queryResult,
  });
});

module.exports = {
  router,
};
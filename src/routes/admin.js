const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({});
const Joi = require('joi').extend(require('@joi/date'));
const { sequelize } = require('../db');
const { QueryTypes } = require('sequelize');

/**
 * @openapi
 * /admin/best-profession:
 *   get:
 *     description: Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 *     parameters:
 *       - in: query
 *         name: start-date
 *       - in: query
 *         name: end-date
 *
 *     responses:
 *       200:
 *         description: Best profession
 *         content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profession:
 *                   type: string
 */
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

/**
 * @openapi
 * /admin/best-clients/:
 *   get:
 *     description: returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
 *     parameters:
 *       - in: query
 *         name: start
 *       - in: query
 *         name: end
 *       - in: query
 *         name: limit
 *
 *     responses:
 *       200:
 *         description: Best clients
 *         content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profession:
 *                   type: string
 */
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
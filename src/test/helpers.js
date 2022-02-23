const { Contract } = require('../models/contract');
const { Job } = require('../models/job');
const faker = require('faker');

const createContract = ({ ClientId, ContractorId, status = 'new', id = faker.datatype.number() }) => {
  return Contract.create({
    id,
    terms: faker.lorem.words(),
    status,
    ClientId,
    ContractorId,
  });
};

const createJob = ({ paid = false, ContractId, price = faker.datatype.number(), paymentDate }) => {
  paymentDate = paymentDate || (paid ? new Date().toISOString() : undefined);
  return Job.create({
    description: faker.lorem.words(),
    price,
    ContractId,
    paid,
    paymentDate,
  });
};

module.exports = {
  createContract,
  createJob,
};

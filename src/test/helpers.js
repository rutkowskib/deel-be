const { Contract } = require('../models/contract');
const faker = require('faker');

const createContract = ({ ClientId, ContractorId, status = 'new', id = faker.random.number() }) => {
  return Contract.create({
    id,
    terms: faker.lorem.words(),
    status,
    ClientId,
    ContractorId,
  });
};

module.exports = {
  createContract,
}
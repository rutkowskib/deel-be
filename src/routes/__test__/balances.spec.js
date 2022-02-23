const app = require('../../app');
const request = require('supertest');
const { createContract, createJob } = require('../../test/helpers');
const { Profile } = require('../../models/profile');

describe('GET /balances/deposit/:userId', () => {
  it('Returns 400 user doesnt exist or amount of money is not sent', async () => {
    await request(app)
      .post('/balances/deposit/1')
      .expect(400);

    await request(app)
      .post('/balances/deposit/12345')
      .send({ money: 1 })
      .expect(400);
  });

  it('Returns 409 if to much money is to be deposited', async () => {
    const contract = await createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' });
    await Promise.all([
      createJob({ paid: false, price: 100, ContractId: contract.id }),
    ]);
    await request(app)
      .post('/balances/deposit/1')
      .send({ money: 26 })
      .expect(409);
  });

  it('Returns 200 and deposits money', async () => {
    const MONEY = 50;
    const profileBefore = await Profile.findByPk(1);
    const [ contract1, contract2 ] = await Promise.all([
      createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' }),
      createContract({ ClientId: 1, ContractorId: 3, status: 'in_progress' }),
    ]);
    await Promise.all([
      createJob({ paid: false, price: 50, ContractId: contract1.id }),
      createJob({ paid: false, price: 50, ContractId: contract1.id }),
      createJob({ paid: false, price: 100, ContractId: contract2.id }),
      createJob({ paid: true, price: 100, ContractId: contract1.id }),
    ]);
    await request(app)
      .post('/balances/deposit/1')
      .send({ money: MONEY })
      .expect(200);

    const profileAfter = await Profile.findByPk(1);
    expect(profileBefore.balance).toEqual(profileAfter.balance - MONEY);
  });
});
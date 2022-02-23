const app = require('../../app');
const request = require('supertest');
const faker = require('faker');
const { createContract } = require('../../test/helpers');

describe('GET /contracts/id', () => {
  it('Returns 401 if profile is not sent or doesnt exist', async () => {
    await request(app)
      .get('/contracts/12345')
      .expect(401);

    await request(app)
      .get('/contracts/12345')
      .set('profile_id', faker.random.number() + 6)
      .expect(401)
  });

  it('Returns 400 if contract is not a number', async () => {
    await request(app)
      .get('/contracts/abcd')
      .set('profile_id', 1)
      .expect(400);
  });

  it('Returns 403 if contract doesnt exist or doesnt belong to profile', async () => {
    await request(app)
      .get('/contracts/12345')
      .set('profile_id', 1)
      .expect(403)

    await createContract({ ClientId: 1, ContractorId: 2, id: 1 });
    await request(app)
      .get('/contracts/1')
      .set('profile_id', 3)
      .expect(403)
  })

  it('Returns 200 and contract if correct user tries to fetch it', async () => {
    const contract = (await createContract({ ClientId: 1, ContractorId: 2, id: 1 })).dataValues;

    const bodyAssertions = (body) => {
      expect(body.id).toEqual(contract.id);
      expect(body.ClientId).toEqual(contract.ClientId);
      expect(body.ContractorId).toEqual(contract.ContractorId);
    }

    await request(app)
      .get('/contracts/1')
      .set('profile_id', 1)
      .expect(200)
      .expect(({ body } ) => bodyAssertions(body));

    await request(app)
      .get('/contracts/1')
      .set('profile_id', 2)
      .expect(200)
      .expect(({ body } ) => bodyAssertions(body));
  })
});

describe('GET /contracts', () => {
  it('Returns 401 if token is not sent', async () => {
    await request(app)
      .get('/contracts')
      .expect(401);
  });

  it('Returns 200 and non terminated contracts for specific user', async () => {
    await Promise.all([
      createContract({ ClientId: 1, ContractorId: 2 }),
      createContract({ ClientId: 3, ContractorId: 1 }),
      createContract({ ClientId: 3, ContractorId: 4 }),
      createContract({ ClientId: 1, ContractorId: 2, status: 'terminated' }),
    ]);
    await request(app)
      .get('/contracts')
      .set('profile_id', 1)
      .expect(200)
      .expect(({ body }) => {
        expect(body.count).toEqual(2);
        expect(body.contracts).toHaveLength(2);
      });
  });
});
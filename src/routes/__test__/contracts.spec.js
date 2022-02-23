const app = require('../../app');
const request = require('supertest');
const faker = require('faker');
const { Contract } = require('../../models/contract');

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

  await Contract.create({
    id:1,
    terms: 'bla bla bla',
    status: 'terminated',
    ClientId: 1,
    ContractorId: 2
  });

  await request(app)
    .get('/contracts/1')
    .set('profile_id', 3)
    .expect(403)
})

it('Returns 200 and contract if correct user tries to fetch it', async () => {
  const contract = {
    id:1,
    terms: 'bla bla bla',
    status: 'terminated',
    ClientId: 1,
    ContractorId: 2
  };
  await Contract.create(contract);

  await request(app)
    .get('/contracts/1')
    .set('profile_id', 1)
    .expect(200)
    .expect(({ body }) => expect(body).toEqual(expect.objectContaining(contract)));

  await request(app)
    .get('/contracts/1')
    .set('profile_id', 2)
    .expect(200)
    .expect(({ body }) => expect(body).toEqual(expect.objectContaining(contract)));
})
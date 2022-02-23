const app = require('../../app');
const request = require('supertest');
const { createContract, createJob } = require('../../test/helpers');
const { Profile } = require('../../models/profile');

describe('GET /admin/best-profession/', () => {
  it('Returns 400 if start or end date are incorrect', async () => {
    await request(app)
      .get('/admin/best-profession')
      .expect(400);

    await request(app)
      .get('/admin/best-profession?start-date=2022-02-22&end-date=abcd')
      .expect(400);

    await request(app)
      .get('/admin/best-profession?start-date=abcd&end-date=2022-02-22')
      .expect(400);
  });

  it('Returns 200 and best profession', async () => {
    const [ contractBefore, contractOnDate1, contractOnDate2, contractAfter ] = await Promise.all([
      createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' }),
      createContract({ ClientId: 1, ContractorId: 3, status: 'in_progress' }),
      createContract({ ClientId: 1, ContractorId: 4, status: 'in_progress' }),
      createContract({ ClientId: 1, ContractorId: 5, status: 'in_progress' }),
    ]);

    await Promise.all([
      createJob({ paid: true, paymentDate: '2022-02-21', price: 9999999, ContractId: contractBefore.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate1.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate1.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate2.id }),
      createJob({ paid: true, paymentDate: '2022-02-23', price: 99999999, ContractId: contractAfter.id }),
    ]);

    const bestProfile = await Profile.findByPk(3);

    await request(app)
      .get('/admin/best-profession?start-date=2022-02-22&end-date=2022-02-22')
      .expect(200)
      .expect(({ body }) => {
        expect(body.profession).toEqual(bestProfile.profession);
      });
  });
});

describe('GET /admin/best-clients', () => {
  it('Returns 400 if start date, end date or limit are in wrong format', async () => {
    await request(app)
      .get('/admin/best-clients')
      .expect(400);

    await request(app)
      .get('/admin/best-clients?start=2022-02-22&end=2022-02-22&limit=-1')
      .expect(400);

    await request(app)
      .get('/admin/best-clients?start=2022-02-22&end=abcd&limit=1')
      .expect(400);

    await request(app)
      .get('/admin/best-clients?start=abcd&end=2022-02-22&limit=1')
      .expect(400);
  });

  it('Returns 200 and best clients', async () => {
    const [ contractBefore, contractOnDate1, contractOnDate2, contractAfter ] = await Promise.all([
      createContract({ ClientId: 2, ContractorId: 1, status: 'in_progress' }),
      createContract({ ClientId: 3, ContractorId: 1, status: 'in_progress' }),
      createContract({ ClientId: 4, ContractorId: 1, status: 'in_progress' }),
      createContract({ ClientId: 5, ContractorId: 1, status: 'in_progress' }),
    ]);

    await Promise.all([
      createJob({ paid: true, paymentDate: '2022-02-21', price: 9999999, ContractId: contractBefore.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate1.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate1.id }),
      createJob({ paid: true, paymentDate: '2022-02-22', price: 1, ContractId: contractOnDate2.id }),
      createJob({ paid: true, paymentDate: '2022-02-23', price: 99999999, ContractId: contractAfter.id }),
    ]);

    const bestProfile = await Profile.findByPk(3);

    await request(app)
      .get('/admin/best-clients?start=2022-02-22&end=2022-02-22&limit=1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.clients).toHaveLength(1);
        expect(body.clients[0].id).toEqual(bestProfile.id);
      });

    await request(app)
      .get('/admin/best-clients?start=2022-02-22&end=2022-02-22')
      .expect(200)
      .expect(({ body }) => {
        expect(body.clients).toHaveLength(2);
        expect(body.clients[0].id).toEqual(bestProfile.id);
      });

    await request(app)
      .get('/admin/best-clients?start=2022-02-22&end=2022-02-22&limit=10')
      .expect(200)
      .expect(({ body }) => {
        expect(body.clients).toHaveLength(2);
      });
  });
});
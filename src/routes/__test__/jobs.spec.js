const app = require('../../app');
const request = require('supertest');
const { createContract, createJob } = require('../../test/helpers');

describe('GET /jobs/unpaid', () => {
  it('Should return 401 if token is not sent', async () => {
    await request(app)
      .get('/jobs/unpaid')
      .expect(401);
  });

  it('Should return 200 and unpaid jobs for active contracts', async () => {
    const [ activeContract, terminatedContract, someoneElseContract ] = await Promise.all([
      createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' }),
      createContract({ ClientId: 1, ContractorId: 2, status: 'terminated' }),
      createContract({ ClientId: 3, ContractorId: 4 }),
    ]);
    await Promise.all([
      createJob({ paid: true, ContractId: activeContract.id }),
      createJob({ paid: false, ContractId: activeContract.id }),
      createJob({ paid: false, ContractId: terminatedContract.id }),
      createJob({ paid: false, ContractId: someoneElseContract.id }),
    ]);
    await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', 1)
      .expect(200)
      .expect(({ body }) => {
        expect(body.jobs).toHaveLength(1);
        expect(body.count).toEqual(1);
      })
  });
});
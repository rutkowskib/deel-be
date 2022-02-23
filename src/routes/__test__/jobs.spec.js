const app = require('../../app');
const request = require('supertest');
const { createContract, createJob } = require('../../test/helpers');
const { Job } = require('../../models/job');
const { Profile } = require('../../models/profile');

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

describe('POST /jobs/:id/pay', () => {
  it('Should return 401 if token is not sent', async () => {
    await request(app)
      .post('/jobs/12345/pay')
      .expect(401);
  });

  it('Should return 400 job id is not number', async () => {
    await request(app)
      .post('/jobs/abcd/pay')
      .set('profile_id', 1)
      .expect(400);
  });

  it('Should return 403 if job doesnt exist or user is not client', async () => {
    const contract = await createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' });
    const job = await createJob({ paid: false, ContractId: contract.id });
    await request(app)
      .post('/jobs/12345/pay')
      .set('profile_id', 1)
      .expect(403);

    await request(app)
      .post(`/jobs/${job.id}/pay`)
      .set('profile_id', 2)
      .expect(403);
  });

  it('Should return 409 if job is already paid', async () => {
    const contract = await createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' });
    const job = await createJob({ paid: true, ContractId: contract.id });

    await request(app)
      .post(`/jobs/${job.id}/pay`)
      .set('profile_id', 1)
      .expect(409);
  });

  it('Should return 402 if user doesnt have enough money to pay', async () => {
    const contract = await createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' });
    const job = await createJob({ paid: false, ContractId: contract.id, price: 999999 });

    await request(app)
      .post(`/jobs/${job.id}/pay`)
      .set('profile_id', 1)
      .expect(402);
  });

  it('Should update balances and mark job as paid', async () => {
    const PRICE = 1;
    const contract = await createContract({ ClientId: 1, ContractorId: 2, status: 'in_progress' });
    const job = await createJob({ paid: false, ContractId: contract.id, price: PRICE });
    const [ clientBefore, contractorBefore ] = await Promise.all([
      Profile.findByPk(1),
      Profile.findByPk(2),
    ]);
    await request(app)
      .post(`/jobs/${job.id}/pay`)
      .set('profile_id', 1)
      .expect(200);
    const [ jobAfter, clientAfter, contractorAfter ] = await Promise.all([
      Job.findByPk(job.id),
      Profile.findByPk(1),
      Profile.findByPk(2),
    ]);
    expect(jobAfter.paid).toEqual(true);
    expect(clientAfter.balance).toEqual(clientBefore.balance - PRICE);
    expect(contractorAfter.balance).toEqual(contractorBefore.balance + PRICE);
  });
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';

const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { seedDatabase } = await import('../../database/seeder.js');
const { default: app } = await import('../../app.js');

let adminCookie = '';
let citizenCookie = '';

const staffUsernames = [
  'staffE2E',
  'staffE2E2',
  'dupStaff',
  'uniqueStaff',
  'otherStaff'
];

async function cleanupStaffUsers() {
  const userRepo = AppDataSourcePostgres.getRepository('Users');
  const userOfficeRepo = AppDataSourcePostgres.getRepository('UserOffice');
  for (const username of staffUsernames) {
    const user = await userRepo.findOneBy({ username });
    if (user) {
      await userOfficeRepo.delete({ userId: user.id });
      await userRepo.delete({ id: user.id });
    }
  }
}

async function loginAndGetCookie(username, password) {
  const res = await request(app)
    .post('/api/v1/sessions/login')
    .send({ username, password });
  expect(res.status).toBe(201);
  const setCookie = res.headers['set-cookie'];
  expect(setCookie).toBeDefined();
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

beforeAll(async () => {
  await AppDataSourcePostgres.initialize();
  await seedDatabase();
  adminCookie = await loginAndGetCookie('admin', 'admin');
  citizenCookie = await loginAndGetCookie('citizen', 'citizen');
}, 30000);

afterAll(async () => {
  await cleanupStaffUsers();
  await AppDataSourcePostgres.destroy();
});

afterEach(async () => {
  await cleanupStaffUsers();
});

describe('POST /api/v1/sessions/signup (E2E)', () => {
  it('registers staff when called by admin', async () => {
    const res = await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', adminCookie)
      .send({ username: 'staffE2E', email: 'staffE2E@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    expect(res.status).toBe(201);
    expect(res.body.user.userType).toBe('STAFF');
  });

  it('forbids staff registration by non-admin', async () => {
    const res = await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', citizenCookie)
      .send({ username: 'staffE2E2', email: 'staffE2E2@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    expect(res.status).toBe(403);
  });

  it('fails if username already exists', async () => {
    // First registration
    await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', adminCookie)
      .send({ username: 'dupStaff', email: 'dupStaff@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    // Duplicate registration
    const res = await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', adminCookie)
      .send({ username: 'dupStaff', email: 'other@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    expect(res.status).toBe(409);
  });

  it('fails if email already exists', async () => {
    // First registration
    await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', adminCookie)
      .send({ username: 'uniqueStaff', email: 'dupEmail@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    // Duplicate email
    const res = await request(app)
      .post('/api/v1/sessions/signup')
      .set('Cookie', adminCookie)
      .send({ username: 'otherStaff', email: 'dupEmail@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
    expect(res.status).toBe(409);
  });
});

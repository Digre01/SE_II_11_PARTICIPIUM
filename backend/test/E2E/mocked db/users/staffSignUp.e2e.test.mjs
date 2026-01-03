import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import {standardSetup, standardTeardown} from "../../utils/standard.setup.js";
import {cleanupUsers} from "../../utils/db.utils.js";

describe('POST /api/v1/sessions/signup (E2E)', () => {
  const staffUsernames = [
    'staffE2E',
    'staffE2E2',
    'dupStaff',
    'uniqueStaff',
    'otherStaff'
  ];

  let app, dataSource, adminCookie, citizenCookie;

  beforeAll(async () => {
    const setup = await standardSetup();

    app = setup.app;
    dataSource = setup.dataSource;

    adminCookie = await setup.loginAsAdmin();
    citizenCookie = await setup.loginAsCitizen();
  }, 30000);

  afterAll(async () => {
    await cleanupUsers(dataSource, staffUsernames);
    await standardTeardown(dataSource);
  });

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

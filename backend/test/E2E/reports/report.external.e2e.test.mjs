import {
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  expect,
  jest
} from '@jest/globals';
import request from 'supertest';
import { mockRepo } from './reports.mock.js';
import { standardSetup, standardTeardown } from '../utils/standard.setup.js';

describe('PATCH /api/v1/reports/:id/assign_external (E2E - mocked)', () => {
  let app;
  let dataSource;
  let adminCookie;
  let staffCookie;
  let citizenCookie;
  const createdForExternalId = 456;

  beforeAll(async () => {
    const setup = await standardSetup();

    app = setup.app;
    dataSource = setup.dataSource;

    adminCookie = await setup.loginAsAdmin();
    staffCookie = await setup.loginAsStaff();
    citizenCookie = await setup.loginAsCitizen();

    jest.resetAllMocks();
  }, 30000);

  afterAll(async () => {
    await standardTeardown(dataSource);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('fails without authentication (no cookie)', async () => {
    const res = await request(app)
        .patch(`/api/v1/reports/${createdForExternalId}/assign_external`);

    expect(res.status).toBe(401);
  });

  it('fails when accessed by citizen', async () => {
    const res = await request(app)
        .patch(`/api/v1/reports/${createdForExternalId}/assign_external`)
        .set('Cookie', citizenCookie);

    expect(res.status).toBe(403);
  });

  it('successfully assigns report to external maintainer (staff)', async () => {
    // Mock della funzione che assegna il report
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue({
      assignedExternal: true
    });

    const res = await request(app)
        .patch(`/api/v1/reports/${createdForExternalId}/assign_external`)
        .set('Cookie', staffCookie);

    expect(res.status).toBe(200);
    expect(res.body.assignedExternal).toBe(true);
  });

  it('returns 404 for non-existent report id', async () => {
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue(null);

    const res = await request(app)
        .patch('/api/v1/reports/999999/assign_external')
        .set('Cookie', staffCookie);

    expect(res.status).toBe(404);
  });
});

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
import { attachFakeImage, deleteReturnedPhotos } from '../utils/files.utils.js';

describe('PATCH /api/v1/reports/:id/assign_external (E2E)', () => {
  let app;
  let dataSource;
  let adminCookie;
  let staffCookie;
  let citizenCookie;
  let createdForExternalId;

  beforeAll(async () => {
    const setup = await standardSetup();

    app = setup.app;
    dataSource = setup.dataSource;

    adminCookie = await setup.loginAsAdmin();
    staffCookie = await setup.loginAsStaff();
    citizenCookie = await setup.loginAsCitizen();

    // Create a report as citizen
    let req = request(app)
        .post('/api/v1/reports')
        .set('Cookie', citizenCookie)
        .field('title', 'To assign externally')
        .field('description', 'Desc')
        .field('categoryId', '5')
        .field('latitude', '10.1')
        .field('longitude', '20.2');

    req = attachFakeImage(req, 'ext-a.jpg');

    const createRes = await req;
    expect(createRes.status).toBe(201);

    // Retrieve created report ID
    const { Users } = await import('../../../entities/Users.js');
    const userRepo = dataSource.getRepository(Users);
    const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });

    const { Report } = await import('../../../entities/Reports.js');
    const reportRepo = dataSource.getRepository(Report);
    const report = await reportRepo.findOne({
      where: { userId: citizenUser.id },
      order: { id: 'DESC' }
    });

    createdForExternalId = report.id;

    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  afterAll(async () => {
    await standardTeardown();
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

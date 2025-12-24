import {describe, it, beforeAll, afterAll, expect, jest, beforeEach} from '@jest/globals';
import request from 'supertest';
import {mockRepo} from './reports.mock.js';
import {
  app,
  attachFakeImage, cookie, cookie_staff,
  deleteReturnedPhotos,
  globalSetup,
  globalTeardown,
} from './report.setup.js';
import {AppDataSourcePostgres} from "../../../config/data-source.js";

describe('PATCH /api/v1/reports/:id/assign_external (E2E)', () => {
  let createdForExternalId;

  beforeAll(async () => {
    await globalSetup()
    let req = request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .field('title', 'To assign externally')
        .field('description', 'Desc')
        .field('categoryId', '5')
        .field('latitude', '10.1')
        .field('longitude', '20.2');
    req = attachFakeImage(req, 'ext-a.jpg');
    const createRes = await req;
    expect(createRes.status).toBe(201);

    const { Users } = await import('../../../entities/Users.js');
    const userRepo = AppDataSourcePostgres.getRepository(Users);
    const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });

    const { Report } = await import('../../../entities/Reports.js');
    const reportRepo = AppDataSourcePostgres.getRepository(Report);
    const report = await reportRepo.findOne({
      where: { userId: citizenUser.id },
      order: { id: 'DESC' }
    });
    createdForExternalId = report.id;

    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  afterAll(async () => {
    await globalTeardown();
  });

  it('fails without authentication (no cookie)', async () => {
    const res = await request(app)
        .patch(`/api/v1/reports/${createdForExternalId}/assign_external`);
    expect(res.status).toBe(401);
  });

  it('successfully assigns to external maintainer (staff)', async () => {
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue({assignedExternal: true});
    const res = await request(app)
        .patch(`/api/v1/reports/${createdForExternalId}/assign_external`)
        .set('Cookie', cookie_staff);
    expect(res.status).toBe(200);
    expect(res.body.assignedExternal).toBe(true);
  });

  it('returns 404 for non-existent report id', async () => {
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue(null)
    const res = await request(app)
        .patch('/api/v1/reports/999999/assign_external')
        .set('Cookie', cookie_staff);
    expect(res.status).toBe(404);
  });
});
/*
// External maintainer routes (mocked)
describe('E2E: external maintainer routes', () => {
  beforeAll(async () => {
    await globalSetup();
    app.use((req, res, next) => {
      req.isAuthenticated = () => true;
      next();
    });
  })

  afterAll(async () => {
    await globalTeardown();
  })

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('start -> in_progress', async () => {
    mockRepo.findOneBy.mockResolvedValue({id: 1})
    mockRepo.startReport.mockResolvedValueOnce({ id: 1, status: 'in_progress' });
    const res = await request(app).patch('/api/v1/reports/1/external/start').set('Cookie', cookie_staff);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('finish -> resolved', async () => {
    mockRepo.finishReport.mockResolvedValueOnce({ id: 2, status: 'resolved' });
    const res = await request(app).patch('/api/v1/reports/2/external/finish').set('Cookie', cookie_staff);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });

  it('suspend -> suspended', async () => {
    mockRepo.suspendReport.mockResolvedValueOnce({ id: 3, status: 'suspended' });
    const res = await request(app).patch('/api/v1/reports/3/external/suspend').set('Cookie', cookie_staff);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('suspended');
  });

  it('resume -> assigned', async () => {
    mockRepo.resumeReport.mockResolvedValueOnce({ id: 4, status: 'assigned' });
    const res = await request(app).patch('/api/v1/reports/4/external/resume').set('Cookie', cookie_staff);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
  });

  it('returns 404 when repo returns null', async () => {
    mockRepo.startReport.mockResolvedValueOnce(null);
    const res = await request(app).patch('/api/v1/reports/999/external/start').set('Cookie', cookie_staff);
    expect(res.status).toBe(404);
  });
});*/
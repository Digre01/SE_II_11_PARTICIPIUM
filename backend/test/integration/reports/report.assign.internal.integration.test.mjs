import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {mockRepo} from "../../mocks/reports.repo.mock.js";
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";

await setupEmailUtilsMock()
await setUpLoginMock()
await setupAuthorizationMocks()

const { default: app } = await import('../../../app.js');

describe('GET /api/v1/reports/assigned (map DTO)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns mapped DTO for assigned reports (including author fields)', async () => {
    const reports = [
      {
        id: 1,
        title: 'Pothole in road',
        latitude: 45.1,
        longitude: 9.2,
        status: 'assigned',
        categoryId: 2,
        user: { username: 'jdoe', name: 'John', surname: 'Doe' },
        photos: [{ link: '/public/p1.jpg' }]
      },
      {
        id: 2,
        title: 'Graffiti',
        latitude: 46.0,
        longitude: 10.0,
        status: 'assigned',
        categoryId: 3,
        user: null,
        photos: []
      }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  expect(res.body).toHaveLength(2);

    const first = res.body.find(r => r.id === 1);
    expect(first).toBeDefined();
    expect(first.title).toBe('Pothole in road');
    expect(first.authorUsername).toBe('jdoe');
    expect(first.authorName).toBe('John Doe');
    expect(first.photos).toEqual([{ link: '/public/p1.jpg' }]);

    const second = res.body.find(r => r.id === 2);
    expect(second).toBeDefined();
    expect(second.authorUsername).toBeNull();
    expect(second.authorName).toBeNull();

    expect(mockRepo.getAcceptedReports).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no accepted reports', async () => {
    mockRepo.getAcceptedReports.mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/api/v1/reports/assigned')
        .set('X-Test-User-Type', 'CITIZEN');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 401 when user is not logged in', async () => {
    mockRepo.getAcceptedReports.mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/api/v1/reports/assigned');
    expect(res.status).toBe(401);
    // response body shape can be { error } or { message }
    expect((res.body.error || res.body.message || '')).toMatch(/UNAUTHORIZED|Unauthorized/);
  });

  it('returns separate items when multiple assigned reports share the same coordinates (client should cluster)', async () => {
    const reports = [
      { id: 10, title: 'A', latitude: 40.0, longitude: 10.0, status: 'assigned', categoryId: 1, user: { username: 'u1', name: 'U', surname: 'One' }, photos: [] },
      { id: 11, title: 'B', latitude: 40.0, longitude: 10.0, status: 'assigned', categoryId: 1, user: { username: 'u2', name: 'V', surname: 'Two' }, photos: [] },
      { id: 12, title: 'C', latitude: 40.0, longitude: 10.0, status: 'assigned', categoryId: 1, user: null, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    // ensure backend returns individual items — clustering/aggregation is client-side
    expect(res.body.filter(r => r.latitude === 40.0 && r.longitude === 10.0)).toHaveLength(3);
  });

  it('returns assigned reports when repository provides mixed statuses', async () => {
    const reports = [
      { id: 30, title: 'Pending', latitude: 1.0, longitude: 1.0, status: 'pending', categoryId: 1, user: null, photos: [] },
      { id: 31, title: 'Assigned', latitude: 2.0, longitude: 2.0, status: 'assigned', categoryId: 1, user: { username: 'u1', name: 'U', surname: 'One' }, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    // ensure at least one assigned report from the repository is returned and mapped
    expect(res.body.some(r => r.id === 31 && r.status === 'assigned')).toBe(true);
  });

  it('each DTO contains required fields for map visualization', async () => {
    const reports = [
      { id: 21, title: 'X', latitude: 41.1, longitude: 11.1, status: 'assigned', categoryId: 2, user: { username: 'alpha', name: 'A', surname: 'A' }, photos: [{ link: '/public/x.jpg' }] }
    ];
    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const dto = res.body[0];
    // required DTO fields: id, title, latitude, longitude, status, categoryId, authorUsername, authorName, photos
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('title');
    expect(dto).toHaveProperty('latitude');
    expect(dto).toHaveProperty('longitude');
    expect(dto).toHaveProperty('status');
    expect(dto).toHaveProperty('categoryId');
    expect(dto).toHaveProperty('authorUsername');
    expect(dto).toHaveProperty('authorName');
    expect(dto).toHaveProperty('photos');
  });
});
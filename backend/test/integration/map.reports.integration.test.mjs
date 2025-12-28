import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../mocks/common.mocks.js";
import {mockRepo} from "../mocks/repositories/reports.repo.mock.js";

await setupEmailUtilsMock()
await setupAuthorizationMocks()
await setUpLoginMock()

const { default: app } = await import('../../app.js');

describe('E2E map: citizen sees approved reports on map', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('zoomed-out: groups reports by coordinates and reports total counts', async () => {
    // prepare sample accepted reports: 3 at coord A, 2 at coord B
    const reports = [
      { id: 1, title: 'A1', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: { username: 'u1', name: 'One', surname: 'Uno' }, photos: [] },
      { id: 2, title: 'A2', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: null, photos: [] },
      { id: 3, title: 'A3', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: null, photos: [] },
      { id: 4, title: 'B1', latitude: 51.0, longitude: 9.0, status: 'assigned', categoryId: 2, user: { username: 'u2', name: 'Two', surname: 'Dos' }, photos: [] },
      { id: 5, title: 'B2', latitude: 51.0, longitude: 9.0, status: 'assigned', categoryId: 2, user: null, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('X-Test-User-Type', 'citizen');

    expect(res.status).toBe(200);
    const dtos = res.body;
    // simulate client zoomed-out grouping by exact coordinates
    const groups = dtos.reduce((acc, r) => {
      const key = `${r.latitude}|${r.longitude}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // expect two groups: coord A -> 3, coord B -> 2
    const keys = Object.keys(groups);
    expect(keys).toHaveLength(2);
    expect(Object.values(groups).sort((a,b)=>b-a)).toEqual([3,2]);
  });

  it('zoomed-in: returns individual reports with title and reporter name or Anonymous', async () => {
    const reports = [
      { id: 10, title: 'Hole', latitude: 48.0, longitude: 10.0, status: 'assigned', categoryId: 1, user: { username: 'alpha', name: 'Alice', surname: 'A' }, photos: [] },
      { id: 11, title: 'Broken light', latitude: 48.1, longitude: 10.1, status: 'assigned', categoryId: 1, user: null, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
        .get('/api/v1/reports/assigned')
        .set('X-Test-User-Type', 'citizen');

    expect(res.status).toBe(200);
    const dtos = res.body;
    expect(dtos).toHaveLength(2);

    // find the named reporter
    const named = dtos.find(r => r.id === 10);
    expect(named).toBeDefined();
    expect(named.title).toBe('Hole');
    // client would display full name when authorName exists
    expect(named.authorName).toBe('Alice A');

    // find the anonymous reporter (user null) -> client displays 'Anonymous'
    const anon = dtos.find(r => r.id === 11);
    expect(anon).toBeDefined();
    expect(anon.title).toBe('Broken light');
    // backend returns null for authorName when user is null; client should show 'Anonymous'
    expect(anon.authorName === null || anon.authorName === undefined).toBeTruthy();
  });
});

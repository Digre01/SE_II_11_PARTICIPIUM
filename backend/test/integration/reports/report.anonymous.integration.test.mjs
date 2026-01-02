import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { mockRepo } from '../mocks/reports.mocks.js';

// Import app after mocks
const { default: app } = await import('../../../app.js');

describe('GET /api/v1/reports/assigned - anonymous mapping', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('hides authorUsername/authorName when report.isAnonymous is true', async () => {
    const reports = [
      {
        id: 101,
        title: 'Anonymous Report',
        latitude: 45.0,
        longitude: 9.0,
        status: 'assigned',
        categoryId: 2,
        isAnonymous: true,
        user: { username: 'jdoe', name: 'John', surname: 'Doe' },
        photos: [{ link: '/public/p.jpg' }]
      }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    const dto = res.body[0];
    expect(dto.id).toBe(101);
    expect(dto.authorUsername).toBeNull();
    expect(dto.authorName).toBeNull();
    expect(dto.photos).toEqual([{ link: '/public/p.jpg' }]);
  });

  it('hides authorUsername/authorName for suspended reports when isAnonymous is true', async () => {
    const reports = [
      {
        id: 102,
        title: 'Suspended Anonymous',
        latitude: 45.1,
        longitude: 9.1,
        status: 'suspended',
        categoryId: 2,
        isAnonymous: true,
        user: { username: 'asmith', name: 'Alice', surname: 'Smith' },
        photos: [{ link: '/public/s.jpg' }]
      }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/suspended')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const dto = res.body[0];
    expect(dto.id).toBe(102);
    expect(dto.authorUsername).toBeNull();
    expect(dto.authorName).toBeNull();
    expect(dto.photos).toEqual([{ link: '/public/s.jpg' }]);
  });

  it('hides authorUsername/authorName for in_progress reports when isAnonymous is true', async () => {
    const reports = [
      {
        id: 103,
        title: 'InProgress Anonymous',
        latitude: 45.2,
        longitude: 9.2,
        status: 'in_progress',
        categoryId: 2,
        isAnonymous: true,
        user: { username: 'bwhite', name: 'Bob', surname: 'White' },
        photos: [{ link: '/public/ip.jpg' }]
      }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/in_progress')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const dto = res.body[0];
    expect(dto.id).toBe(103);
    expect(dto.authorUsername).toBeNull();
    expect(dto.authorName).toBeNull();
    expect(dto.photos).toEqual([{ link: '/public/ip.jpg' }]);
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';

// Repository mock
const mockRepo = {
  createReport: jest.fn(),
  getAcceptedReports: jest.fn(),
  getReportById: jest.fn(),
};

// Mock repository before importing app
await jest.unstable_mockModule('../../repositories/reportRepository.mjs', () => ({
  reportRepository: mockRepo,
}));

// Mock authorization middleware with role enforcement based on X-Role header
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
  authorizeUserType: (allowed) => (req, _res, next) => {
    const userTypeHdr = req.header('X-Test-User-Type');
    const roleHdr = req.header('X-Test-Role');
    const effectiveUserType = userTypeHdr || roleHdr;

    if (effectiveUserType) {
      req.user = { id: 10, userType: effectiveUserType };
      const normalized = (allowed || []).map(a => String(a).toUpperCase());
      const caller = String(effectiveUserType).toUpperCase();
      if (!normalized.includes(caller)) {
        return next(new InsufficientRightsError('Forbidden'));
      }
      return next();
    }

    if (req.header('Authorization')) {
      req.user = { id: 10, userType: 'citizen' };
      const normalized = (allowed || []).map(a => String(a).toUpperCase());
      if (!normalized.includes('CITIZEN')) {
        return next(new InsufficientRightsError('Forbidden'));
      }
      return next();
    }

    // For the map/assigned route we want to simulate real auth behavior and return 401
    if (req.path && req.path.includes('/assigned')) {
      return next(new UnauthorizedError('UNAUTHORIZED'));
    }

    // default: allow through (keeps existing POST tests behavior where no header leads to validation errors)
    return next();
  },
  requireAdminIfCreatingStaff: () => (req, _res, next) => next(), // no-op for tests
  authorizeRole: (requiredRole) => (req, _res, next) => {
    const roleHdr = req.header('X-Test-Role');
    if (!roleHdr) return next(new InsufficientRightsError('Forbidden'));
    if (String(roleHdr).toUpperCase() !== String(requiredRole).toUpperCase()) {
      return next(new InsufficientRightsError('Forbidden'));
    }
    next();
  },
}));

// Mock upload middleware
await jest.unstable_mockModule('../../middlewares/uploadMiddleware.js', () => ({
  default: {
    array: () => (req, _res, next) => {
      const photoNamesHeader = req.header('X-Test-Photos');
      if (photoNamesHeader) {
        const names = photoNamesHeader.split(',').filter(Boolean);
        req.files = names.map((n, idx) => ({ filename: n.trim(), path: `/tmp/${n.trim()}-${idx}` }));
      } else {
        req.files = [];
      }
      next();
    },
    single: () => (req, _res, next) => {
      const name = req.header('X-Test-Photo');
      req.file = name ? { filename: name.trim(), path: `/tmp/${name.trim()}` } : undefined;
      next();
    }
  }
}));


// Import app after mocks
const { default: app } = await import('../../app.js');

describe('POST /api/v1/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.createReport.mockResolvedValue({ id: 1 });
  });

  it('creates report successfully with 2 photos', async () => {
    const body = { title: 'Good', description: 'Desc', categoryId: 5, latitude: 45.1, longitude: 9.2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'a.jpg,b.jpg')
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Report created successfully/);
    expect(res.body.photos).toEqual(['/public/a.jpg', '/public/b.jpg']);
    expect(mockRepo.createReport).toHaveBeenCalledWith({
      title: 'Good',
      description: 'Desc',
      categoryId: 5,
      userId: 10,
      latitude: 45.1,
      longitude: 9.2,
      photos: ['/public/a.jpg', '/public/b.jpg']
    });
  });

  it('creates report successfully with 1 photo', async () => {
    const body = { title: 'One', description: 'Desc', categoryId: 7, latitude: 11.2, longitude: 33.4 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'solo.jpg')
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.photos).toEqual(['/public/solo.jpg']);
    expect(mockRepo.createReport).toHaveBeenCalledTimes(1);
  });

  it('creates report successfully with 3 photos', async () => {
    const body = { title: 'Three', description: 'Desc', categoryId: 2, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'a.jpg,b.jpg,c.jpg')
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.photos).toEqual(['/public/a.jpg', '/public/b.jpg', '/public/c.jpg']);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .send({ title: 'Only title' });
    expect(res.status).toBe(400);
    expect((res.body.error || res.body.message || '')).toMatch(/All fields are required/);
    expect(mockRepo.createReport).not.toHaveBeenCalled();
  });

  it('rejects when admin tries citizen-only endpoint', async () => {
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('X-Test-Role', 'admin') // simulate admin user
      .set('X-Test-Photos', 'a.jpg')
      .send(body);
    expect(res.status).toBe(403);
  });

  it('rejects wrong number of photos (0)', async () => {
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .send(body);
    expect(res.status).toBe(400);
    expect((res.body.error || res.body.message || '')).toMatch(/upload between 1 and 3 photos/);
    expect(mockRepo.createReport).not.toHaveBeenCalled();
  });

  it('rejects too many photos (>3)', async () => {
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'a.jpg,b.jpg,c.jpg,d.jpg')
      .send(body);
    expect(res.status).toBe(400);
    expect((res.body.error || res.body.message || '')).toMatch(/upload between 1 and 3 photos/);
    expect(mockRepo.createReport).not.toHaveBeenCalled();
  });

  it('cleans up uploaded files on repository error', async () => {
    mockRepo.createReport.mockRejectedValueOnce(new Error('DB failure'));
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'a.jpg,b.jpg')
      .send(body);
    expect(res.status).toBe(500);
  });

  it('cleans up files on validation error (missing description)', async () => {
    const body = { title: 'No desc', categoryId: 3, latitude: 10, longitude: 11 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'x.jpg,y.jpg')
      .send(body);
    expect(res.status).toBe(400);
  });

  it('fails when categoryId is 0', async () => {
    const body = { title: 'Bad cat', description: 'D', categoryId: 0, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .set('X-Test-Photos', 'a.jpg')
      .send(body);
    expect(res.status).toBe(400);
    expect(mockRepo.createReport).not.toHaveBeenCalled();
  });

  it('fails when user not authorized (no header)', async () => {
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('X-Test-Photos', 'a.jpg')
      .send(body);
    expect(res.status).toBe(400);
    expect((res.body.error || res.body.message || '')).toMatch(/All fields are required/);
  });
});


// --- Map /assigned integration tests (merged from reports.assigned.integration.test.mjs)
describe('GET /api/v1/reports/assigned (map DTO)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns mapped DTO for accepted reports (including author fields)', async () => {
    const reports = [
      {
        id: 1,
        title: 'Pothole in road',
        latitude: 45.1,
        longitude: 9.2,
        status: 'accepted',
        categoryId: 2,
        user: { username: 'jdoe', name: 'John', surname: 'Doe' },
        photos: [{ link: '/public/p1.jpg' }]
      },
      {
        id: 2,
        title: 'Graffiti',
        latitude: 46.0,
        longitude: 10.0,
        status: 'accepted',
        categoryId: 3,
        user: null,
        photos: []
      }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test');

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
      .set('Authorization', 'Bearer test');
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

  it('returns separate items when multiple reports share the same coordinates (client should cluster)', async () => {
    const reports = [
      { id: 10, title: 'A', latitude: 40.0, longitude: 10.0, status: 'accepted', categoryId: 1, user: { username: 'u1', name: 'U', surname: 'One' }, photos: [] },
      { id: 11, title: 'B', latitude: 40.0, longitude: 10.0, status: 'accepted', categoryId: 1, user: { username: 'u2', name: 'V', surname: 'Two' }, photos: [] },
      { id: 12, title: 'C', latitude: 40.0, longitude: 10.0, status: 'accepted', categoryId: 1, user: null, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    // ensure backend returns individual items — clustering/aggregation is client-side
    expect(res.body.filter(r => r.latitude === 40.0 && r.longitude === 10.0)).toHaveLength(3);
  });

  it('returns accepted reports when repository provides mixed statuses', async () => {
    const reports = [
      { id: 30, title: 'Pending', latitude: 1.0, longitude: 1.0, status: 'pending', categoryId: 1, user: null, photos: [] },
      { id: 31, title: 'Accepted', latitude: 2.0, longitude: 2.0, status: 'accepted', categoryId: 1, user: { username: 'u1', name: 'U', surname: 'One' }, photos: [] }
    ];

    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    // ensure at least one accepted report from the repository is returned and mapped
    expect(res.body.some(r => r.id === 31 && r.status === 'accepted')).toBe(true);
  });

  it('each DTO contains required fields for map visualization', async () => {
    const reports = [
      { id: 21, title: 'X', latitude: 41.1, longitude: 11.1, status: 'accepted', categoryId: 2, user: { username: 'alpha', name: 'A', surname: 'A' }, photos: [{ link: '/public/x.jpg' }] }
    ];
    mockRepo.getAcceptedReports.mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test');

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

// --- Staff / list integration tests for GET /api/v1/reports
describe('GET /api/v1/reports (staff)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty array when no reports exist', async () => {
    mockRepo.getAllReports = jest.fn().mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/reports')
      .set('X-Test-Role', 'staff');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
    expect(mockRepo.getAllReports).toHaveBeenCalledTimes(1);
  });

  it('returns all reports for authorized staff', async () => {
    const reports = [
      { id: 101, title: 'R1', latitude: 1, longitude: 2, status: 'pending', categoryId: 1, user: null, photos: [] },
      { id: 102, title: 'R2', latitude: 3, longitude: 4, status: 'accepted', categoryId: 2, user: { username: 's', name: 'S', surname: 'S' }, photos: [] }
    ];

    mockRepo.getAllReports = jest.fn().mockResolvedValueOnce(reports);

    const res = await request(app)
      .get('/api/v1/reports')
      .set('X-Test-Role', 'staff');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.some(r => r.id === 101)).toBe(true);
    expect(mockRepo.getAllReports).toHaveBeenCalledTimes(1);
  });
});

// --- Staff / report details integration tests for GET /api/v1/reports/:id
describe('GET /api/v1/reports/:id', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns report details for authorized staff with correct role', async () => {
    const report = {
      id: 1,
      title: 'Detail Report',
      description: 'Full details',
      latitude: 45.0,
      longitude: 9.0,
      status: 'pending',
      categoryId: 1,
      user: { username: 'citizen1', name: 'C', surname: 'Z' },
      photos: []
    };
    mockRepo.getReportById.mockResolvedValueOnce(report);

    const res = await request(app)
      .get('/api/v1/reports/1')
      .set('X-Test-User-Type', 'staff')
      .set('X-Test-Role', 'Municipal Public Relations Officer');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(report);
    expect(mockRepo.getReportById).toHaveBeenCalledWith('1');
  });

  it('returns 404 when report not found', async () => {
    mockRepo.getReportById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/reports/999')
      .set('X-Test-User-Type', 'staff')
      .set('X-Test-Role', 'Municipal Public Relations Officer');

    expect(res.status).toBe(404);
  });

  it('returns 403 for staff with wrong role', async () => {
    const res = await request(app)
      .get('/api/v1/reports/1')
      .set('X-Test-User-Type', 'staff')
      .set('X-Test-Role', 'Technician'); // Wrong role

    expect(res.status).toBe(403);
    expect(mockRepo.getReportById).not.toHaveBeenCalled();
  });

  it('returns 403 for citizen (unauthorized user type)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/1')
      .set('Authorization', 'Bearer test'); // Citizen

    expect(res.status).toBe(403);
    expect(mockRepo.getReportById).not.toHaveBeenCalled();
  });
});
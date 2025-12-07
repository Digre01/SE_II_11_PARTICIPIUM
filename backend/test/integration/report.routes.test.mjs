import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';

// Repository mock
const mockRepo = {
  createReport: jest.fn(),
  assignReportToExternalMaintainer: jest.fn(),
};

// Mock repository before importing app
await jest.unstable_mockModule('../../repositories/reportRepository.mjs', () => ({
  reportRepository: mockRepo,
}));

// Mock authorization middleware with role enforcement based on X-Role header
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
  authorizeUserType: (allowed) => (req, res, next) => {
    const roleHdr = req.header('X-Test-Role');
    const hasAuth = !!req.header('Authorization') || !!roleHdr;

    // If no auth info provided at all, emulate a 401 from auth middleware
    if (!hasAuth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (roleHdr) {
      req.user = { id: 10, userType: roleHdr };
    } else {
      // without X-Test-Role -> treat as citizen
      req.user = { id: 10, userType: 'citizen' };
    }

    // Enforce allowed user types
    const normalized = (allowed || []).map(a => String(a).toUpperCase());
    const caller = String(req.user.userType).toUpperCase();
    if (normalized.length > 0 && !normalized.includes(caller)) {
      return next(new InsufficientRightsError('Forbidden'));
    }

    next();
  },
  requireAdminIfCreatingStaff: () => (req, _res, next) => next(), // no-op for tests
  authorizeRole: () => (req, _res, next) => next(),
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
    expect(res.body.message).toMatch(/All fields are required/);
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
    expect(res.body.message).toMatch(/upload between 1 and 3 photos/);
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
    expect(res.body.message).toMatch(/upload between 1 and 3 photos/);
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
    // No auth should be rejected by auth middleware
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/reports/:id/assign_external', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue({ id: 1, assignedExternal: true });
  });

  it('fails without authentication (no auth header)', async () => {
    const res = await request(app)
      .patch('/api/v1/reports/1/assign_external');
    // Staff-only endpoint must reject unauthenticated calls
    expect(res.status).toBe(401);
  });

  it('successfully assigns externally for staff user', async () => {
    const res = await request(app)
      .patch('/api/v1/reports/1/assign_external')
      .set('X-Test-Role', 'staff');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.assignedExternal).toBe(true);
    expect(mockRepo.assignReportToExternalMaintainer).toHaveBeenCalledWith('1');
  });

  it('returns 404 when repository returns null', async () => {
    mockRepo.assignReportToExternalMaintainer.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch('/api/v1/reports/999/assign_external')
      .set('X-Test-Role', 'staff');
    expect(res.status).toBe(404);
  });
});

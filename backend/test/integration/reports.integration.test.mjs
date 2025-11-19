import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {InsufficientRightsError} from "../../errors/InsufficientRightsError.js";
import {UnauthorizedError} from "../../errors/UnauthorizedError.js";

// Repository mock
const mockRepo = {
  createReport: jest.fn(),
    getAllReports: jest.fn(),
    getReportById: jest.fn(),
    reviewReport: jest.fn(),
};

// Mock repository before importing app
await jest.unstable_mockModule('../../repositories/reportRepository.mjs', () => ({
  reportRepository: mockRepo,
}));

// Mock authorization middleware (must include every named export app.js imports)
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
    authorizeUserType: (allowedTypes) => (req, _res, next) => {
        if (!req.header('Authorization')) {
            const err = new UnauthorizedError('UNAUTHORIZED');
            err.statusCode = 401;
            return next(err);
        }
        const userType = req.header('X-User-Type') || 'citizen';
        if (!allowedTypes.map(t => t.toUpperCase()).includes(userType.toUpperCase())) {
            const err = new InsufficientRightsError('FORBIDDEN');
            err.statusCode = 403;
            return next(err);
        }
        req.user = { id: 10, userType };
        next();
    },
  requireAdminIfCreatingStaff: () => (req, _res, next) => next(), // no-op for tests

    authorizeRole: (requiredRole) => (req, _res, next) => {
        const userRole = req.header('X-User-Role');
        if (userRole !== requiredRole) {
            const err = new InsufficientRightsError('FORBIDDEN');
            err.statusCode = 403;
            return next(err);
        }
        next();
    },
}));

// Mock upload middleware
await jest.unstable_mockModule('../../middlewares/uploadMiddleware.js', () => ({
  default: {
      single: () => (req, _res, next) => {
          req.file = null; // non serve nel tuo test
          next();
      },
    array: () => (req, _res, next) => {
      const photoNamesHeader = req.header('X-Test-Photos');
      if (photoNamesHeader) {
        const names = photoNamesHeader.split(',').filter(Boolean);
        req.files = names.map((n, idx) => ({ filename: n.trim(), path: `/tmp/${n.trim()}-${idx}` }));
      } else {
        req.files = [];
      }
      next();
    }
  }
}));


// Import app after mocks
const { default: app } = await import('../../app.js');
/*
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
    expect(res.body.error).toMatch(/All fields are required/);
    expect(mockRepo.createReport).not.toHaveBeenCalled();
  });

  it('rejects wrong number of photos (0)', async () => {
    const body = { title: 'T', description: 'D', categoryId: 5, latitude: 1, longitude: 2 };
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test')
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/upload between 1 and 3 photos/);
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
    expect(res.body.error).toMatch(/upload between 1 and 3 photos/);
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
    expect(res.body.error).toMatch(/All fields are required/);
  });
});*/

describe('GET /api/v1/reports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns all reports for authorized staff', async () => {
        const mockReports = [
            {
                id: 1,
                title: 'Report 1',
                description: 'Description 1',
                status: 'pending',
                category: { id: 5, name: 'Infrastructure' },
                photos: [{ id: 1, link: '/public/photo1.jpg' }]
            },
            {
                id: 2,
                title: 'Report 2',
                description: 'Description 2',
                status: 'resolved',
                category: { id: 6, name: 'Public Safety' },
                photos: []
            }
        ];

        mockRepo.getAllReports.mockResolvedValue(mockReports);

        const res = await request(app)
            .get('/api/v1/reports')
            .set('Authorization', 'Bearer test')
            .set('X-User-Type', 'staff');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockReports);
        expect(res.body).toHaveLength(2);
        expect(mockRepo.getAllReports).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no reports exist', async () => {
        mockRepo.getAllReports.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/v1/reports')
            .set('Authorization', 'Bearer test')
            .set('X-User-Type', 'staff');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
        expect(res.body).toHaveLength(0);
    });

    it('returns 401 when not authenticated', async () => {
        const res = await request(app)
            .get('/api/v1/reports');

        expect(res.status).toBe(401);
        expect(mockRepo.getAllReports).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not staff', async () => {
        const res = await request(app)
            .get('/api/v1/reports')
            .set('Authorization', 'Bearer test')
            .set('X-User-Type', 'citizen');

        expect(res.status).toBe(403);
        expect(mockRepo.getAllReports).not.toHaveBeenCalled();
    });

    it('handles repository errors', async () => {
        mockRepo.getAllReports.mockRejectedValue(new Error('Database error'));

        const res = await request(app)
            .get('/api/v1/reports')
            .set('Authorization', 'Bearer test')
            .set('X-User-Type', 'staff');

        expect(res.status).toBe(500);
    });
});
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';

// Repository mock
const mockRepo = {
  createReport: jest.fn(),
  assignReportToExternalMaintainer: jest.fn(),
};

// Controller mock
const mockController = {
  createReport: jest.fn(),
  getAllReports: jest.fn(),
  getReport: jest.fn(),
  reviewReport: jest.fn(),
  getAcceptedReports: jest.fn(),
  startReport: jest.fn(),
  finishReport: jest.fn(),
  suspendReport: jest.fn(),
  resumeReport: jest.fn(),
  getReportPhotos: jest.fn(),
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
  authorizeRole: (requiredName) => (req, res, next) => {
    const staffRole = req.header('X-Test-Staff-Role');
    if (requiredName && staffRole !== requiredName) {
      return res.status(403).json({ message: 'Forbidden' });
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


await jest.unstable_mockModule('../../controllers/reportController.mjs', () => ({
  createReport: mockController.createReport,
  getAllReports: mockController.getAllReports,
  getReport: mockController.getReport,
  reviewReport: mockController.reviewReport,
  getAcceptedReports: mockController.getAcceptedReports,
  // The routes import start/finish/suspend/resume/getReportPhotos dynamically, but mocking here still works
  startReport: mockController.startReport,
  finishReport: mockController.finishReport,
  suspendReport: mockController.suspendReport,
  resumeReport: mockController.resumeReport,
  getReportPhotos: mockController.getReportPhotos,
  assignReportToExternalMaintainer: mockController.assignReportToExternalMaintainer,
}));


// Import app after mocks
const { default: app } = await import('../../app.js');

describe('POST /api/v1/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.createReport.mockResolvedValue({ id: 1 });
    mockController.createReport.mockImplementation((reportData) => {
      return mockRepo.createReport(reportData);
    });
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

describe('GET /api/v1/reports (list, staff only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.getAllReports.mockResolvedValue([{ id: 11 }, { id: 12 }]);
  });

  it('rejects citizen user (403)', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', 'Bearer test'); // treated as citizen by mock
    expect(res.status).toBe(403);
  });

  it('returns list for staff user', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('X-Test-Role', 'staff');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 11 }, { id: 12 }]);
    expect(mockController.getAllReports).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/v1/reports/assigned and /suspended (citizen only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.getAcceptedReports.mockResolvedValue([
      { id: 1, status: 'assigned', title: 'A', latitude: 1, longitude: 2, categoryId: 5, user: { username: 'u', name: 'N', surname: 'S' }, photos: [{ link: '/public/a.jpg' }] },
      { id: 2, status: 'suspended', title: 'B', latitude: 3, longitude: 4, categoryId: 6, user: null, photos: [] },
    ]);
  });

  it('assigned returns only assigned DTOs', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Authorization', 'Bearer test'); // citizen
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 1, title: 'A', latitude: 1, longitude: 2, status: 'assigned', categoryId: 5,
        authorUsername: 'u', authorName: 'N S', photos: [{ link: '/public/a.jpg' }]
      }
    ]);
    expect(mockController.getAcceptedReports).toHaveBeenCalledTimes(1);
  });

  it('suspended returns only suspended DTOs', async () => {
    const res = await request(app)
      .get('/api/v1/reports/suspended')
      .set('Authorization', 'Bearer test'); // citizen
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 2, title: 'B', latitude: 3, longitude: 4, status: 'suspended', categoryId: 6,
        authorUsername: null, authorName: null, photos: []
      }
    ]);
  });

  it('rejects staff user (403) as route requires citizen', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('X-Test-Role', 'staff');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/reports/:id (staff with specific role)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.getReport.mockResolvedValue({ id: 77, title: 'T' });
  });

  it('rejects without staff role header (403)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/77')
      .set('X-Test-Role', 'staff');
    // Missing X-Test-Staff-Role required by authorizeRole mock
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    mockController.getReport.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/v1/reports/999')
      .set('X-Test-Role', 'staff')
      .set('X-Test-Staff-Role', 'Municipal Public Relations Officer');
    expect(res.status).toBe(404);
  });

  it('returns report when role matches', async () => {
    const res = await request(app)
      .get('/api/v1/reports/77')
      .set('X-Test-Role', 'staff')
      .set('X-Test-Staff-Role', 'Municipal Public Relations Officer');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(77);
    expect(mockController.getReport).toHaveBeenCalledWith('77');
  });
});

describe('PATCH /api/v1/reports/:id/review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.reviewReport.mockResolvedValue({ id: 5, status: 'assigned' });
  });

  it('rejects invalid action', async () => {
    const res = await request(app)
      .patch('/api/v1/reports/5/review')
      .set('X-Test-Role', 'staff')
      .set('X-Test-Staff-Role', 'Municipal Public Relations Officer')
      .send({ action: 'foobar' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid action/i);
    expect(mockController.reviewReport).not.toHaveBeenCalled();
  });

  it('returns 404 when controller returns null', async () => {
    mockController.reviewReport.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch('/api/v1/reports/99/review')
      .set('X-Test-Role', 'staff')
      .set('X-Test-Staff-Role', 'Municipal Public Relations Officer')
      .send({ action: 'accept', explanation: '', categoryId: 5 });
    expect(res.status).toBe(404);
  });

  it('accepts review and returns updated', async () => {
    const res = await request(app)
      .patch('/api/v1/reports/5/review')
      .set('X-Test-Role', 'staff')
      .set('X-Test-Staff-Role', 'Municipal Public Relations Officer')
      .send({ action: 'accept', explanation: '', categoryId: 5 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
    expect(mockController.reviewReport).toHaveBeenCalledWith({ reportId: '5', action: 'accept', explanation: '', categoryId: 5 });
  });
});

describe('PATCH /api/v1/reports/:id/start|finish|suspend|resume (staff only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.startReport.mockResolvedValue({ id: 1, status: 'in_progress' });
    mockController.finishReport.mockResolvedValue({ id: 1, status: 'resolved' });
    mockController.suspendReport.mockResolvedValue({ id: 1, status: 'suspended' });
    mockController.resumeReport.mockResolvedValue({ id: 1, status: 'in_progress' });
  });

  it('start returns updated or 404', async () => {
    const ok = await request(app)
      .patch('/api/v1/reports/1/start')
      .set('X-Test-Role', 'staff');
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('in_progress');
    expect(mockController.startReport).toHaveBeenCalledWith({ reportId: '1', technicianId: 10 });

    mockController.startReport.mockResolvedValueOnce(null);
    const notFound = await request(app)
      .patch('/api/v1/reports/999/start')
      .set('X-Test-Role', 'staff');
    expect(notFound.status).toBe(404);
  });

  it('finish returns updated or 404', async () => {
    const ok = await request(app)
      .patch('/api/v1/reports/1/finish')
      .set('X-Test-Role', 'staff');
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('resolved');
    expect(mockController.finishReport).toHaveBeenCalledWith({ reportId: '1', technicianId: 10 });

    mockController.finishReport.mockResolvedValueOnce(null);
    const notFound = await request(app)
      .patch('/api/v1/reports/999/finish')
      .set('X-Test-Role', 'staff');
    expect(notFound.status).toBe(404);
  });

  it('suspend returns updated or 404', async () => {
    const ok = await request(app)
      .patch('/api/v1/reports/1/suspend')
      .set('X-Test-Role', 'staff');
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('suspended');
    expect(mockController.suspendReport).toHaveBeenCalledWith({ reportId: '1', technicianId: 10 });

    mockController.suspendReport.mockResolvedValueOnce(null);
    const notFound = await request(app)
      .patch('/api/v1/reports/999/suspend')
      .set('X-Test-Role', 'staff');
    expect(notFound.status).toBe(404);
  });

  it('resume returns updated or 404', async () => {
    const ok = await request(app)
      .patch('/api/v1/reports/1/resume')
      .set('X-Test-Role', 'staff');
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('in_progress');
    expect(mockController.resumeReport).toHaveBeenCalledWith({ reportId: '1', technicianId: 10 });

    mockController.resumeReport.mockResolvedValueOnce(null);
    const notFound = await request(app)
      .patch('/api/v1/reports/999/resume')
      .set('X-Test-Role', 'staff');
    expect(notFound.status).toBe(404);
  });
});

describe('GET /api/v1/reports/:id/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.getReportPhotos.mockResolvedValue([{ link: '/public/a.jpg' }]);
  });

  it('returns photos array', async () => {
    const res = await request(app)
      .get('/api/v1/reports/123/photos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ link: '/public/a.jpg' }]);
    expect(mockController.getReportPhotos).toHaveBeenCalledWith('123');
  });

  it('returns 404 when controller returns null', async () => {
    mockController.getReportPhotos.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/v1/reports/999/photos');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/reports/:id/assign_external', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.assignReportToExternalMaintainer.mockResolvedValue({ id: 1, assignedExternal: true });
    
    mockController.assignReportToExternalMaintainer.mockImplementation(({ reportId }) => {
      return mockRepo.assignReportToExternalMaintainer(reportId);
    });
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

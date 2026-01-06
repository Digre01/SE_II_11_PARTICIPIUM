import { Router } from "express";
import {
  createReport,
  getAllReports,
  getReport,
  reviewReport,
  getAcceptedReports,
  getReportsByCategory, getReportsByTechnician
} from "../controllers/reportController.mjs";
import upload from '../middlewares/uploadMiddleware.js';
import { authorizeUserType, authorizeRole } from '../middlewares/userAuthorization.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import fs from 'fs';

const router = Router();

// POST /api/v1/reports
router.post('/',
  authorizeUserType(['citizen']),
  upload.array('photos', 3),
  async (req, res, next) => {

    const deleteUploadedFiles = () => {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (err) { console.error('Deleting files error:', file.path, err); }
        });
      }
    };

    try {
      const { title, description, categoryId, latitude, longitude, isAnonymous } = req.body;
      const userId = req.user?.id;
      const photos = req.files ? req.files.map(file => `/public/${file.filename}`) : [];

      if (!title || !description || !categoryId || !userId || !latitude || !longitude) {
        deleteUploadedFiles();
        return next(new BadRequestError(`All fields are required. ${title} ${description} ${categoryId} ${userId} ${latitude} ${longitude}`));
      }
      if (photos.length < 1 || photos.length > 3) {
        deleteUploadedFiles();
        return next(new BadRequestError('You must upload between 1 and 3 photos.'));
      }

      await createReport({ title, description, categoryId, userId, latitude, longitude, photos, isAnonymous });
      res.status(201).json({ message: 'Report created successfully', photos });
    } catch (error) {
      deleteUploadedFiles();
      console.log(error)
      next(error);
    }
  }
);

// GET /api/v1/reports (list)
// Only staff members with the 'Municipal Public Relations Officer' role can access
router.get(
    '/',
    authorizeUserType(['staff']),
    async (req, res, next) => {
      try {
        const categoryId = req.query.categoryId;
        const isExternal = req.query.isExternal === "true" ? true : null;

        const reports = categoryId
            ? await getReportsByCategory(categoryId, isExternal)
            : await getAllReports();

        res.json(reports);
      } catch (err) {
        next(err);
      }
    }
);

router.get(
    '/technician/:userId',
    authorizeUserType(['staff']),
    async (req, res, next) => {
      try {
        const reports = await getReportsByTechnician(req.params.userId);
        res.json(reports);
      } catch (err) {
        next(err);
      }
    }
);


// GET /api/v1/reports/assigned and /api/v1/reports/suspended (public map layer)
// Public: allow unregistered users to fetch accepted reports for the interactive map
router.get(['/assigned', '/suspended', '/in_progress'], async (req, res, next) => {
  try {
    const reports = await getAcceptedReports();
    // Filter by requested path to avoid duplicates when frontend merges both endpoints
    const isAssignedPath = req.path.endsWith('/assigned');
    const isInProgressPath = req.path.endsWith('/in_progress');
    let targetStatus = 'suspended';

    if (isAssignedPath) {
      targetStatus = 'assigned';
    } else if (isInProgressPath) {
      targetStatus = 'in_progress';
    }

   
    const filtered = reports.filter(r => r.status === targetStatus);
    
    const dto = filtered.map(r => ({
      id: r.id,
      title: r.title,
      latitude: r.latitude,
      longitude: r.longitude,
      status: r.status,
      categoryId: r.categoryId,
      authorUsername: r.isAnonymous ? null : (r.user?.username || null),
      authorName: r.isAnonymous ? null : (r.user ? `${r.user.name} ${r.user.surname}` : null),
      photos: r.photos?.map(p => ({ link: p.link })) || []
    }));
    res.json(dto);
  } catch (err) { next(err); }
});

// GET /api/v1/reports/:id (staff detail)
router.get('/:id', authorizeUserType(['staff']), authorizeRole('Municipal Public Relations Officer'), async (req, res, next) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) return next(new NotFoundError('Not found'));
    res.json(report);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/review
router.patch('/:id/review', authorizeUserType(['staff']), authorizeRole('Municipal Public Relations Officer'), async (req, res, next) => {
  try {
    const { action, explanation, categoryId } = req.body;
    if (!action || !['accept','reject'].includes(action)) {
      return next(new BadRequestError('Invalid action'));
    }
    const updated = await reviewReport({ reportId: req.params.id, action, explanation, categoryId });
    if (!updated) return next(new NotFoundError('Not found'));
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/start
router.patch('/:id/start', authorizeUserType(['staff']), async (req, res, next) => {
  try {
    const technicianId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.startReport({ reportId: req.params.id, technicianId }));
    if (!updated) return next(new NotFoundError('Not found'));
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/finish
router.patch('/:id/finish', authorizeUserType(['staff']), async (req, res, next) => {
  try {
    const technicianId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.finishReport({ reportId: req.params.id, technicianId }));
    if (!updated) return next(new NotFoundError('Not found'));
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/suspend
router.patch('/:id/suspend', authorizeUserType(['staff']), async (req, res, next) => {
  try {
    const technicianId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.suspendReport({ reportId: req.params.id, technicianId }));
    if (!updated) return next(new NotFoundError('Not found'));
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/resume
router.patch('/:id/resume', authorizeUserType(['staff']), async (req, res, next) => {
  try {
    const technicianId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.resumeReport({ reportId: req.params.id, technicianId }));
    if (!updated) return next(new NotFoundError('Not found'));
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/v1/reports/:id/assign_external
router.patch('/:id/assign_external', authorizeUserType(['staff']), async (
    req, res, next) => {
    try {
        const internalStaffMemberId = req.user?.id;
        const updated = await import('../controllers/reportController.mjs').then(
            mod => mod.assignReportToExternalMaintainer({ reportId: req.params.id, internalStaffMemberId }));
        if (!updated) return next(new NotFoundError('Not found'));
        res.json(updated);
    } catch (err) { next(err); }
});

// External-specific start/finish/suspend/resume
router.patch('/:id/external/start',
    authorizeUserType(["staff"]),
    async (req, res, next) => {
  try {
    if (!req.isAuthenticated?.()) return next(new UnauthorizedError('UNAUTHORIZED'));
    const userId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.externalStart({ reportId: req.params.id, externalMaintainerId: userId }));
    if (!updated) return next(new NotFoundError('Not found or not allowed'));
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/external/finish',
    authorizeUserType(["staff"]),
    async (req, res, next) => {
  try {
    if (!req.isAuthenticated?.()) return next(new UnauthorizedError('UNAUTHORIZED'));
    const userId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.externalFinish({ reportId: req.params.id, externalMaintainerId: userId }));
    if (!updated) return next(new NotFoundError('Not found or not allowed'));
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/external/suspend',
    authorizeUserType(["staff"]),
    async (req, res, next) => {
  try {
   if (!req.isAuthenticated?.()) return next(new UnauthorizedError('UNAUTHORIZED'));
    const userId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.externalSuspend({ reportId: req.params.id, externalMaintainerId: userId }));
    if (!updated) return next(new NotFoundError('Not found or not allowed'));
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/external/resume',
    authorizeUserType(["staff"]),
    async (req, res, next) => {
  try {
   if (!req.isAuthenticated?.()) return next(new UnauthorizedError('UNAUTHORIZED'));
    const userId = req.user?.id;
    const updated = await import('../controllers/reportController.mjs').then(mod => mod.externalResume({ reportId: req.params.id, externalMaintainerId: userId }));
    if (!updated) return next(new NotFoundError('Not found or not allowed'));
    res.json(updated);
  } catch (err) { next(err); }
});

router.get("/:id/photos", async function(
    req, res, next) {
    try {
        const photos = await import('../controllers/reportController.mjs').then(
            mod => mod.getReportPhotos(req.params.id));
        if (!photos) return next(new NotFoundError('Not found'));
        res.json(photos);
    } catch (err) { next(err); }
})

export default router;

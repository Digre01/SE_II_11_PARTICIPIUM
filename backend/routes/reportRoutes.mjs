import { Router } from "express";
import { createReport, getAllReports, getReport, reviewReport, getAcceptedReports } from "../controllers/reportController.mjs";
import upload from '../middlewares/uploadMiddleware.js';
import { authorizeUserType, authorizeRole } from '../middlewares/userAuthorization.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
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
      const { title, description, categoryId, latitude, longitude } = req.body;
      const userId = req.user?.id;
      const photos = req.files ? req.files.map(file => `/public/${file.filename}`) : [];

      if (!title || !description || !categoryId || !userId || !latitude || !longitude) {
        deleteUploadedFiles();
        return next(new BadRequestError('All fields are required.'));
      }
      if (photos.length < 1 || photos.length > 3) {
        deleteUploadedFiles();
        return next(new BadRequestError('You must upload between 1 and 3 photos.'));
      }

      await createReport({ title, description, categoryId, userId, latitude, longitude, photos });
      res.status(201).json({ message: 'Report created successfully', photos });
    } catch (error) {
      deleteUploadedFiles();
      next(error);
    }
  }
);

// GET /api/v1/reports (list)
// Only staff members with the 'Municipal Public Relations Officer' role can access
router.get('/', authorizeUserType(['staff']), async (req, res, next) => {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (err) { next(err); }
});

// GET /api/v1/reports/assigned and /api/v1/reports/suspended (public map layer)
router.get(['/assigned', '/suspended'], authorizeUserType(['citizen']), async (req, res, next) => {
  try {
    const reports = await getAcceptedReports();
    // Filter by requested path to avoid duplicates when frontend merges both endpoints
    const isAssignedPath = req.path.endsWith('/assigned');
    const filtered = reports.filter(r => isAssignedPath ? r.status === 'assigned' : r.status === 'suspended');
    const dto = filtered.map(r => ({
      id: r.id,
      title: r.title,
      latitude: r.latitude,
      longitude: r.longitude,
      status: r.status,
      categoryId: r.categoryId,
      authorUsername: r.user?.username || null,
      authorName: r.user ? `${r.user.name} ${r.user.surname}` : null,
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
        const updated = await import('../controllers/reportController.mjs').then(
            mod => mod.assignReportToExternalMaintainer({ reportId: req.params.id}));
        if (!updated) return next(new NotFoundError('Not found'));
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

import { Router } from "express";
import { createReport, getAllReports, getReport, reviewReport } from "../controllers/reportController.mjs";
import upload from '../middlewares/uploadMiddleware.js';
import { authorizeUserType, authorizeRole } from '../middlewares/userAuthorization.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import fs from 'fs';

const router = Router();

// GET /api/v1/reports
router.get('/', async (req, res, next) => {
  try {
    const reports = await getAllReports();
    // DTO semplice
    const dto = reports.map(r => ({
      id: r.id,
      title: r.title,
      latitude: r.latitude,
      longitude: r.longitude,
      status: r.status,
      categoryId: r.categoryId,
      photo: r.photos?.[0]?.link || null
    }));
    res.status(200).json(dto);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/reports
router.post('/',
  authorizeUserType(['citizen']),
  upload.array('photos', 3),
  async (req, res, next) => {

  // Function to delete uploaded files in case of error
  const deleteUploadedFiles = () => {
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          // log error but don't stop
          console.error('Deleting files error:', file.path, err);
        }
      });
    }
  };

  try {
    const { title, description, categoryId, latitude, longitude } = req.body;
    const userId = req.user?.id;
    const photos = req.files ? req.files.map(file => `/public/${file.filename}`) : [];

    // Validation
    if (!title || !description || !categoryId || !userId || !latitude || !longitude) {
      deleteUploadedFiles();
      return next(new BadRequestError('All fields are required.'));
    }
    if (photos.length < 1 || photos.length > 3) {
      deleteUploadedFiles();
      return next(new BadRequestError('You must upload between 1 and 3 photos.'));
    }

    const report = await createReport({ title, description, categoryId, userId, latitude, longitude, photos });

    res.status(201).json({ message: 'Report created successfully', photos });
  } catch (error) {
    deleteUploadedFiles();
    next(error);
  }
});

// GET /api/v1/reports (list)
// Only staff members with the 'Municipal Public Relations Officer' role can access
router.get('/', authorizeUserType(['staff']), authorizeRole('Municipal Public Relations Officer'), async (req, res, next) => {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (err) { next(err); }
});

// GET /api/v1/reports/:id
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

export default router;

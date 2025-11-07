// backend/routes/categoryRoutes.mjs
import { Router } from "express";
import { getAllCategories } from "../controllers/categoryController.mjs";

const router = Router();

// GET /api/v1/categories
router.get('/', getAllCategories);

export default router;

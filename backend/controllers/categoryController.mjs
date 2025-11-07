// backend/controllers/categoryController.mjs
import { categoryRepository } from "../repositories/categoryRepository.mjs";

export async function getAllCategories(req, res, next) {
  try {
    const categories = await categoryRepository.getAllCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

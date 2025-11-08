// backend/repositories/categoryRepository.mjs
import { AppDataSourcePostgres } from "../config/data-source.js";
import { Categories } from "../entities/Categories.js";

export class CategoryRepository {
  get repo() {
    return AppDataSourcePostgres.getRepository(Categories);
  }

  async getAllCategories() {
    return await this.repo.find();
  }
}

export const categoryRepository = new CategoryRepository();

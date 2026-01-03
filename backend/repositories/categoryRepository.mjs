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

  async findCategoriesByOfficeId(officeId, isExternal) {
    if (isExternal) {
      return await this.repo.findOneBy({ externalOfficeId: officeId })
    } else {
      return await this.repo.findOneBy({ officeId });
    }
  }
}

export const categoryRepository = new CategoryRepository();

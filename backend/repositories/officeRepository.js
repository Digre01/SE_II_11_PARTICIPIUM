import {AppDataSourcePostgres} from "../config/data-source.js";
import {Office} from "../entities/Offices.js";

class OfficeRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Office);
    }

    async findAll() {
        return await this.repo.find();
    }

    async findById(id) {
        return await this.repo.findOneBy({ id });
    }
}

export const officeRepository = new OfficeRepository();

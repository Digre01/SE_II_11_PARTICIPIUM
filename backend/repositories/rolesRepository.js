import {AppDataSourcePostgres} from "../config/data-source.js";
import {Roles} from "../entities/Roles.js";

class RolesRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Roles);
    }

    async findAll() {
        return await this.repo.find();
    }

    async findById(id) {
        return await this.repo.findOneBy({ id });
    }
}

export const rolesRepository = new RolesRepository();

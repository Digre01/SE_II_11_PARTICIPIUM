import {AppDataSourcePostgres} from "../config/data-source.js";
import {UserOffice} from "../entities/UserOffice.js";

class UserOfficeRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(UserOffice);
    }

    async getUserOfficeByUserId(userId) {
        return this.repo.findOneBy({ userId });
    }
}

export const userOfficeRepository = new UserOfficeRepository();
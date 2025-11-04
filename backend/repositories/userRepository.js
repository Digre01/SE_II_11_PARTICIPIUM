import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserByUsernameAndPassword(username, password) {
        return await this.repo.findOneBy({ where: { username, password } });
    }

    async createUser(username, email, name, surname, hashedPassword, salt, userType){
        await this.repo.findOneByOrFail({ where: { username, email } });
        return await this.repo.create({username, email, name, surname, hashedPassword, salt, userType});
    }
}

export const userRepository = new UserRepository();
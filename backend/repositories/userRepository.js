import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserByUsername(username) {
        return await this.repo.findOneBy({ username });
    }

    async createUser(username, email, name, surname, password, salt, userType){

        const existing = await this.repo.findOneBy({ email } );

        if(existing) {
            throw new Error(`EXISTING EMAIL`);
        }

        return await this.repo.save({username, email, name, surname, password, salt, userType});
    }
}

export const userRepository = new UserRepository();
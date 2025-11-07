import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import {ConflictError} from "../errors/ConflictError.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserByUsername(username) {
        return await this.repo.findOneBy({username});
    }

    async createUser(username, email, name, surname, password, salt, userType){

        const existing_username = await this.repo.findOneBy({ username } );
        if(existing_username) {
            throw new ConflictError(`User with username ${username} already exists`);
        }

        const existing_email = await this.repo.findOneBy({ email } );
        if(existing_email) {
            throw new ConflictError(`User with email ${email} already exists`);
        }

        return await this.repo.save({username, email, name, surname, password, salt, userType});
    }
}

export const userRepository = new UserRepository();
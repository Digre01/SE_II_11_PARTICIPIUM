import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import crypto from "crypto";
import userService from "../services/userService.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserByUsernameAndPassword(username, password) {
        const user = await this.repo.findOneBy({ username });
        if(!user) return null;

        const hashedPassword = await userService.hashPassword(password, user.salt);  //calcolo hash sulla password inserita
        const bufferedHashPassword = Buffer.from(hashedPassword, 'hex');
        const storedHash = Buffer.from(user.password, 'hex');   //hash salvato
        const match = crypto.timingSafeEqual(storedHash, bufferedHashPassword);
        if (!match) return null;

        return user;
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
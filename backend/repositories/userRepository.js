import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import {UserOffice} from "../entities/UserOffice.js";
import {Roles} from "../entities/Roles.js";
import {NotFoundError} from "../errors/NotFoundError.js";
import {ConflictError} from "../errors/ConflictError.js";
import { InsufficientRightsError } from "../errors/InsufficientRightsError.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserById(id) {
        return await this.repo.findOneBy({ id } );
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

    async assignRoleToUser(userId, roleId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if(!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        // Only users of type STAFF (accounts created by admin) can be assigned roles
        // Normalize case to be defensive against different casing in DB
        const userType = String(user.userType || '').toUpperCase();
        if (userType !== 'STAFF') {
            throw new InsufficientRightsError('Only staff accounts can be assigned a role');
        }

        const roleRepo = AppDataSourcePostgres.getRepository(Roles);
        const role = await roleRepo.findOneBy({ id: Number(roleId) });
        if(!role) {
            throw new NotFoundError(`Role with id '${roleId}' not found`);
        }

        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
        let userOffice = await userOfficeRepo.findOneBy({ userId: Number(userId) });
        if (userOffice) {
            userOffice.roleId = Number(roleId);
            await userOfficeRepo.save(userOffice);
        } else {
            // create a new UserOffice mapping with role
            userOffice = userOfficeRepo.create({ userId: Number(userId), officeId: null, roleId: Number(roleId) });
            await userOfficeRepo.save(userOffice);
        }

        // return the user with its userOffice relation
        return await userRepo.findOne({ where: { id: Number(userId) }, relations: ['userOffice'] });
    }
}

export const userRepository = new UserRepository();
import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import {UserOffice} from "../entities/UserOffice.js";
import {Roles} from "../entities/Roles.js";
import {NotFoundError} from "../errors/NotFoundError.js";
import {Office} from "../entities/Offices.js";
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

    async getAvailableStaffForRoleAssignment() {
        // return users with userType = 'STAFF' that do not have a UserOffice row
        const repo = AppDataSourcePostgres.getRepository(Users);
        // left join userOffice and filter where userOffice is null
        const qb = repo.createQueryBuilder('user')
            .leftJoinAndSelect('user.userOffice', 'userOffice')
            .where("UPPER(user.userType) = :staff", { staff: 'STAFF' })
            .andWhere('userOffice.userId IS NULL');

        return await qb.getMany();
    }


    async assignRoleToUser(userId, roleId, officeId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if(!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        // Validate officeId exists (office must be linked)
        if (officeId === undefined || officeId === null) {
            throw new NotFoundError(`officeId is required`);
        }
        const officeRepo = AppDataSourcePostgres.getRepository(Office);
        const office = await officeRepo.findOneBy({ id: Number(officeId) });
        if (!office) {
            throw new NotFoundError(`Office with id '${officeId}' not found`);
        }

        // Only users of type STAFF can be assigned roles
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
            userOffice.officeId = Number(officeId);
            await userOfficeRepo.save(userOffice);
        } else {
            // create a new UserOffice mapping with role and office
            userOffice = userOfficeRepo.create({ userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) });
            await userOfficeRepo.save(userOffice);
        }

        return await userOfficeRepo.findOne({ where: { userId: Number(userId) }, relations: ['role', 'office'] });
    }
}

export const userRepository = new UserRepository();
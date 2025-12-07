import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import {UserOffice} from "../entities/UserOffice.js";
import {Roles} from "../entities/Roles.js";
import {NotFoundError} from "../errors/NotFoundError.js";
import {Office} from "../entities/Offices.js";
import {ConflictError} from "../errors/ConflictError.js";
import { InsufficientRightsError } from "../errors/InsufficientRightsError.js";
import { Photos } from "../entities/Photos.js";

class UserRepository {
    get repo() {
        return AppDataSourcePostgres.getRepository(Users);
    }

    async getUserById(id) {
        return await this.repo.findOne({ where: { id }, relations: ['userOffice', 'userOffice.role'] } );
    }

    async getUserByUsername(username) {
        return await this.repo.findOne({ where: { username }, relations: ['userOffice', 'userOffice.role'] });
    }

    async getUserByEmail(email) {
        return await this.repo.findOne({ where: { email } });
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

    async getUserRoles(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOne({ where: { id: Number(userId) }, relations: ['userOffice', 'userOffice.role', 'userOffice.office'] });
        if (!userId) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        return user.userOffice.map(uo => ({
            role: uo.role,
            office: uo.office
        }));
    }

    async addUserRole(userId, roleId, isExternal) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        // Only users of type STAFF possono essere assegnati
        const userType = String(user.userType || '').toUpperCase();
        if (userType !== 'STAFF') {
            throw new InsufficientRightsError('Only staff accounts can be assigned a role');
        }
        // Prendi il ruolo e l'ufficio corretto
        const roleRepo = AppDataSourcePostgres.getRepository(Roles);
        const role = await roleRepo.findOneBy({ id: Number(roleId) });
        if (!role) {
            throw new NotFoundError(`Role with id '${roleId}' not found`);
        }
        let officeId;
        if (isExternal) {
            officeId = role.officeIdExternal;
        } else {
            officeId = role.officeId;
        }
        if (!officeId) {
            throw new NotFoundError(`Role with id '${roleId}' does not have an associated office for ${isExternal ? 'external' : 'internal'} assignment`);
        }
        //add the new role
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
        const userOffice = userOfficeRepo.create({ userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) });
        await userOfficeRepo.save(userOffice);
        return await userOfficeRepo.findOne({ where: { userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) }, relations: ['role', 'office'] });
    }

    // Add multiple roles to a staff user in one call (idempotent)
    async addUserRoles(userId, roleIds, isExternal) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        const userType = String(user.userType || '').toUpperCase();
        if (userType !== 'STAFF') {
            throw new InsufficientRightsError('Only staff accounts can be assigned roles');
        }

        if (!Array.isArray(roleIds) || roleIds.length === 0) {
            throw new BadRequestError('roleIds must be a non-empty array');
        }

        const roleRepo = AppDataSourcePostgres.getRepository(Roles);
        const officeRepo = AppDataSourcePostgres.getRepository(Office);
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);

        const results = [];
        for (const rid of roleIds) {
            const role = await roleRepo.findOneBy({ id: Number(rid) });
            if (!role) {
                throw new NotFoundError(`Role with id '${rid}' not found`);
            }
            const officeId = isExternal ? role.officeIdExternal : role.officeId;
            if (!officeId) {
                throw new NotFoundError(`Role with id '${rid}' does not have an associated office for ${isExternal ? 'external' : 'internal'} assignment`);
            }
            const office = await officeRepo.findOneBy({ id: Number(officeId) });
            if (!office) {
                throw new NotFoundError(`Office with id '${officeId}' not found`);
            }
            const existing = await userOfficeRepo.findOneBy({ userId: Number(userId), officeId: Number(officeId), roleId: Number(rid) });
            if (!existing) {
                const created = userOfficeRepo.create({ userId: Number(userId), officeId: Number(officeId), roleId: Number(rid) });
                await userOfficeRepo.save(created);
            }
            const saved = await userOfficeRepo.findOne({ where: { userId: Number(userId), officeId: Number(officeId), roleId: Number(rid) }, relations: ['role', 'office'] });
            results.push(saved);
        }

        return results;
    }


    async assignRoleToUser(userId, roleId, isExternal) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        // Only users of type STAFF possono essere assegnati
        const userType = String(user.userType || '').toUpperCase();
        if (userType !== 'STAFF') {
            throw new InsufficientRightsError('Only staff accounts can be assigned a role');
        }

        // Prendi il ruolo e l'ufficio corretto
        const roleRepo = AppDataSourcePostgres.getRepository(Roles);
        const role = await roleRepo.findOneBy({ id: Number(roleId) });
        if (!role) {
            throw new NotFoundError(`Role with id '${roleId}' not found`);
        }
        let officeId;
        if (isExternal) {
            officeId = role.officeIdExternal;
        } else {
            officeId = role.officeId;
        }
        if (!officeId) {
            throw new NotFoundError(`Role with id '${roleId}' does not have an associated office for ${isExternal ? 'external' : 'internal'} assignment`);
        }

        // Validate office exists
        const officeRepo = AppDataSourcePostgres.getRepository(Office);
        const office = await officeRepo.findOneBy({ id: officeId });
        if (!office) {
            throw new NotFoundError(`Office with id '${officeId}' not found`);
        }

        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
        // With composite PK (userId + officeId + roleId)
        let userOffice = await userOfficeRepo.findOneBy({ userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) });
        if (userOffice) {
            // update role if changed (in realtà la tripletta è unica)
            await userOfficeRepo.save(userOffice);
        } else {
            // create a new UserOffice mapping with role and office
            userOffice = userOfficeRepo.create({ userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) });
            await userOfficeRepo.save(userOffice);
        }

        return await userOfficeRepo.findOne({ where: { userId: Number(userId), officeId: Number(officeId), roleId: Number(roleId) }, relations: ['role', 'office'] });
    }

    // Update user info for telegram, email notifications and profile photo URL
    async configUserAccount(userId, telegramId, emailNotifications, photoUrl){
        const userRepo = AppDataSourcePostgres.getRepository(Users);

        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        if (telegramId !== undefined) {
            user.telegramId = telegramId || null;
        }
        if (emailNotifications !== undefined) {
            user.emailNotifications = Boolean(emailNotifications);
        }
        if (photoUrl) {
            // Create a Photos record and link it to the user (Users.photoId -> Photos.id)
            const photoRepo = AppDataSourcePostgres.getRepository(Photos);
            const photo = photoRepo.create({ link: photoUrl });
            const saved = await photoRepo.save(photo);
            user.photoId = saved.id;
        }

        await userRepo.save(user);
        return user;
    }

    //Get PFP of the user
    async getPfpUrl(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);

        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        const photoRepo = AppDataSourcePostgres.getRepository(Photos);
        if (!user.photoId) {
            throw new NotFoundError(`'${userId}' profile picture not found`);
        }
        const photo = await photoRepo.findOneBy({ id: Number(user.photoId) });
        
        if(!photo){
             throw new NotFoundError(`'${userId}' profile picture not found`);
        }
        return photo.link;
        
    }
}

export const userRepository = new UserRepository();
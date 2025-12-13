import {AppDataSourcePostgres} from "../config/data-source.js";
import {Users} from "../entities/Users.js";
import {UserOffice} from "../entities/UserOffice.js";
import {Roles} from "../entities/Roles.js";
import {NotFoundError} from "../errors/NotFoundError.js";
import {Office} from "../entities/Offices.js";
import {ConflictError} from "../errors/ConflictError.js";
import { InsufficientRightsError } from "../errors/InsufficientRightsError.js";
import { Photos } from "../entities/Photos.js";
import { BadRequestError } from "../errors/BadRequestError.js";

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
        return await this.repo.findOne({ where: { email }, relations: ['userOffice', 'userOffice.role'] });
    }

    async createUser(username, email, name, surname, password, salt, userType, isVerified, verificationCode, verificationCodeExpires){

        const existing_username = await this.repo.findOneBy({ username } );
        if(existing_username) {
            throw new ConflictError(`User with username ${username} already exists`);
        }

        const existing_email = await this.repo.findOneBy({ email } );
        if(existing_email) {
            throw new ConflictError(`User with email ${email} already exists`);
        }

        return await this.repo.save({username, email, name, surname, password, salt, userType, isVerified, verificationCode, verificationCodeExpires});
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

    async getAssignedStaffForRoleModification() {
        // return users with userType = 'STAFF' that HAVE at least one UserOffice row
        const repo = AppDataSourcePostgres.getRepository(Users);
        const qb = repo.createQueryBuilder('user')
            .leftJoinAndSelect('user.userOffice', 'userOffice')
            .where("UPPER(user.userType) = :staff", { staff: 'STAFF' })
            .andWhere('userOffice.userId IS NOT NULL');
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


    // Set final roles for a staff user: synchronize add/remove in a single transaction
    // roles: Array<{ roleId: number, isExternal?: boolean }>
    async setUserRoles(userId, roles) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        const userType = String(user.userType || '').toUpperCase();
        if (userType !== 'STAFF') {
            throw new InsufficientRightsError('Only staff accounts can be assigned roles');
        }

        if (!Array.isArray(roles)) {
            throw new BadRequestError('roles must be an array of { roleId, isExternal? }');
        }

        const roleRepo = AppDataSourcePostgres.getRepository(Roles);
        const officeRepo = AppDataSourcePostgres.getRepository(Office);
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);

        // Build desired set of triples (userId, officeId, roleId)
        const desiredTriples = [];
        for (const entry of roles) {
            const roleId = Number(entry?.roleId ?? entry); // allow number-only entries
            if (!roleId) continue;
            const role = await roleRepo.findOneBy({ id: roleId });
            if (!role) {
                throw new NotFoundError(`Role with id '${roleId}' not found`);
            }
            const officeId = (entry?.isExternal ? role.officeIdExternal : role.officeId);
            if (!officeId) {
                throw new NotFoundError(`Role with id '${roleId}' does not have an associated office for ${entry?.isExternal ? 'external' : 'internal'} assignment`);
            }
            const office = await officeRepo.findOneBy({ id: Number(officeId) });
            if (!office) {
                throw new NotFoundError(`Office with id '${officeId}' not found`);
            }
            desiredTriples.push({ userId: Number(userId), officeId: Number(officeId), roleId });
        }

        // Read current assignments
        const current = await userOfficeRepo.find({ where: { userId: Number(userId) } });
        const currentKey = new Set(current.map(uo => `${uo.userId}:${uo.officeId}:${uo.roleId}`));
        const desiredKey = new Set(desiredTriples.map(t => `${t.userId}:${t.officeId}:${t.roleId}`));

        // Compute diff
        const toAdd = desiredTriples.filter(t => !currentKey.has(`${t.userId}:${t.officeId}:${t.roleId}`));
        const toRemove = current.filter(uo => !desiredKey.has(`${uo.userId}:${uo.officeId}:${uo.roleId}`));

        // Apply changes
        if (toRemove.length > 0) {
            for (const uo of toRemove) {
                await userOfficeRepo.delete({ userId: uo.userId, officeId: uo.officeId, roleId: uo.roleId });
            }
        }
        if (toAdd.length > 0) {
            for (const t of toAdd) {
                const created = userOfficeRepo.create(t);
                await userOfficeRepo.save(created);
            }
        }

        // Return updated assignments with relations
        return await userOfficeRepo.find({ where: { userId: Number(userId) }, relations: ['role', 'office'] });
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
            const value = telegramId || null;
            if (value) {
                const existing = await userRepo.findOne({ where: { telegramId: String(value) } });
                if (existing && existing.id !== user.id) {
                    throw new ConflictError('Telegram ID already in use');
                }
            }
            user.telegramId = value;
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

    // Request a telegram verification code for the authenticated user
    async requestTelegramVerificationCode(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) throw new NotFoundError(`User with id '${userId}' not found`);

        const username = user.telegramId;
        if (!username) throw new BadRequestError('TelegramId is required');

        const existing = await userRepo.findOne({ where: { telegramId: username } });
        if (existing && existing.id !== user.id) {
            throw new ConflictError('Telegram username already linked to another account');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.telegramVerificationCode = code;
        user.telegramVerificationExpires = expiresAt;
        await userRepo.save(user);

        return { code, expiresAt };
    }

    async verifyTelegramCode(senderUsername, code) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const username = String(senderUsername || '').trim();
        const codeStr = String(code || '').trim();
        if (!username || !codeStr) throw new BadRequestError('username and code are required');

        const user = await userRepo.findOne({ where: { telegramVerificationCode: codeStr, telegramId: username } });
        if (!user) throw new NotFoundError('Verification not found');

        if (user.telegramVerificationExpires && new Date(user.telegramVerificationExpires).getTime() < Date.now()) {
            user.telegramVerificationCode = null;
            user.telegramVerificationExpires = null;
            await userRepo.save(user);
            throw new BadRequestError('Verification code expired');
        }

        // Link username (uniqueness enforced by column + earlier check)
        user.telegramId = username;
        user.telegramVerificationCode = null;
        user.telegramVerificationExpires = null;
        await userRepo.save(user);

        return { linked: true, userId: user.id, telegramId: user.telegramId };
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
    // Delete a user and clean up related mappings
    async deleteUser(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);

        const idNum = Number(userId);
        const user = await userRepo.findOneBy({ id: idNum });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }

        // Remove role/office mapping if present
        const mapping = await userOfficeRepo.findOneBy({ userId: idNum });
        if (mapping) {
            await userOfficeRepo.delete({ userId: idNum });
        }

        // Finally delete the user
        await userRepo.delete({ id: idNum });
        return { id: idNum };
    }


    /*
    
    
    EMAIL VERIFICATION


    */
    async saveEmailVerificationCode(userId, code, expiresAt) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        user.verificationCode = code;
        user.verificationCodeExpires = expiresAt;
        await userRepo.save(user);
    }

    async getEmailVerification(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        return {
            code: user.verificationCode || null,
            expiresAt: user.verificationCodeExpires || null
        };
    }

    async markEmailVerified(userId) {
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const user = await userRepo.findOneBy({ id: Number(userId) });
        if (!user) {
            throw new NotFoundError(`User with id '${userId}' not found`);
        }
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await userRepo.save(user);
    }

}

export const userRepository = new UserRepository();
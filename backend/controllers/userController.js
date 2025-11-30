import {userRepository} from "../repositories/userRepository.js";
import {rolesRepository} from "../repositories/rolesRepository.js";
import {officeRepository} from "../repositories/officeRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";

async function getUserByUsernameOrEmail(identifier) {
    const isEmail = identifier.includes('@');

    return isEmail ?
        await userRepository.getUserByEmail(identifier)
    : await userRepository.getUserByUsername(identifier);
}

async function getAvailableStaffForRoleAssignment() {
    return await userRepository.getAvailableStaffForRoleAssignment();
}

async function getAllRoles() {
    return await rolesRepository.findAll();
}

async function getAllOffices() {
    return await officeRepository.findAll();
}

async function createUser({username, email, name, surname, password, userType}){
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await userService.hashPassword(password, salt);
    const user = await userRepository.createUser(username, email, name, surname, hashedPassword, salt, userType);
    return mapUserToDTO(user);
}

async function createEmailVerification(userId) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await userRepository.saveEmailVerificationCode(userId, code, expiresAt);
    return { code, expiresAt };
}

async function verifyEmail(userId, code) {
    const record = await userRepository.getEmailVerification(userId);
    if (!record) throw new Error('Verification not found');
    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
        userRepository.deleteUser(userId);
        throw new Error('Verification code expired');
    }
    if (record.code !== code) throw new Error('Invalid verification code');

    await userRepository.markEmailVerified(userId);
    const user = await userRepository.getUserById(userId);
    return mapUserToDTO(user);
}

async function isEmailVerified(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error('User not found');
    return { isVerified: Boolean(user.isVerified) };
}

//used for STAFF signup
async function markEmailVerified(userId) {
    await userRepository.markEmailVerified(userId);
    const user = await userRepository.getUserById(userId);
    return mapUserToDTO(user);
}

async function assignRole(userId, roleId) {
    const userOffice = await userRepository.assignRoleToUser(userId, roleId);
    return {
        userId: userOffice.userId,
        officeId: userOffice.officeId ?? null,
        roleId: userOffice.roleId ?? null,
        role: userOffice.role ? { id: userOffice.role.id, name: userOffice.role.name } : null,
        office: userOffice.office ? { id: userOffice.office.id, name: userOffice.office.name } : null
    };
}

async function configAccount(userId, telegramId, emailNotifications, photoUrl){
    const user = await userRepository.configUserAccount(userId, telegramId, emailNotifications, photoUrl);
    return user;
}
async function getPfpUrl(userId) {
    const photoUrl = await userRepository.getPfpUrl(userId);
    return photoUrl;
}
    


const userController = { 
    getUserByUsernameOrEmail, 
    createUser, 
    assignRole, 
    getAvailableStaffForRoleAssignment, 
    getAllRoles, 
    getAllOffices, 
    configAccount, 
    getPfpUrl,
    createEmailVerification,
    verifyEmail,
    isEmailVerified,
    markEmailVerified
};
export default userController;
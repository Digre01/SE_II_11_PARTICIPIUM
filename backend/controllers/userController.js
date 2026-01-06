import {userRepository} from "../repositories/userRepository.js";
import {rolesRepository} from "../repositories/rolesRepository.js";
import {officeRepository} from "../repositories/officeRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";
import { BadRequestError } from "../errors/BadRequestError.js";
import { sendVerificationEmail } from '../utils/email.js';

async function getUserByUsernameOrEmail(identifier) {
    const isEmail = identifier.includes('@');

    return isEmail ?
        await userRepository.getUserByEmail(identifier)
    : await userRepository.getUserByUsername(identifier);
}

async function getAvailableStaffForRoleAssignment() {
    return await userRepository.getAvailableStaffForRoleAssignment();
}

async function getAssignedStaffForRoleModification() {
    return await userRepository.getAssignedStaffForRoleModification();
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
        // Auto-resend a new code on expiry
        const { code: newCode } = await createEmailVerification(userId);
        const user = await userRepository.getUserById(userId);
        const email = user?.email;
        if (email) {
            try { await sendVerificationEmail(email, newCode); } catch {}
        }
        throw new BadRequestError('Verification code expired. A new code has been sent to your email.');
    }
    if (record.code !== code) throw new Error('Invalid verification code');

    await userRepository.markEmailVerified(userId);
    const user = await userRepository.getUserById(userId);
    return mapUserToDTO(user);
}


// used for STAFF signup
async function markEmailVerified(userId) {
    await userRepository.markEmailVerified(userId);
    const user = await userRepository.getUserById(userId);
    return mapUserToDTO(user);
}

async function isEmailVerified(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error('User not found');
    return { isVerified: Boolean(user.isVerified) };
}


async function assignRole(userId, roleId, isExternal) {

    const rolesToAssign = Array.isArray(roleId) ? roleId : [roleId];

    if (isExternal && rolesToAssign.length > 1) {
        throw new BadRequestError('An external maintainer can only have one role');
    }

    const results = [];

    for (const r of rolesToAssign) {
        const userOffice = await userRepository.assignRoleToUser(userId, r, isExternal);

        const formattedResult = {
            userId: userOffice.userId,
            officeId: userOffice.officeId ?? null,
            roleId: userOffice.roleId ?? null,
            role: userOffice.role
                ? { id: userOffice.role.id, name: userOffice.role.name }
                : null,
            office: userOffice.office
                ? { id: userOffice.office.id, name: userOffice.office.name }
                : null
        };
        results.push(formattedResult);
    }

    return Array.isArray(roleId) ? results : results[0];
}

async function addUserRoles(userId, roleIds, isExternal) {
    return await userRepository.addUserRoles(userId, roleIds, isExternal);
}

async function removeUserRole(userId, roleId) {
    return await userRepository.removeUserRole(userId, roleId);
}

async function getUserRoles(userId) {
    return await userRepository.getUserRoles(userId);
}

async function setUserRoles(userId, roles) {
    return await userRepository.setUserRoles(userId, roles);
}

async function configAccount(userId, telegramId, emailNotifications, photoUrl){
    const user = await userRepository.configUserAccount(userId, telegramId, emailNotifications, photoUrl);
    return user;
}
async function getPfpUrl(userId) {
    const photoUrl = await userRepository.getPfpUrl(userId);
    return photoUrl;
}
// Telegram linking
async function requestTelegramCode(userId) {
    return await userRepository.requestTelegramVerificationCode(userId);
}
async function verifyTelegramCode(senderUsername, code) {
    return await userRepository.verifyTelegramCode(senderUsername, code);
}
    

async function resendEmailVerification(userId) {
    const { code } = await createEmailVerification(userId);
    const user = await userRepository.getUserById(userId);
    const email = user?.email;
    if (!email) throw new BadRequestError('User email not available');
    const result = await sendVerificationEmail(email, code);
    return { emailSent: Boolean(result?.sent), emailReason: result?.reason };
}

const userController = { 
    getUserByUsernameOrEmail, 
    createUser, 
    assignRole, 
    getAvailableStaffForRoleAssignment, 
    getAssignedStaffForRoleModification, 
    getAllRoles, 
    getAllOffices, 
    configAccount, 
    getPfpUrl, 
    addUserRoles, 
    removeUserRole, 
    getUserRoles, 
    setUserRoles,
    createEmailVerification,
    verifyEmail,
    isEmailVerified,
    markEmailVerified,
    resendEmailVerification,
    requestTelegramCode,
    verifyTelegramCode,
};
export default userController;
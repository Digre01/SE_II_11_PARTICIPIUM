import {userRepository} from "../repositories/userRepository.js";
import {rolesRepository} from "../repositories/rolesRepository.js";
import {officeRepository} from "../repositories/officeRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";
import { BadRequestError } from "../errors/BadRequestError.js";

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

async function assignRole(userId, roleId, isExternal) {
    // Se isExternal è true, accetta solo un ruolo
    if (isExternal && Array.isArray(roleId) && roleId.length > 1) {
        throw new BadRequestError('An external maintainer can only have one role');
    }

    // Support assigning a single roleId or multiple roleIds (array)
    if (Array.isArray(roleId)) {
        const results = [];
        for (const r of roleId) {
            const userOffice = await userRepository.assignRoleToUser(userId, r, isExternal);
            results.push({
                userId: userOffice.userId,
                officeId: userOffice.officeId ?? null,
                roleId: userOffice.roleId ?? null,
                role: userOffice.role ? { id: userOffice.role.id, name: userOffice.role.name } : null,
                office: userOffice.office ? { id: userOffice.office.id, name: userOffice.office.name } : null
            });
        }
        return results;
    } else {
        const userOffice = await userRepository.assignRoleToUser(userId, roleId, isExternal);
        return {
            userId: userOffice.userId,
            officeId: userOffice.officeId ?? null,
            roleId: userOffice.roleId ?? null,
            role: userOffice.role ? { id: userOffice.role.id, name: userOffice.role.name } : null,
            office: userOffice.office ? { id: userOffice.office.id, name: userOffice.office.name } : null
        };
    }
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
    


const userController = { getUserByUsernameOrEmail, createUser, assignRole, getAvailableStaffForRoleAssignment, getAllRoles, getAllOffices, configAccount, getPfpUrl, addUserRoles, removeUserRole, getUserRoles, setUserRoles };
export default userController;
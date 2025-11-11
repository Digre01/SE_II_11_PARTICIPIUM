import {userRepository} from "../repositories/userRepository.js";
import {rolesRepository} from "../repositories/rolesRepository.js";
import {officeRepository} from "../repositories/officeRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";

async function getUserByUsername(username) {
    return await userRepository.getUserByUsername(username);
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

async function assignRole(userId, roleId, officeId) {
    const userOffice = await userRepository.assignRoleToUser(userId, roleId, officeId);
    return {
        userId: userOffice.userId,
        officeId: userOffice.officeId ?? null,
        roleId: userOffice.roleId ?? null,
        role: userOffice.role ? { id: userOffice.role.id, name: userOffice.role.name } : null,
        office: userOffice.office ? { id: userOffice.office.id, name: userOffice.office.name } : null
    };
}

const userController = { getUserByUsername, createUser, assignRole, getAvailableStaffForRoleAssignment, getAllRoles, getAllOffices };
export default userController;
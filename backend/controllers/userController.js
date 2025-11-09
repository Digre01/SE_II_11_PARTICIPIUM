import {userRepository} from "../repositories/userRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";

async function getUserByUsername(username) {
    return await userRepository.getUserByUsername(username);
}

async function createUser({username, email, name, surname, password, userType}){
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await userService.hashPassword(password, salt);
    const user = await userRepository.createUser(username, email, name, surname, hashedPassword, salt, userType);
    return mapUserToDTO(user);
}

async function assignRole(userId, roleId) {
    const updatedUser = await userRepository.assignRoleToUser(userId, roleId);
    return mapUserToDTO(updatedUser);
}

const userController = { getUserByUsername, createUser, assignRole };
export default userController;
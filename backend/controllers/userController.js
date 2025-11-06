import {userRepository} from "../repositories/userRepository.js";
import crypto from "crypto";
import userService from "../services/userService.js";

async function getUserByUsername(username) {
    return userRepository.getUserByUsername(username);
}

async function createUser({username, email, name, surname, password, userType}){
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await userService.hashPassword(password, salt);
    return await userRepository.createUser(username, email, name, surname, hashedPassword, salt, userType);
}

const userController = { getUserByUsername, createUser };
export default userController;
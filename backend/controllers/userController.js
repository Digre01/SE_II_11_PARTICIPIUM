import {userRepository} from "../repositories/userRepository.js";

export async function createUser({username, email, name, surname, password, userType}){
    const salt = crypto.randomBytes(16);

    const hashedPassword = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey);
        });
    });

    try {
        return await userRepository.createUser(username, email, name, surname, hashedPassword, salt, userType);
    } catch (error) {
        return {error, msg: "User already exists"};
    }
}
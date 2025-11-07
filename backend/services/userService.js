import crypto from "crypto";

async function hashPassword(password, salt) {

    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey.toString('hex'));
        });
    })
}

async function verifyPassword(password, storedPassword, salt) {
    const hashedPassword = await hashPassword(password, salt);
    const bufferedHashPassword = Buffer.from(hashedPassword, 'hex');
    const hashedStoredPassword = Buffer.from(storedPassword, 'hex');
    return crypto.timingSafeEqual(hashedStoredPassword, bufferedHashPassword);
}

const userService = { hashPassword, verifyPassword };
export default userService;
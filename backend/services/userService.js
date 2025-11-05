import crypto from "crypto";

async function hashPassword(password, salt) {

    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey.toString('hex'));
        });
    })
}

const userService = { hashPassword };
export default userService;
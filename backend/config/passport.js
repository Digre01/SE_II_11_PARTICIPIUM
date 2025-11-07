import passport from "passport";
import LocalStrategy from "passport-local";
import userController from "../controllers/userController.js";
import userService from "../services/userService.js";
import {mapUserToDTO} from "../mappers/userMappers.js";
import {userRepository} from "../repositories/userRepository.js";

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const user = await userController.getUserByUsername(username);

    if (!user) {
        return cb(null, false, 'User not found');
    }

    const isValid = await userService.verifyPassword(password, user.password, user.salt);
    if (!isValid) {
        return cb(null, false, 'Incorrect password');
    }
    return cb(null, mapUserToDTO(user));
}));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);  //salvo solo id user nella sessione
});

passport.deserializeUser(async function (userId, cb) {
    try {
        const user = await userRepository.getUserById(userId);
        if (!user) return cb(null, false);
        const safeUser = mapUserToDTO(user);
        cb(null, safeUser);
    } catch (err) {
        cb(err);
    }
});

export default passport;
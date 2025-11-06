import passport from "passport";
import LocalStrategy from "passport-local";
import userController from "../controllers/userController.js";
import userService from "../services/userService.js";

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const user = await userController.getUserByUsername(username);

    if (!user) {
        return cb(null, false, 'User not found');
    }

    const isValid = await userService.verifyPassword(password, user.password, user.salt);
    if (!isValid) {
        return cb(null, false, 'Incorrect password');
    }
    return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    return cb(null, user);
});

export default passport;
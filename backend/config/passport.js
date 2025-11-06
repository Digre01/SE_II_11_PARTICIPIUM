import passport from "passport";
import LocalStrategy from "passport-local";
import userController from "../controllers/userController.js";

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const user = await userController.getUserByUsernameAndPassword(username, password);
    if (!user) {
        return cb(null, false, 'Incorrect username or password');
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
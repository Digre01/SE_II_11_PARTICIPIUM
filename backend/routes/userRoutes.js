import Router from "express";
import userController from "../controllers/userController.js";
import passport from "passport";
import { requireAdminIfCreatingStaff, authorizeUserType } from "../middlewares/userAuthorization.js";

const router = Router();

//login
router.post('/login', passport.authenticate('local'), function(
    req,
    res) {
        res.status(201).json(req.user);
});

// Assign role to a user (ADMIN only)
router.patch('/:id/role', authorizeUserType(['ADMIN']),
    async function(req, res, next) {
        try {
            const roleId = req.body?.roleId;
            if (roleId === undefined || roleId === null) {
                const err = new Error('roleId is required');
                err.status = 400;
                return next(err);
            }

            const updatedUser = await userController.assignRole(req.params.id, roleId);
            return res.status(200).json(updatedUser);
        } catch (err) {
            next(err);
        }
    }
);

//signup
router.post("/signup", requireAdminIfCreatingStaff,
    async function(
    req,
    res,
    next) {
    try {
        const user = await userController.createUser(req.body);

        if (user.userType === 'citizen'){ // if a citizen signs up, log them in
            req.login(user, (err) => {  // login after sign up
                if (err) return next(err);
                return res.status(201).json(req.user);
            });
        } else {
            // if an admin creates a staff member, return the created user without logging in
            return res.status(201).json(user);
        }
    } catch (err) {
        next(err)
    }
});

//get current session
router.get('/current', (
    req,
    res) => {
    if(req.isAuthenticated()) {
        res.json(req.user);}
    else
        res.status(401).json({error: 'Not authenticated'});
});

//delete current session
router.delete('/current', (
    req,
    res) => {
    req.logout(() => {
        res.end();
    });
});

export default router;
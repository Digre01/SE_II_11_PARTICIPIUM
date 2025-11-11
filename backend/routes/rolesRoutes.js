import Router from "express";
import {authorizeUserType} from "../middlewares/userAuthorization.js";
import userController from "../controllers/userController.js";

const router = new Router();

// GET list of roles (ADMIN only)
router.get('/', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const roles = await userController.getAllRoles();
        res.status(200).json(roles);
    } catch (err) { next(err); }
});

export default router;
import Router from "express";
import {authorizeUserType} from "../middlewares/userAuthorization.js";
import userController from "../controllers/userController.js";

const router = new Router();

// GET list of offices (ADMIN only)
router.get('/', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const offices = await userController.getAllOffices();
        res.status(200).json(offices);
    } catch (err) { next(err); }
});

export default router;

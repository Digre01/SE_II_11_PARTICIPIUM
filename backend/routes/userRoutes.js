import Router from "express";
import userController from "../controllers/userController.js";
import passport from "passport";
import AuthenticationError from "passport/lib/errors/authenticationerror.js";
import {authorizeUserType} from "../middleware/userAuthorization.js";

const router = Router();

//login
router.post('/login', passport.authenticate('local'), function(
    req,
    res) {
        res.status(201).json(req.user);
});

//signup
router.post("/signup", async function(req,res) {
    //check if body is staff, if that, the caller needs to be an admin 
    //needs a middleware?
    try {
        res.status(201).json(await userController.createUser(req.body));
    } catch (err) {
        if (err.message === "EXISTING EMAIL") {
            res.status(409).json({error: 'User already exists'});
        } else if(err.message === "FORBIDDEN") {
            res.status(403).json({error: 'Forbidden'});
        } else if(err.message === "UNAUTHORIZED") {
            res.status(401).json({error: 'Unauthorized user'});
        } else {
            res.status(500).json({error: 'Internal Server Error'});
        }
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
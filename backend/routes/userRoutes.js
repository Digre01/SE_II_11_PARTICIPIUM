import {Router} from "express";
import {createUser} from "../controllers/userController.js";
import passport from "passport";

const router = Router();

// POST /api/sessions
router.post('/api/sessions', passport.authenticate('local'), function(
    req,
    res) {
    return res.status(201).json(req.user);
});

// GET /api/sessions/current
router.get('/api/sessions/current', (
    req,
    res) => {
    if(req.isAuthenticated()) {
        res.json(req.user);}
    else
        res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
router.delete('/api/sessions/current', (
    req,
    res) => {
    req.logout(() => {
        res.end();
    });
});

router.post("", async function(
    req,
    res,
    next) {
    try {
        res.status(201).json(await createUser(req.body));
    } catch (err) {
        res.status(409).json({error: 'User already exists'});
    }
});

export default router;
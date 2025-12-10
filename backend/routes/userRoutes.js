import { Router } from "express";
import userController from "../controllers/userController.js";
import passport from "passport";
import { requireAdminIfCreatingStaff, authorizeUserType } from "../middlewares/userAuthorization.js";
import {BadRequestError} from "../errors/BadRequestError.js";
import upload from '../middlewares/uploadMiddleware.js';
import fs from 'fs';
import { sendVerificationEmail } from '../utils/email.js';

const router = Router();

//login
router.post('/login', passport.authenticate('local'), function(req, res) {
    const user = req.user;
    const prevSession = req.session;
    req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: 'Session error' });
        Object.assign(req.session, prevSession);
        res.status(201).json(user);
    });
});

// GET /api/v1/sessions/me/roles - Roles for the current logged-in user (STAFF or ADMIN)
router.get('/me/roles', authorizeUserType(['ADMIN','STAFF']), async function(req, res, next) {
    try {
        const userId = Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const roles = await userController.getUserRoles(userId);
        res.status(200).json(roles);
    } catch (err) { next(err); }
});

// PATCH /api/v1/sessions/:id/role - Assign role to staff (ADMIN only)
router.patch('/:id/role', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const roleId = req.body.roleId;
        const isExternal = req.body.isExternal || false;
        const result = await userController.assignRole(userId, roleId, isExternal);
        res.status(200).json(result);
    } catch (err) { next(err); }
});

// GET /api/v1/sessions/:id/roles - List roles for a user
// Allows ADMIN to query any user; allows a logged-in STAFF user to query their own roles
router.get('/:id/roles', authorizeUserType(['ADMIN','STAFF']), async function(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const callerType = String(req.user?.userType || '').toUpperCase();
        const isAdmin = callerType === 'ADMIN';
        const isSelf = req.user?.id === userId;
        if (!isAdmin && !isSelf) {
            // Only admins can query other users' roles
            return res.status(403).json({ error: 'FORBIDDEN' });
        }
        const roles = await userController.getUserRoles(userId);
        res.status(200).json(roles);
    } catch (err) { next(err); }
});


// PUT /api/v1/sessions/:id/roles - Set final roles for a user (ADMIN only)
// Body supports either { roleIds: number[] } or { roles: Array<{ roleId: number, isExternal?: boolean }> }
router.put('/:id/roles', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const { roleIds, roles } = req.body || {};
        let payload = roles;
        if (!payload && Array.isArray(roleIds)) {
            payload = roleIds.map(rid => ({ roleId: rid }));
        }
        if (!Array.isArray(payload)) {
            throw new BadRequestError('Provide roleIds array or roles array');
        }
        const updated = await userController.setUserRoles(userId, payload);
        res.status(200).json(updated);
    } catch (err) { next(err); }
});

// GET /api/v1/sessions/:id/pfp - Get profile picture URL for a user (authenticated)
router.get('/:id/pfp', authorizeUserType(['CITIZEN']), async function(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const result = await userController.getPfpUrl(userId);
        res.status(200).json(result);
    } catch (err) { next(err); }
});

// PATCH /api/v1/sessions/:id/config - Update info of my account (single profile photo)
router.patch(
    '/:id/config',
    authorizeUserType(['CITIZEN']),
    upload.single('photo'),
    async (req, res, next) => {
        // Remove uploaded file on error
        const deleteUploadedFile = () => {
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Deleting file error:', req.file.path, err);
                }
            }
        };

        try {
            const userId = Number(req.params.id);

            // Optional fields via multipart/form-data
            const telegramId = req.body?.telegramId ?? undefined;
            const emailNotificationsRaw = req.body?.emailNotifications ?? undefined;
            let emailNotifications;
            if (emailNotificationsRaw !== undefined) {
                const val = String(emailNotificationsRaw).toLowerCase();
                emailNotifications = (val === 'true' || val === '1' || val === 'yes' || val === 'on');
            }

            // Compute photo public URL if provided
            const photoUrl = req.file ? `/public/${req.file.filename}` : undefined;

            const result = await userController.configAccount(
                userId,
                telegramId,
                emailNotifications,
                photoUrl
            );

            return res.status(200).json({ message: 'Account updated', user: result });
        } catch (err) {
            deleteUploadedFile();
            next(err);
        }
    }
);


// GET list of staff users available for role assignment (ADMIN only)
router.get('/available_staff', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const users = await userController.getAvailableStaffForRoleAssignment();
        const mapped = users.map(u => ({ id: u.id, username: u.username, name: u.name, surname: u.surname }));
        res.status(200).json(mapped);
    } catch (err) { next(err); }
});

// GET list of staff users already assigned to at least one role (ADMIN only)
router.get('/assigned_staff', authorizeUserType(['ADMIN']), async function(req, res, next) {
    try {
        const users = await userController.getAssignedStaffForRoleModification();
        const mapped = users.map(u => ({ id: u.id, username: u.username, name: u.name, surname: u.surname }));
        res.status(200).json(mapped);
    } catch (err) { next(err); }
});


//signup
router.post("/signup", requireAdminIfCreatingStaff,
    async function(req, res, next) {
        try {
            const { email, userType } = req.body;
            if (!email) {
                return next(new BadRequestError('email is required'));
            }

            const isStaff = String(userType || '').toUpperCase() === 'STAFF';
            const user = await userController.createUser(req.body);

            if (isStaff) {
                //skip email
                const verifiedUser = await userController.markEmailVerified(user.id);
                return res.status(201).json({ user: verifiedUser, emailSent: false, emailReason: 'staff auto-verified' });
            }

            //citizen
            const { code } = await userController.createEmailVerification(user.id);

            let emailSent = false;
            let emailReason;
            try {
                const result = await sendVerificationEmail(email, code);
                emailSent = Boolean(result?.sent);
                emailReason = result?.reason;
            } catch (mailErr) {
                emailReason = mailErr?.message || String(mailErr);
                console.error('sendVerificationEmail failed:', emailReason);
            }
            req.login(user, (err) => {
                if (err) return next(err);
                return res.status(201).json({ user, emailSent, emailReason });
            });
        } catch (err) {
            next(err);
        }
    }
);



// verify email for currently authenticated session user 
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
router.post('/current/verify_email', async function(req, res, next) {
    try {
        if (!req.isAuthenticated?.() || !req.user?.id) {
            return next(new UnauthorizedError('Not authenticated'));
        }
        const { code } = req.body || {};
        if (!code) return next(new BadRequestError('code is required'));
        try {
            const user = await userController.verifyEmail(Number(req.user.id), code);
            return res.status(200).json({ message: 'Email verified', user });
        } catch (err) {
            const msg = err?.message || String(err);
            if (msg.toLowerCase().includes('expired')) {
                return res.status(410).json({ message: msg, expired: true });
            }
            throw err;
        }
    } catch (err) {
        next(err);
    }
});

// Check if email is verified
router.get('/current/email_verified', authorizeUserType(['CITIZEN']), async function(req, res, next) {
    try {
        const result = await userController.isEmailVerified(Number(req.user.id));
        return res.status(200).json(result);
    } catch (err) {
        next(err);
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

// Resend verification code for the current authenticated user
router.post('/current/resend_verification', async function(req, res, next) {
    try {
        if (!req.isAuthenticated?.() || !req.user?.id) {
            return next(new UnauthorizedError('Not authenticated'));
        }
        const result = await userController.resendEmailVerification(Number(req.user.id));
        return res.status(200).json({ message: 'Verification code resent', ...result });
    } catch (err) {
        next(err);
    }
});

export default router;
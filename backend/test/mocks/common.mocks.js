import { jest } from "@jest/globals";
import { InsufficientRightsError } from "../../errors/InsufficientRightsError.js";
import {UnauthorizedError} from "../../errors/UnauthorizedError.js";

export function mockAuthorizeUserType(allowedTypes = []) {
    return (req, _res, next) => {
        // Controlla se l'utente è autenticato (già impostato da Passport)
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return next(new UnauthorizedError('UNAUTHORIZED'));
        }

        if (allowedTypes.length > 0) {
            const normalizedAllowed = allowedTypes.map(a => String(a).toUpperCase());
            const callerType = String(req.user?.userType || '').toUpperCase();
            if (!normalizedAllowed.includes(callerType)) {
                return next(new InsufficientRightsError('Forbidden'));
            }
        }

        next();
    };
}

export function mockRequireAdminIfCreatingStaff(req, _res, next) {
    const requestedUserType = req.body?.userType;
    const isStaff = String(requestedUserType || '').toUpperCase() === 'STAFF';

    if (!isStaff) {
        return next();
    }

    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return next(new UnauthorizedError('Unauthorized'));
    }

    const isAdmin = String(req.user?.userType || '').toUpperCase() === 'ADMIN';
    if (!isAdmin) {
        return next(new InsufficientRightsError('Forbidden'));
    }

    next();
}

export function mockAuthorizeRole(requiredRole) {
    return (req, _res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return next(new UnauthorizedError('UNAUTHORIZED'));
        }

        const headers = req.headers || {};
        const roleHeader = headers['x-test-role'];

        if (!roleHeader || String(roleHeader).toLowerCase() !== String(requiredRole).toLowerCase()) {
            return next(new InsufficientRightsError('Forbidden'));
        }

        next();
    };
}

export function createUploadMiddlewareMock() {
    return {
        array: () => (req, _res, next) => {
            const photoNamesHeader = req.header('X-Test-Photos');
            if (photoNamesHeader) {
                const names = photoNamesHeader.split(',').filter(Boolean);
                req.files = names.map((n, idx) => ({
                    filename: n.trim(),
                    path: `/tmp/${n.trim()}-${idx}`
                }));
            } else {
                req.files = [];
            }
            next();
        },
        single: () => (req, _res, next) => {
            const name = req.header('X-Test-Photo');
            req.file = name ? {
                filename: name.trim(),
                path: `/tmp/${name.trim()}`
            } : undefined;
            next();
        }
    };
}

export async function setupAuthorizationMocks() {
    await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
        authorizeUserType: mockAuthorizeUserType,
        requireAdminIfCreatingStaff: mockRequireAdminIfCreatingStaff,
        authorizeRole: mockAuthorizeRole
    }));
}

// Setup upload middleware mock
export async function setupUploadMiddlewareMock() {
    await jest.unstable_mockModule('../../middlewares/uploadMiddleware.js', () => ({
        default: createUploadMiddlewareMock()
    }));
}

// Setup email utils mock to avoid nodemailer dependency in tests
export async function setupEmailUtilsMock() {
    await jest.unstable_mockModule('../../utils/email.js', () => ({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendNotificationEmail: jest.fn().mockResolvedValue(true),
    }));
}

export async function setUpLoginMock() {
    await jest.unstable_mockModule('passport', () => ({
        default: {
            initialize: () => (req, _res, next) => {
                const headers = req.headers || {};
                const userTypeHeader = headers['x-test-user-type'];

                if (userTypeHeader) {
                    req.user = {
                        id: 1,
                        username: 'testuser',
                        userType: userTypeHeader.toUpperCase(),
                        email: 'test@example.com'
                    };
                }

                req.isAuthenticated = () => !!req.user;
                req.login = (user, cb) => {
                    req.user = user;
                    if (cb) cb();
                };
                req.logout = (cb) => {
                    req.user = null;
                    if (cb) cb();
                };
                req.session = req.session || {};
                next();
            },
            session: () => (_req, _res, next) => next(),
            authenticate: (strategy, options, callback) => (req, res, next) => {
                if (req.path?.includes('/login')) {
                    if (req.body?.username === 'wrong' && req.body?.password === 'wrong') {
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    const user = {
                        id: 10,
                        username: 'testuser',
                        userType: 'CITIZEN',
                        email: 'test@example.com'
                    };

                    req.user = user;
                    req.session = req.session || {};
                    req.session.regenerate = (cb) => cb();

                    if (callback) return callback(null, user);
                }

                next();
            },
            use: jest.fn(),
            serializeUser: jest.fn(),
            deserializeUser: jest.fn()
        }
    }));
}

export async function setupWsHandlerMock() {
    await jest.unstable_mockModule('../../wsHandler.js', () => ({
        broadcastToConversation: jest.fn(),
    }));
}
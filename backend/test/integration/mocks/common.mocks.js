// Common mock utilities for all test files
import { jest } from "@jest/globals";
import { InsufficientRightsError } from "../../../errors/InsufficientRightsError.js";
import { UnauthorizedError } from "../../../errors/UnauthorizedError.js";

// Creates authorization middleware mock with customizable behavior
export function createAuthorizationMock(options = {}) {
    const allowUnauthorizedThrough = options.allowUnauthorizedThrough || false;
    const return401OnAssigned = options.return401OnAssigned || false;

    return {
        authorizeUserType: (allowed) => (req, _res, next) => {
            const userTypeHdr = req.header('X-Test-User-Type');
            const roleHdr = req.header('X-Test-Role');
            const effectiveUserType = userTypeHdr || roleHdr;

            if (effectiveUserType) {
                req.user = { id: 10, userType: effectiveUserType };
                req.isAuthenticated = () => true;
                const normalized = (allowed || []).map(a => String(a).toUpperCase());
                const caller = String(effectiveUserType).toUpperCase();
                if (!normalized.includes(caller)) {
                    return next(new InsufficientRightsError('Forbidden'));
                }
                return next();
            }

            if (req.header('Authorization')) {
                req.user = { id: 10, userType: 'citizen' };
                req.isAuthenticated = () => true;
                const normalized = (allowed || []).map(a => String(a).toUpperCase());
                if (!normalized.includes('CITIZEN')) {
                    return next(new InsufficientRightsError('Forbidden'));
                }
                return next();
            }

            // Handle special case for /assigned route
            if (return401OnAssigned && req.path?.includes('/assigned')) {
                return next(new UnauthorizedError('UNAUTHORIZED'));
            }

            // Default behavior based on options
            if (allowUnauthorizedThrough) {
                return next();
            }

            return next(new InsufficientRightsError('Forbidden'));
        },

        requireAdminIfCreatingStaff: () => (req, _res, next) => next(),

        authorizeRole: (requiredRole) => (req, _res, next) => {
            const roleHdr = req.header('X-Test-Role');
            if (!roleHdr) return next(new InsufficientRightsError('Forbidden'));
            if (String(roleHdr).toUpperCase() !== String(requiredRole).toUpperCase()) {
                return next(new InsufficientRightsError('Forbidden'));
            }
            next();
        },
    };
}

// Creates upload middleware mock
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

// Setup authorization middleware mock
export async function setupAuthorizationMock(options = {}) {
    await jest.unstable_mockModule('../../../middlewares/userAuthorization.js', () =>
        createAuthorizationMock(options)
    );
}

// Setup upload middleware mock
export async function setupUploadMiddlewareMock() {
    await jest.unstable_mockModule('../../../middlewares/uploadMiddleware.js', () => ({
        default: createUploadMiddlewareMock()
    }));
}

// Setup email utils mock to avoid nodemailer dependency in tests
export async function setupEmailUtilsMock() {
    await jest.unstable_mockModule('../../../utils/email.js', () => ({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendNotificationEmail: jest.fn().mockResolvedValue(true),
    }));
}
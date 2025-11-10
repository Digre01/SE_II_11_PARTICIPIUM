import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../errors/InsufficientRightsError.js';

export function authorizeUserType(allowedTypes) {
    return async function (req, res, next) {

        if (!req.isAuthenticated()) {
            const err = new UnauthorizedError('Unauthorized');
            return next(err);
        }

        if (!allowedTypes.includes(req.user.userType)) {
            const err = new InsufficientRightsError('Forbidden');
            return next(err);
        }
        next();
    };
}

//for STAFF account creation
export function requireAdminIfCreatingStaff(req, res, next) {
    try {
        const requestedUserType = req.body?.userType;

        // CITIZEN signup
        if (!requestedUserType || String(requestedUserType).toUpperCase() !== 'STAFF') {
            return next();
        }

        // STAFF signup
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return next(new UnauthorizedError('Unauthorized'));
        }

        // And ADMIN role
        const callerType = String(req.user?.userType || '').toUpperCase();
        if (callerType !== 'ADMIN') {
            return next(new InsufficientRightsError('Forbidden'));
        }

        return next();
    } catch (e) {
        return next(e);
    }
}

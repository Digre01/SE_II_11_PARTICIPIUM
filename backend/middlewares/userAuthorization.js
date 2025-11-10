import {UnauthorizedError} from "../errors/UnauthorizedError.js";
import {InsufficientRightsError} from "../errors/InsufficientRightsError.js";

export function authorizeUserType(allowedTypes) {
    return async function (req, res, next) {

        if (!req.isAuthenticated()) {
            const err = new UnauthorizedError('UNAUTHORIZED');
            return next(err);
        }
        // perform a case-insensitive check between allowedTypes and the caller's userType
        const normalizedAllowed = (allowedTypes || []).map(a => String(a).toUpperCase());
        const callerType = String(req.user?.userType || '').toUpperCase();
        if (!normalizedAllowed.includes(callerType)) {
            const err = new InsufficientRightsError('FORBIDDEN');
            return next(err);
        }
        next();
    };
}

//for STAFF account creation
export function requireAdminIfCreatingStaff(req, res, next) {
    try {
        const requestedUserType = req.body?.userType;

        //CITIZEN signup
        if (!requestedUserType || String(requestedUserType).toUpperCase() !== 'STAFF') {
            return next();
        }

        //STAFF signup
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            const err = new Error('UNAUTHORIZED');
            err.status = 401;
            return next(err);
        }

        // And ADMIN role
        const callerType = String(req.user?.userType || '').toUpperCase();
        if (callerType !== 'ADMIN') {
            const err = new Error('FORBIDDEN');
            err.status = 403;
            return next(err);
        }

        return next();
    } catch (e) {
        return next(e);
    }
}

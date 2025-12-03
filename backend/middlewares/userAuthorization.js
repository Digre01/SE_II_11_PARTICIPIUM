import {UnauthorizedError} from "../errors/UnauthorizedError.js";
import {InsufficientRightsError} from "../errors/InsufficientRightsError.js";
import { AppDataSourcePostgres } from '../config/data-source.js';
import { UserOffice } from '../entities/UserOffice.js';

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

export function authorizeRole(roleName) {
    return async function (req, res, next) {
        try {
            if (!req.isAuthenticated || !req.isAuthenticated()) {
                return next(new UnauthorizedError('UNAUTHORIZED'));
            }

            const userId = req.user?.id;
            if (!userId) return next(new UnauthorizedError('UNAUTHORIZED'));

            const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
            const userOffices = await userOfficeRepo.find({ where: { userId: Number(userId) }, relations: ['role'] });
            if (!userOffices || userOffices.length === 0) {
                return next(new InsufficientRightsError('FORBIDDEN'));
            }

            const match = userOffices.find(uo => uo.role && String(uo.role.name || '').toLowerCase() === String(roleName || '').toLowerCase());
            if (!match) {
                return next(new InsufficientRightsError('FORBIDDEN'));
            }

            return next();
        } catch (e) {
            return next(e);
        }
    };
}

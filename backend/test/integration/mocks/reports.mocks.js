// Repository mock
import {jest} from "@jest/globals";
import {InsufficientRightsError} from "../../../errors/InsufficientRightsError.js";
import {UnauthorizedError} from "../../../errors/UnauthorizedError.js";

export const mockRepo = {
    createReport: jest.fn(),
    getAcceptedReports: jest.fn(),
    getReportById: jest.fn(),
    startReport: jest.fn(),
    finishReport: jest.fn(),
    suspendReport: jest.fn(),
    resumeReport: jest.fn(),
};

// Mock repository before importing app
await jest.unstable_mockModule('../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo,
}));

// Mock authorization middleware with role enforcement based on X-Role header
await jest.unstable_mockModule('../../../middlewares/userAuthorization.js', () => ({
    authorizeUserType: (allowed) => (req, _res, next) => {
        const userTypeHdr = req.header('X-Test-User-Type');
        const roleHdr = req.header('X-Test-Role');
        const effectiveUserType = userTypeHdr || roleHdr;

        if (effectiveUserType) {
            req.user = { id: 10, userType: effectiveUserType };
            const normalized = (allowed || []).map(a => String(a).toUpperCase());
            const caller = String(effectiveUserType).toUpperCase();
            if (!normalized.includes(caller)) {
                return next(new InsufficientRightsError('Forbidden'));
            }
            return next();
        }

        if (req.header('Authorization')) {
            req.user = { id: 10, userType: 'citizen' };
            const normalized = (allowed || []).map(a => String(a).toUpperCase());
            if (!normalized.includes('CITIZEN')) {
                return next(new InsufficientRightsError('Forbidden'));
            }
            return next();
        }


        // For the map/assigned route we want to simulate real auth behavior and return 401
        if (req.path && req.path.includes('/assigned')) {
            return next(new UnauthorizedError('UNAUTHORIZED'));
        }

        // default: allow through (keeps existing POST tests behavior where no header leads to validation errors)
        return next();
    },
    requireAdminIfCreatingStaff: () => (req, _res, next) => next(), // no-op for tests
    authorizeRole: (requiredRole) => (req, _res, next) => {
        const roleHdr = req.header('X-Test-Role');
        if (!roleHdr) return next(new InsufficientRightsError('Forbidden'));
        if (String(roleHdr).toUpperCase() !== String(requiredRole).toUpperCase()) {
            return next(new InsufficientRightsError('Forbidden'));
        }
        next();
    },
}));

// Mock upload middleware
await jest.unstable_mockModule('../../../middlewares/uploadMiddleware.js', () => ({
    default: {
        array: () => (req, _res, next) => {
            const photoNamesHeader = req.header('X-Test-Photos');
            if (photoNamesHeader) {
                const names = photoNamesHeader.split(',').filter(Boolean);
                req.files = names.map((n, idx) => ({ filename: n.trim(), path: `/tmp/${n.trim()}-${idx}` }));
            } else {
                req.files = [];
            }
            next();
        },
        single: () => (req, _res, next) => {
            const name = req.header('X-Test-Photo');
            req.file = name ? { filename: name.trim(), path: `/tmp/${name.trim()}` } : undefined;
            next();
        }
    }
}));
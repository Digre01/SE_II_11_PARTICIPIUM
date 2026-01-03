import {describe, expect, it, jest} from '@jest/globals';
import {
    requireAdminIfCreatingStaff,
} from '../../../middlewares/userAuthorization.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../../../errors/InsufficientRightsError.js';
import { createMockReq, createMockRes, createMockNext } from '../mocks/test-utils.mocks.js';

describe('Middleware: requireAdminIfCreatingStaff', () => {
    it('allows CITIZEN or missing userType', () => {
        const next = createMockNext();
        requireAdminIfCreatingStaff(createMockReq({ body: { userType: 'CITIZEN' } }), createMockRes(), next);
        expect(next).toHaveBeenCalledWith();

        requireAdminIfCreatingStaff(createMockReq({ body: {} }), createMockRes(), next);
        expect(next).toHaveBeenCalledWith();
    });

    it('throws UnauthorizedError if not authenticated when creating STAFF', () => {
        const req = createMockReq({ body: { userType: 'STAFF' }, isAuthenticated: () => false });
        const next = createMockNext();
        requireAdminIfCreatingStaff(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('throws InsufficientRightsError if user is not ADMIN', () => {
        const req = createMockReq({ body: { userType: 'STAFF' }, isAuthenticated: () => true, user: { userType: 'STAFF' } });
        const next = createMockNext();
        requireAdminIfCreatingStaff(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('allows ADMIN to create STAFF', () => {
        const req = createMockReq({ body: { userType: 'STAFF' }, isAuthenticated: () => true, user: { userType: 'ADMIN' } });
        const next = createMockNext();
        requireAdminIfCreatingStaff(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith();
    });

    it('catches thrown errors', () => {
        const req = createMockReq({ body: { userType: 'STAFF' }, isAuthenticated: () => { throw new Error('fail') } });
        const next = createMockNext();
        requireAdminIfCreatingStaff(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
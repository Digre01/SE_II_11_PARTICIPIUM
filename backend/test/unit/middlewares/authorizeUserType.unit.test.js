import {describe, expect, it} from '@jest/globals';
import {
    authorizeUserType,
} from '../../../middlewares/userAuthorization.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../../../errors/InsufficientRightsError.js';
import { createMockReq, createMockRes, createMockNext } from '../mocks/test-utils.mocks.js';

describe('Middleware: authorizeUserType', () => {
    it('throws UnauthorizedError if not authenticated', async () => {
        const req = createMockReq({ isAuthenticated: () => false });
        const next = createMockNext();
        await authorizeUserType(['ADMIN'])(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('throws InsufficientRightsError if userType not allowed', async () => {
        const req = createMockReq({ isAuthenticated: () => true, user: { userType: 'CITIZEN' } });
        const next = createMockNext();
        await authorizeUserType(['ADMIN'])(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('passes if userType allowed', async () => {
        const req = createMockReq({ isAuthenticated: () => true, user: { userType: 'ADMIN' } });
        const next = createMockNext();
        await authorizeUserType(['ADMIN', 'STAFF'])(req, createMockRes(), next);
        expect(next).toHaveBeenCalledWith();
    });
});
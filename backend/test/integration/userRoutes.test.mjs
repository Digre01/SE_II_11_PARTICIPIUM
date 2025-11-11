import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {UnauthorizedError} from "../../errors/UnauthorizedError.js";

const mockController = {
    assignRole: jest.fn(),
};

// Mock del middleware di autorizzazione
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
    authorizeUserType: () => (req, res, next) => {
        if (!req.header('Authorization')) {
            const err = new UnauthorizedError('Unauthorized');
            return next(err); // blocca la richiesta
        }
        req.user = { id: 1, userType: 'ADMIN' };
        next();
    },
    requireAdminIfCreatingStaff: () => (req, _res, next) => next(), // no-op for tests
}));

// Mock del controller prima di importare app
await jest.unstable_mockModule('../../controllers/userController.js', () => ({
    default: mockController,
}));

// Import app after mocks
const { default: app } = await import('../../app.js');

describe('PATCH /api/v1/sessions/:id/role', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockController.assignRole.mockResolvedValue({
            userId: 5,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' },
        });
    });

    it('updates user role successfully', async () => {
        const res = await request(app)
            .patch('/api/v1/sessions/5/role')
            .set('Authorization', 'Bearer admin')
            .send({ roleId: 3, officeId: 2 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            userId: 5,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' },
        });

        expect(mockController.assignRole).toHaveBeenCalledWith('5', 3, 2);
    });

    it('fails when roleId is missing', async () => {
        const res = await request(app)
            .patch('/api/v1/sessions/5/role')
            .set('Authorization', 'Bearer admin')
            .send({ officeId: 2 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/roleId is required/i);
        expect(mockController.assignRole).not.toHaveBeenCalled();
    });

    it('fails when officeId is missing', async () => {
        const res = await request(app)
            .patch('/api/v1/sessions/5/role')
            .set('Authorization', 'Bearer admin')
            .send({ roleId: 3 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/officeId is required/i);
        expect(mockController.assignRole).not.toHaveBeenCalled();
    });

    it('propagates controller errors (500)', async () => {
        mockController.assignRole.mockRejectedValueOnce(new Error('Database failure'));
        const res = await request(app)
            .patch('/api/v1/sessions/5/role')
            .set('Authorization', 'Bearer admin')
            .send({ roleId: 3, officeId: 2 });

        expect(res.status).toBe(500);
        //expect(res.body.error).toBeDefined();
    });

    it('fails when user not authorized (no Authorization header)', async () => {
        const res = await request(app)
            .patch('/api/v1/sessions/5/role')
            .send({ roleId: 3, officeId: 2 });

        expect(res.status).toBe(401); // oppure 403 se la logica reale lo impone
    });
});
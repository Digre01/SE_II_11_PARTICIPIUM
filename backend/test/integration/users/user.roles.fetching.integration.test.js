import {describe, expect, it} from "@jest/globals";
import request from "supertest";
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";
import {mockUserRepo} from "../../mocks/repositories/users.repo.mock.js";

await setupAuthorizationMocks()
await setupEmailUtilsMock();
await setUpLoginMock()

const { default: app } = await import('../../../app.js');

describe('GET /me/roles', () => {
    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/me/roles');

        expect(res.status).toBe(401);
    });

    it('should return 200 and user roles for ADMIN', async () => {
        const mockRoles = [{ id: 1, name: 'ADMIN' }];

        mockUserRepo.getUserRoles.mockResolvedValueOnce(mockRoles);

        const res = await request(app)
            .get('/api/v1/sessions/me/roles')
            .set('X-Test-User-Type', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockRoles);
        expect(mockUserRepo.getUserRoles).toHaveBeenCalledWith(1);
    });

    it('should return 200 and user roles for STAFF', async () => {
        const mockRoles = [{ id: 2, name: 'STAFF' }];

        mockUserRepo.getUserRoles.mockResolvedValueOnce(mockRoles);

        const res = await request(app)
            .get('/api/v1/sessions/me/roles')
            .set('X-Test-User-Type', 'STAFF');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockRoles);
    });

    it('should return 403 if user is not ADMIN or STAFF', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/me/roles')
            .set('X-Test-User-Type', 'USER');

        expect(res.status).toBe(403);
    });
});

describe('GET /me/roles', () => {
    const userId = 1
    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get(`/api/v1/sessions/${userId}/roles`);

        expect(res.status).toBe(401);
    });

    it('should return 200 and user roles for ADMIN', async () => {
        const mockRoles = [{ id: 1, name: 'ADMIN' }];

        mockUserRepo.getUserRoles.mockResolvedValueOnce(mockRoles);

        const res = await request(app)
            .get(`/api/v1/sessions/${userId}/roles`)
            .set('X-Test-User-Type', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockRoles);
    });

    it('should return 200 and user roles for STAFF', async () => {
        const mockRoles = [{ id: 2, name: 'STAFF' }];

        mockUserRepo.getUserRoles.mockResolvedValueOnce(mockRoles);

        const res = await request(app)
            .get(`/api/v1/sessions/${userId}/roles`)
            .set('X-Test-User-Type', 'STAFF');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockRoles);
        expect(mockUserRepo.getUserRoles).toHaveBeenCalledWith(userId);
    });

    it('should return 403 if user is not ADMIN or STAFF', async () => {
        const res = await request(app)
            .get(`/api/v1/sessions/${userId}/roles`)
            .set('X-Test-User-Type', 'USER');

        expect(res.status).toBe(403);
    });

});

describe('GET /available_staff', () => {
    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/available_staff')

        expect(res.status).toBe(401);
    });

    it('should return 403 if user is not ADMIN', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/available_staff')
            .set('X-Test-User-Type', 'STAFF');

        expect(res.status).toBe(403);
    });

    it('should return 200 and available staff for ADMIN', async () => {
        const mockUsers = [
            {
                id: 1,
                username: 'staff1',
                name: 'Mario',
                surname: 'Rossi',
                email: 'mario.rossi@test.it'
            },
            {
                id: 2,
                username: 'staff2',
                name: 'Luigi',
                surname: 'Verdi',
                email: 'luigi.verdi@test.it'
            }
        ];

        mockUserRepo.getAvailableStaffForRoleAssignment.mockResolvedValueOnce(mockUsers);

        const res = await request(app)
            .get('/api/v1/sessions/available_staff')
            .set('X-Test-User-Type', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, username: 'staff1', name: 'Mario', surname: 'Rossi' },
            { id: 2, username: 'staff2', name: 'Luigi', surname: 'Verdi' }
        ]);
    });

    it('should return 500 if repository throws', async () => {
        mockUserRepo.getAvailableStaffForRoleAssignment.mockRejectedValueOnce(
            new Error('DB error')
        );

        const res = await request(app)
            .get('/api/v1/sessions/available_staff')
            .set('X-Test-User-Type', 'ADMIN');

        expect([500]).toContain(res.status);
    });
});

describe('GET /assigned_staff', () => {
    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/assigned_staff')

        expect(res.status).toBe(401);
    });

    it('should return 403 if user is not ADMIN', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/assigned_staff')
            .set('X-Test-User-Type', 'STAFF');

        expect(res.status).toBe(403);
    });

    it('should return 200 and assigned staff for ADMIN', async () => {
        const mockUsers = [
            {
                id: 1,
                username: 'staff1',
                name: 'Mario',
                surname: 'Rossi',
                email: 'mario.rossi@test.it'
            },
            {
                id: 2,
                username: 'staff2',
                name: 'Luigi',
                surname: 'Verdi',
                email: 'luigi.verdi@test.it'
            }
        ];

        mockUserRepo.getAssignedStaffForRoleModification.mockResolvedValueOnce(mockUsers);

        const res = await request(app)
            .get('/api/v1/sessions/assigned_staff')
            .set('X-Test-User-Type', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, username: 'staff1', name: 'Mario', surname: 'Rossi' },
            { id: 2, username: 'staff2', name: 'Luigi', surname: 'Verdi' }
        ]);
    });

    it('should return 500 if repository throws', async () => {
        mockUserRepo.getAssignedStaffForRoleModification.mockRejectedValueOnce(
            new Error('DB error')
        );

        const res = await request(app)
            .get('/api/v1/sessions/assigned_staff')
            .set('X-Test-User-Type', 'ADMIN');

        expect([500]).toContain(res.status);
    });
});


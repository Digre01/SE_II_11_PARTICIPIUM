import { jest } from '@jest/globals';
import { authorizeUserType, requireAdminIfCreatingStaff, authorizeRole } from '../../middlewares/userAuthorization.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';

describe('authorizeUserType', () => {
	it('should call next with UnauthorizedError if not authenticated', async () => {
		const req = { isAuthenticated: () => false };
		const next = jest.fn();
		await authorizeUserType(['ADMIN'])(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
	});

	it('should call next with InsufficientRightsError if userType not allowed', async () => {
		const req = { isAuthenticated: () => true, user: { userType: 'CITIZEN' } };
		const next = jest.fn();
		await authorizeUserType(['ADMIN'])(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(InsufficientRightsError);
	});

	it('should call next with no error if userType allowed', async () => {
		const req = { isAuthenticated: () => true, user: { userType: 'ADMIN' } };
		const next = jest.fn();
		await authorizeUserType(['ADMIN', 'STAFF'])(req, {}, next);
		expect(next).toHaveBeenCalledWith();
	});
});

describe('requireAdminIfCreatingStaff', () => {
	it('should call next for CITIZEN signup', () => {
		const req = { body: { userType: 'CITIZEN' } };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next).toHaveBeenCalledWith();
	});

	it('should call next for missing userType', () => {
		const req = { body: {} };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next).toHaveBeenCalledWith();
	});

	it('should call next with UnauthorizedError if not authenticated', () => {
		const req = { body: { userType: 'STAFF' }, isAuthenticated: () => false };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
	});

	it('should call next with InsufficientRightsError if not ADMIN', () => {
		const req = { body: { userType: 'STAFF' }, isAuthenticated: () => true, user: { userType: 'STAFF' } };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(InsufficientRightsError);
	});

	it('should call next for ADMIN and STAFF signup', () => {
		const req = { body: { userType: 'STAFF' }, isAuthenticated: () => true, user: { userType: 'ADMIN' } };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next).toHaveBeenCalledWith();
	});

	it('should call next with error if thrown', () => {
		const req = { body: { userType: 'STAFF' }, isAuthenticated: () => { throw new Error('fail') } };
		const next = jest.fn();
		requireAdminIfCreatingStaff(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
	});
});

describe('authorizeRole', () => {
	it('should call next with UnauthorizedError if not authenticated', async () => {
		const req = { isAuthenticated: () => false };
		const next = jest.fn();
		await authorizeRole('Manager')(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
	});

	it('should call next with UnauthorizedError if no userId', async () => {
		const req = { isAuthenticated: () => true, user: {} };
		const next = jest.fn();
		await authorizeRole('Manager')(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
	});

	it('should call next with InsufficientRightsError if no userOffices', async () => {
		const req = { isAuthenticated: () => true, user: { id: 1 } };
		const next = jest.fn();
		const repo = { find: jest.fn().mockResolvedValue([]) };
		const dataSourceModule = await import('../../config/data-source.js');
		const origGetRepo = dataSourceModule.AppDataSourcePostgres.getRepository;
		dataSourceModule.AppDataSourcePostgres.getRepository = () => repo;
		await authorizeRole('Manager')(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(InsufficientRightsError);
		dataSourceModule.AppDataSourcePostgres.getRepository = origGetRepo;
	});

	it('should call next with InsufficientRightsError if no matching role', async () => {
		const req = { isAuthenticated: () => true, user: { id: 1 } };
		const next = jest.fn();
		const repo = { find: jest.fn().mockResolvedValue([{ role: { name: 'Other' } }]) };
		const dataSourceModule = await import('../../config/data-source.js');
		const origGetRepo = dataSourceModule.AppDataSourcePostgres.getRepository;
		dataSourceModule.AppDataSourcePostgres.getRepository = () => repo;
		await authorizeRole('Manager')(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(InsufficientRightsError);
		dataSourceModule.AppDataSourcePostgres.getRepository = origGetRepo;
	});

	it('should call next if matching role found', async () => {
		const req = { isAuthenticated: () => true, user: { id: 1 } };
		const next = jest.fn();
		const repo = { find: jest.fn().mockResolvedValue([{ role: { name: 'Manager' } }]) };
		const dataSourceModule = await import('../../config/data-source.js');
		const origGetRepo = dataSourceModule.AppDataSourcePostgres.getRepository;
		dataSourceModule.AppDataSourcePostgres.getRepository = () => repo;
		await authorizeRole('Manager')(req, {}, next);
		expect(next).toHaveBeenCalledWith();
		dataSourceModule.AppDataSourcePostgres.getRepository = origGetRepo;
	});

	it('should call next with error if thrown', async () => {
		const req = { isAuthenticated: () => true, user: { id: 1 } };
		const next = jest.fn();
		const dataSourceModule = await import('../../config/data-source.js');
		const origGetRepo = dataSourceModule.AppDataSourcePostgres.getRepository;
		dataSourceModule.AppDataSourcePostgres.getRepository = () => { throw new Error('fail') };
		await authorizeRole('Manager')(req, {}, next);
		expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
		dataSourceModule.AppDataSourcePostgres.getRepository = origGetRepo;
	});
});

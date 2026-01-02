import {afterEach, beforeAll, describe, expect, it, jest} from '@jest/globals';
import {authorizeRole} from '../../../middlewares/userAuthorization.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../../../errors/InsufficientRightsError.js';
import { createMockReq, createMockRes, createMockNext } from '../mocks/test-utils.mocks.js';

describe('Middleware: authorizeRole', () => {
	let dataSourceModule;
	let origGetRepo;

	beforeAll(async () => {
		dataSourceModule = await import('../../../config/data-source.js');
		origGetRepo = dataSourceModule.AppDataSourcePostgres.getRepository;
	});

	afterEach(() => {
		dataSourceModule.AppDataSourcePostgres.getRepository = origGetRepo;
		jest.clearAllMocks();
	});

	it('throws UnauthorizedError if not authenticated', async () => {
		const req = createMockReq({ isAuthenticated: () => false });
		const next = createMockNext();
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
	});

	it('throws UnauthorizedError if no userId', async () => {
		const req = createMockReq({ isAuthenticated: () => true, user: {} });
		const next = createMockNext();
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
	});

	it('throws InsufficientRightsError if no roles found', async () => {
		const req = createMockReq({ isAuthenticated: () => true, user: { id: 1 } });
		const next = createMockNext();
		dataSourceModule.AppDataSourcePostgres.getRepository = () => ({ find: jest.fn().mockResolvedValue([]) });
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
	});

	it('throws InsufficientRightsError if role does not match', async () => {
		const req = createMockReq({ isAuthenticated: () => true, user: { id: 1 } });
		const next = createMockNext();
		dataSourceModule.AppDataSourcePostgres.getRepository = () => ({ find: jest.fn().mockResolvedValue([{ role: { name: 'Other' } }]) });
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
	});

	it('passes if role matches', async () => {
		const req = createMockReq({ isAuthenticated: () => true, user: { id: 1 } });
		const next = createMockNext();
		dataSourceModule.AppDataSourcePostgres.getRepository = () => ({ find: jest.fn().mockResolvedValue([{ role: { name: 'Manager' } }]) });
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it('catches thrown errors', async () => {
		const req = createMockReq({ isAuthenticated: () => true, user: { id: 1 } });
		const next = createMockNext();
		dataSourceModule.AppDataSourcePostgres.getRepository = () => { throw new Error('fail'); };
		await authorizeRole('Manager')(req, createMockRes(), next);
		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});
});

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Stubs for repositories
const makeRepoStub = () => ({
	findOne: jest.fn(),
	find: jest.fn(),
	findOneBy: jest.fn(),
	create: jest.fn(),
	save: jest.fn(),
});

const convRepo = makeRepoStub();
const msgRepo = makeRepoStub();

// Mock DataSource and ws handler before importing repository
await jest.unstable_mockModule('../../config/data-source.js', () => ({
	AppDataSourcePostgres: {
		getRepository: jest.fn((entity) => {
			const name = entity?.options?.name;
			if (name === 'Conversation') return convRepo;
			if (name === 'Message') return msgRepo;
			return makeRepoStub();
		})
	}
}));

const broadcastSpy = jest.fn();
await jest.unstable_mockModule('../../wsHandler.js', () => ({
	broadcastToConversation: broadcastSpy,
}));

const {
	sendStaffMessage,
	getMessagesForConversation,
	createMessage,
	createSystemMessage,
} = await import('../../../repositories/messageRepository.js');

import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { InsufficientRightsError } from '../../../errors/InsufficientRightsError.js';
import { BadRequestError } from '../../../errors/BadRequestError.js';

describe('Unit: messageRepository', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('sendStaffMessage', () => {
		it('succeeds for participant and broadcasts', async () => {
			convRepo.findOne.mockResolvedValueOnce({
				id: 100,
				participants: [{ id: 42 }],
				report: { status: 'assigned' },
			});
			const created = { id: 11, content: 'Hi', sender: { id: 42 } };
			msgRepo.create.mockReturnValue(created);
			msgRepo.save.mockResolvedValue(created);

			const result = await sendStaffMessage(100, 42, 'Hi');

			expect(msgRepo.create).toHaveBeenCalledWith({ conversation: { id: 100 }, sender: { id: 42 }, content: 'Hi' });
			expect(msgRepo.save).toHaveBeenCalledWith(created);
			expect(broadcastSpy).toHaveBeenCalledWith(100, created);
			expect(result).toBe(created);
		});

		it('throws NotFoundError when conversation missing', async () => {
			convRepo.findOne.mockResolvedValueOnce(null);
			await expect(sendStaffMessage(999, 42, 'x')).rejects.toThrow(NotFoundError);
		});

		it('throws UnauthorizedError when user not participant', async () => {
			convRepo.findOne.mockResolvedValueOnce({ id: 100, participants: [{ id: 7 }], report: { status: 'assigned' } });
			await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(UnauthorizedError);
		});

		it('throws BadRequestError when report is resolved', async () => {
			convRepo.findOne.mockResolvedValueOnce({ id: 100, participants: [{ id: 42 }], report: { status: 'resolved' } });
			await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(BadRequestError);
		});

		it('throws BadRequestError when report is rejected', async () => {
			convRepo.findOne.mockResolvedValueOnce({ id: 100, participants: [{ id: 42 }], report: { status: 'rejected' } });
			await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(BadRequestError);
		});
	});

	describe('getMessagesForConversation', () => {
		it('returns messages for participant', async () => {
			convRepo.findOne.mockResolvedValueOnce({ id: 100, participants: [{ id: 42 }] });
			const rows = [{ id: 1, content: 'A' }, { id: 2, content: 'B' }];
			msgRepo.find.mockResolvedValueOnce(rows);

			const result = await getMessagesForConversation(100, 42);

			expect(msgRepo.find).toHaveBeenCalledWith({ where: { conversation: { id: 100 } }, relations: ['sender'] });
			expect(result).toEqual(rows);
		});

		it('throws NotFoundError when conversation missing', async () => {
			convRepo.findOne.mockResolvedValueOnce(null);
			await expect(getMessagesForConversation(999, 42)).rejects.toThrow(NotFoundError);
		});

		it('throws InsufficientRightsError when user not participant', async () => {
			convRepo.findOne.mockResolvedValueOnce({ id: 100, participants: [{ id: 7 }] });
			await expect(getMessagesForConversation(100, 42)).rejects.toThrow(InsufficientRightsError);
		});
	});

	describe('createMessage & createSystemMessage', () => {
		it('createMessage stores user message and returns saved row', async () => {
			const created = { id: 99, content: 'Hello', sender: { id: 42 }, conversation: { id: 100 } };
			msgRepo.create.mockReturnValueOnce(created);
			msgRepo.save.mockResolvedValueOnce(created);

			const result = await createMessage(100, 42, 'Hello');

			expect(msgRepo.create).toHaveBeenCalledWith({ conversation: { id: 100 }, sender: { id: 42 }, content: 'Hello' });
			expect(msgRepo.save).toHaveBeenCalledWith(created);
			expect(result).toBe(created);
		});

		it('createSystemMessage stores system message with isSystem=true and null sender', async () => {
			const created = { id: 101, content: 'System', sender: null, isSystem: true, conversation: { id: 100 } };
			msgRepo.create.mockReturnValueOnce(created);
			msgRepo.save.mockResolvedValueOnce(created);

			const result = await createSystemMessage(100, 'System');

			expect(msgRepo.create).toHaveBeenCalledWith({ conversation: { id: 100 }, sender: null, content: 'System', isSystem: true });
			expect(msgRepo.save).toHaveBeenCalledWith(created);
			expect(result).toBe(created);
		});
	});
});


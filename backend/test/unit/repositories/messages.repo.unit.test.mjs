import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
	messageRepoStub,
	conversationRepoStub
} from '../mocks/repo.stubs.js';

import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { InsufficientRightsError } from '../../../errors/InsufficientRightsError.js';
import { BadRequestError } from '../../../errors/BadRequestError.js';

let sendStaffMessage;
let getMessagesForConversation;
let createMessage;
let createSystemMessage;

let conversationMock;
let messageMock;

beforeAll(async () => {
	const repo = await import('../../../repositories/messageRepository.js');
	sendStaffMessage = repo.sendStaffMessage;
	getMessagesForConversation = repo.getMessagesForConversation;
	createMessage = repo.createMessage;
	createSystemMessage = repo.createSystemMessage;
});

beforeEach(() => {
	jest.clearAllMocks();

	conversationMock = {
		id: 100,
		participants: [{ id: 42 }],
		report: { status: 'assigned' },
	};

	messageMock = { id: 1, content: 'Hi', sender: { id: 42 } };

	conversationRepoStub.findOne.mockResolvedValue(conversationMock);
	messageRepoStub.create.mockReturnValue(messageMock);
	messageRepoStub.save.mockResolvedValue(messageMock);
	messageRepoStub.find.mockResolvedValue([messageMock]);
});

describe('sendStaffMessage', () => {
	it('succeeds for participant and broadcasts', async () => {
		const result = await sendStaffMessage(100, 42, 'Hi');

		expect(messageRepoStub.create).toHaveBeenCalledWith({
			conversation: { id: 100 },
			sender: { id: 42 },
			content: 'Hi',
		});
		expect(messageRepoStub.save).toHaveBeenCalledWith(messageMock);
		expect(result).toBe(messageMock);
	});

	it('throws NotFoundError when conversation missing', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce(null);
		await expect(sendStaffMessage(999, 42, 'x')).rejects.toThrow(NotFoundError);
	});

	it('throws UnauthorizedError when user not participant', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce({
			...conversationMock,
			participants: [{ id: 7 }],
		});
		await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(UnauthorizedError);
	});

	it('throws BadRequestError when report is resolved', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce({
			...conversationMock,
			report: { status: 'resolved' },
		});
		await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(BadRequestError);
	});

	it('throws BadRequestError when report is rejected', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce({
			...conversationMock,
			report: { status: 'rejected' },
		});
		await expect(sendStaffMessage(100, 42, 'x')).rejects.toThrow(BadRequestError);
	});
});

describe('getMessagesForConversation', () => {
	it('returns messages for participant', async () => {
		const result = await getMessagesForConversation(100, 42);
		expect(messageRepoStub.find).toHaveBeenCalledWith({
			where: { conversation: { id: 100 } },
			relations: ['sender'],
		});
		expect(result).toEqual([messageMock]);
	});

	it('throws NotFoundError when conversation missing', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce(null);
		await expect(getMessagesForConversation(999, 42)).rejects.toThrow(NotFoundError);
	});

	it('throws InsufficientRightsError when user not participant', async () => {
		conversationRepoStub.findOne.mockResolvedValueOnce({
			...conversationMock,
			participants: [{ id: 7 }],
		});
		await expect(getMessagesForConversation(100, 42)).rejects.toThrow(InsufficientRightsError);
	});
});

describe('createMessage & createSystemMessage', () => {
	it('createMessage stores user message', async () => {
		const result = await createMessage(100, 42, 'Hello');
		expect(messageRepoStub.create).toHaveBeenCalled();
		expect(messageRepoStub.save).toHaveBeenCalledWith(messageMock);
		expect(result).toBe(messageMock);
	});

	it('createSystemMessage stores system message', async () => {
		const systemMessage = { id: 101 };
		messageRepoStub.create.mockReturnValueOnce(systemMessage);
		messageRepoStub.save.mockResolvedValueOnce(systemMessage);

		const result = await createSystemMessage(100, 'System');
		expect(messageRepoStub.create).toHaveBeenCalledWith({
			conversation: { id: 100 },
			sender: null,
			content: 'System',
			isSystem: true,
		});
		expect(result).toBe(systemMessage);
	});
});

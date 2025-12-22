import {describe, it, expect, beforeEach, jest} from "@jest/globals";
import { createMockRes, createMockNext } from "../mocks/test-utils.mocks.js";
import { getConversationsForUserMock } from '../mocks/external.mocks.js';

const { getUserConversations } = await import('../../../controllers/conversationController.js');

describe('conversationController.getUserConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return conversations as json', async () => {
    const mockConversations = [{ id: 1, title: 'TestConv' }];
    getConversationsForUserMock.mockResolvedValue(mockConversations);

    const req = { user: { id: 42 } };
    const res = createMockRes();
    const next = createMockNext();

    await getUserConversations(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockConversations);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next on error', async () => {
    const mockError = new Error('Database connection failed');
    getConversationsForUserMock.mockRejectedValueOnce(mockError);

    const req = { user: { id: 42 } };
    const res = createMockRes();
    const next = createMockNext();

    await getUserConversations(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});
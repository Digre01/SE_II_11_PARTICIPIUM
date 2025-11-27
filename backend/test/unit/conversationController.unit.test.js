// backend/test/unit/conversationController.unit.test.js
import { describe, it, expect, jest } from "@jest/globals";

// Mock prima di importare il controller!
await jest.unstable_mockModule(
  '../../repositories/conversationRepository.js',
  () => ({
    getConversationsForUser: jest.fn().mockResolvedValue([{ id: 1, title: 'TestConv' }])
  })
);

const { getUserConversations } = await import('../../controllers/conversationController.js');

function createMockRes() {
  return { json: jest.fn() };
}

describe('conversationController', () => {
  it('should return conversations as json', async () => {
    const req = { user: { id: 42 } };
    const res = createMockRes();
    const next = jest.fn();
    await getUserConversations(req, res, next);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'TestConv' }]);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next on error', async () => {
    const { getConversationsForUser } = await import('../../repositories/conversationRepository.js');
    getConversationsForUser.mockRejectedValueOnce(new Error('fail'));
    const req = { user: { id: 42 } };
    const res = createMockRes();
    const next = jest.fn();
    await getUserConversations(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

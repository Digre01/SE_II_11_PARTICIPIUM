import { describe, it, expect, jest } from "@jest/globals";

// Mock prima di importare il controller!
await jest.unstable_mockModule(
  '../../repositories/categoryRepository.mjs',
  () => ({
    categoryRepository: {
      getAllCategories: jest.fn().mockResolvedValue([{ id: 1, name: 'TestCat' }])
    }
  })
);

const { getAllCategories } = await import('../../controllers/categoryController.mjs');

// Helper per mock res, next
function createMockRes() {
  return { json: jest.fn() };
}

describe('categoryController', () => {
  it('should return categories as json', async () => {
    const req = {};
    const res = createMockRes();
    const next = jest.fn();
    await getAllCategories(req, res, next);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'TestCat' }]);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next on error', async () => {
    // Override mock per errore
    const { categoryRepository } = await import('../../repositories/categoryRepository.mjs');
    categoryRepository.getAllCategories.mockRejectedValueOnce(new Error('fail'));
    const req = {};
    const res = createMockRes();
    const next = jest.fn();
    await getAllCategories(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
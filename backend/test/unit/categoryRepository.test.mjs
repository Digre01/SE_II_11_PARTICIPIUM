import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Categories come oggetto fittizio
const fakeCategories = Symbol('FakeCategories');

await jest.unstable_mockModule('../../entities/Categories.js', () => ({
  Categories: fakeCategories
}));

// Mock AppDataSourcePostgres
const mockFind = jest.fn();
await jest.unstable_mockModule('../../config/data-source.js', () => ({
  AppDataSourcePostgres: {
    getRepository: jest.fn(() => ({ find: mockFind }))
  }
}));

const { CategoryRepository } = await import('../../repositories/categoryRepository.mjs');
const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { Categories } = await import('../../entities/Categories.js');

describe('CategoryRepository', () => {
  let repo;

  beforeEach(() => {
    mockFind.mockReset();
    repo = new CategoryRepository();
  });

  it('getAllCategories chiama find sul repository', async () => {
    mockFind.mockResolvedValue([{ id: 1, name: 'cat' }]);
    const result = await repo.getAllCategories();
    expect(AppDataSourcePostgres.getRepository).toHaveBeenCalledWith(Categories);
    expect(mockFind).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: 'cat' }]);
  });
});
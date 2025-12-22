import {describe, it, expect, beforeEach, jest} from '@jest/globals';
import { categoryRepoStub} from "../mocks/shared.mocks.js";

const { categoryRepository } = await import('../../../repositories/categoryRepository.mjs');

describe('CategoryRepository.getAllCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Infrastructure', description: 'Roads and bridges' },
      { id: 2, name: 'Public Safety', description: 'Safety issues' }
    ];

    categoryRepoStub.find.mockResolvedValue(mockCategories);

    const result = await categoryRepository.getAllCategories();

    expect(categoryRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual(mockCategories);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no categories exist', async () => {
    categoryRepoStub.find.mockResolvedValue([]);

    const result = await categoryRepository.getAllCategories();

    expect(categoryRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

describe('CategoryRepository.getCategoryById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a specific category when found', async () => {
    const mockCategory = {
      id: 1,
      name: 'Infrastructure',
      description: 'Roads, bridges, and public infrastructure'
    };

    categoryRepoStub.findOneBy.mockResolvedValue(mockCategory);

    const result = await categoryRepository.getCategoryById(1);

    expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(mockCategory);
  });

  it('returns null when category not found', async () => {
    categoryRepoStub.findOneBy.mockResolvedValue(null);

    const result = await categoryRepository.getCategoryById(999);

    expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 999 });
    expect(result).toBeNull();
  });

  it('converts string id to number', async () => {
    const mockCategory = { id: 5, name: 'Test Category' };
    categoryRepoStub.findOneBy.mockResolvedValue(mockCategory);

    await categoryRepository.getCategoryById('5');

    expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 5 });
  });
});
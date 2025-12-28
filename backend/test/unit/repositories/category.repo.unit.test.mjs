import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import { categoryRepoStub } from "../mocks/repo.stubs.js";

let categoryRepository;

beforeAll(async () => {
  ({ categoryRepository } =
      await import('../../../repositories/categoryRepository.mjs'));
});

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

  it('returns category given internal officeId', async () => {
    const mockOfficeId = 1
    const mockCategory = { id: 1, name: 'Infrastructure', description: 'Roads and bridges' }

    categoryRepoStub.findOneBy.mockResolvedValue(mockCategory);

    const result = await categoryRepository.findCategoriesByOfficeId(mockOfficeId, false);

    expect(categoryRepoStub.findOneBy).toHaveBeenCalled();
    expect(result).toEqual(mockCategory);
  });

  it('returns category given external officeId', async () => {
    const mockOfficeId = 1
    const mockCategory = { id: 1, name: 'Infrastructure', description: 'Roads and bridges' }

    categoryRepoStub.findOneBy.mockResolvedValue(mockCategory);

    const result = await categoryRepository.findCategoriesByOfficeId(mockOfficeId, true);

    expect(categoryRepoStub.findOneBy).toHaveBeenCalled();
    expect(result).toEqual(mockCategory);
  });
});
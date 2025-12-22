import {describe, it, expect, beforeEach, jest} from "@jest/globals";
import { categoryRepoStub } from "../mocks/shared.mocks.js";
import { createMockRes, createMockNext } from "../mocks/test-utils.mocks.js";

const { getAllCategories } = await import('../../../controllers/categoryController.mjs');

describe('categoryController.getAllCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return categories as json', async () => {
    const mockCategories = [
      { id: 1, name: 'Infrastructure' },
      { id: 2, name: 'Public Safety' }
    ];

    categoryRepoStub.find.mockResolvedValue(mockCategories);

    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    await getAllCategories(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockCategories);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next on error', async () => {
    const error = new Error('Database connection failed');
    categoryRepoStub.find.mockRejectedValueOnce(error);

    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    await getAllCategories(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return empty array when no categories exist', async () => {
    categoryRepoStub.find.mockResolvedValue([]);

    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    await getAllCategories(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });
});
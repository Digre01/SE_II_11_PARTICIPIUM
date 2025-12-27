import {jest} from "@jest/globals";

export const mockCategoryRepo =  {
    findCategoriesByOfficeId: jest.fn()
}

await jest.unstable_mockModule('../../../repositories/categoryRepository.mjs', () => ({
    categoryRepository: mockCategoryRepo,
}));
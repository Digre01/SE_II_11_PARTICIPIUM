import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fakeOffice = Symbol('FakeOffice');

await jest.unstable_mockModule('../../entities/Offices.js', () => ({
  Office: fakeOffice
}));

const mockFind = jest.fn();
const mockFindOneBy = jest.fn();

await jest.unstable_mockModule('../../config/data-source.js', () => ({
  AppDataSourcePostgres: {
    getRepository: jest.fn(() => ({ find: mockFind, findOneBy: mockFindOneBy }))
  }
}));

const { officeRepository } = await import('../../repositories/officeRepository.js');
const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { Office } = await import('../../entities/Offices.js');

describe('officeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll chiama find sul repository', async () => {
    mockFind.mockResolvedValue([{ id: 1, name: 'office' }]);
    const result = await officeRepository.findAll();
    expect(AppDataSourcePostgres.getRepository).toHaveBeenCalledWith(Office);
    expect(mockFind).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: 'office' }]);
  });

  it('findById chiama findOneBy sul repository', async () => {
    mockFindOneBy.mockResolvedValue({ id: 2, name: 'office2' });
    const result = await officeRepository.findById(2);
    expect(AppDataSourcePostgres.getRepository).toHaveBeenCalledWith(Office);
    expect(mockFindOneBy).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual({ id: 2, name: 'office2' });
  });
});
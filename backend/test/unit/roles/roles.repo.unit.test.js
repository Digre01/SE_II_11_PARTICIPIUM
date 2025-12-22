import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock data-source and entity
const findMock = jest.fn();
const findOneByMock = jest.fn();

await jest.unstable_mockModule('../../config/data-source.js', () => ({
  AppDataSourcePostgres: {
    getRepository: () => ({
      find: findMock,
      findOneBy: findOneByMock,
    })
  }
}));

await jest.unstable_mockModule('../../entities/Roles.js', () => ({
  Roles: class {}
}));

const { rolesRepository } = await import('../../../repositories/rolesRepository.js');

describe('rolesRepository', () => {
  beforeEach(() => {
    findMock.mockReset();
    findOneByMock.mockReset();
  });

  it('findAll chiama find e ritorna i ruoli', async () => {
    findMock.mockResolvedValue([{ id: 1, name: 'admin' }, { id: 2, name: 'user' }]);
    const result = await rolesRepository.findAll();
    expect(findMock).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: 'admin' }, { id: 2, name: 'user' }]);
  });

  it('findById chiama findOneBy con id e ritorna il ruolo', async () => {
    findOneByMock.mockResolvedValue({ id: 2, name: 'user' });
    const result = await rolesRepository.findById(2);
    expect(findOneByMock).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual({ id: 2, name: 'user' });
  });

  it('findById ritorna null se non trovato', async () => {
    findOneByMock.mockResolvedValue(null);
    const result = await rolesRepository.findById(99);
    expect(findOneByMock).toHaveBeenCalledWith({ id: 99 });
    expect(result).toBeNull();
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {rolesRepoStub} from "../mocks/shared.mocks.js";

const { rolesRepository } = await import('../../../repositories/rolesRepository.js');

describe('rolesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll chiama find e ritorna i ruoli', async () => {
    const mockRoles = [
        { id: 1, name: 'admin' },
      { id: 2, name: 'user' }
    ];
    rolesRepoStub.find.mockResolvedValue(mockRoles)

    const result = await rolesRepository.findAll();

    expect(rolesRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: 'admin' }, { id: 2, name: 'user' }]);
  });

  it('findById chiama findOneBy con id e ritorna il ruolo', async () => {
    const mockRole = { id: 2, name: 'user' };
    rolesRepoStub.findOneBy.mockResolvedValue(mockRole)

    const result = await rolesRepository.findById(2);

    expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual({ id: 2, name: 'user' });
  });

  it('findById ritorna null se non trovato', async () => {
    rolesRepoStub.findOneBy.mockResolvedValue(null);

    const result = await rolesRepository.findById(99);

    expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 99 });
    expect(result).toBeNull();
  });
});

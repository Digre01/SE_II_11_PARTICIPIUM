import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { rolesRepoStub } from "../mocks/repo.stubs.js";

const { rolesRepository } = await import('../../../repositories/rolesRepository.js');

let mockRole;
let mockRoles;

describe('rolesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRole = { id: 1, name: 'admin' };
    mockRoles = [mockRole, { id: 2, name: 'user' }];

    rolesRepoStub.find.mockResolvedValue(mockRoles);
    rolesRepoStub.findOneBy.mockResolvedValue(mockRole);
  });

  it('findAll chiama find e ritorna i ruoli', async () => {
    const result = await rolesRepository.findAll();

    expect(rolesRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual(mockRoles);
  });

  it('findById chiama findOneBy con id e ritorna il ruolo', async () => {
    const role = { id: 2, name: 'user' };
    rolesRepoStub.findOneBy.mockResolvedValueOnce(role);

    const result = await rolesRepository.findById(2);

    expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual(role);
  });

  it('findById ritorna null se non trovato', async () => {
    rolesRepoStub.findOneBy.mockResolvedValueOnce(null);

    const result = await rolesRepository.findById(99);

    expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 99 });
    expect(result).toBeNull();
  });
});

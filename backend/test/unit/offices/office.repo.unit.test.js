import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { officeRepoStub } from '../mocks/shared.mocks.js';

const { officeRepository } = await import('../../../repositories/officeRepository.js');

describe('officeRepository (unit test)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll chiama find sul repository e ritorna dati', async () => {
    const mockData = [
        { id: 1, name: 'office' }
    ];
    officeRepoStub.find.mockResolvedValue(mockData);

    const result = await officeRepository.findAll();

    expect(officeRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('findById chiama findOneBy sul repository e ritorna il dato corretto', async () => {
    const mockData = { id: 2, name: 'office2' };
    officeRepoStub.findOneBy.mockResolvedValue(mockData);

    const result = await officeRepository.findById(2);

    expect(officeRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual(mockData);
  });

  it('findById ritorna null se non trova l’ufficio', async () => {
    officeRepoStub.findOneBy.mockResolvedValue(null);

    const result = await officeRepository.findById(999);

    expect(officeRepoStub.findOneBy).toHaveBeenCalledWith({ id: 999 });
    expect(result).toBeNull();
  });
});

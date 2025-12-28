import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { officeRepoStub } from '../mocks/shared.mocks.js';

const { officeRepository } = await import('../../../repositories/officeRepository.js');

let mockOffice;
let mockOffices;

describe('officeRepository (unit test)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockOffice = { id: 1, name: 'office' };
    mockOffices = [mockOffice];

    officeRepoStub.find.mockResolvedValue(mockOffices);
    officeRepoStub.findOneBy.mockResolvedValue(mockOffice);
  });

  it('findAll chiama find sul repository e ritorna dati', async () => {
    const result = await officeRepository.findAll();

    expect(officeRepoStub.find).toHaveBeenCalled();
    expect(result).toEqual(mockOffices);
  });

  it('findById chiama findOneBy sul repository e ritorna il dato corretto', async () => {
    mockOffice = { id: 2, name: 'office2' };
    officeRepoStub.findOneBy.mockResolvedValueOnce(mockOffice);

    const result = await officeRepository.findById(2);

    expect(officeRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
    expect(result).toEqual(mockOffice);
  });

  it('findById ritorna null se non trova l’ufficio', async () => {
    officeRepoStub.findOneBy.mockResolvedValueOnce(null);

    const result = await officeRepository.findById(999);

    expect(officeRepoStub.findOneBy).toHaveBeenCalledWith({ id: 999 });
    expect(result).toBeNull();
  });
});

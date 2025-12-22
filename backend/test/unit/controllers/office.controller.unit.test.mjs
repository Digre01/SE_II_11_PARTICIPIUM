import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {officeRepoStub} from "../mocks/shared.mocks.js";

const { officeRepository } = await import('../../../repositories/officeRepository.js');

describe('userController - getAllOffices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all offices successfully', async () => {
        const fakeOffices = [
            { id: 1, name: 'Municipality Office' },
            { id: 2, name: 'Technical Office' },
        ];
        officeRepoStub.find.mockResolvedValue(fakeOffices);

        const result = await officeRepository.findAll();

        expect(officeRepoStub.find).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeOffices);
    });
});

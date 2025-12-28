import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {mockOfficeRepo} from "../../mocks/repositories/office.repo.mock.js";

const { default: officeController } = await import('../../../controllers/officeController.js');

describe('userController - getAllOffices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns office by id', async () => {
        const fakeOffice = [
            { id: 1, name: 'Municipality Office' },
        ];
        mockOfficeRepo.findById.mockResolvedValue(fakeOffice)

        const result = await officeController.getOffice(1);

        expect(mockOfficeRepo.findById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeOffice);
    });
});

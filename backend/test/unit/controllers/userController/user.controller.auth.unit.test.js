import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { mockUserRepo } from "../../../mocks/repositories/users.repo.mock.js";
import {mapUserToDTO} from "../../../mocks/services.mocks.js";
import {setupEmailUtilsMock} from "../../../mocks/common.mocks.js";

await setupEmailUtilsMock()
let controller;

beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo.saveEmailVerificationCode.mockResolvedValue();
    mockUserRepo.getEmailVerification.mockResolvedValue({
        code: '123456',
        expiresAt: Date.now() + 10000
    });
    mockUserRepo.markEmailVerified.mockResolvedValue();
    mockUserRepo.getUserById.mockResolvedValue({ isVerified: false });
    mockUserRepo.deleteUser.mockResolvedValue();
    mapUserToDTO.mockReturnValue('dto');
});

describe('createEmailVerification', () => {
    it('saves code and returns', async () => {
        const result = await controller.createEmailVerification(1);
        expect(result.code).toMatch(/\d{6}/);
        expect(result.expiresAt).toBeInstanceOf(Date);
    });
});

describe('verifyEmail', () => {
    it('success', async () => {
        const result = await controller.verifyEmail(1, '123456');
        expect(result).toBe('dto');
    });

    it('throws if code wrong', async () => {
        mockUserRepo.getEmailVerification.mockResolvedValue({
            code: '654321',
            expiresAt: Date.now() + 10000
        });
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Invalid verification code');
    });

    it('throws if expired', async () => {
        mockUserRepo.getEmailVerification.mockResolvedValue({
            code: '123456',
            expiresAt: Date.now() - 10000
        });
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification code expired');
    });

    it('throws if record missing', async () => {
        mockUserRepo.getEmailVerification.mockResolvedValue(null);
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification not found');
    });

    it('handles missing expiresAt', async () => {
        mockUserRepo.getEmailVerification.mockResolvedValue({ code: '123456' });
        const result = await controller.verifyEmail(1, '123456');
        expect(result).toBe('dto');
    });
});

describe('isEmailVerified', () => {
    it('returns true', async () => {
        mockUserRepo.getUserById.mockResolvedValue({ isVerified: true });
        const result = await controller.isEmailVerified(1);
        expect(result).toEqual({ isVerified: true });
    });

    it('throws if user not found', async () => {
        mockUserRepo.getUserById.mockResolvedValue(null);
        await expect(controller.isEmailVerified(1)).rejects.toThrow('User not found');
    });

    it('returns false if not verified', async () => {
        const result = await controller.isEmailVerified(1);
        expect(result).toEqual({ isVerified: false });
    });
});

describe('markEmailVerified', () => {
    it('returns DTO', async () => {
        const result = await controller.markEmailVerified(1);
        expect(result).toBe('dto');
    });
});

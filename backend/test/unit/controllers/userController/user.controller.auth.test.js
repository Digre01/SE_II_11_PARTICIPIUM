import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import {
    userRepositoryMock,
    mapUserToDTO
} from './user.controller.mock.js';

let controller;
beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createEmailVerification', () => {
    it('saves code and returns', async () => {
        userRepositoryMock.saveEmailVerificationCode.mockResolvedValue();
        const result = await controller.createEmailVerification(1);
        expect(result.code).toMatch(/\d{6}/);
        expect(result.expiresAt).toBeInstanceOf(Date);
    });
});

describe('verifyEmail', () => {
    it('success', async () => {
        userRepositoryMock.getEmailVerification.mockResolvedValue({
            code: '123456',
            expiresAt: Date.now() + 10000
        });
        userRepositoryMock.markEmailVerified.mockResolvedValue();
        userRepositoryMock.getUserById.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.verifyEmail(1, '123456');
        expect(result).toBe('dto');
    });

    it('throws if code wrong', async () => {
        userRepositoryMock.getEmailVerification.mockResolvedValue({
            code: '654321',
            expiresAt: Date.now() + 10000
        });
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Invalid verification code');
    });

    it('throws if expired', async () => {
        userRepositoryMock.getEmailVerification.mockResolvedValue({
            code: '123456',
            expiresAt: Date.now() - 10000
        });
        userRepositoryMock.deleteUser.mockResolvedValue();
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification code expired');
    });

    it('throws if record missing', async () => {
        userRepositoryMock.getEmailVerification.mockResolvedValue(null);
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification not found');
    });

    it('handles missing expiresAt', async () => {
        userRepositoryMock.getEmailVerification.mockResolvedValue({ code: '123456' });
        userRepositoryMock.markEmailVerified.mockResolvedValue();
        userRepositoryMock.getUserById.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.verifyEmail(1, '123456');
        expect(result).toBe('dto');
    });
});

describe('isEmailVerified', () => {
    it('returns true', async () => {
        userRepositoryMock.getUserById.mockResolvedValue({ isVerified: true });
        const result = await controller.isEmailVerified(1);
        expect(result).toEqual({ isVerified: true });
    });

    it('throws if user not found', async () => {
        userRepositoryMock.getUserById.mockResolvedValue(null);
        await expect(controller.isEmailVerified(1)).rejects.toThrow('User not found');
    });

    it('returns false if not verified', async () => {
        userRepositoryMock.getUserById.mockResolvedValue({ isVerified: false });
        const result = await controller.isEmailVerified(1);
        expect(result).toEqual({ isVerified: false });
    });
});

describe('markEmailVerified', () => {
    it('returns DTO', async () => {
        userRepositoryMock.markEmailVerified.mockResolvedValue();
        userRepositoryMock.getUserById.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.markEmailVerified(1);
        expect(result).toBe('dto');
    });
});
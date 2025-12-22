import { jest } from '@jest/globals';

export const userRepositoryMock = {
    getUserByEmail: jest.fn(),
    getUserByUsername: jest.fn(),
    getAvailableStaffForRoleAssignment: jest.fn(),
    createUser: jest.fn(),
    saveEmailVerificationCode: jest.fn(),
    getEmailVerification: jest.fn(),
    markEmailVerified: jest.fn(),
    getUserById: jest.fn(),
    assignRoleToUser: jest.fn(),
    configUserAccount: jest.fn(),
    getPfpUrl: jest.fn(),
    deleteUser: jest.fn(),
    setUserRoles: jest.fn(),
};

export const rolesRepositoryMock = { findAll: jest.fn() };
export const officeRepositoryMock = { findAll: jest.fn() };
export const userServiceMock = { hashPassword: jest.fn() };
export const mapUserToDTO = jest.fn();

await jest.unstable_mockModule('../../../../repositories/userRepository.js', () => ({
    userRepository: userRepositoryMock
}));

await jest.unstable_mockModule('../../../../repositories/rolesRepository.js', () => ({
    rolesRepository: rolesRepositoryMock
}));

await jest.unstable_mockModule('../../../../repositories/officeRepository.js', () => ({
    officeRepository: officeRepositoryMock
}));

await jest.unstable_mockModule('../../../../services/userService.js', () => ({
    default: userServiceMock
}));

await jest.unstable_mockModule('../../../../mappers/userMappers.js', () => ({
    mapUserToDTO
}));

jest.unstable_mockModule('../../../../utils/email.js', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

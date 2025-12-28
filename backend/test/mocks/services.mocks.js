import {jest} from "@jest/globals";

export const mapUserToDTO = jest.fn();
export const userServiceMock = {
    hashPassword: jest.fn()
};

await jest.unstable_mockModule('../../services/userService.js', () => ({
    default: userServiceMock
}));

await jest.unstable_mockModule('../../mappers/userMappers.js', () => ({
    mapUserToDTO
}));
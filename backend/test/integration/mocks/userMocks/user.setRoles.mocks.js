import {jest} from "@jest/globals";

export const mockController = {
    setUserRoles: jest.fn()
};

await jest.unstable_mockModule('../../../../controllers/userController.js', () => ({
    default: mockController,
}));
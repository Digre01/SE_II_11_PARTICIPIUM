import { jest } from '@jest/globals';

// ---- Test helper functions ----
export function createMockRes() {
    return {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        sendStatus: jest.fn()
    };
}

export function createMockNext() {
    return jest.fn();
}

export function createMockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        query: {},
        user: {},
        ...overrides
    };
}
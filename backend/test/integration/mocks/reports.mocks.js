import { jest } from "@jest/globals";
import { setupAuthorizationMock, setupUploadMiddlewareMock } from "./common.mocks.js";

// Report Repository mock
export const mockRepo = {
    createReport: jest.fn(),
    getAcceptedReports: jest.fn(),
    getReportById: jest.fn(),
    startReport: jest.fn(),
    finishReport: jest.fn(),
    suspendReport: jest.fn(),
    resumeReport: jest.fn(),
    assignReportToExternalMaintainer: jest.fn(),
};

// Setup authorization middleware with custom behavior for reports
await setupAuthorizationMock({
    allowUnauthorizedThrough: true,  // Allow through for validation error tests
    return401OnAssigned: true        // Return 401 for /assigned routes
});

// Setup upload middleware
await setupUploadMiddlewareMock();

// Mock report repository
await jest.unstable_mockModule('../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo,
}));
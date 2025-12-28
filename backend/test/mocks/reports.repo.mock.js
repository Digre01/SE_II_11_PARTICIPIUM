import { jest } from "@jest/globals";

// Report Repository mock
export const mockRepo = {
    createReport: jest.fn(),
    getAllReports: jest.fn(),
    getAcceptedReports: jest.fn(),
    getReportById: jest.fn(),
    startReport: jest.fn(),
    finishReport: jest.fn(),
    suspendReport: jest.fn(),
    resumeReport: jest.fn(),
    assignReportToExternalMaintainer: jest.fn(),
    externalStart: jest.fn(),
    externalFinish: jest.fn(),
    externalSuspend: jest.fn(),
    externalResume: jest.fn(),
    getReportPhotos: jest.fn(),
    reviewReport: jest.fn()
};

// Mock report repository
await jest.unstable_mockModule('../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo,
}));
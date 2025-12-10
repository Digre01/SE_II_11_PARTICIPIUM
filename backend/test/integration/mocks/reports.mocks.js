import { jest } from "@jest/globals";
import { setupAuthorizationMock, setupUploadMiddlewareMock, setupEmailUtilsMock } from "./common.mocks.js";

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
    externalStart: jest.fn(),
    externalFinish: jest.fn(),
    externalSuspend: jest.fn(),
    externalResume: jest.fn(),
};

// Setup authorization middleware with custom behavior for reports
await setupAuthorizationMock({
    allowUnauthorizedThrough: true,  // Allow through for validation error tests
    return401OnAssigned: true        // Return 401 for /assigned routes
});

// Setup upload middleware
await setupUploadMiddlewareMock();

// Setup email utils (nodemailer) mock
await setupEmailUtilsMock();

// Mock report repository
await jest.unstable_mockModule('../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo,
}));

// Mock passport to mark requests as authenticated and attach user from headers
await jest.unstable_mockModule('../../../config/passport.js', () => ({
    default: {
        initialize: () => (_req, _res, next) => next(),
        authenticate: () => (req, _res, next) => {
            const roleHdr = req.header('X-Test-Role');
            const userTypeHdr = req.header('X-Test-User-Type');
            const authHdr = req.header('Authorization');
            if (roleHdr || userTypeHdr || authHdr) {
                req.user = req.user || { id: 10, userType: roleHdr || userTypeHdr || 'citizen' };
                req.isAuthenticated = () => true;
            } else {
                req.isAuthenticated = () => false;
            }
            next();
        }
    }
}));
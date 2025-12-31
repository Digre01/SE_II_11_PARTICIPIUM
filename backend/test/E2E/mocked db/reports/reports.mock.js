import {jest} from "@jest/globals";
import express from "express";

export const mockRepo = {
    createReport: jest.fn(),
    getReportById: jest.fn(),
    assignReportToExternalMaintainer: jest.fn(),
    startReport: jest.fn(),
    resumeReport: jest.fn(),
    suspendReport: jest.fn(),
    finishReport: jest.fn(),
    externalStart: jest.fn(),
    externalFinish: jest.fn(),
    externalSuspend: jest.fn(),
    externalResume: jest.fn(),
    findOneBy: jest.fn()
};

jest.unstable_mockModule('../../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo
}));
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

jest.unstable_mockModule('../../../repositories/reportRepository.mjs', () => ({
    reportRepository: mockRepo
}));

export async function setupRoutes() {
    jest.unstable_mockModule('../../../routes/reportRoutes.mjs', () => {
        const router = express.Router();

        router.patch('/:id/external/start', async (req, res) => {
            const r = await mockRepo.externalStart({
                reportId: req.params.id,
                externalMaintainerId: 77
            });
            if (!r) return res.status(404).json({ message: 'Not found' });
            res.json(r);
        });

        router.patch('/:id/external/finish', async (req, res) => {
            const r = await mockRepo.externalFinish({
                reportId: req.params.id,
                externalMaintainerId: 77
            });
            if (!r) return res.status(404).json({ message: 'Not found' });
            res.json(r);
        });

        router.patch('/:id/external/suspend', async (req, res) => {
            const r = await mockRepo.externalSuspend({
                reportId: req.params.id,
                externalMaintainerId: 77
            });
            if (!r) return res.status(404).json({ message: 'Not found' });
            res.json(r);
        });

        router.patch('/:id/external/resume', async (req, res) => {
            const r = await mockRepo.externalResume({
                reportId: req.params.id,
                externalMaintainerId: 77
            });
            if (!r) return res.status(404).json({ message: 'Not found' });
            res.json(r);
        });

        return { default: router };
    });
}
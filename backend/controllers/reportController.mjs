import { reportRepository } from "../repositories/reportRepository.mjs";

export async function createReport(reportData) {
  const report = await reportRepository.createReport(reportData);
  return report;
}

export async function getApprovedReports() {
  const reports = await reportRepository.getAllReports();
  return reports;
}
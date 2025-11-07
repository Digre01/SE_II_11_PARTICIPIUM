import { reportRepository } from "../repositories/reportRepository.mjs";

export async function createReport(reportData) {
  const report = await reportRepository.createReport(reportData);
  return report;
}
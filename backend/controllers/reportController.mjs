import { reportRepository } from "../repositories/reportRepository.mjs";

export async function createReport(reportData) {
  const report = await reportRepository.createReport(reportData);
  return report;
}

export async function getAllReports() {
  return await reportRepository.getAllReports();
}

export async function getReport(id) {
  return await reportRepository.getReportById(id);
}

export async function reviewReport(reviewData) {
  return await reportRepository.reviewReport(reviewData);
}
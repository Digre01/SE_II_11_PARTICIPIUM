import {reportRepository} from "../repositories/reportRepository.mjs";

export async function createReport(reportData) {
  return await reportRepository.createReport(reportData);
}

export async function getAllReports() {
  return await reportRepository.getAllReports();
}

export async function getReport(id) {
  return await reportRepository.getReportById(id);
}

export async function getReportsByCategory(categoryId) {
  return await reportRepository.getReportsByCategory(categoryId)
}

export async function getAcceptedReports(){
  return await reportRepository.getAcceptedReports();
}

export async function reviewReport(reviewData) {
  return await reportRepository.reviewReport(reviewData);
}

export async function suspendReport({ reportId, technicianId }) {
  return await reportRepository.suspendReport({ reportId, technicianId });
}

export async function resumeReport({ reportId, technicianId }) {
  return await reportRepository.resumeReport({ reportId, technicianId });
}

export async function startReport({ reportId, technicianId }) {
  return await reportRepository.startReport({ reportId, technicianId });
}

export async function finishReport({ reportId, technicianId }) {
  return await reportRepository.finishReport({ reportId, technicianId });
}

export async function assignReportToExternalMaintainer({reportId, internalStaffMemberId}) {
    console.log("Controller - Assigning report to external maintainer, report id:", reportId);
    return await reportRepository.assignReportToExternalMaintainer(reportId, internalStaffMemberId);
}

export async function getReportPhotos(reportId) {
    return await reportRepository.getReportPhotos(reportId);
}

export async function externalStart({ reportId, externalMaintainerId }) {
  return await reportRepository.externalStart({ reportId, externalMaintainerId });
}

export async function externalFinish({ reportId, externalMaintainerId }) {
  return await reportRepository.externalFinish({ reportId, externalMaintainerId });
}

export async function externalSuspend({ reportId, externalMaintainerId }) {
  return await reportRepository.externalSuspend({ reportId, externalMaintainerId });
}

export async function externalResume({ reportId, externalMaintainerId }) {
  return await reportRepository.externalResume({ reportId, externalMaintainerId });
}
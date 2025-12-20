export function useExternalReports(reports, user, isExternal) {
    return reports.filter(r => {
        const statusMatch = ["assigned", "in_progress", "suspended"].includes(
            String(r.status || "").toLowerCase()
        );

        const userOfficeIds = Array.isArray(user?.officeId)
            ? user.officeId
            : (user?.officeId ? [user.officeId] : []);

        const reportOfficeId = !isExternal
            ? (r.category?.officeId ?? r.officeId)
            : (r.category?.externalOfficeId ?? r.externalOfficeId);

        const externalAssignmentMatch = isExternal
            ? r.assignedExternal === true
            : r.assignedExternal !== true;

        return statusMatch && externalAssignmentMatch;
    });
}

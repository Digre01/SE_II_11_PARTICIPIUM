import API from "../../../API/API.mjs";

export function useReportActions({
                                     selectedOfficeId,
                                     setReports,
                                     setAlertMessage,
                                     setAlertColor,
                                     setAlertVisible,
                                 }) {
    const handleAction = async (action, reportId) => {
        try {
            if (action === "start") await API.startReport(reportId);
            else if (action === "assign") {
                await API.assignReportToExternalMaintainer(reportId);
                setAlertMessage("Report assigned to external office.");
                setAlertColor("primary");
                setAlertVisible(true);
            } else if (action === "finish") await API.finishReport(reportId);
            else if (action === "suspend") await API.suspendReport(reportId);
            else if (action === "resume") await API.resumeReport(reportId);

            if (selectedOfficeId) {
                const category = await API.fetchOfficeCategory(selectedOfficeId);
                const updatedReports = await API.fetchReports(category.id);
                setReports(updatedReports);
            }
        } catch (err) {
            alert("Operation failed: " + err);
        }
    };

    return { handleAction };
}

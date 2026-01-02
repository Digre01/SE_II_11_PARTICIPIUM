import API from "../../../API/API.mjs";
import {fetchAndFilterReports} from "../common.jsx";

export function useReportActions({
    selectedOfficeId,
    isExternal,
    setReports,
    setUserReports,
    setAlertMessage,
    setAlertColor,
    setAlertVisible,
    }) {
    const handleAction = async (action, reportId, userId) => {
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

            if (userId) {
                const userReports = await fetchAndFilterReports({userId})
                setUserReports(userReports);
            }

            if (selectedOfficeId) {
                const category = await API.fetchOfficeCategory(selectedOfficeId, isExternal);
                const filtered = await fetchAndFilterReports({ categoryId: category.id, isExternal });
                setReports(filtered);
            }
        } catch (err) {
            alert("Operation failed: " + err);
        }
    };

    return { handleAction };
}

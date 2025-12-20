import { useEffect, useState } from "react";
import API from "../../../API/API.mjs";

export function useUserReports(userId) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const fetchUserReports = async () => {
            try {
                setLoading(true);
                const data = await API.fetchReportsByTechnician(userId);

                const filtered = data.filter(r =>
                    ["assigned", "in_progress", "suspended"].includes(
                        String(r.status || "").trim().toLowerCase()
                    )
                );

                setReports(filtered);
            } catch (err) {
                console.error(err);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserReports();
    }, [userId]);

    return reports;
}

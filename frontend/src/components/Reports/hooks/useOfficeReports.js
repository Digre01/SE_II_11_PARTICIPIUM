import { useEffect, useState } from "react";
import API from "../../../API/API.mjs";

export function useOfficeReports(selectedOfficeId, isExternal) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedOfficeId) {
            setReports([]);
            return;
        }

        const fetchReports = async () => {
            try {
                setLoading(true);
                const category = await API.fetchOfficeCategory(selectedOfficeId, isExternal);
                const data = await API.fetchReports(category.id);
                setReports(data);
            } catch (err) {
                console.error(err);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [selectedOfficeId, isExternal]);

    return { reports, setReports, loading };
}

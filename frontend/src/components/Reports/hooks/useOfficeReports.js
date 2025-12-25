import { useEffect, useState } from "react";
import API from "../../../API/API.mjs";
import {fetchAndFilterReports} from "../common.jsx";

export function useOfficeReports(selectedOfficeId, isExternal) {
    const [reports, setReports] = useState([]);
    const [loadingOffice, setLoadingOffice] = useState(false);

    useEffect(() => {
        if (!selectedOfficeId) {
            setReports([]);
            return;
        }

        const fetchReports = async () => {
            try {
                setLoadingOffice(true);
                const category = await API.fetchOfficeCategory(selectedOfficeId, isExternal);
                const filtered = await fetchAndFilterReports({ categoryId: category.id, isExternal });
                setReports(filtered);
            } catch (err) {
                console.error(err);
                setReports([]);
            } finally {
                setLoadingOffice(false);
            }
        };

        fetchReports();
    }, [selectedOfficeId, isExternal]);

    return { reports, setReports, loadingOffice };
}

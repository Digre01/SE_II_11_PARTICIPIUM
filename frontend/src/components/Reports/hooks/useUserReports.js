import { useEffect, useState } from "react";
import {fetchAndFilterReports} from "../common.jsx";

export function useUserReports(userId) {
    const [userReports, setUserReports] = useState([]);
    const [loadingUser, setLoadingUser] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const fetchUserReports = async () => {
            try {
                setLoadingUser(true);
                const filtered = await fetchAndFilterReports({ userId });
                setUserReports(filtered);
            } catch (err) {
                console.error(err);
                setUserReports([]);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserReports();
    }, [userId]);

    return { userReports, setUserReports, loadingUser };
}

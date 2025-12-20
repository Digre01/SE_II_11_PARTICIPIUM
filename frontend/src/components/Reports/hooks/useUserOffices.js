import { useEffect, useState } from "react";
import { getUserOffices } from "../common";

export function useUserOffices(user) {
    const [userOffices, setUserOffices] = useState([]);
    const [isExternal, setIsExternal] = useState(false);

    useEffect(() => {
        if (!user?.officeId?.length) return;

        const load = async () => {
            const offices = await getUserOffices(user.officeId);
            setUserOffices(offices);
            setIsExternal(offices.some(o => o.isExternal));
        };

        load();
    }, [user]);

    return { userOffices, isExternal };
}

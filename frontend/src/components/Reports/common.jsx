import {Button} from "react-bootstrap";
import API from "../../API/API.mjs";

export const getStatusVariant = (status) => {
    switch (status) {
        case "pending":
            return "warning";
        case "assigned":
            return "primary";
        case "in_progress":
            return "success";
        case "rejected":
            return "danger";
        case "suspended":
            return "secondary";
        default:
            return "secondary";
    }
};

export const getActionButtons = (report, user, onAction, isExternal, loading) => {
    if (!report) return [];

    const status = String(report.status).toLowerCase();
    const isUserTechnician = report.technicianId === user?.id;

    const createButton = (key, variant, action, label) => (
        <Button
            key={key}
            variant={variant}
            size="sm"
            className={"me-2 mb-2"}
            onClick={() => onAction(action, report.id, user?.id)}
            disabled={loading}
        >
            {label}
        </Button>
    );

    // Determina quali bottoni mostrare in base allo stato
    if (status === "assigned") {
        const buttons = [
            createButton("start", "success", "start", "START"),
            createButton("suspend", "warning", "suspend", "SUSPEND")
        ];
        // do not show the assign button to users that belong to the report's external office
        if (!isExternal) buttons.push(createButton("assign", "primary", "assign", "ASSIGN TO EXTERNAL"));
        return buttons;
    }

    if (status === "in_progress" && isUserTechnician) {
        return [
            createButton("finish", "danger", "finish", "FINISH"),
            createButton("suspend", "warning", "suspend", "SUSPEND")
        ];
    }

    if (status === "suspended") {
        // Chiunque può vedere RESUME se non c'è tecnico assegnato,
        // altrimenti solo il tecnico assegnato
        if (!report.technicianId || isUserTechnician) {
            return [createButton("resume", "info", "resume", "RESUME")];
        }
    }

    return [];
};

export const getUserOffices = async (officesIdArray) => {
    return await Promise.all(
        officesIdArray.map(id => API.fetchOffice(id))
    );
};

export const fetchAndFilterReports = async ({ userId, categoryId, isExternal }) => {
    let data = [];

    if (userId) {
        data = await API.fetchReportsByTechnician(userId);
    } else if (categoryId !== undefined) {
        data = await API.fetchReports(categoryId, isExternal);
    }

    return data.filter(r => {
        const validStatus = ["assigned", "in_progress", "suspended"].includes(
            String(r.status || "").trim().toLowerCase()
        );
        
        if (!validStatus) return false;
        
        // Se stiamo filtrando per userId (report assegnati a un tecnico specifico),
        // non filtrare per assignedExternal - mostra tutti i report del tecnico
        if (userId) {
            return true;
        }
        
        // Se stiamo filtrando per categoryId (report di un ufficio),
        // applica il filtro assignedExternal
        if (categoryId !== undefined) {
            // Se sei utente interno, mostra solo report NON assegnati all'esterno
            if (!isExternal) {
                return r.assignedExternal === null || r.assignedExternal === undefined;
            }
            // Se sei utente esterno, mostra tutti (il backend già filtra)
            return true;
        }
        
        return true;
    });
};

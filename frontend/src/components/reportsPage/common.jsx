import {Button} from "react-bootstrap";

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

export const getActionButtons = (report, user, onAction) => {
    const status = String(report.status).toLowerCase();
    const isUserTechnician = report.technicianId === user?.id;

    // Helper function per creare bottoni
    const createButton = (key, variant, action, label) => (
        <Button
            key={key}
            variant={variant}
            size="sm"
            className={"me-2 mb-2"}
            onClick={() => onAction(action, report.id)}
        >
            {label}
        </Button>
    );

    // Determina quali bottoni mostrare in base allo stato
    if (status === "assigned") {
        return [
            createButton("start", "success", "start", "START"),
            createButton("suspend", "warning", "suspend", "SUSPEND"),
            createButton("assign", "primary", "assign", "ASSIGN")
        ];
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
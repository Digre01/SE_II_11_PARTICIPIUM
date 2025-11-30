import {useState} from "react";
import {Badge, Button, Card} from "react-bootstrap";
import {getStatusVariant} from "./common.js";
import {CardBody, Collapse} from "design-react-kit";

export function ReportRow({ idx, report, user, onAction, onRowClick }) {

    const handleRowClick = (e) => {
        if (e.target.closest('button')) return;
        onRowClick(report);
    };

    // Determina i bottoni da mostrare
    let actionButtons = [];
    const status = String(report.status).toLowerCase();

    if (status === "assigned") {
        actionButtons.push(
            <Button key="start" variant="success" size="sm" className="me-2" onClick={() => onAction('start', report.id)}>START</Button>
        );
        actionButtons.push(
            <Button key="suspend" variant="warning" size="sm" onClick={() => onAction('suspend', report.id)}>SUSPEND</Button>
        );
    } else if (status === "in_progress") {
        if (report.technicianId === user?.id) {
            actionButtons.push(
                <Button key="finish" variant="danger" size="sm" className="me-2" onClick={() => onAction('finish', report.id)}>FINISH</Button>
            );
            actionButtons.push(
                <Button key="suspend" variant="warning" size="sm" onClick={() => onAction('suspend', report.id)}>SUSPEND</Button>
            );
        }
    } else if (status === "suspended") {
        // Se il report è suspended prima di essere in_progress (technicianId null)
        if (!report.technicianId) {
            // Chiunque dell'ufficio può vedere RESUME
            actionButtons.push(
                <Button key="resume" variant="info" size="sm" onClick={() => onAction('resume', report.id)}>RESUME</Button>
            );
        } else if (report.technicianId === user?.id) {
            // Se era in_progress e ora suspended, solo il tecnico assegnato può vedere RESUME
            actionButtons.push(
                <Button key="resume" variant="info" size="sm" onClick={() => onAction('resume', report.id)}>RESUME</Button>
            );
        }
    }

    return (
        <tr
            onClick={handleRowClick}
            style={{ cursor: 'pointer' }}
            className="table-row-hover"
        >
            <td>{idx + 1}</td>
            <td>{report.title}</td>
            <td>{report.latitude}</td>
            <td>{report.longitude}</td>
            <td>
                <Badge bg={getStatusVariant(report.status)} pill>
                    {report.status.replace("_", " ").toUpperCase()}
                </Badge>
            </td>
            <td className="text-end">
                {actionButtons.length > 0 ? actionButtons.map(btn => btn) : null}
            </td>
        </tr>
    );
}

// -------------------------
// Componente per card mobile
// -------------------------
export function ReportCard({ report, onCardClick }) {
    const [open, setOpen] = useState(false);

    return (
        <Card className="mb-3 shadow-sm d-md-none">
            <div
                className="card-header d-flex justify-content-between align-items-center"
                onClick={() => setOpen(!open)}
                style={{ cursor: "pointer" }}
            >
                <span className="fw-semibold">{report.title}</span>
                <span>{open ? "-" : "+"}</span>
            </div>
            <Collapse isOpen={open}>
                <CardBody>
                    <p><strong>Latitude:</strong> {report.latitude}</p>
                    <p><strong>Longitude:</strong> {report.longitude}</p>
                    <p>
                        <strong>Status:</strong>{" "}
                        <Badge bg={getStatusVariant(report.status)} pill>
                            {report.status.replace("_", " ").toUpperCase()}
                        </Badge>
                    </p>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onCardClick(report)}
                    >
                        View
                    </Button>
                </CardBody>
            </Collapse>
        </Card>
    );
}

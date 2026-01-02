import {useState} from "react";
import {Badge, Button, Card} from "react-bootstrap";
import {getActionButtons, getStatusVariant} from "./common.jsx";
import {CardBody, Collapse} from "design-react-kit";

export function ReportRow({ idx, report, user, isExternal, onAction, onRowClick, loading }) {

    const handleRowClick = (e) => {
        if (e.target.closest('button')) return;
        onRowClick(report);
    };

    const actionButtons = getActionButtons(report, user, onAction, isExternal, loading);

    return (
        <tr
            onClick={handleRowClick}
            style={{ cursor: 'pointer' }}
            className="table-row-hover"
        >
            <td>{idx + 1}</td>
            <td>{report.title}</td>
            <td>{report.latitude.toFixed(3)}</td>
            <td>{report.longitude.toFixed(3)}</td>
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

export function ReportCard({ report, user, isExternal, onAction, onCardClick }) {
    const [open, setOpen] = useState(false);

    const actionButtons = getActionButtons(report, user, onAction, isExternal);

    return (
        <Card className="mb-3 shadow-sm d-md-none">
            <div
                className="card-header d-flex justify-content-between align-items-center"
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                        e.preventDefault();
                        setOpen(o => !o);
                    }
                }}
                tabIndex={0}
                role="button"
                style={{ cursor: "pointer" }}
            >
                <span className="fw-semibold">{report.title}</span>
                <span>{open ? "-" : "+"}</span>
            </div>
            <Collapse isOpen={open}>
                <CardBody>
                    <p><strong>Latitude:</strong> {report.latitude.toFixed(3)}</p>
                    <p><strong>Longitude:</strong> {report.longitude.toFixed(3)}</p>
                    <p>
                        <strong>Status:</strong>{" "}
                        <Badge bg={getStatusVariant(report.status)} pill>
                            {report.status.replace("_", " ").toUpperCase()}
                        </Badge>
                    </p>
                    <div className="d-flex flex-column">
                        {actionButtons.length > 0 && actionButtons.map(btn => btn)}
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onCardClick(report)}
                        >
                            View
                        </Button>
                    </div>
                </CardBody>
            </Collapse>
        </Card>
    );
}
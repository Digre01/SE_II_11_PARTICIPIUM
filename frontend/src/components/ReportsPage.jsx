import { useEffect, useState } from "react";
import { Table, Button, Badge, Container, Card, Collapse } from "react-bootstrap";
import API from "../API/API.mjs";

// -------------------------
// Componente per riga desktop
// -------------------------
function ReportRow({ idx, report, user, onAction }) {
    const getStatusVariant = (status) => {
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
        <tr>
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
function ReportCard({ report }) {
    const [open, setOpen] = useState(false);

    const getStatusVariant = (status) => {
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

    return (
        <Card className="mb-3 shadow-sm d-md-none">
            <Card.Header
                className="d-flex justify-content-between align-items-center"
                onClick={() => setOpen(!open)}
                style={{ cursor: "pointer" }}
            >
                <span className="fw-semibold">{report.title}</span>
                <span>{open ? "-" : "+"}</span>
            </Card.Header>
            <Collapse in={open}>
                <Card.Body>
                    <p><strong>Latitude:</strong> {report.latitude}</p>
                    <p><strong>Longitude:</strong> {report.longitude}</p>
                    <p>
                        <strong>Status:</strong>{" "}
                        <Badge bg={getStatusVariant(report.status)} pill>
                            {report.status.replace("_", " ").toUpperCase()}
                        </Badge>
                    </p>
                    <Button variant="outline-primary" size="sm">View</Button>
                </Card.Body>
            </Collapse>
        </Card>
    );
}

// -------------------------
// Pagina principale
// -------------------------
function ReportsPage({user}) {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchReports = async () => {
            const data = await API.fetchReports();
            setReports(data);
        };
        fetchReports();
    }, []);

    const officeReports = (reports || []).filter(r => {
        const statusMatch = ["assigned", "in_progress", "suspended"].includes(String(r.status || '').toLowerCase());
        const officeMatch = r.category?.officeId === user?.officeId;
        return statusMatch && officeMatch;
    });

    const yourReports = (reports || []).filter(r => {
        const status = String(r.status || '').toLowerCase();
        if (status === 'in_progress' && r.technicianId === user?.id) return true;
        // Mostra anche report suspended assegnati a te
        if (status === 'suspended' && r.technicianId === user?.id) return true;
        return false;
    });

    // Handler per azioni dei bottoni
    const handleAction = async (action, reportId) => {
        try {
            if (action === 'start') {
                await API.startReport(reportId);
            } else if (action === 'finish') {
                await API.finishReport(reportId);
            } else if (action === 'suspend') {
                await API.suspendReport(reportId);
            } else if (action === 'resume') {
                await API.resumeReport(reportId);
            }
            // Aggiorna la lista dopo l'azione
            const data = await API.fetchReports();
            setReports(data);
        } catch (err) {
            alert('Operation failed: ' + err);
        }
    };

    return (
        <>
        <Container className="my-4">
            <Card className="shadow-sm p-4">
                <h3 className="mb-4 text-primary text-center">Reports assigned to you</h3>

                {/* Desktop table */}
                <Table responsive hover className="d-none d-md-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {yourReports.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                                No reports available.
                            </td>
                        </tr>
                    ) : (
                        yourReports.map((r, idx) => <ReportRow key={r.id} idx={idx} report={r} user={user} onAction={handleAction} />)
                    )}
                    </tbody>
                </Table>

                {/* Mobile cards */}
                <div className="d-md-none">
                    {officeReports.length === 0 && (
                        <p className="text-center text-muted py-4">No reports available.</p>
                    )}
                    {officeReports.map((r) => (
                        <ReportCard key={r.id} report={r} />
                    ))}
                </div>
            </Card>
        </Container>
        <Container className="my-4">
            <Card className="shadow-sm p-4">
                <h3 className="mb-4 text-primary text-center">Reports assigned to your office</h3>

                {/* Desktop table */}
                <Table responsive hover className="d-none d-md-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {officeReports.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                                No reports available.
                            </td>
                        </tr>
                    ) : (
                        officeReports.map((r, idx) => <ReportRow key={r.id} idx={idx} report={r} user={user} onAction={handleAction} />)
                    )}
                    </tbody>
                </Table>

                {/* Mobile cards */}
                <div className="d-md-none">
                    {officeReports.length === 0 && (
                        <p className="text-center text-muted py-4">No reports available.</p>
                    )}
                    {officeReports.map((r) => (
                        <ReportCard key={r.id} report={r} />
                    ))}
                </div>
            </Card>
        </Container>
        </>
    );
}

export default ReportsPage;
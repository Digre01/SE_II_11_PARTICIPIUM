import { useEffect, useState } from "react";
import { Table, Button, Badge, Container, Card, Collapse } from "react-bootstrap";
import API from "../API/API.mjs";

// -------------------------
// Componente per riga desktop
// -------------------------
function ReportRow({ idx, report }) {
    const getStatusVariant = (status) => {
        switch (status) {
            case "open":
                return "warning";
            case "in_progress":
                return "primary";
            case "resolved":
                return "success";
            case "rejected":
                return "danger";
            default:
                return "secondary";
        }
    };

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
                <Button variant="outline-primary" size="sm">
                    View
                </Button>
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
            case "open":
                return "warning";
            case "in_progress":
                return "primary";
            case "resolved":
                return "success";
            case "rejected":
                return "danger";
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
function ReportsPage() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchReports = async () => {
            const data = await API.fetchReports();
            setReports(data);
        };
        fetchReports();
    }, []);

    return (
        <Container className="my-4">
            <Card className="shadow-sm p-4">
                <h3 className="mb-4 text-primary text-center">Reports Overview</h3>

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
                    {reports.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                                No reports available.
                            </td>
                        </tr>
                    ) : (
                        reports.map((r, idx) => <ReportRow key={r.id} idx={idx} report={r} />)
                    )}
                    </tbody>
                </Table>

                {/* Mobile cards */}
                <div className="d-md-none">
                    {reports.length === 0 && (
                        <p className="text-center text-muted py-4">No reports available.</p>
                    )}
                    {reports.map((r) => (
                        <ReportCard key={r.id} report={r} />
                    ))}
                </div>
            </Card>
        </Container>
    );
}

export default ReportsPage;

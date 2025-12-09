import { useEffect, useState } from "react";
import { Table, Container, Card } from "react-bootstrap";
import API from "../../API/API.mjs";
import {ReportCard, ReportRow} from "./ReportsRowCard.jsx";
import ReportDetailModal from "./ReportsDetailModal.jsx";
import {getUserOffices} from "./common.jsx";
import {Alert} from "design-react-kit";

function ReportsPage({user}) {
    const [reports, setReports] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    // Initialize with user's officeId to avoid empty UI before roles load
    const [userOfficeIds, setUserOfficeIds] = useState(() => {
        return user?.officeId ? [Number(user.officeId)] : [];
    });

    useEffect(() => {
        const fetchReports = async () => {
            const data = await API.fetchReports();
            setReports(data);
        };
        fetchReports();
    }, []);

    // Load all officeIds for current staff user from backend roles
    useEffect(() => {
        const loadUserOffices = async () => {
            try {
                // Prefer roles of current session to avoid ID mismatch
                const roles = await API.fetchMyRoles();
                const officeIds = Array.from(new Set((roles || [])
                    .map(r => r?.office?.id ?? r?.officeId)
                    .filter(v => v !== undefined && v !== null)
                    .map(v => Number(v))));
                // Fallback to single officeId on user, if any
                const fallback = user?.officeId ? [Number(user.officeId)] : [];
                setUserOfficeIds(Array.from(new Set([ ...fallback, ...officeIds])));
            } catch (e) {
                // keep current state on error
            }
        };
        loadUserOffices();
    }, [user?.officeId]);

    const officeReports = (reports || []).filter(r => {
        const statusMatch = ["assigned", "in_progress", "suspended"].includes(String(r.status || '').toLowerCase());
        const officeIdRaw = r?.officeId ?? r?.category?.officeId ?? r?.category?.office?.id;
        const officeId = officeIdRaw !== undefined && officeIdRaw !== null ? Number(officeIdRaw) : undefined;
        const officeMatch = officeId !== undefined ? userOfficeIds.includes(officeId) : false;
        return statusMatch && officeMatch;
    });

    const yourReports = (reports || []).filter(r => {
        const status = String(r.status || '').toLowerCase();
        const isMine = r.technicianId === user?.id;
        return isMine && ["assigned", "in_progress", "suspended"].includes(status);
    });

    const handleOpenModal = (report) => {
        setSelectedReport(report);
        setModalOpen(true);
    };

    // Handler per chiudere il modale
    const toggleModal = () => {
        setModalOpen(!modalOpen);
        if (modalOpen) {
            setSelectedReport(null);
        }
    };

    // Handler per azioni dei bottoni
    const handleAction = async (action, reportId) => {
        try {
            if (action === 'start') {
                await API.startReport(reportId);
            } else if (action === 'assign') {
                await API.assignReportToExternalMaintainer(reportId)
                setAlertMessage("Report assigned to external office.");
                setAlertColor("primary");
                setAlertVisible(true);
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
            <ReportDetailModal
                isOpen={modalOpen}
                toggle={toggleModal}
                report={selectedReport}
            />
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
                            yourReports.map((r, idx) => <ReportRow
                                key={r.id}
                                idx={idx}
                                report={r}
                                user={user}
                                onAction={handleAction}
                                onRowClick={handleOpenModal} />)
                        )}
                        </tbody>
                    </Table>

                    {/* Mobile cards */}
                    <div className="d-md-none">
                        {yourReports.length === 0 && (
                            <p className="text-center text-muted py-4">No reports available.</p>
                        )}
                        {yourReports.map((r) => (
                            <ReportCard
                                key={r.id}
                                report={r}
                                user={user}
                                onAction={handleAction}
                                onCardClick={handleOpenModal}/>
                        ))}
                    </div>
                </Card>
            </Container>
            {alertVisible && (
                <Alert
                    color={alertColor}
                    icon="it-info-circle"
                    className="mb-4"
                    dismissible
                    toggle={() => setAlertVisible(false)}
                >
                    {alertMessage}
                </Alert>
            )}

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
                            officeReports.map((r, idx) => <ReportRow
                                key={r.id}
                                idx={idx}
                                report={r}
                                user={user}
                                onAction={handleAction}
                                onRowClick={handleOpenModal}/>)
                        )}
                        </tbody>
                    </Table>

                    {/* Mobile cards */}
                    <div className="d-md-none">
                        {officeReports.length === 0 && (
                            <p className="text-center text-muted py-4">No reports available.</p>
                        )}
                        {officeReports.map((r) => (
                            <ReportCard
                                key={r.id}
                                report={r}
                                user={user}
                                onAction={handleAction}
                                onCardClick={handleOpenModal}/>
                        ))}
                    </div>
                </Card>
            </Container>
        </>
    );
}

export default ReportsPage;
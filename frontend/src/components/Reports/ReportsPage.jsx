import { useState } from "react";
import { Container, FormSelect } from "react-bootstrap";
import { ReportsTable } from "./ReportsTable.jsx";
import ReportDetailModal from "./ReportsDetailModal.jsx";
import { Alert } from "design-react-kit";
import { useUserOffices } from "./hooks/useUserOffices.js";
import { useOfficeReports } from "./hooks/useOfficeReports.js";
import { useReportActions } from "./hooks/useReportActions.js";

function ReportsPage({ user }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedOfficeId, setSelectedOfficeId] = useState("");

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertColor, setAlertColor] = useState("primary");

    const { userOffices, isExternal } = useUserOffices(user);
    const { reports, setReports } = useOfficeReports(selectedOfficeId, isExternal);

    const userReports = reports.filter(r => r.technicianId === user.id)
    isExternal && reports.filter(r => r.assignedExternal)

    const { handleAction } = useReportActions({
        selectedOfficeId,
        setReports,
        setAlertMessage,
        setAlertColor,
        setAlertVisible,
    });

    const selectedOffice = userOffices.find(
        (o) => o.id === Number(selectedOfficeId)
    );

    const handleOpenModal = (report) => {
        setSelectedReport(report);
        setModalOpen(true);
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        if (!modalOpen) setSelectedReport(null);
    };

    return (
        <>
            <ReportDetailModal
                isOpen={modalOpen}
                toggle={toggleModal}
                report={selectedReport}
            />

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
                <ReportsTable
                    reports={userReports}
                    user={user}
                    onAction={handleAction}
                    onRowClick={handleOpenModal}
                    title="Reports assigned to you"
                />
            </Container>

            <Container className="my-4">
                <ReportsTable
                    reports={reports}
                    user={user}
                    onAction={handleAction}
                    onRowClick={handleOpenModal}
                    headerContent={
                        <div className="d-flex flex-column gap-3">
                            <h3 className="text-primary mb-0">
                                Reports assigned to: {selectedOffice?.name || "Select an office"}
                            </h3>

                            <FormSelect
                                style={{ maxWidth: "300px" }}
                                value={selectedOfficeId}
                                onChange={(e) => setSelectedOfficeId(e.target.value)}
                            >
                                <option value="">Select office</option>
                                {userOffices.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </FormSelect>
                        </div>
                    }
                />
            </Container>
        </>
    );
}

export default ReportsPage;

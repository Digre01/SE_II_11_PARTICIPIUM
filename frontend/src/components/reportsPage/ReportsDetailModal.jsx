import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Badge,
    Row,
    Col,
} from 'design-react-kit';
import {getStatusVariant} from "./common.jsx";

function ReportDetailModal({ isOpen, toggle, report }) {
    if (!report) return null;

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
            <ModalHeader toggle={toggle}>
                {report.title}
            </ModalHeader>
            <ModalBody>
                <Row className="mb-3">
                    <Col md={6}>
                        <p><strong>ID:</strong> {report.id}</p>
                        <p><strong>Category:</strong> {report.category?.name || 'N/A'}</p>
                        <p>
                            <strong>Status:</strong>{' '}
                            <Badge color={getStatusVariant(report.status)} pill>
                                {report.status.replace("_", " ").toUpperCase()}
                            </Badge>
                        </p>
                    </Col>
                    <Col md={6}>
                        <p><strong>Latitude:</strong> {report.latitude.toFixed(3)}</p>
                        <p><strong>Longitude:</strong> {report.longitude.toFixed(3)}</p>
                    </Col>
                </Row>

                {report.description && (
                    <Row className="mb-3">
                        <Col>
                            <h6>Description</h6>
                            <p className="text-muted">{report.description}</p>
                        </Col>
                    </Row>
                )}

                {report.technicianId && (
                    <Row>
                        <Col>
                            <p><strong>Assigned to:</strong> Technician #{report.technicianId}</p>
                        </Col>
                    </Row>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default ReportDetailModal;
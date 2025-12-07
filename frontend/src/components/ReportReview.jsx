import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Input,
    Label,
    FormGroup,
    Button,
    Alert,
    Select, TextArea
} from 'design-react-kit';
import API, { SERVER_URL } from '../API/API.mjs';
import {Textarea} from "react-bootstrap-icons";

export default function ReportReview({ user, loggedIn }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState(null);
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const r = await API.fetchReport(id);
                setReport(r);
                setCategoryId(r.categoryId);
                const cats = await API.fetchCategories();
                setCategories(cats || []);
            } catch (err) {
                console.error(err);
            } finally { setLoading(false); }
        }
        load();
    }, [id]);

    if (!loggedIn) return <Container className="mt-4">Please log in to review reports.</Container>;

    const handleAccept = async () => {
        try {
            const updated = await API.reviewReport(id, { action: 'accept', categoryId });
            setMessage('Report assigned.');
            setReport(updated);
            navigate('/reports');
        } catch (err) {
            setMessage('Error accepting report: ' + String(err));
        }
    };

    const handleReject = async () => {
        if (!explanation.trim()) { setMessage('Please provide an explanation for rejection.'); return; }
        try {
            const updated = await API.reviewReport(id, { action: 'reject', explanation });
            setMessage('Report rejected.');
            setReport(updated);
            navigate('/reports');
        } catch (err) {
            setMessage('Error rejecting report: ' + String(err));
        }
    };

    if (loading) return <Container className="mt-4">Loading...</Container>;
    if (!report) return <Container className="mt-4">Report not found.</Container>;

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <h3>Review Report</h3>
                    <Card className="mb-3" border={false}>
                        <CardBody>
                            <CardTitle tag="h5">{report.title}</CardTitle>
                            <CardText>{report.description}</CardText>
                            <CardText><strong>Coordinates:</strong> {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}</CardText>
                            <CardText><strong>Status:</strong> {report.status}</CardText>
                            {report.reject_explanation && (
                                <CardText><strong>Rejection:</strong> {report.reject_explanation}</CardText>
                            )}

                            <FormGroup className="mb-3">
                                <Label htmlFor="category-select" className="fw-bold">
                                    Category
                                </Label>
                                <Select
                                    id="category-select"
                                    className="form-select"
                                    value={categoryId || ''}
                                    onChange={e => setCategoryId(e.target.value)}
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            </FormGroup>

                            <FormGroup className="mb-3">
                                <Label><strong>Photos</strong></Label>
                                <div>
                                    {(report.photos || []).map((p, idx) => (
                                        <img key={idx} src={`${SERVER_URL}${p.link}`} alt={`photo-${idx}`} style={{ maxWidth: 200, marginRight: 8 }} />
                                    ))}
                                </div>
                            </FormGroup>

                            <FormGroup className="mb-3">
                                <Label htmlFor="explanation-textarea" className="fw-bold">
                                    Rejection explanation
                                </Label>
                                <TextArea
                                    id="explanation-textarea"
                                    className="form-control"
                                    value={explanation}
                                    onChange={e => setExplanation(e.target.value)}
                                />
                            </FormGroup>

                            <div className="d-flex gap-2">
                                <Button color="success" onClick={handleAccept}>Accept</Button>
                                <Button color="danger" onClick={handleReject}>Reject</Button>
                                <Button color="secondary" outline onClick={() => navigate(-1)}>Back</Button>
                            </div>

                            {message && <Alert color="info" className="mt-3">{message}</Alert>}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
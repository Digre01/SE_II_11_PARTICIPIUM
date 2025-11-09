import { Input, Row, Col, Button, Alert, Form } from "design-react-kit";
import { useState } from "react";
import API from "../API/API.mjs";

function AssignRole() {
    const [form, setForm] = useState({ userId: '', roleId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const onChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const reset = () => setForm({ userId: '', roleId: '' });

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!form.userId || !form.roleId) {
            setMessage({ type: 'danger', text: 'Both User ID and Role ID are required' });
            return;
        }

        setSubmitting(true);
        try {
            const result = await API.assignRole(Number(form.userId), Number(form.roleId));
            setMessage({ type: 'success', text: 'Role assigned successfully' });
            reset();
        } catch (err) {
            const text = typeof err === 'string' ? err : (err?.error || 'Error assigning role');
            setMessage({ type: 'danger', text });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Assign Role</h2>
            <Form onSubmit={onSubmit} className="mb-4">
                <Row>
                    <Input
                        label="User ID"
                        placeholder="Numeric user id"
                        type="number"
                        wrapperClassName="col col-md-4"
                        value={form.userId}
                        onChange={onChange('userId')}
                    />

                    <Input
                        label="Role ID"
                        placeholder="Numeric role id"
                        type="number"
                        wrapperClassName="col col-md-4"
                        value={form.roleId}
                        onChange={onChange('roleId')}
                    />
                </Row>

                {message && (
                    <Alert color={message.type} role="alert">
                        {message.text}
                    </Alert>
                )}

                <Row>
                    <Col sm="auto">
                        <Button color="secondary" type="button" onClick={reset} disabled={submitting}>Cancel</Button>
                    </Col>
                    <Col sm="auto">
                        <Button color="primary" type="submit" disabled={submitting}>Assign</Button>
                    </Col>
                </Row>
            </Form>

            <p className="text-muted">Note: Enter numeric User ID and Role ID. Role and user lists are not available in this page; provide IDs directly.</p>
        </div>
    );
}

export default AssignRole;

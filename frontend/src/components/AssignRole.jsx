import { Form, FormGroup, Select, Button, Alert } from "design-react-kit";
import { Row, Col } from 'react-bootstrap';
import { useState, useEffect } from "react";
import API from "../API/API.mjs";

function AssignRole() {
    const [form, setForm] = useState({ userId: '', roleId: '', officeId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [officeOptions, setOfficeOptions] = useState([]);
    const [alertOpen, setAlertOpen] = useState(true);

    const onChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const reset = () => setForm({ userId: '', roleId: '', officeId: '' });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const staff = await API.fetchAvailableStaff();
                const roles = await API.fetchRoles();
                const offices = await API.fetchOffices();
                if (!mounted) return;
                setStaffOptions(staff || []);
                setRoleOptions(roles || []);
                setOfficeOptions(offices || []);
            } catch (e) {
            }
        })();
        return () => { mounted = false };
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!form.userId || !form.roleId || !form.officeId) {
            setMessage({ type: 'danger', text: 'User, Role and Office are required' });
            return;
        }

        setSubmitting(true);
        try {
            await API.assignRole(Number(form.userId), Number(form.roleId), Number(form.officeId));
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
        <div style={{ maxWidth: 700, margin: '2rem auto' }}>
            <div className="card shadow-sm p-4">
                <h3 className="mb-4 text-primary text-center">Assign Role to Staff</h3>
                <Form onSubmit={onSubmit}>
                    <FormGroup className="mb-3">
                        <Select
                            name="userId"
                            id="userId"
                            value={form.userId}
                            onChange={(e) => {
                                const v = e && e.target ? e.target.value : e;
                                setForm(f => ({ ...f, userId: v }));
                            }}
                            label="Staff user"
                        >
                            <option value="">Choose from the list</option>
                            {staffOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.username} — {s.name} {s.surname}</option>
                            ))}
                        </Select>
                    </FormGroup>

                    <FormGroup className="mb-4">
                        <Select
                            name="roleId"
                            id="roleId"
                            value={form.roleId}
                            onChange={(e) => {
                                const v = e && e.target ? e.target.value : e;
                                setForm(f => ({ ...f, roleId: v }));
                            }}
                            label="Role"
                        >
                            <option value="">Choose from the list</option>
                            {roleOptions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </Select>
                    </FormGroup>

                        <FormGroup className="mb-4">
                            <Select
                                name="officeId"
                                id="officeId"
                                value={form.officeId}
                                onChange={(e) => {
                                    const v = e && e.target ? e.target.value : e;
                                    setForm(f => ({ ...f, officeId: v }));
                                }}
                                label="Office"
                            >
                                <option value="">Choose from the list</option>
                                {officeOptions.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </Select>
                        </FormGroup>

                    {message && (
                        <div className="mb-3">
                            <Alert color={message.type} isOpen={alertOpen} toggle={() => setAlertOpen(false)}>
                                {message.text}
                            </Alert>
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <Button color="secondary" type="button" onClick={reset} disabled={submitting}>Cancel</Button>
                        <Button color="primary" type="submit" disabled={submitting || !form.userId || !form.roleId}>
                            Assign Role
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default AssignRole;

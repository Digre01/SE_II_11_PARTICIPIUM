import { Form, FormGroup, Select, Button, Alert } from "design-react-kit";
import { useState, useEffect } from "react";
import API from "../API/API.mjs";

function AssignRole() {
    const [form, setForm] = useState({ userId: '', roleId: ''});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [officeOptions, setOfficeOptions] = useState([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(true);

    const onChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const reset = () => setForm({ userId: '', roleId: ''});

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const [staff, roles, offices] = await Promise.all([
                    API.fetchAvailableStaff(),
                    API.fetchRoles(),
                    API.fetchOffices().catch(() => []) // offices optional
                ]);
                if (!mounted) return;
                setStaffOptions(staff || []);
                setRoleOptions(roles || []);
                setOfficeOptions(offices || []);
            } catch (e) {
                if (!mounted) return;
                setMessage({ type: 'danger', text: typeof e === 'string' ? e : 'Errore nel caricamento dei dati' });
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false };
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!form.userId || !form.roleId) {
            setMessage({ type: 'danger', text: 'User and Role are required' });
            return;
        }

        setSubmitting(true);
        try {
            await API.assignRole(Number(form.userId), Number(form.roleId));
            setMessage({ type: 'success', text: 'Role assigned successfully' });
            reset();
            const staff = await API.fetchAvailableStaff();
            setStaffOptions(staff || []);
        } catch (err) {
            const text = typeof err === 'string' ? err : (err?.error || 'Error assigning role');
            setMessage({ type: 'danger', text });
        } finally {
            setSubmitting(false);
        }
    };

    // Derive visible staff based on selected office (if available in data)
    const visibleStaff = (selectedOfficeId
        ? staffOptions.filter(s => {
            const officeId = s?.userOffice?.office?.id ?? s?.officeId;
            return Number(officeId) === Number(selectedOfficeId);
        })
        : staffOptions
    );

    return (
        <div style={{ maxWidth: 700, margin: '2rem auto' }}>
            <div className="card shadow-sm p-4">
                <h3 className="mb-4 text-primary text-center">Assign Role to Staff</h3>
                <Form onSubmit={onSubmit}>
                    <FormGroup className="mb-3">
                        <Select
                            name="officeId"
                            id="officeId"
                            value={selectedOfficeId}
                            onChange={(e) => {
                                const v = e && e.target ? e.target.value : e;
                                setSelectedOfficeId(v);
                            }}
                            label="Office (optional)"
                            disabled={loading}
                        >
                            <option value="">All offices</option>
                            {officeOptions.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </Select>
                    </FormGroup>

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
                            disabled={loading}
                        >
                            <option value="">Choose from the list</option>
                            {visibleStaff.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.username} — {s.name} {s.surname}
                                    {s?.userOffice?.role?.name ? ` (${s.userOffice.role.name})` : ''}
                                </option>
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
                            disabled={loading}
                        >
                            <option value="">Choose from the list</option>
                            {roleOptions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
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
                        <Button color="secondary" type="button" onClick={reset} disabled={submitting || loading}>Cancel</Button>
                        <Button color="primary" type="submit" disabled={submitting || loading || !form.userId || !form.roleId}>
                            Assign Role
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default AssignRole;

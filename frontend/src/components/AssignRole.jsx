import { Form, FormGroup, Select, Button, Alert } from "design-react-kit";
import { useState, useEffect } from "react";
import API from "../API/API.mjs";

function AssignRole() {
    const [form, setForm] = useState({ userId: '', roleIds: []});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [alertOpen, setAlertOpen] = useState(true);

    const onChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const toggleRoleSelection = (roleId) => {
        setForm(f => {
            const current = new Set(f.roleIds || []);
            if (current.has(roleId)) current.delete(roleId); else current.add(roleId);
            return { ...f, roleIds: Array.from(current) };
        });
    };

    const reset = () => setForm({ userId: '', roleIds: []});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const staff = await API.fetchAvailableStaff();
                const roles = await API.fetchRoles();
                if (!mounted) return;
                setStaffOptions(staff || []);
                setRoleOptions(roles || []);
            } catch (e) {
            }
        })();
        return () => { mounted = false };
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!form.userId || !form.roleIds || form.roleIds.length === 0) {
            setMessage({ type: 'danger', text: 'User and at least one Role are required' });
            return;
        }

        setSubmitting(true);
        try {
            // pass array of role ids (numbers)
            await API.assignRole(Number(form.userId), form.roleIds.map(Number));
            setMessage({ type: 'success', text: 'Roles assigned successfully' });
            reset();
            const staff = await API.fetchAvailableStaff();
            setStaffOptions(staff || []);
        } catch (err) {
            const text = typeof err === 'string' ? err : (err?.error || 'Error assigning roles');
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
                        <div>
                            <label className="form-label">Role</label>
                            <div>
                                {roleOptions.map(r => (
                                    <div className="form-check" key={r.id}>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`role-${r.id}`}
                                            checked={(form.roleIds || []).includes(r.id)}
                                            onChange={() => toggleRoleSelection(r.id)}
                                        />
                                        <label className="form-check-label" htmlFor={`role-${r.id}`}>
                                            {r.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                        <Button color="primary" type="submit" disabled={submitting || !form.userId || !(form.roleIds && form.roleIds.length > 0)}>
                            Assign Role
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default AssignRole;

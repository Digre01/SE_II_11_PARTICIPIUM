import { Form, FormGroup, Select, Button, Alert, Input, Label, UncontrolledTooltip } from "design-react-kit";
import { useState, useEffect, useRef } from "react";
import API from "../API/API.mjs";

function AssignRole() {
    const [form, setForm] = useState({ userId: '', roleIds: [], isExternal: false });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [alertOpen, setAlertOpen] = useState(true);
    const refTooltip = useRef(null);

    const onChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    // Se isExternal è true, consenti solo un ruolo di Technical Offices
    const toggleRoleSelection = (roleId) => {
        setForm(f => {
            if (f.isExternal) {
                // Se già selezionato, deseleziona
                if (f.roleIds.includes(roleId)) {
                    return { ...f, roleIds: [] };
                } else {
                    return { ...f, roleIds: [roleId] };
                }
            } else {
                const current = new Set(f.roleIds || []);
                if (current.has(roleId)) current.delete(roleId); else current.add(roleId);
                return { ...f, roleIds: Array.from(current) };
            }
        });
    };

    const reset = () => setForm({ userId: '', roleIds: [], isExternal: false });

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
            // pass array of role ids (numbers) e isExternal
            await API.assignRole(Number(form.userId), form.roleIds.map(Number), form.isExternal);
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

    // Divide roles by officeId
    const orgOfficeRoles = roleOptions.filter(r => r.officeId === 1);
    const techOfficeRoles = roleOptions.filter(r => r.officeId !== 1);

    // Mutual exclusion logic
    const hasOrgOfficeSelected = form.roleIds.some(id => orgOfficeRoles.some(r => r.id === id));
    const hasTechOfficeSelected = form.roleIds.some(id => techOfficeRoles.some(r => r.id === id));
    // Per external: solo un ruolo tecnico selezionabile, organization office disabilitati
    const selectedTechRoleId = form.isExternal ? form.roleIds[0] : null;

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
                        <fieldset>
                            <legend>Organization Office</legend>
                            {orgOfficeRoles.length === 0 && <div className="text-muted">No roles available</div>}
                            {orgOfficeRoles.map(r => (
                                <FormGroup check key={r.id}>
                                    <Input
                                        id={`role-${r.id}`}
                                        type="checkbox"
                                        checked={(form.roleIds || []).includes(r.id)}
                                        onChange={() => toggleRoleSelection(r.id)}
                                        disabled={form.isExternal || (hasTechOfficeSelected && !form.roleIds.includes(r.id))}
                                    />
                                    <Label check for={`role-${r.id}`}>
                                        {r.name}
                                    </Label>
                                </FormGroup>
                            ))}
                        </fieldset>
                        <fieldset className="mt-3">
                            <legend>Technical offices</legend>
                            {techOfficeRoles.length === 0 && <div className="text-muted">No roles available</div>}
                            {techOfficeRoles.map(r => (
                                <FormGroup check key={r.id}>
                                    <Input
                                        id={`role-${r.id}`}
                                        type="checkbox"
                                        checked={(form.roleIds || []).includes(r.id)}
                                        onChange={() => toggleRoleSelection(r.id)}
                                        disabled={form.isExternal
                                            ? (selectedTechRoleId !== undefined && selectedTechRoleId !== r.id)
                                            : (hasOrgOfficeSelected && !form.roleIds.includes(r.id))}
                                    />
                                    <Label check for={`role-${r.id}`}>
                                        {r.name}
                                    </Label>
                                </FormGroup>
                            ))}
                            <FormGroup className="mb-2">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: '1vw' }}>
                                    <Input
                                        type="checkbox"
                                        id="isExternal"
                                        checked={form.isExternal}
                                        onChange={e => setForm(f => ({ ...f, isExternal: e.target.checked, roleIds: e.target.checked ? [] : f.roleIds }))}
                                        disabled={hasOrgOfficeSelected}
                                        style={{ margin: 0 }}
                                    />
                                    <Label for="isExternal" check style={{ margin: 0, padding: 0 } }>
                                        <Button innerRef={refTooltip} style={{ padding: '0 6px', fontWeight: 400, fontSize: '1rem', lineHeight: 1 }}>
                                            Assign as External Maintainer
                                        </Button>
                                    </Label>
                                </div>
                            </FormGroup>
                        </fieldset>
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

                    <UncontrolledTooltip placement='right' target={refTooltip}>
                        You can assign only one technical role to external maintainer.
                    </UncontrolledTooltip>
                </Form>
            </div>
        </div>
    );
}

export default AssignRole;

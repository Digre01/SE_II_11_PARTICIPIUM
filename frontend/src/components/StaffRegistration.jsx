import { Input, Row, Col, Button, Alert, Form } from "design-react-kit"
import { useState } from "react";
import { signUp } from "../API/API.mjs";



function StaffRegistration(){
    const [form, setForm] = useState({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'danger', text: string }

    const onChange = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
    };

    const reset = () => {
        setForm({ name: "", surname: "", username: "", email: "", password: "" });
        setMessage(null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // basic validation
        if (!form.name || !form.surname || !form.username || !form.email || !form.password) {
            setMessage({ type: 'danger', text: 'Fill all fields' });
            return;
        }

        setSubmitting(true);
        try {
            await signUp({
                username: form.username,
                email: form.email,
                name: form.name,
                surname: form.surname,
                password: form.password,
                userType: 'STAFF',
            });
            setMessage({ type: 'success', text: 'Registrazione completata.' });
            reset();
        } catch (err) {
            setMessage({ type: 'danger', text: err.message || 'Errore durante la registrazione.' });
        } finally {
            setSubmitting(false);
        }
    };
    return(
        <>
            <Form onSubmit={onSubmit}>
                <Row>
                    <Input
                        label="Name"
                        placeholder="Insert first name"
                        type="text"
                        wrapperClassName="col col-md-5"
                        value={form.name}
                        onChange={onChange("name")}
                    />
                    <Input
                        label="Surname"
                        placeholder="Insert last name"
                        type="text"
                        wrapperClassName="col col-md-5"
                        value={form.surname}
                        onChange={onChange("surname")}
                    />
                </Row>
                <Row>
                   <Input
                        label="Username"
                        placeholder="Insert username"
                        type="text"
                        wrapperClassName="col col-md-4"
                        value={form.username}
                        onChange={onChange("username")}
                    />
                    <Input
                        label="Email"
                        placeholder="Insert a mail"
                        type="email"
                        wrapperClassName="col col-md-4"
                        value={form.email}
                        onChange={onChange("email")}
                    />
                    <Input
                        label="Password"
                        placeholder="Insert a password"
                        type="password"
                        wrapperClassName="col col-md-4"
                        value={form.password}
                        onChange={onChange("password")}
                    />
                </Row>

                {message && (
                <Alert color={message.type} role="alert">
                    {message.text}
                </Alert>
                )}

                <Row>
                    <Col sm="auto">
                        <Button
                            color="primary"
                            outline
                            type="button"
                            onClick={reset}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </Col>
                    <Col sm="auto">
                        <Button
                            color="primary"
                            type="submit"
                            disabled={submitting}
                        >
                            Confirm
                        </Button>
                    </Col>
                </Row>
            </Form>

            
        </>
    )

}

export default StaffRegistration;

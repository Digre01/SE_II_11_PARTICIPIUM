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
    };

    const generatePassword = () => {
        const length = 8;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setForm((f) => ({ ...f, password: retVal }));
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
            const result = await signUp({
                username: form.username,
                email: form.email,
                name: form.name,
                surname: form.surname,
                password: form.password,
                userType: 'STAFF',
            });

            if (result && !result.error) {
                    setMessage({
                        type: 'success',
                        text: result.message || 'Registration completed successfully',
                    });
                reset();
            }
        }
         catch (err) {
            console.log(err);
            const text = err.error || 'Error during registration process';
            setMessage({ type: 'danger', text });
            reset();
        } finally {
            setSubmitting(false);
        }
    };
    return(
        <>
        <div className="container mt-5">
            <Form onSubmit={onSubmit} className="mb-4">
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
                </Row>
                <Row>
                    <Input
                        label="Password"
                        placeholder="Insert a password"
                        type="text"
                        wrapperClassName="col col-md-4"
                        value={form.password}
                        onChange={onChange("password")}
                    />
                    <Col sm="auto">
                        <Button
                            color="secondary"
                            type="button"
                            onClick={generatePassword}
                        >
                        Random Password
                        </Button>
                    </Col>
                    
                </Row>

                {/* Alert for success or rejection */}
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
        </div>

            
        </>
    )

}

export default StaffRegistration;

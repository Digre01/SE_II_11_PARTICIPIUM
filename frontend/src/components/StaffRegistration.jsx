import { Input, Row, Col, Button, Alert, Form } from "design-react-kit"
import { useState } from "react";
import { signUp } from "../API/API.mjs";
import { useNavigate } from "react-router";



function StaffRegistration(){
    const navigate = useNavigate();
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
                navigate("/");
            }
        }
         catch (err) {
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
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title mb-5">Staff Registration</h3>
                                <Form onSubmit={onSubmit} className="mb-0 auth-form mt-4">
                                    <Row className="g-4">
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="staff-name"
                                                label="Name"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                value={form.name}
                                                onChange={onChange("name")}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="staff-surname"
                                                label="Surname"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                value={form.surname}
                                                onChange={onChange("surname")}
                                            />
                                        </Col>

                                        <Col xs={12} md={6}>
                                            <Input
                                                id="staff-username"
                                                label="Username"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                value={form.username}
                                                onChange={onChange("username")}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="staff-email"
                                                label="Email"
                                                type="email"
                                                wrapperClassName="mb-0"
                                                value={form.email}
                                                onChange={onChange("email")}
                                            />
                                        </Col>

                                        <Col xs={12} md={6}>
                                            <Input
                                                id="staff-password"
                                                label="Password"
                                                type="password"
                                                wrapperClassName="mb-0"
                                                value={form.password}
                                                onChange={onChange("password")}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <div className="d-flex align-items-end h-100">
                                                <Button
                                                    color="secondary"
                                                    type="button"
                                                    onClick={generatePassword}
                                                    className="w-100 w-sm-auto"
                                                >
                                                    Random Password
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>

                                    {message && (
                                        <Alert color={message.type} role="alert" className="mt-4">
                                            {message.text}
                                        </Alert>
                                    )}

                                    <Row className="gy-2 mt-3">
                                        <Col className="col-12 col-sm-auto">
                                            <Button
                                                color="primary"
                                                outline
                                                type="button"
                                                onClick={reset}
                                                disabled={submitting}
                                                className="w-100 w-sm-auto"
                                            >
                                                Cancel
                                            </Button>
                                        </Col>
                                        <Col className="col-12 col-sm-auto">
                                            <Button
                                                color="primary"
                                                type="submit"
                                                disabled={submitting}
                                                className="w-100 w-sm-auto"
                                            >
                                                Confirm
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}

export default StaffRegistration;

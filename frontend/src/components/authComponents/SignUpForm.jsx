import { Input, Row, Col, Button, Alert, Form } from "design-react-kit"
import {useActionState, useState} from "react";
import {useNavigate} from "react-router";


function SignUpForm(props){
    const [form, setForm] = useState({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [state, formAction, isPending] = useActionState(signUpFunction, form);

    const navigate = useNavigate();

    async function signUpFunction(prevState, formData){
        const data = {
            name: formData.get("name"),
            surname: formData.get("surname"),
            email: formData.get("email"),
            username: formData.get('username'),
            password: formData.get('password'),
            userType: "citizen"
        };

        if (data.username.trim() === '' || data.password.trim() === '') {
            return {error: "The fields can't be empty."}
        }

        try {
            const user = await props.handleSignUp(data);
            // If signup succeeds, go to email verification page
            navigate(`/verify_mail`);
            return { success: true };
        } catch (err) {
            
            const status = err?.status ?? err?.response?.status;
            if (status === 409) {
                const serverMsg = err?.response?.data?.message || err?.message;
                return { error: serverMsg || "Username or email already in use." };
            }
            const serverMsg = err?.response?.data?.message || err?.message;
            return { error: serverMsg || "Registration failed. Please try again." };
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const passwordsMatch = form.password !== ''
        && form.confirmPassword !== ''
        && form.password === form.confirmPassword;

    return(
        <>
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title mb-5">Sign Up</h3>
                                <Form action={formAction} className="mb-0 auth-form mt-4">
                                    <Row className="g-4">
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-name"
                                                label="Name"
                                                name="name"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                defaultValue={form.name}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-surname"
                                                label="Surname"
                                                name="surname"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                defaultValue={form.surname}
                                                onChange={handleInputChange}
                                            />
                                        </Col>

                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-username"
                                                label="Username"
                                                name="username"
                                                type="text"
                                                wrapperClassName="mb-0"
                                                defaultValue={form.username}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-email"
                                                label="Email"
                                                name="email"
                                                type="email"
                                                wrapperClassName="mb-0"
                                                defaultValue={form.email}
                                                onChange={handleInputChange}
                                            />
                                        </Col>

                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-password"
                                                label="Password"
                                                name="password"
                                                type="password"
                                                wrapperClassName="mb-0"
                                                defaultValue={form.password}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Input
                                                id="signup-confirmPassword"
                                                label="Rewrite Password"
                                                name="confirmPassword"
                                                type="password"
                                                wrapperClassName="mb-0"
                                                value={form.confirmPassword}
                                                onChange={handleInputChange}
                                            />
                                            {form.confirmPassword !== '' && !passwordsMatch && (
                                                <div className="text-danger small mt-2">Passwords do not match</div>
                                            )}
                                        </Col>
                                    </Row>

                                    {/* Alert for success or rejection */}
                                    {state.error && (
                                        <Alert color={"danger"}>
                                            {state.error}
                                        </Alert>
                                    )}

                                    <Row className="gy-2">
                                        <Col sm="auto">
                                            <Button
                                                color="primary"
                                                outline
                                                type="reset"
                                                className="w-100 w-sm-auto"
                                                disabled={isPending}
                                            >
                                                Cancel
                                            </Button>
                                        </Col>
                                        <Col sm="auto">
                                            <Button
                                                color="primary"
                                                type="submit"
                                                className="w-100 w-sm-auto"
                                                disabled={isPending || !passwordsMatch}
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

export default SignUpForm;

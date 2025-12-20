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
                <Form action={formAction} className="mb-4">
                    <Row className="gy-3">
                        <Input
                            label="Name"
                            name="name"
                            placeholder="Insert first name"
                            type="text"
                            wrapperClassName="col-12 col-md-6"
                            defaultValue={form.name}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Surname"
                            name="surname"
                            placeholder="Insert last name"
                            type="text"
                            wrapperClassName="col-12 col-md-6"
                            defaultValue={form.surname}
                            onChange={handleInputChange}
                        />
                    </Row>
                    <Row className="gy-3">
                        <Input
                            label="Username"
                            name="username"
                            placeholder="Insert username"
                            type="text"
                            wrapperClassName="col-12 col-md-6"
                            defaultValue={form.username}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Email"
                            name="email"
                            placeholder="Insert an email"
                            type="email"
                            wrapperClassName="col-12 col-md-6"
                            defaultValue={form.email}
                            onChange={handleInputChange}
                        />
                    </Row>
                    <Row className="gy-3">
                        <Input
                            label="Password"
                            name="password"
                            placeholder="Insert a password"
                            type="password"
                            wrapperClassName="col-12 col-md-6"
                            defaultValue={form.password}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Rewrite Password"
                            name="confirmPassword"
                            placeholder="Rewrite the password"
                            type="password"
                            wrapperClassName="col-12 col-md-6"
                            value={form.confirmPassword}
                            onChange={handleInputChange}
                        />
                        {form.confirmPassword !== '' && !passwordsMatch && (
                            <div className="col-12 text-danger small mt-1">Passwords do not match</div>
                        )}
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


        </>
    )

}

export default SignUpForm;

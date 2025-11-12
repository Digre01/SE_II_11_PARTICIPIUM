import {Alert, Button, Col, Form, Input, Row, Icon, NavLink} from "design-react-kit";
import {useActionState, useState} from "react";
import {useNavigate} from "react-router";

function LoginForm(props) {
    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [state, formAction, isPending] = useActionState(loginFunction, form);
    const navigate = useNavigate();

    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };

        if (credentials.username.trim() === '' || credentials.password.trim() === '') {
            return {error: "The fields can't be empty."}
        }

        try {
            const user = await props.handleLogin(credentials);
            navigate(`/`);
        } catch (error) {
            return { error: 'Wrong username or password.' };
        }
    }

    return(
        <>
            { isPending && <Alert variant="warning">Please, wait for the server's response...</Alert> }
            <div className="container mt-5">
                <Form action={formAction} className="mb-4">
                    <Row>
                        <Input
                            label="Username"
                            name="username"
                            placeholder="Insert username"
                            type="text"
                            wrapperClassName="col col-md-4"
                            defaultValue={form.username}
                            required
                        />
                        <Input
                            label="Password"
                            name="password"
                            placeholder="Insert a password"
                            type="password"
                            wrapperClassName="col col-md-4"
                            defaultValue={form.password}
                            required
                        />
                    </Row>

                    {/* Alert for success or rejection */}
                    {state.error && (
                        <Alert color={"danger"}>
                            {state.error}
                        </Alert>
                    )}

                    <Row>
                        <Col sm="auto">
                            <Button
                                color="primary"
                                outline
                                type="reset"
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                        </Col>
                        <Col sm="auto">
                            <Button
                                color="primary"
                                type="submit"
                                disabled={isPending}
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

function LogoutButton(props) {
    const navigate = useNavigate();

    return(
        <NavLink
            href="#" 
            onClick={() => {props.handleLogout(); navigate('/');}} 
        >
            <Icon icon="it-logout" className="me-2" />
            Logout
        </NavLink>
    )
   
}

export {LoginForm, LogoutButton};
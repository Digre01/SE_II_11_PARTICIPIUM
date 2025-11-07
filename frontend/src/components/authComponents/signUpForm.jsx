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
            console.log(data)
            const user = await props.handleSignUp(data);
            navigate(`/users/${user.id}`);
        } catch (error) {
            return { error: 'Wrong username or password.' };
        }
    }

    return(
        <>
            <div className="container mt-5">
                <Form action={formAction} className="mb-4">
                    <Row>
                        <Input
                            label="Name"
                            name="name"
                            placeholder="Insert first name"
                            type="text"
                            wrapperClassName="col col-md-5"
                            defaultValue={form.name}
                        />
                        <Input
                            label="Surname"
                            name="surname"
                            placeholder="Insert last name"
                            type="text"
                            wrapperClassName="col col-md-5"
                            defaultValue={form.surname}
                        />
                    </Row>
                    <Row>
                        <Input
                            label="Username"
                            name="username"
                            placeholder="Insert username"
                            type="text"
                            wrapperClassName="col col-md-4"
                            defaultValue={form.username}
                        />
                        <Input
                            label="Email"
                            name="email"
                            placeholder="Insert a mail"
                            type="email"
                            wrapperClassName="col col-md-4"
                            defaultValue={form.email}
                        />
                    </Row>
                    <Row>
                        <Input
                            label="Password"
                            name="password"
                            placeholder="Insert a password"
                            type="text"
                            wrapperClassName="col col-md-4"
                            defaultValue={form.password}
                        />
                    </Row>

                    {/* Alert for success or rejection */}
                    {state.error && <Alert className="text-danger">{state.error}</Alert>}

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

export default SignUpForm;

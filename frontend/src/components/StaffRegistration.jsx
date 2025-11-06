import { Input, Row, Col, Select, Toggle, Button } from "design-react-kit"

function StaffRegistration(){
    return(
        <>
            <div>
                <Row>
                    <Input
                        label="Name"
                        placeholder="Insert first name"
                        type="text"
                        wrapperClassName="col col-md-5"
                    />
                    <Input
                        label="Surname"
                        placeholder="Insert last name"
                        type="text"
                        wrapperClassName="col col-md-5"
                    />
                    
                </Row>
                <Row>
                   <Input
                        label="Username"
                        placeholder="Insert username"
                        type="text"
                        wrapperClassName="col col-md-5"
                    />
                    <Input
                        label="Password"
                        placeholder="Insert a password"
                        type="password"
                        wrapperClassName="col col-md-5"
                    />
                </Row>
                <Row>
                    <Col sm="auto">
                    <Button
                        color="primary"
                        outline
                    >
                        Annulla
                    </Button>
                    </Col>
                    <Col sm="auto">
                    <Button
                        color="primary"
                        type="submit"
                    >
                        Conferma
                    </Button>
                    </Col>
                </Row>
                </div>
        
        </>
    )

}

export default StaffRegistration;
    
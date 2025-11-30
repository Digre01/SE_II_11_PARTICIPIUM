import { Link } from 'react-router-dom';
import { Row, Col, Card, Button } from 'design-react-kit';
import Map from './Map.jsx';
import ReportsPage from './reportsPage/ReportsPage.jsx';
import StaffReports from './StaffReports.jsx';

export default function HomePage({ user, loggedIn, isAdmin, isCitizen, isStaff, isReportsAllowed, wsMessage }) {
  
  
  return isReportsAllowed ? (
    <StaffReports wsMessage={wsMessage} />
  ) : isStaff ? (
    <ReportsPage user={user} />
  ) : isAdmin? (
    <Row className="g-4">
      <Col md="6" xs="12">
        <Card image rounded shadow="sm">
          <h3 className="it-card-title ">
            <Link className="it-card-link" to="/staff_signup">
              Register Staff Member
            </Link>
          </h3>
          <div className="it-card-body">
            <p className="it-card-text">
              Create a new staff account
            </p>
            <Button color="primary" tag={Link} to="/staff_signup">
              Go to Staff Signup
            </Button>
          </div>

        </Card>
      </Col>
      <Col md="6" xs="12">
        <Card image rounded shadow="sm">
          <h3 className="it-card-title ">
            <Link className="it-card-link" to="/assign_role">
              Assign Roles
            </Link>
          </h3>
          <div className="it-card-body">
            <p className="it-card-text">
              Manage user roles for staff members.
            </p>
            <Button color="primary" tag={Link} to="/assign_role">
              Go to Assign Role
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  ) : (
    <Map user={user} loggedIn={loggedIn} onPointChange={(point) => console.log('Selected point:', point)} />
  );
}



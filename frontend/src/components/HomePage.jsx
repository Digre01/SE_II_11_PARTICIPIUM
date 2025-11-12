import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useState, useMemo} from 'react'
import { useNavigate, Link } from 'react-router';
import { Row, Col, Card, Button } from 'design-react-kit';
import L from 'leaflet';
import './HomePage.css';


function SingleClickMarker({ onPointChange, user, loggedIn }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const map = useMapEvents({
    click(e) {
      setSelectedPoint(e.latlng);
      onPointChange?.(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  const navigate = useNavigate();

  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  // Keep the default Leaflet pin shape but tint it red using a CSS class
  const selectedPinIcon = useMemo(() => new L.Icon.Default({
    className: 'selected-pin-red'
  }), []);

  return (
    <>
      {selectedPoint && (
        <Marker position={selectedPoint} icon={selectedPinIcon}
          eventHandlers={{ add: (ev) => ev.target.openPopup() }}>
          {isCitizen && (
            <Popup>
              <button
                onClick={() => navigate('/report', {state: {lat: selectedPoint.lat, lng: selectedPoint.lng} })}>
                Create Report
              </button>
            </Popup>
          )}
        </Marker>
      )}
    </>
  );
}


export default function HomePage({ user, loggedIn, isAdmin }) {
  
  
  return !isAdmin ? (
    
    <MapContainer 
      center={[45.0703, 7.6869]} 
      maxBounds={[
        [45.0027, 7.5703],  //South-West
        [45.144, 7.7783]    //North-East
      ]} 
      maxBoundsViscosity={1.0}
      zoom={15}
      minZoom={15}
      maxZoom={15} 
      zoomControl={false}
      scrollWheelZoom={false}

      style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={{ lat: 45.0703, lng: 7.6869 }}>
        <Popup>Turin Center</Popup>
      </Marker>
      <SingleClickMarker onPointChange={(point) => console.log('Selected point:', point)} user={user} loggedIn={loggedIn} />
    </MapContainer>
  ) : (
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
              Manage user roles and permissions for staff members.
            </p>
            <Button color="primary" tag={Link} to="/assign_role">
              Go to Assign Role
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  );
}



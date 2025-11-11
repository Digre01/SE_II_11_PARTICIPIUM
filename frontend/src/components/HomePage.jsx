import { Container } from 'react-bootstrap'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { use, useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import { Button } from 'design-react-kit';


function SingleClickMarker({ onPointChange, user, loggedIn }) {
  const [userPosition, setUserPosition] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const map = useMapEvents({
    locationfound(e) {
      setUserPosition(e.latlng);
      map.setView(e.latlng, map.getZoom());
    },
    click(e) {
      setUserPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    click(e) {
      if (!userPosition) return;
      setSelectedPoint(e.latlng);
      onPointChange?.(e.latlng);
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    map.locate();
  }, [map]);

  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  return (
    <>
      {userPosition && (
        <Marker position={userPosition}>
          <Popup>Posizione utente</Popup>
        </Marker>
      )}
      {selectedPoint && (
        <Marker position={selectedPoint}
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


export default function HomePage({ user, loggedIn }) {
  return (
    <MapContainer 
      center={[45.0703, 7.6869]} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SingleClickMarker onPointChange={(point) => console.log('Selected point:', point)} user={user} loggedIn={loggedIn} />
    </MapContainer>
  );
}



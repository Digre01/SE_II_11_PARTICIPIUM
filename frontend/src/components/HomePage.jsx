import { Container } from 'react-bootstrap'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Button } from 'design-react-kit';
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
      {/* Nessuna geolocalizzazione automatica all'avvio */}
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


export default function HomePage({ user, loggedIn }) {
  return (
    <MapContainer 
      center={[45.0703, 7.6869]} 
      zoom={15}
      //Parameters for zoom control
      minZoom={15}
      maxZoom={15} 
      zoomControl={false}
      scrollWheelZoom={false}

      style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Marker fisso al centro di Torino con stile standard */}
      <Marker position={{ lat: 45.0703, lng: 7.6869 }}>
        <Popup>Turin Center</Popup>
      </Marker>
      <SingleClickMarker onPointChange={(point) => console.log('Selected point:', point)} user={user} loggedIn={loggedIn} />
    </MapContainer>
  );
}



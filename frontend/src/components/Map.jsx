import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './HomePage.css';


function SingleClickMarker({ onPointChange, user, loggedIn }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const navigate = useNavigate();
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  const selectedPinIcon = useMemo(() => new L.Icon.Default({ className: 'selected-pin-red' }), []);

  useMapEvents({
    click(e) {
      setSelectedPoint(e.latlng);
      onPointChange?.(e.latlng);
      /* Reverse geocoding to get address
      Nominatim.reverseGeocode({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        addressdetails: 1,
        format: 'json'
      }).then((data) => {
        if (data && data.address) {
          const addr = data.address;  
          const selectedAddress = [
            addr.road || '',
            addr.house_number || '',
            addr.city || addr.town || addr.village || '',
            addr.state || '',
            addr.postcode || '',
            addr.country || ''
          ].filter(Boolean).join(', ');
          setSelectedAddress(selectedAddress);
        } else {
          setSelectedAddress(null);
        }
      });*/
    }
  });



  return (
    <>
      {selectedPoint && (
        <Marker
          position={selectedPoint}
          icon={selectedPinIcon}
          eventHandlers={{ add: ev => ev.target.openPopup() }}
        >
          {isCitizen && (
            <Popup>
              {selectedAddress || `${selectedPoint.lat.toFixed(5)}, ${selectedPoint.lng.toFixed(5)}`}<br />
              <button
                onClick={() => navigate('/report', { state: { lat: selectedPoint.lat, lng: selectedPoint.lng } })}
              >
                Create Report
              </button>
            </Popup>
          )}
        </Marker>
      )}
    </>
  );
}

export default function Map({ user, loggedIn, onPointChange }) {
  const center = [45.0703, 7.6869];
  const initialZoom = 12; // start wider
  const targetZoom = 15;  // animate to this

  function IntroZoom() {
    const map = useMap();
    useEffect(() => {
      // Ensure starting state, then animate into the center
      map.setView(center, initialZoom, { animate: false });
      // Use flyTo for a smooth pan+zoom animation
      requestAnimationFrame(() => map.flyTo(center, targetZoom, { duration: 1.2 }));
    }, [map]);
    return null;
  }

  return (
    <MapContainer
      data-testid="map-container"
      center={center}
      zoom={initialZoom}
      maxBounds={[[45.0027, 7.5703], [45.144, 7.7783]]}
      maxBoundsViscosity={1.0}
      style={{ height: '90vh', width: '100%' }}
    >
      <IntroZoom />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={{ lat: 45.0703, lng: 7.6869 }}>
        <Popup>Turin Center</Popup>
      </Marker>
      <SingleClickMarker user={user} loggedIn={loggedIn} onPointChange={onPointChange} />
    </MapContainer>
  );
}

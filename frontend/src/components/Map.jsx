import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './HomePage.css';
import API from '../API/API.mjs';


async function reverseGeocode({ lat, lon, signal }) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '18');
  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'it' },
    signal
  });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return res.json();
}

function SingleClickMarker({ onPointChange, user, loggedIn }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const requestRef = useRef(null);
  const navigate = useNavigate();
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  const selectedPinIcon = useMemo(() => new L.Icon.Default({ className: 'selected-pin-red' }), []);

  useMapEvents({
    click(e) {
      setSelectedPoint(e.latlng);
      onPointChange?.(e.latlng);
      // Reverse geocoding to get address 
      try {
        if (requestRef.current) requestRef.current.abort();
        const ctrl = new AbortController();
        requestRef.current = ctrl;
        reverseGeocode({ lat: e.latlng.lat, lon: e.latlng.lng, signal: ctrl.signal })
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              const formattedAddress = [
                addr.road || '',
                addr.house_number || '',
                addr.city || addr.town || addr.village || '',
                addr.state || ''
              ].filter(Boolean).join(', ');
              setSelectedAddress(formattedAddress);
            } else {
              setSelectedAddress(null);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') setSelectedAddress(null);
          })
          .finally(() => {
            requestRef.current = null;
          });
      } catch {
        setSelectedAddress('Address not available');
      }
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
                onClick={() => navigate('/report', { state: { lat: selectedPoint.lat, lng: selectedPoint.lng, address: selectedAddress || null } })}
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
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let mounted = true;
    API.fetchAcceptedReports()
      .then(list => { if (mounted) setReports(list); })
      .catch(() => { if (mounted) setReports([]); });
    return () => { mounted = false; };
  }, []);

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
      {reports.map(r => (
        <Marker key={r.id} position={{ lat: r.latitude, lng: r.longitude }}>
          <Popup>
            <strong>{r.title}</strong><br />
            {r.photo ? <img src={SERVER_URL + r.photo} alt={r.title} style={{ maxWidth: '120px', marginTop: '6px' }} /> : null}
          </Popup>
        </Marker>
      ))}
      <SingleClickMarker user={user} loggedIn={loggedIn} onPointChange={onPointChange} />
    </MapContainer>
  );
}

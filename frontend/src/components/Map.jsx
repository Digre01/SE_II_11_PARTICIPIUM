import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './HomePage.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import API, { SERVER_URL } from '../API/API.mjs';



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

  const selectedPinIcon = useMemo(() => new L.Icon.Default({ className: 'selected-pin-green' }), []);
  
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

function ClusteredReports({ reports, reportsPinIcon }) {
  const map = useMap();
  // Simple HTML escape
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  useEffect(() => {
    if (!map) return;
    const clusterGroup = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 40, spiderfyOnMaxZoom: true });
    reports.forEach(r => {
      const marker = L.marker([r.latitude, r.longitude], { icon: reportsPinIcon });
      const imgHtml = (r.photos && r.photos[0] && r.photos[0].link)
        ? `<img src='${esc(SERVER_URL + r.photos[0].link)}' alt='${esc(r.title)}' style='max-width:120px;margin-top:6px'/>`
        : '';
      const author = r.authorName ? `<span style='font-size:0.75rem'>by ${esc(r.authorName)}</span><br/>` : '';
      marker.bindPopup(`<strong>${esc(r.title)}</strong><br/>${author}${imgHtml}`);
      clusterGroup.addLayer(marker);
    });
    map.addLayer(clusterGroup);
    return () => { map.removeLayer(clusterGroup); };
  }, [map, reports, reportsPinIcon]);
  return null;
}

export default function Map({ user, loggedIn, onPointChange }) {
  const center = [45.0703, 7.6869];
  const initialZoom = 12; // start wider
  const targetZoom = 15;  // animate to this
  const [reports, setReports] = useState([]);
  const reportsPinIcon = useMemo(() => new L.Icon.Default({ className: 'reports-pin-orange' }), []);
  

  // Fetch accepted reports on mount
  useEffect(() => {
    let mounted = true;
    API.fetchAcceptedReports()
      .then(list => { if (mounted) setReports(list); })
      .catch(() => { if (mounted) setReports([]); });
    return () => { mounted = false; };
  }, []);

  // Component to handle intro zoom animation
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
      minZoom={11}
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
      <ClusteredReports reports={reports} reportsPinIcon={reportsPinIcon} />
      <SingleClickMarker user={user} loggedIn={loggedIn} onPointChange={onPointChange} />
    </MapContainer>
  );
}

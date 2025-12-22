import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import { useEffect, useState, useMemo, useRef, use } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './HomePage.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import API, { SERVER_URL } from '../API/API.mjs';

import turinData from '../data/turin_boundaries.json';



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

async function GeocodeResearch({ query, signal }) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('viewbox', '7.5703,45.144,7.7783,45.0027'); // Bounding box for Turin
  url.searchParams.set('bounded', '1');
  url.searchParams.set('countrycodes', 'it');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '4');
  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'it' },
    signal
  });
  if (!res.ok) throw new Error(`Search address failed: ${res.status}`);
  return res.json();
}

function SearchAddress({ onPointChange }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showList, setShowList] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const requestRef = useRef(null);
  const debounceRef = useRef(null);
  const stopAll = (e) => {
    // Stop event from reaching Leaflet map handlers, but do not prevent default
    // so the input can still receive focus and clicks.
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation && e.nativeEvent.stopPropagation();
    }
  };

  useEffect(() => {
    if( !query || query.trim().length < 3 ) {
      setResults([]);
      setShowList(false);
      if (requestRef.current) { requestRef.current.abort(); }
      return;
    }
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    debounceRef.current = setTimeout(() => {
      try {
        if (requestRef.current) requestRef.current.abort();
        const ctrl = new AbortController();
        requestRef.current = ctrl;
        GeocodeResearch({ query: query.trim(),signal: ctrl.signal })
          .then((data) => {
            setResults(Array.isArray(data) ? data : []);
            setShowList(true);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setResults([]);
              setShowList(false);
            }
          })
          .finally(() => { requestRef.current = null; });
      } catch {
        setResults([]);
        setShowList(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) { clearTimeout(debounceRef.current); }
    };
    }, [query]);

    function selectResult(item) {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const addr = item.address || {};
      const neighborhood = (addr.neighbourhood || addr.suburb || '').trim();
      const cityLike = (addr.city || addr.town || addr.village || '').trim();
      const street = String(addr.road || '').trim();
      const formattedAddress = [street, neighborhood, cityLike].filter(Boolean).join(', ');
      setSelectedPoint({ lat, lng });
      setSelectedAddress(formattedAddress);
      setShowList(false);
      if(map) map.flyTo([lat, lng], 16, {duration: 0.8});
      onPointChange?.({ lat, lng });
    }

    function clearSelection() {
      setSelectedPoint(null);
      setSelectedAddress('');
    }
    function formatSuggestionLabel(item) {
      const addr = item.address || {};
      const street = String(addr.road || '').trim();
      const neighborhood = String(addr.neighbourhood || addr.suburb || '').trim();
      const cityLike = String(addr.city || addr.town || addr.village || '').trim();
      const parts = [street, neighborhood, cityLike].filter(Boolean);
      if (parts.length) return parts.join(', ');
      const dn = String(item.display_name || '').trim();
      return dn ? dn.split(',')[0] : '';
    }

    return (
    <div
      style={{ position: 'absolute', top: 12, left: 64, zIndex: 1000, width: 'min(420px, 70vw)' }}
      onMouseDownCapture={stopAll}
        onWheelCapture={stopAll}
        onPointerDownCapture={stopAll}
        onPointerUpCapture={stopAll}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
            onMouseDownCapture={stopAll}
            onClickCapture={stopAll}
            onFocus={(e) => { /* prevent map interactions when focusing input */ }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // If we already have results, pick the first
              if (results && results.length > 0) {
                selectResult(results[0]);
                setShowList(false);
                return;
              }
              // Otherwise, try to fetch immediately and pick first result
              const q = query.trim();
              if (q.length >= 3) {
                try {
                  const ctrl = new AbortController();
                  const data = await GeocodeResearch({ query: q, signal: ctrl.signal });
                  if (Array.isArray(data) && data.length > 0) {
                    selectResult(data[0]);
                    setShowList(false);
                  }
                } catch {}
              }
            }
          }}
          placeholder="Search address in Turin..."
          aria-label="Search address"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #c2c8d0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            background: 'white'
          }}
        />
        {selectedPoint && (
          <button onClick={clearSelection} title="Pulisci selezione" style={{ padding: '8px 10px' }}>
            ✕
          </button>
        )}
      </div>
      {showList && results.length > 0 && (
        <div style={{
          marginTop: 6,
          background: 'white',
          border: '1px solid #c2c8d0',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          maxHeight: '280px',
          overflowY: 'auto'
        }}>
          {results.map((r) => (
            <button
              key={`${r.place_id}`}
              type="button"
                onClick={(e) => { stopAll(e); selectResult(r); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                color: '#1c1c1c',
                cursor: 'pointer'
              }}
            >
              {formatSuggestionLabel(r)}
            </button>
          ))}
        </div>
      )}

      {selectedPoint && (
        <Marker position={selectedPoint} eventHandlers={{ add: ev => ev.target.openPopup() }}>
          <Popup>{selectedAddress || `${selectedPoint.lat.toFixed(3)}, ${selectedPoint.lng.toFixed(3)}`}<br />
            <button
                  onClick={() => navigate('/report', { state: { lat: selectedPoint.lat, lng: selectedPoint.lng, address: selectedAddress || null } })}
                >
                  Create Report
                </button>
          </Popup>
        </Marker>
      )}
    </div>
  );
}
function SingleClickMarker({ onPointChange, user, loggedIn }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isInTurin, setIsInTurin] = useState(false);
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

      
              const cityLike = (addr.city || addr.town || addr.village || '').trim().toLowerCase();
              setIsInTurin(cityLike === 'torino');
            } else {
              setSelectedAddress(null);
              setIsInTurin(false);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setSelectedAddress(null);
              setIsInTurin(false);
            }
          })
          .finally(() => {
            requestRef.current = null;
          });
      } catch {
        setSelectedAddress('Address not available');
        setIsInTurin(false);
      }
    }
  });



  return (
    <>
      {selectedPoint && (
        <Marker
          position={selectedPoint}
          eventHandlers={{ add: ev => ev.target.openPopup() }}
        >
          {isCitizen && (
            <Popup>
              {selectedAddress || `${selectedPoint.lat.toFixed(3)}, ${selectedPoint.lng.toFixed(3)}`}<br />
              {isInTurin && (
                <button
                  onClick={() => navigate('/report', { state: { lat: selectedPoint.lat, lng: selectedPoint.lng, address: selectedAddress || null } })}
                >
                  Create Report
                </button>
              )}
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

export default function ReportsMap({ user, loggedIn, onPointChange }) {
  const center = [45.0703, 7.6869];
  const initialZoom = 12; // start wider
  const targetZoom = 15;  // animate to this
  const [reports, setReports] = useState([]);
  const reportsPinIcon = useMemo(() => new L.Icon.Default({ className: 'reports-pin-orange' }), []);

  const cityBoundary = useMemo(() => {
    return turinData?.find(item => item.addresstype === 'city');
  }, []);

  const maskData = useMemo(() => {
    if (!cityBoundary || !cityBoundary.geojson) return null;

    // CORREZIONE: Usa [Longitudine, Latitudine] per il GeoJSON
    // Torino è circa a Lat 45, Lon 7.
    // Il box deve coprire un'area più ampia.
    const outerCoords = [
      [6.50, 46.60], // Top Left (Lon, Lat)
      [9.30, 46.60], // Top Right
      [9.30, 44.00], // Bottom Right
      [6.50, 44.00], // Bottom Left
      [6.50, 46.60]  // Chiudi il cerchio
    ];

    let cityCoords = [];
    const geo = cityBoundary.geojson;

    // Assumiamo che geo.coordinates siano già nel formato standard GeoJSON [Lon, Lat]
    if (geo.type === 'Polygon') {
      cityCoords = geo.coordinates[0];
    } else if (geo.type === 'MultiPolygon') {
      // Nota: Se Torino è un MultiPolygon (es. ha isole), questo prende solo la forma principale.
      // Per una maschera perfetta servirebbe gestire tutti i poligoni, ma spesso basta il principale.
      cityCoords = geo.coordinates[0][0];
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        // In GeoJSON: primo array = forma esterna, array successivi = buchi interni
        coordinates: [outerCoords, cityCoords]
      }
    };
  }, [cityBoundary]);

  const maskStyle = {
    color: 'transparent', 
    fillColor: '#001c50ff', 
    fillOpacity: 0.2,   
    interactive: false    
  };

  // Fetch accepted reports on mount
  useEffect(() => {
    let mounted = true;
    API.fetchAssignedReports()
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

  // Load Turin boundaries and add to map
  const boundaryStyle = {
    color: '#001c50ff', 
    weight: 3,       
    opacity: 1,       // Opacity of the border line
    fillOpacity: 0,   // IMPORTANT: 0 makes the inside transparent
  };

  return (
    <MapContainer
      data-testid="map-container"
      center={center}
      zoom={initialZoom}
      minZoom={13}
      maxBounds={[[45.0027, 7.5703], [45.144, 7.7783]]}
      maxBoundsViscosity={1.0}
      style={{ height: '90vh', width: '100%' }}
    >
      <IntroZoom />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Search Address Component */}
      <SearchAddress onPointChange={onPointChange} />

      
      {/* External Mask */}
      {maskData && (
        <GeoJSON 
          key="turin-mask"
          data={maskData} 
          style={maskStyle} 
        />
      )}
      {/* City */}
      {cityBoundary && (
        <GeoJSON 
          key={cityBoundary.osm_id} 
          data={cityBoundary.geojson} 
          style={boundaryStyle} 
          interactive={false} 
        />
      )}

      <ClusteredReports reports={reports} reportsPinIcon={reportsPinIcon} />
      <SingleClickMarker user={user} loggedIn={loggedIn} onPointChange={onPointChange} />
    </MapContainer>
  );
}

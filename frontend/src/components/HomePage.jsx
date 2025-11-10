import { Container } from 'react-bootstrap'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'


function SingleClickMarker({ onPointChange }) {
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

  useEffect(() => {
    map.locate();
  }, [map]);

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
          <Popup>Lat: {selectedPoint.lat.toFixed(5)}, Lng: {selectedPoint.lng.toFixed(5)} 
            <br /> Compile Report
          </Popup>
        </Marker>
      )}
    </>
  );
}


export default function HomePage() {

  return (
    /*<Container className="d-flex flex-column justify-content-center align-items-center text-center">
      <h2>Hello</h2>
    </Container>*/
    <MapContainer 
    center={[45.0703, 7.6869]} 
    zoom={13} 
    style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SingleClickMarker onPointChange={(point) => console.log('Selected point:', point)} />
    </MapContainer>
  )
}



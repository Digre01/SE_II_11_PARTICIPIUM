import { Container } from 'react-bootstrap'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

function HomePage() {

  return (
    /*<Container className="d-flex flex-column justify-content-center align-items-center text-center">
      <h2>Hello</h2>
    </Container>*/
    <MapContainer center={[45.0703, 7.6869]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[45.0703, 7.6869]}>
        <Popup>
          Piazza Castello  <br /> Centro di Torino.
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default HomePage

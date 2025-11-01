import { Container, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router'

function HomePage() {
  const navigate = useNavigate()

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center text-center">
      <h2>Welcome! Please choose your role</h2>

      <div className="d-flex gap-3">
        <Button variant="primary" size="lg" onClick={() => navigate('/customer')}>
          Customer
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/officer')}>
          Officer
        </Button>
      </div>
    </Container>
  )
}

export default HomePage

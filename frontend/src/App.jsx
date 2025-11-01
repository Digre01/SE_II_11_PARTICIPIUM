import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes } from 'react-router'
import CustomerHome from './components/CustomerHome'
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage'
import OfficerHome from './components/OfficerHome'

function App() {

  return (
    <>
     <Routes>
      <Route element={<DefaultLayout/>}>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/customer' element={<CustomerHome/>}/>
        <Route path='/officer' element={<OfficerHome/>}/>
      </Route>
     </Routes>
    </>
  )
}

export default App

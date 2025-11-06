
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes } from 'react-router'
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import StaffRegistration from './components/StaffRegistration';


function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout/>}>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/staff_signup' element={<StaffRegistration/>}/>
      </Route>
     </Routes>
  );
}

export default App

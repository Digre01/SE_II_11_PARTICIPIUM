
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes } from 'react-router'
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';


function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout/>}>
        <Route path='/' element={<HomePage/>}/>
      </Route>
     </Routes>
  );
}

export default App

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes, Navigate } from 'react-router'; 
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import StaffRegistration from './components/StaffRegistration';
import ReportForm from './components/ReportForm';
import API from "./API/API.mjs";
import { useState } from "react";
import { LoginForm } from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";



function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);

  const isAdmin = user?.userType === 'admin';

  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials); 
    setUser(user);
    setLoggedIn(true);
    return { user: u, isAdmin: u?.userType === 'admin' }; 
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
  };

  const handleSignUp = async (data) => {
    const user = await API.signUp(data);
    setUser(user);
    setLoggedIn(true);
    setUser(user)
  };

  return (
    <Routes>
      <Route element={<DefaultLayout user={user} loggedIn={loggedIn} isAdmin={isAdmin}/> }>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/login' element={
          loggedIn ? <Navigate to='/' replace /> : <LoginForm handleLogin={handleLogin}/>
        }/>
        <Route path='/signup' element={<SignUpForm handleSignUp={handleSignUp}/>}/>
        <Route path='/staff_signup' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isAdmin)
              ? <StaffRegistration/>
              : <Navigate to="/" replace />
        }/>
        <Route path='/report' element={<ReportForm/>} />
      </Route>
    </Routes>
  );
}

export default App

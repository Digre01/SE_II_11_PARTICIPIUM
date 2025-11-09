import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes, Navigate } from 'react-router'; 
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import StaffRegistration from './components/StaffRegistration';
import AssignRole from './components/AssignRole';
import ReportForm from './components/ReportForm';
import API from "./API/API.mjs";
import { useState, useEffect } from "react";
import { LoginForm } from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";



function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);

  const isAdmin = user?.userType === 'admin';

  useEffect(() => {
    // Recupera lo stato utente dalla sessione attiva
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sessions/current', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setLoggedIn(true);
        } else {
          setUser(undefined);
          setLoggedIn(false);
        }
      } catch {
        setUser(undefined);
        setLoggedIn(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials); 
    setUser(user);
    setLoggedIn(true);
    return { user, isAdmin: user?.userType === 'admin' }; 
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
  };

  return (
    <Routes>
      <Route element={<DefaultLayout user={user} loggedIn={loggedIn} isAdmin={isAdmin} handleLogout={handleLogout}/> }>
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
        <Route path='/assign_role' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isAdmin)
              ? <AssignRole/>
              : <Navigate to="/" replace />
        }/>
      <Route path='/report' element={<ReportForm user={user} loggedIn={loggedIn}/>} />
      </Route>
    </Routes>
  );
}

export default App

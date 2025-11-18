import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes, Navigate } from 'react-router'; 
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage.jsx';
import StaffRegistration from './components/StaffRegistration';
import AssignRole from './components/AssignRole';
import ReportForm from './components/ReportForm';
import AccountConfig from './components/AccountConfig.jsx';
import ReportReview from './components/ReportReview.jsx';
import StaffReports from './components/StaffReports';
import API from "./API/API.mjs";
import { useState, useEffect } from "react";
import { LoginForm } from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";



function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);
  const [isReportsAllowed, setIsReportsAllowed] = useState(false);

  const isAdmin = String(user?.userType || '').toLowerCase() === 'admin';
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  useEffect(() => {
    // Recupera lo stato utente dalla sessione attiva
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/sessions/current', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // determine if the user has the specific role required for reports
          const roleName = userData?.roleName || null;
          setIsReportsAllowed(Boolean(roleName && String(roleName).toLowerCase() === 'municipal public relations officer'));
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
    const roleName = user?.roleName || null;
    setIsReportsAllowed(Boolean(roleName && String(roleName).toLowerCase() === 'municipal public relations officer'));
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
    setIsReportsAllowed(false);
    setLoggedIn(true);
  };

  return (
    <Routes>
      <Route element={<DefaultLayout user={user} loggedIn={loggedIn} isAdmin={isAdmin} isReportsAllowed={isReportsAllowed} handleLogout={handleLogout}/> }>
        <Route path='/' element={<HomePage user={user} loggedIn={loggedIn} isAdmin={isAdmin} />}/>
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
        <Route path='/report' element={
          isCitizen
            ? <ReportForm user={user} loggedIn={loggedIn}/>
            : <Navigate to="/" replace />
        } />
        <Route path='/reports' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isReportsAllowed)
              ? <StaffReports />
              : <Navigate to="/" replace />
        } />

        <Route path='/review/:id' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isReportsAllowed)
              ? <ReportReview user={user} loggedIn={loggedIn} />
              : <Navigate to="/" replace />
        } />
        <Route path='/setting' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isCitizen)
              ? <AccountConfig user={user} loggedIn={loggedIn} />
              : <Navigate to="/" replace />
        } />
      </Route>
    </Routes>
  );
}

export default App

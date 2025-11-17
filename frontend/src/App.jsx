import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes, Navigate } from 'react-router'; 
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage.jsx';
import StaffRegistration from './components/StaffRegistration';
import AssignRole from './components/AssignRole';
import ReportForm from './components/ReportForm';
import AccountConfig from './components/AccountConfig.jsx';
import API from "./API/API.mjs";
import { useState, useEffect } from "react";
import { LoginForm } from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";
import ConversationsPage from './components/messageComponents/ConversationsPage.jsx';
import ConversationPage from './components/messageComponents/ConversationPage.jsx';




function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const isAdmin = String(user?.userType || '').toLowerCase() === 'admin';
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/sessions/current', {
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
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<DefaultLayout user={user} loggedIn={loggedIn} isAdmin={isAdmin} handleLogout={handleLogout}/> }>
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
        <Route path='/setting' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : (isCitizen)
              ? <AccountConfig user={user} loggedIn={loggedIn} />
              : <Navigate to="/" replace />
        } />
        <Route path='/conversations' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : <ConversationsPage user={user} loggedIn={loggedIn} />
        } />
        <Route path='/conversations/:conversationId' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : <ConversationPage user={user} loggedIn={loggedIn} />
        } />
      </Route>
    </Routes>
  );
}

export default App

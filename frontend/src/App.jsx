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
import { useState, useEffect, useRef } from "react";
import { LoginForm } from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";
import ConversationsPage from './components/messageComponents/ConversationsPage.jsx';
import ConversationPage from './components/messageComponents/ConversationPage.jsx';





function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [wsMessage, setWsMessage] = useState(null);
  const wsRef = useRef(null);

  const isAdmin = String(user?.userType || '').toLowerCase() === 'admin';
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  // Aggiorna il conteggio notifiche
  const updateNotificationCount = async () => {
    if (loggedIn && (isCitizen || isStaff) && user) {
      try {
        const notifications = await API.fetchNotifications();
        setNotificationCount(notifications.length);
      } catch {
        setNotificationCount(0);
      }
    } else {
      setNotificationCount(0);
    }
  };

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

  useEffect(() => {
    updateNotificationCount();
    // eslint-disable-next-line
  }, [loggedIn, user]);

  // Connessione WebSocket e gestione eventi
  useEffect(() => {
    if (loggedIn && user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      const ws = new window.WebSocket('ws://localhost:3000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        // console.log('WebSocket connected');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            // Aggiorna notifiche e triggera aggiornamento conversazioni/messaggi
            await updateNotificationCount();
            setWsMessage(data.message); // Passa il messaggio ai figli
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
      ws.onerror = () => {};
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [loggedIn, user]);

  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials); 
    setUser(user);
    setLoggedIn(true);
    updateNotificationCount();
    return { user, isAdmin: user?.userType === 'admin' }; 
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
    setNotificationCount(0);
  };

  const handleSignUp = async (data) => {
    const user = await API.signUp(data);
    setUser(user);
    setLoggedIn(true);
    updateNotificationCount();
  };

  // Funzione da passare ai figli per aggiornare le notifiche
  const handleNotificationsUpdate = () => {
    updateNotificationCount();
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
      <Route element={<DefaultLayout user={user} loggedIn={loggedIn} isAdmin={isAdmin} handleLogout={handleLogout} notificationCount={notificationCount}/> }>
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
            : <ConversationsPage user={user} loggedIn={loggedIn} handleNotificationsUpdate={handleNotificationsUpdate} wsMessage={wsMessage} />
        } />
        <Route path='/conversations/:conversationId' element={
          (!loggedIn)
            ? <Navigate to="/login" replace />
            : <ConversationPage user={user} loggedIn={loggedIn} handleNotificationsUpdate={handleNotificationsUpdate} wsMessage={wsMessage} />
        } />
      </Route>
    </Routes>
  );
}

export default App

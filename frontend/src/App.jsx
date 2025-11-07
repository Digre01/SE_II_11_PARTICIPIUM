
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

import { Route, Routes } from 'react-router'
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import StaffRegistration from './components/StaffRegistration';
import ReportForm from './components/ReportForm';
import API from "./API/API.mjs";
import {useState} from "react";
import LoginForm from "./components/authComponents/loginForm.jsx";
import SignUpForm from "./components/authComponents/signUpForm.jsx";


function App() {
    const [loggedIn, setLoggedIn] =  useState(false);
    const [user, setUser] = useState(undefined);

    const handleLogin = async (credentials) => {
        const user = await API.logIn(credentials);
        console.log("logged in");
        setLoggedIn(true);
        setUser(user);
        return user;
    };

    const handleLogout = async () => {
        await API.logOut();
        setLoggedIn(false);
        setUser(undefined);
    };

    const handleSignUp = async (data) => {
        const user = await API.signUp(data);
        console.log("signed up");
        setLoggedIn(true);
        setUser(user);
        console.log(user);
        return user;
    }

    return (
        <Routes>
            <Route element={<DefaultLayout/>}>
                <Route path='/' element={<HomePage/>}/>
                <Route path='/login' element={<LoginForm handleLogin={handleLogin}/>}/>
                <Route path='/signup' element={<SignUpForm handleSignUp={handleSignUp}/>}/>
                <Route path='/staff_signup' element={<StaffRegistration/>}/>
                <Route path='/report' element={<ReportForm/>} />
            </Route>
         </Routes>
    );
}

export default App

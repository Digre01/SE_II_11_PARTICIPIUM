// imports
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from "express-session";
import {userRepository} from "./repositories/userRepository.js";
import userRoutes from "./routes/userRoutes.js";

// init express
const app = new express();
const port = 3001;

// middleware
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};

app.use(cors(corsOptions));

/** PASSPORT CONFIGURATION */
passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const user = await userRepository.getUserByUsernameAndPassword(username, password);
    if (!user) {
        return cb(null, false, 'Incorrect username or password');
    }
    return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    return cb(null, user);
});

app.use(session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

// API routes
app.use('/api/users', userRoutes);  //gestisce gli utenti in generale

export default app;
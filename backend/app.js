// imports
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import session from "express-session";
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

app.use(session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));

// API routes
app.use('/api/sessions', userRoutes);

export default app;
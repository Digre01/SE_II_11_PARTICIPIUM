// imports
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import session from 'express-session';
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from './routes/reportRoutes.mjs';
import multerErrorHandler from './middlewares/multerErrorHandler.js';
import errorHandler from './middlewares/errorHandler.js';
import corsOptions from "./config/cors.js";

// init express
const app = new express();
const port = 3000;

// middleware
app.use(express.json());

app.use(cors(corsOptions));

app.use(session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));

// API routes

app.use('/public', express.static(new URL('./public', import.meta.url).pathname));
app.use('/api/sessions', userRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(errorHandler);
app.use(multerErrorHandler);

export default app;
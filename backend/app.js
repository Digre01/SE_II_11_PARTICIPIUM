// imports
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import session from 'express-session';
import userRoutes from "./routes/userRoutes.js";

// init express
const app = new express();
const port = 3000;

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

// Global JSON error handler to ensure consistent error responses
// This catches errors thrown/passed by middlewares (e.g., authorization)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || (
    err?.message === 'UNAUTHORIZED' ? 401 :
    err?.message === 'FORBIDDEN' ? 403 :
    500
  );

  let message = 'Internal Server Error';
  if (status === 401) message = 'Unauthorized user';
  else if (status === 403) message = 'Forbidden';
  else if (err?.message && !['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) message = err.message;

  res.status(status).json({ error: message });
});

export default app;
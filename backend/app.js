// imports
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import session from 'express-session';
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from './routes/reportRoutes.mjs';
import categoryRoutes from './routes/categoryRoutes.mjs';
import multerErrorHandler from './middlewares/multerErrorHandler.js';
import errorHandler from './middlewares/errorHandler.js';
import corsOptions from "./config/cors.js";
import rolesRoutes from "./routes/rolesRoutes.js";
import officeRoutes from "./routes/officeRoutes.js";

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
app.use('/api/v1/sessions', userRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/offices', officeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(errorHandler);
app.use(multerErrorHandler);

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
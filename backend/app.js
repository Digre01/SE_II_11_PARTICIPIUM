// imports
import express from 'express';
import cors from 'cors';
import reportRoutes from './routes/reportRoutes.mjs';
import multerErrorHandler from './middlewares/multerErrorHandler.js';
import errorHandler from './middlewares/errorHandler.js';

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

// API routes

app.use('/public', express.static(new URL('./public', import.meta.url).pathname));

app.use('/api/v1/reports', reportRoutes);


app.use(multerErrorHandler);
app.use(errorHandler);

export default app;
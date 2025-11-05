// imports
import express from 'express';
import cors from 'cors';

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
//app.use('/api/v1', queueRoutes);

export default app;
import { createAppError } from '../services/errorService.js';

export default function errorHandler(err, req, res, next) {
  const error = createAppError(err);
  res.status(error.code || 500).json({
    name: error.name,
    message: error.message
  });
}

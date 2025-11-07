// Multer error handler middleware
export default function multerErrorHandler(err, req, res, next) {
  if (err && err.name === 'MulterError') {
    let message = 'Upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Too large file: maximum 2MB per file.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'You can upload up to 3 photos.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files or invalid field.';
    }
    return res.status(400).json({ error: message });
  } else if (err && err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed.' });
  }
  next(err);
}

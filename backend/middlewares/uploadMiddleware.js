import multer from 'multer';
import path from 'path';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.resolve(process.cwd(), 'public');
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Limits: max 3 files, max 2MB per file, only images
const upload = multer({
  storage: storage,
  limits: {
    files: 3,
    fileSize: 2 * 1024 * 1024 // 2MB per file
  },
  fileFilter: (req, file, cb) => {
    // Only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export default upload;

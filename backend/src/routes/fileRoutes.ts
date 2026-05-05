import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getFiles, getFilesByUser, getCategories, viewFile, deleteFile, updateFile, searchFiles } from '../controllers/fileController.js';

const router = Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max upload size
  },
});

// Routes
router.get('/categories', getCategories);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/search', searchFiles);
router.get('/user/:username', getFilesByUser);
router.get('/:id', viewFile);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);
router.get('/', getFiles);

export default router;

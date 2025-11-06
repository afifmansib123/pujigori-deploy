import { Router } from 'express';
import multer from 'multer';
import UploadController from '../controllers/UploadController';
// import { authMiddleware, adminMiddleware } from '../middleware/auth'; // TODO: Implement auth middleware
import {creatorMiddleware} from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation (additional validation in controller)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  } 
});

// Public utility routes
router.post('/validate', UploadController.validateFile);
router.get('/health', UploadController.getUploadHealth);

// File upload routes (require authentication in production)
// router.post('/single', authMiddleware, upload.single('file'), UploadController.uploadSingle);
 router.post('/multiple', creatorMiddleware, upload.array('files', 10), UploadController.uploadMultiple);
// router.post('/presigned-url', authMiddleware, UploadController.getPresignedUrl);

// File management routes (require authentication in production)
// router.delete('/:key', authMiddleware, UploadController.deleteFile);
// router.post('/delete-multiple', authMiddleware, UploadController.deleteMultipleFiles);
// router.get('/file-info/:key', authMiddleware, UploadController.getFileInfo);
// router.get('/download/:key', authMiddleware, UploadController.getDownloadUrl);
// router.post('/copy', authMiddleware, UploadController.copyFile);

// Admin routes
// router.get('/list/:folder', adminMiddleware, UploadController.listFiles);
// router.get('/storage-stats', adminMiddleware, UploadController.getStorageStats);

// Temporary routes for development (remove when auth is integrated)
router.post('/single', upload.single('file'), UploadController.uploadSingle);
router.post('/multiple', upload.array('files', 10), UploadController.uploadMultiple);
router.post('/presigned-url', UploadController.getPresignedUrl);
router.delete('/:key', UploadController.deleteFile);
router.post('/delete-multiple', UploadController.deleteMultipleFiles);
router.get('/file-info/:key', UploadController.getFileInfo);
router.get('/download/:key', UploadController.getDownloadUrl);
router.post('/copy', UploadController.copyFile);
router.get('/list/:folder', UploadController.listFiles);
router.get('/storage-stats', UploadController.getStorageStats);

// Error handling for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;
import express from 'express';
import { signup, login, forgotPassword, resetPassword, verifyToken, updateProfile, getUsers, adminUpdateUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify', verifyToken);
router.put('/profile', authenticateToken, updateProfile);
router.get('/users', authenticateToken, getUsers);
router.put('/user/:targetUserId', authenticateToken, adminUpdateUser);

export default router;

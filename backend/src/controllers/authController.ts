import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import crypto from 'crypto';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret');
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || (process.env.NODE_ENV === 'production' ? '' : '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'); // Standard Google Test Secret
const JWT_EXPIRE = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production. Set it in the environment.');
}
if (process.env.NODE_ENV === 'production' && !RECAPTCHA_SECRET) {
  throw new Error('RECAPTCHA_SECRET is required in production. Set it in the environment.');
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      username, 
      fullName, 
      password, 
      confirmPassword,
      phoneNumber,
      address,
      province,
      cityMun,
      barangay
    } = req.body;

    // Validation
    if (!email || !username || !fullName || !password || !confirmPassword || !phoneNumber || !address || !province || !cityMun || !barangay) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        password: hashedPassword,
        phoneNumber,
        address,
        province,
        cityMun,
        barangay,
        isAdmin: false
      },
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        province: user.province,
        cityMun: user.cityMun,
        barangay: user.barangay,
        isAdmin: user.isAdmin
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email: emailOrUsername, password, captchaToken } = req.body;

    // Validation
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Verify CAPTCHA
    const skipRecaptcha = process.env.SKIP_RECAPTCHA === 'true';
    if (!skipRecaptcha) {
      if (!captchaToken) {
        return res.status(400).json({ error: 'CAPTCHA verification is required' });
      }

      if (!RECAPTCHA_SECRET) {
        return res.status(500).json({ error: 'CAPTCHA secret is not configured on the server.' });
      }

      try {
        const response = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captchaToken}`
        );

        if (!response.data.success) {
          return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
        }
      } catch (captchaError) {
        console.error('CAPTCHA verification error:', captchaError);
        return res.status(500).json({ error: 'Failed to verify CAPTCHA' });
      }
    }

    // Special Admin Check
    if (emailOrUsername === 'admin' && password === 'adminpassword') {
      let adminUser = await prisma.user.findUnique({
        where: { username: 'admin' }
      });

      if (!adminUser) {
        // Create the admin user record if it doesn't exist
        const hashedPassword = await bcryptjs.hash('adminpassword', 10);
        adminUser = await prisma.user.create({
          data: {
            email: 'admin@cityhealth.com',
            username: 'admin',
            fullName: 'System Administrator',
            password: hashedPassword,
            phoneNumber: '00000000000',
            address: 'Main Office',
            province: 'Metro Manila',
            cityMun: 'Manila',
            barangay: 'Barangay 1',
            isAdmin: true
          }
        });
      }

      const token = jwt.sign({ userId: adminUser.id, email: adminUser.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
      });

      return res.json({
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          fullName: adminUser.fullName,
          phoneNumber: adminUser.phoneNumber,
          address: adminUser.address,
          province: adminUser.province,
          cityMun: adminUser.cityMun,
          barangay: adminUser.barangay,
          isAdmin: true
        },
      });
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        province: user.province,
        cityMun: user.cityMun,
        barangay: user.barangay,
        isAdmin: user.isAdmin
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // In production, send email with reset link
    // For now, return token for testing
    res.json({
      message: 'Password reset token sent to email',
      resetToken, // Remove in production
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Failed to process forgot password' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        province: user.province,
        cityMun: user.cityMun,
        barangay: user.barangay,
        isAdmin: user.isAdmin
      },
    });
  } catch (error: any) {
    console.error('Verify token error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { fullName, phoneNumber, address, province, cityMun, barangay } = req.body;

    if (!fullName || !phoneNumber || !address || !province || !cityMun || !barangay) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phoneNumber,
        address,
        province,
        cityMun,
        barangay
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        province: updatedUser.province,
        cityMun: updatedUser.cityMun,
        barangay: updatedUser.barangay,
        isAdmin: updatedUser.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

export const getUsers = async (req: any, res: Response) => {
  try {
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        province: true,
        cityMun: true,
        barangay: true,
        isAdmin: true
      }
    });

    res.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const adminUpdateUser = async (req: any, res: Response) => {
  try {
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { targetUserId } = req.params;
    const { fullName, phoneNumber, address, province, cityMun, barangay } = req.body;

    if (!fullName || !phoneNumber || !address || !province || !cityMun || !barangay) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Fetch original user data to detect changes
    const originalUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!originalUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const changes = [];
    if (originalUser.fullName !== fullName) changes.push(`Full Name ("${originalUser.fullName}" -> "${fullName}")`);
    if (originalUser.phoneNumber !== phoneNumber) changes.push(`Phone ("${originalUser.phoneNumber}" -> "${phoneNumber}")`);
    if (originalUser.address !== address) changes.push(`Address ("${originalUser.address}" -> "${address}")`);
    if (originalUser.province !== province) changes.push(`Province ("${originalUser.province}" -> "${province}")`);
    if (originalUser.cityMun !== cityMun) changes.push(`City/Mun ("${originalUser.cityMun}" -> "${cityMun}")`);
    if (originalUser.barangay !== barangay) changes.push(`Barangay ("${originalUser.barangay}" -> "${barangay}")`);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        fullName,
        phoneNumber,
        address,
        province,
        cityMun,
        barangay
      }
    });

    // Create Detailed Admin Activity Log
    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: adminId,
          action: `ADMIN_UPDATE_USER: Modified user ${updatedUser.username}. Changes: ${changes.join(', ')}`,
        }
      });
    } else {
      await prisma.activityLog.create({
        data: {
          userId: adminId,
          action: `ADMIN_UPDATE_USER: Re-saved profile for user ${updatedUser.username} (no changes detected)`,
        }
      });
    }

    res.json({
      message: 'User updated successfully by admin',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        province: updatedUser.province,
        cityMun: updatedUser.cityMun,
        barangay: updatedUser.barangay,
        isAdmin: updatedUser.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

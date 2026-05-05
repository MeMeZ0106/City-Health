import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { validateInteger, validateString, validateOptionalString, validateUUID, validateDateRange, ValidationError, handleValidationError } from '../utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId, categoryName } = req.body;
    const file = req.file;
    const userId = req.userId;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const validatedCategoryId = validateInteger(categoryId, 'Category ID');
    const validatedUserId = validateUUID(userId, 'User ID');
    const validatedCategoryName = validateOptionalString(categoryName, 'Category name', 100);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newFile = await prisma.file.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        category: {
          connectOrCreate: {
            where: { id: validatedCategoryId },
            create: {
              id: validatedCategoryId,
              name: validatedCategoryName || 'Uncategorized',
            },
          },
        },
        uploadedBy: {
          connect: { id: validatedUserId },
        },
      },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: validatedUserId,
        action: 'UPLOAD',
        fileId: newFile.id,
      },
    });

    res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const viewFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const validatedId = validateUUID(id, 'File ID');
    const validatedUserId = validateUUID(userId, 'User ID');

    const file = await prisma.file.findUnique({
      where: { id: validatedId },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (validatedUserId) {
      await prisma.activityLog.create({
        data: {
          userId: validatedUserId,
          action: 'VIEW',
          fileId: validatedId,
        },
      });
    }

    res.json(file);
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = await prisma.file.findMany({
      include: {
        category: true,
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch (error) {
    next(error);
  }
};

export const getFilesByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    const validatedUsername = validateString(username, 'Username', 1, 100);

    const files = await prisma.file.findMany({
      where: {
        uploadedBy: {
          fullName: {
            contains: validatedUsername,
          },
        },
      },
      include: {
        category: true,
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const searchFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      fileName,
      categoryId,
      uploaderName,
      startDate,
      endDate,
      uploaderUsername
    } = req.query;

    const where: any = {};

    if (fileName) {
      const validatedFileName = validateString(fileName, 'File name', 1, 255);
      where.originalName = {
        contains: validatedFileName,
      };
    }

    if (categoryId) {
      const validatedCategoryId = validateInteger(categoryId, 'Category ID');
      where.categoryId = validatedCategoryId;
    }

    if (uploaderName) {
      const validatedUploaderName = validateString(uploaderName, 'Uploader name', 1, 255);
      where.uploadedBy = {
        fullName: {
          contains: validatedUploaderName,
        },
      };
    }

    if (uploaderUsername) {
      const validatedUploaderUsername = validateString(uploaderUsername, 'Uploader username', 1, 100);
      where.uploadedBy = {
        ...where.uploadedBy,
        username: {
          contains: validatedUploaderUsername,
        },
      };
    }

    const { start, end } = validateDateRange(startDate as string, endDate as string);
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const files = await prisma.file.findMany({
      where,
      include: {
        category: true,
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const updateFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { originalName, categoryId } = req.body;
    const userId = req.userId;

    const validatedId = validateUUID(id, 'File ID');
    const validatedUserId = validateUUID(userId, 'User ID');
    const validatedOriginalName = validateString(originalName, 'Original name', 1, 255);
    const validatedCategoryId = validateInteger(categoryId, 'Category ID');

    const file = await prisma.file.findUnique({
      where: { id: validatedId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const updatedFile = await prisma.file.update({
      where: { id: validatedId },
      data: {
        originalName: validatedOriginalName,
        categoryId: validatedCategoryId,
      },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: validatedUserId,
        action: 'UPDATE',
        fileId: validatedId,
      },
    });

    res.json({ message: 'File updated successfully!', file: updatedFile });
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const validatedId = validateUUID(id, 'File ID');
    const validatedUserId = validateUUID(userId, 'User ID');

    const file = await prisma.file.findUnique({
      where: { id: validatedId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Create activity log before deleting file record
    if (validatedUserId) {
      await prisma.activityLog.create({
        data: {
          userId: validatedUserId,
          action: 'DELETE',
          fileId: validatedId,
        },
      });
    }

    // Delete file from database - Prisma will handle logs referencing this file
    await prisma.activityLog.deleteMany({
      where: { fileId: validatedId },
    });

    await prisma.file.delete({
      where: { id: validatedId },
    });

    // Delete file from filesystem AFTER DB deletion for consistency
    const filePath = path.join(__dirname, '../../uploads', file.storedName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete physical file:', err);
      }
    }

    res.json({ message: 'File deleted successfully!' });
  } catch (error) {
    handleValidationError(error, res, next);
  }
};



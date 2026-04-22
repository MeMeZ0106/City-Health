import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../prisma.js';

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

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId, categoryName, userId, username, fullName } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const parsedCategoryId = Number(categoryId);
  if (!parsedCategoryId || !userId || !fullName) {
    return res.status(400).json({ error: 'Missing required upload metadata.' });
  }

  try {
    const newFile = await prisma.file.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        category: {
          connectOrCreate: {
            where: { id: parsedCategoryId },
            create: {
              id: parsedCategoryId,
              name: categoryName || 'Uncategorized',
            },
          },
        },
        uploadedBy: {
          connectOrCreate: {
            where: { id: userId },
            create: {
              id: userId,
              username: username || `user-${userId}`,
              fullName,
            },
          },
        },
      },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'UPLOAD',
        fileId: newFile.id,
      },
    });

    res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
  } catch (error) {
    next(error);
  }
};

export const viewFile = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { userId, username, fullName } = req.query as Record<string, string>;

  try {
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (userId && fullName) {
      await prisma.activityLog.create({
        data: {
          user: {
            connectOrCreate: {
              where: { id: userId },
              create: {
                id: userId,
                username: username || `user-${userId}`,
                fullName,
              },
            },
          },
          action: 'VIEW',
          file: {
            connect: { id },
          },
        },
      });
    }

    res.json(file);
  } catch (error) {
    next(error);
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
  const { username } = req.params;
  try {
    const files = await prisma.file.findMany({
      where: {
        uploadedBy: {
          fullName: {
            contains: username,
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
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { userId, username, fullName } = req.query as Record<string, string>;

  try {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Create activity log before deleting file record
    if (userId && fullName) {
      await prisma.activityLog.create({
        data: {
          user: {
            connectOrCreate: {
              where: { id: userId },
              create: {
                id: userId,
                username: username || `user-${userId}`,
                fullName,
              },
            },
          },
          action: 'DELETE',
        },
      });
    }

    // Delete file from database - Prisma will handle logs referencing this file
    await prisma.activityLog.deleteMany({
      where: { fileId: id },
    });

    await prisma.file.delete({
      where: { id },
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
    next(error);
  }
};

export const updateFile = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { originalName, categoryId, userId, username, fullName } = req.body;

  try {
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        originalName,
        category: {
          connect: { id: Number(categoryId) },
        },
      },
      include: {
        category: true,
        uploadedBy: true,
      },
    });

    if (userId && fullName) {
      await prisma.activityLog.create({
        data: {
          user: {
            connectOrCreate: {
              where: { id: userId },
              create: {
                id: userId,
                username: username || `user-${userId}`,
                fullName,
              },
            },
          },
          action: 'UPDATE',
          file: {
            connect: { id },
          },
        },
      });
    }

    res.json({ message: 'File updated successfully!', file: updatedFile });
  } catch (error) {
    next(error);
  }
};

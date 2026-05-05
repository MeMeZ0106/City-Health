import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma.js';
import { validateString, validateDateRange, ValidationError, handleValidationError } from '../utils/validation.js';

export const getLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const where: any = {};

    // If not admin, hide administrative logs (starting with ADMIN_)
    if (!user?.isAdmin) {
      where.NOT = {
        action: { startsWith: 'ADMIN_' }
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, username: true }
        },
        file: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const searchLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const {
      userName,
      action,
      fileName,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    // If not admin, hide administrative logs (starting with ADMIN_)
    if (!user?.isAdmin) {
      where.NOT = {
        action: { startsWith: 'ADMIN_' }
      };
    }

    if (userName) {
      const validatedUserName = validateString(userName, 'User name', 1, 255);
      where.user = {
        fullName: {
          contains: validatedUserName,
        },
      };
    }

    if (action) {
      const validatedAction = validateString(action, 'Action', 1, 50);
      where.action = {
        contains: validatedAction,
      };
    }

    if (fileName) {
      const validatedFileName = validateString(fileName, 'File name', 1, 255);
      where.file = {
        originalName: {
          contains: validatedFileName,
        },
      };
    }

    const { start, end } = validateDateRange(startDate as string, endDate as string);
    if (start || end) {
      where.timestamp = {};
      if (start) where.timestamp.gte = start;
      if (end) where.timestamp.lte = end;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, username: true }
        },
        file: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    handleValidationError(error, res, next);
  }
};

export const getAdminLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        action: { startsWith: 'ADMIN_' }
      },
      include: {
        user: {
          select: { id: true, fullName: true, username: true }
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

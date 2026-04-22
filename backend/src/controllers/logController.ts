import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma.js';

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: true,
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

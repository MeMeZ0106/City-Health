import { Request, Response, NextFunction } from 'express';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateInteger = (value: any, fieldName: string): number => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }

  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be a valid integer`);
  }

  return num;
};

export const validateString = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): string => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }

  return trimmed;
};

export const validateOptionalString = (value: any, fieldName: string, maxLength: number = 255): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string if provided`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }

  return trimmed;
};

export const validateDateRange = (startDate?: string, endDate?: string): { start?: Date; end?: Date } => {
  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate) {
    start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new ValidationError('Invalid start date format');
    }
  }

  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new ValidationError('Invalid end date format');
    }
  }

  if (start && end && start > end) {
    throw new ValidationError('Start date cannot be after end date');
  }

  return { start, end };
};

export const validateUUID = (value: any, fieldName: string): string => {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required and must be a string`);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }

  return value;
};

export const handleValidationError = (error: any, res: Response, next: NextFunction) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};
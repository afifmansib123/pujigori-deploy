// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json(ResponseUtils.error(message));
};
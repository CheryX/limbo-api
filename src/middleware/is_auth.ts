import { Request, Response, NextFunction } from 'express';
import { Permission } from '../lib/permissions';

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

export const hasPermission = (perm: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.pm.has(perm)) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden: Missing permissions' });
  };
};
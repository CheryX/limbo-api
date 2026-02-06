// GET /auth/login - Initiate OAuth login
// GET /auth/callback - OAuth callback
// GET /auth/me - Get current user info
// GET /auth/logout - Logout a user

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import query from '../lib/db';
import { DEFAULT } from '../lib/permissions';

const router: Router = Router();

router.get('/login', (req: Request, res: Response, next: NextFunction) => {
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;
  passport.authenticate('usos', { callbackURL: callbackUrl } as any)(req, res, next);
});

router.get('/callback', 
  (req: Request, res: Response, next: NextFunction) => {
    const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;
    passport.authenticate('usos', { 
      callbackURL: callbackUrl,
      failureRedirect: '/login' 
    } as any)(req, res, next);
  },
  (req: Request, res: Response) => {
    const defaultPermissions = DEFAULT;

    if (req.user)
      query("INSERT INTO users (id, username, permissions) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;", [parseInt(req.user.id), req.user.id, defaultPermissions]);

    res.redirect('/');
  }
);

router.get('/me', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });


  res.json(req.user);
});

router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

export default router;

import express from 'express'
import 'dotenv/config';
import session from 'express-session';
import passport from 'passport';
import './lib/passport';
import cors from 'cors'

import { init_db } from './lib/db'
import browserRouter from './routes/browser'
import authRouter from './routes/auth';
import fileRouter from './routes/file';
import { ensureAuthenticated } from './middleware/is_auth';
import { UsosUser } from './types/global';
import { PermissionManager } from './lib/permissions';

const app = express(); 
const port = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
  res.status(200).json({
    status: "The void appears to be working..."
  })
})

app.use(session({ 
  secret: process.env.JWT_SECRET!, 
  resave: false, 
  saveUninitialized: false 
}));

app.set('trust proxy', 1);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: UsosUser, done) => {
  user.pm = new PermissionManager(user.permissions);
  done(null, user);
});

app.use('/auth', authRouter);
app.use(ensureAuthenticated);
  
// Under this line, all routes require authentication!

app.use('/browser', browserRouter)
app.use('/file', fileRouter)

// User Management Endpoints

// GET /users/:user - Get user info
// PUT /users/:user - Update user info

// Admin Endpoints

// GET /admin/stats - Get system statistics
// GET /admin/logs - Get system logs

app.listen(port, () => {
  console.log(`The void appears on http://localhost:${port}`)
  init_db();
})
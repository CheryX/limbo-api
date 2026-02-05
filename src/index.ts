import express from 'express'
import 'dotenv/config';
import session from 'express-session';
import passport from 'passport';
import './lib/passport';

import { init_db } from './lib/db'
import browserRouter from './routes/browser'
import authRouter from './routes/auth';
import { ensureAuthenticated } from './middleware/is_auth';

const app = express(); 
const port = 3000;

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
passport.deserializeUser((user: any, done) => done(null, user));

app.use('/auth', authRouter);
app.use(ensureAuthenticated);
  
// Under this line, all routes require authentication!

app.use('/browser', browserRouter)

// GET /files/:file - Download a file
// POST /files/:dir?name= - Upload a file to directory
// DELETE /files/:file - Delete a file
// PUT /files/:file?new_name= - Rename a file

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
import express, { Router } from 'express';
import { handleLogin, handleSignUp } from '../controllers/authController';

const router: Router = express.Router();

// GET:

// POST:
router.post('/login', handleLogin);
router.post('/signup', handleSignUp);

// PATCH:

// DELETE:

export default router;

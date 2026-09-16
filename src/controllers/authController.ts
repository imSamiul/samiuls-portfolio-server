import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';

// POST: Login User using form
export async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send({ message: 'Email and password are required.' });
    return;
  }
  if (email !== 'samiulkarimprodhan@gmail.com') {
    res.status(400).send({ message: 'You are not valid for this website.' });
    return;
  }
  try {
    const loginSuccessfulUser = await User.findByCredentials(email, password);

    if (!loginSuccessfulUser) {
      res.status(401).json({ message: 'Incorrect credentials' });
      return;
    }

    const token = await loginSuccessfulUser.generateAuthToken();
    res.status(200).send({ user: loginSuccessfulUser, token });
    return;
  } catch (error) {
    let errorMessage = 'Failed to login';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log(error);
    res.status(500).json({ message: errorMessage });
    return;
  }
}

// POST: SingUp User using form
export const handleSignUp = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email !== 'samiulkarimprodhan@gmail.com') {
    res.status(400).send({ message: 'You are not valid for this website.' });
    return;
  }
  try {
    const user = new User({ email, password });
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
    return;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({ message: 'This user already exists.' });
      return;
    }
    let errorMessage = 'Failed to sign up';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage });
    console.log(error);
    return;
  }
};

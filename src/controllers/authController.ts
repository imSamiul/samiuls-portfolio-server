import { Request, Response } from 'express';
import User from '../models/user.model';

// POST: Login User using form
export async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  if (email !== 'samiulkarimprodhan@gmail.com') {
    res.status(400).send({ message: 'You are not valid for this website.' });
    return;
  }
  try {
    const loginSuccessfulUser = await User.findByCredentials(email, password);

    if (loginSuccessfulUser) {
      const token = await loginSuccessfulUser.generateAuthToken();
      res.status(201).send({ user: loginSuccessfulUser, token });
      return;
    }
  } catch (error) {
    let errorMessage = 'Failed to load the client list';
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
    let errorMessage = 'Failed to load the client list';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage });
    console.log(error);
    return;
  }
};

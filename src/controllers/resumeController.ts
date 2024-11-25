import path from 'path';
import { Request, Response } from 'express';

export const downloadResume = async (req: Request, res: Response) => {
  const filePath = path.join(
    __dirname,
    '../../public/assets/Samiul_Resume.pdf',
  );
  try {
    res.download(filePath, 'Samiul_Resume.pdf');
  } catch (error) {
    let errorMessage = 'Failed to do something exceptional';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).send({ message: errorMessage });
  }
};

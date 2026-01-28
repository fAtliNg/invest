import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendMail, sendEmailVerification, sendPasswordReset } from './mailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Internal endpoint to send generic email
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text } = req.body;
    
    if (!to || !subject || (!html && !text)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await sendMail({ to, subject, html, text });
    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Endpoint for email verification
app.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { to, token } = req.body;
    
    if (!to || !token) {
      res.status(400).json({ error: 'Missing to or token' });
      return;
    }

    await sendEmailVerification(to, token);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Endpoint for password reset
app.post('/send-password-reset', async (req: Request, res: Response) => {
  try {
    const { to, token } = req.body;
    
    if (!to || !token) {
      res.status(400).json({ error: 'Missing to or token' });
      return;
    }

    await sendPasswordReset(to, token);
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

app.listen(PORT, () => {
  console.log(`Email Service running on port ${PORT}`);
});

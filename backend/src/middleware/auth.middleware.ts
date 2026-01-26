import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Note: You need to install cookie-parser: npm install cookie-parser
// and use it in your app: app.use(cookieParser());

interface UserPayload {
  userId: number;
  email: string;
}

// Extend Express Request interface to include currentUser
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in cookies (requires cookie-parser middleware)
  // @ts-ignore - req.cookies may not be typed if cookie-parser types are missing
  let token = req.cookies?.token;

  // Fallback to Authorization header if no cookie (useful for testing or non-browser clients)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ error: 'Internal server error' });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as UserPayload;
    
    req.currentUser = payload;
    next();
  } catch (err) {
    // console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

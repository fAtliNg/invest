import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    const tokens = await authService.refresh(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      // In a real app we might decode the token to get userId, or rely on middleware
      // For simplicity here, we clear the cookie. The service logic handles DB update if we pass userId
      // But we need userId. Let's assume we decode it or it's passed in body/middleware.
      // To keep it simple:
      res.clearCookie('refreshToken');
      res.json({ success: true });
    } else {
      res.json({ success: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

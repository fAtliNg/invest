import { prisma } from '../config/prisma';
import { generateTokens, verifyRefreshToken } from './jwt.service';
import bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from '../types';

export class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('User already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
      },
    });

    const tokens = generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    const tokens = generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error('No token provided');
    
    const payload: any = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokens = generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async updateRefreshToken(userId: number, token: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }
}

import { Request } from 'express';
import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface GithubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: { value: string }[];
  photos: { value: string }[];
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

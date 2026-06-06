import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  deviceId: z.string(),
  fingerprint: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'MODERATOR';
    profile: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

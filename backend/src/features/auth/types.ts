export interface AuthUser {
  id: number;
  username: string;
  role: 'finance' | 'staff';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
export {};

export interface UsosUser {
  id: string;
  token: string;
  tokenSecret: string;
}

declare global {
  namespace Express {
    interface User extends UsosUser {}
  }
}
import { PermissionManager } from "../lib/permissions";

export interface UsosUser {
  id: string;
  token: string;
  tokenSecret: string;
  permissions: string;
  pm: PermissionManager;
}

declare global {
  namespace Express {
    interface User extends UsosUser {}
  }
}
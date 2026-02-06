
export const Permission = {
  VIEW_ASSETS:             1n << 0n,
  ADD_ASSETS_TO_APPROVAL:  1n << 1n,
  CREATE_WITHOUT_APPROVAL: 1n << 2n,
  RENAME_ASSETS:           1n << 3n,
  DELETE_ASSETS:           1n << 4n,
  SOCIAL_INTERACTIONS:     1n << 5n,
  CHANGE_USERNAME:         1n << 6n,
  APPROVE_ASSETS:          1n << 19n,
  VIEW_SUPPORT_TICKETS:    1n << 20n,
  REPLY_SUPPORT_TICKETS:   1n << 21n,
  CHANGE_OTHER_USERNAMES:  1n << 22n,
  DELETE_COMMENTS:         1n << 23n,
  MODIFY_BASIC_PERMS:      1n << 24n,
  MODIFY_ADMIN_PERMS:      1n << 25n,
} as const;

export const DEFAULT = Permission.VIEW_ASSETS
  | Permission.ADD_ASSETS_TO_APPROVAL
  | Permission.SOCIAL_INTERACTIONS
  | Permission.CHANGE_USERNAME;

export const TRUSTED = DEFAULT
  | Permission.CREATE_WITHOUT_APPROVAL
  | Permission.RENAME_ASSETS
  | Permission.DELETE_ASSETS;

export const MODERATOR = TRUSTED
  | Permission.APPROVE_ASSETS
  | Permission.VIEW_SUPPORT_TICKETS
  | Permission.CHANGE_OTHER_USERNAMES
  | Permission.DELETE_COMMENTS

export const ADMIN = MODERATOR
  | Permission.REPLY_SUPPORT_TICKETS
  | Permission.MODIFY_BASIC_PERMS

export type Permission = typeof Permission[keyof typeof Permission];

export class PermissionManager {
  private value: bigint;

  constructor(initialValue: bigint | string = 0n) {
    this.value = BigInt(initialValue);
  }

  has(permission: Permission): boolean {
    return (this.value & permission) === permission;
  }

  grant(...permissions: Permission[]): void {
    for (const p of permissions) {
      this.value |= p;
    }
  }

  revoke(...permissions: Permission[]): void {
    for (const p of permissions) {
      this.value &= ~p;
    }
  }

  toString(): string {
    return this.value.toString();
  }
}
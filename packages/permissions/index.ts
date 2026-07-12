export const packageName = 'permissions';
export type Role = 'customer' | 'admin' | 'super_admin';
export function hasPermission(userRole: string, requiredRole: Role): boolean {
  const hierarchy: Record<string, number> = { customer: 0, admin: 1, super_admin: 2 };
  return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
}

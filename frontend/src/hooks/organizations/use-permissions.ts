import { useMemo } from "react";
import { OrganizationUserRole } from "#/types/org";
import { rolePermissions, Permission } from "#/utils/org/permissions";

export const usePermission = (role: OrganizationUserRole) => {
  /* Memoize permissions for the role */
  const currentPermissions = useMemo<Permission[]>(
    () => rolePermissions[role] as Permission[],
    [role],
  );

  /* Check if the user has a specific permission */
  const hasPermission = (permission: Permission): boolean =>
    currentPermissions.includes(permission);

  /* Returns the list of permissions the user actually has from the given array */
  const hasAnyPermission = (permissions: Permission[]): Permission[] =>
    permissions.filter((perm) => currentPermissions.includes(perm));

  /* Check if the user has all of the given permissions */
  const hasAllPermissions = (permissions: Permission[]): boolean =>
    permissions.every((perm) => currentPermissions.includes(perm));

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};

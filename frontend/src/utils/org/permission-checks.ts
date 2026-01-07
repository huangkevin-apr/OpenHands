import { OrganizationMember, OrganizationUserRole } from "#/types/org";
import { Permission, rolePermissions } from "./permissions";

/**
 * Check if active user has permission to change an organization members role
 * @param user OrganizationMember
 * @param memberId Id of org member whose role would change
 * @param memberRole Role of org member whose role would change
 * @returns boolean
 */
export const checkIfUserHasPermissionToChangeRole = (
  user: OrganizationMember | undefined,
  memberId: string,
  memberRole: OrganizationUserRole,
) => {
  if (!user) return false;

  // Users cannot change their own role
  if (memberId === user.user_id) return false;

  // Members can never change roles
  if (user.role === "member") return false;

  // Owners cannot change another owner's role
  if (user.role === "owner" && memberRole === "owner") return false;

  // Admins cannot change admin or owner roles
  if (user.role === "admin") {
    if (memberRole === "admin" || memberRole === "owner") return false;

    // Admins can change member roles
    return rolePermissions.admin.includes(`change_user_role:${memberRole}`);
  }

  // Owners can change member & admin roles
  return rolePermissions.owner.includes(`change_user_role:${memberRole}`);
};

/**
 * Get the list of roles that a user can assign to others
 * @param userPermissions all permission for active user
 * @returns an array of roles (strings) the user can change other users to
 */
export const getAvailableRolesToChangeTo = (
  userPermissions: Permission[],
): OrganizationUserRole[] => {
  const roleChangeMap: Record<OrganizationUserRole, Permission> = {
    owner: "change_user_role:owner",
    admin: "change_user_role:admin",
    member: "change_user_role:member",
  };

  return (Object.entries(roleChangeMap) as [OrganizationUserRole, Permission][])
    .filter((roleMap_keyValuePairs) =>
      userPermissions.includes(roleMap_keyValuePairs[1]),
    )
    .map(([roleMap_Key]) => roleMap_Key);
};

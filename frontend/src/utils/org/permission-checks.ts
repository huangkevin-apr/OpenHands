import { organizationService } from "#/api/organization-service/organization-service.api";
import { getSelectedOrganizationIdFromStore } from "#/stores/selected-organization-store";
import { OrganizationMember, OrganizationUserRole } from "#/types/org";
import { getMeFromQueryClient } from "../query-client-getters";
import { Permission } from "./permissions";
import { queryClient } from "#/query-client-config";

/**
 * Get the active organization user.
 * Reads from cache first, fetches if missing.
 * @returns OrganizationMember
 */
export const getActiveOrganizationUser = async (): Promise<
  OrganizationMember | undefined
> => {
  const orgId = getSelectedOrganizationIdFromStore();
  if (!orgId) return undefined;
  let user = getMeFromQueryClient(orgId);
  if (!user) {
    user = await organizationService.getMe({ orgId });
    queryClient.setQueryData(["organizations", orgId, "me"], user);
  }
  return user;
};

/**
 * Get a list of roles that a user has permission to assign to other users
 * @param userPermissions all permission for active user
 * @returns an array of roles (strings) the user can change other users to
 */
export const getAvailableRolesAUserCanAssign = (
  userPermissions: Permission[],
): OrganizationUserRole[] => {
  const roleToPermissionMap: Record<OrganizationUserRole, Permission> = {
    owner: "change_user_role:owner",
    admin: "change_user_role:admin",
    member: "change_user_role:member",
  };

  return (
    Object.entries(roleToPermissionMap) as [OrganizationUserRole, Permission][]
  )
    .filter((roleToPermissionMap_keyValuePairs) =>
      userPermissions.includes(roleToPermissionMap_keyValuePairs[1]),
    )
    .map(([role]) => role);
};

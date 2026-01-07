/* PERMISSION TYPES */
type UserRoleChangePermissionKey = "change_user_role";
type InviteUserToOrganizationKey = "invite_user_to_organization";

type ChangeOrganizationNamePermission = "change_organization_name";
type DeleteOrganizationPermission = "delete_organization";
type AddCreditsPermission = "add_credits";
type ViewBillingPermission = "view_billing";

type ManageSecretsPermission = "manage_secrets";
type ManageMCPPermission = "manage_mcp";
type ManageIntegrationsPermission = "manage_integrations";
type ManageApplicationSettingsPermission = "manage_application_settings";
type ManageAPIKeysPermission = "manage_api_keys";

type ViewLLMSettingsPermission = "view_llm_settings";
type EditLLMSettingsPermission = "edit_llm_settings";

type MemberPermission =
  | ManageSecretsPermission
  | ManageMCPPermission
  | ManageIntegrationsPermission
  | ManageApplicationSettingsPermission
  | ManageAPIKeysPermission
  | ViewLLMSettingsPermission;

type AdminPermission =
  | MemberPermission
  | EditLLMSettingsPermission
  | ViewBillingPermission
  | AddCreditsPermission
  | InviteUserToOrganizationKey
  | `${UserRoleChangePermissionKey}:member`
  | `${UserRoleChangePermissionKey}:admin`;

type OwnerPermission =
  | AdminPermission
  | ChangeOrganizationNamePermission
  | DeleteOrganizationPermission
  | `${UserRoleChangePermissionKey}:owner`;

/* PERMISSION ARRAYS */
const memberPerms: MemberPermission[] = [
  "manage_secrets",
  "manage_mcp",
  "manage_integrations",
  "manage_application_settings",
  "manage_api_keys",
  "view_llm_settings",
];

const adminPerms: AdminPermission[] = [
  // member perms
  "manage_secrets",
  "manage_mcp",
  "manage_integrations",
  "manage_application_settings",
  "manage_api_keys",
  "view_llm_settings",

  // admin-only
  "edit_llm_settings",
  "view_billing",
  "add_credits",
  "invite_user_to_organization",
  `change_user_role:member`,
  "change_user_role:admin",
];

const ownerPerms: OwnerPermission[] = [
  // admin perms
  "manage_secrets",
  "manage_mcp",
  "manage_integrations",
  "manage_application_settings",
  "manage_api_keys",
  "view_llm_settings",
  "edit_llm_settings",
  "view_billing",
  "add_credits",
  "invite_user_to_organization",
  "change_user_role:member",
  "change_user_role:admin",

  // owner-only
  "change_organization_name",
  "delete_organization",
  "change_user_role:owner",
];

export type RolePermissionMap = {
  owner: OwnerPermission[];
  admin: AdminPermission[];
  member: MemberPermission[];
};

export type Permission = RolePermissionMap[keyof RolePermissionMap][number];

export const rolePermissions: RolePermissionMap = {
  owner: ownerPerms,
  admin: adminPerms,
  member: memberPerms,
};

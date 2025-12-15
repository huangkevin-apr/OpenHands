export type OrganizationUserRole = "user" | "admin" | "owner";

export interface Organization {
  id: string;
  name: string;
  balance: number;
}

export interface OrganizationMember {
  id: string;
  email: string;
  role: OrganizationUserRole;
  status: "active" | "invited";
}

export interface UserOrgInfo {
  orgId: string;
  orgName: string;
  role: OrganizationUserRole;
  isCurrent: boolean;
}

export interface GetMeResponse {
  userId: string;
  email: string;
  orgs: UserOrgInfo[];
}

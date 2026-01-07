import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermission } from "#/hooks/organizations/use-permissions";
import { rolePermissions, Permission } from "#/utils/org/permissions";
import { OrganizationUserRole } from "#/types/org";

describe("usePermission", () => {
  const setup = (role: OrganizationUserRole) =>
    renderHook(() => usePermission(role)).result.current;

  describe("hasPermission", () => {
    it("returns true when the role has the permission", () => {
      const { hasPermission } = setup("admin");

      expect(hasPermission("invite_user_to_organization")).toBe(true);
    });

    it("returns false when the role does not have the permission", () => {
      const { hasPermission } = setup("member");

      expect(hasPermission("invite_user_to_organization")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns only permissions the role actually has", () => {
      const { hasAnyPermission } = setup("admin");

      const permissions: Permission[] = [
        "invite_user_to_organization",
        "delete_organization",
        "view_llm_settings",
      ];

      expect(hasAnyPermission(permissions)).toEqual([
        "invite_user_to_organization",
        "view_llm_settings",
      ]);
    });

    it("returns an empty array if no permissions match", () => {
      const { hasAnyPermission } = setup("member");

      const permissions: Permission[] = [
        "delete_organization",
        "change_organization_name",
      ];

      expect(hasAnyPermission(permissions)).toEqual([]);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when the role has all permissions", () => {
      const { hasAllPermissions } = setup("owner");

      expect(
        hasAllPermissions([
          "change_organization_name",
          "delete_organization",
        ])
      ).toBe(true);
    });

    it("returns false when the role is missing at least one permission", () => {
      const { hasAllPermissions } = setup("admin");

      expect(
        hasAllPermissions([
          "invite_user_to_organization",
          "delete_organization",
        ])
      ).toBe(false);
    });
  });

  describe("rolePermissions integration", () => {
    it("matches the permissions defined for the role", () => {
      const { hasPermission } = setup("member");

      rolePermissions.member.forEach((permission) => {
        expect(hasPermission(permission)).toBe(true);
      });
    });
  });
});

import { SettingsDropdownInput } from "../settings/settings-dropdown-input";
import { useSelectedOrganizationId } from "#/context/use-selected-organization";
import { useOrganizations } from "#/hooks/query/use-organizations";

export function OrgSelector() {
  const { orgId, setOrgId } = useSelectedOrganizationId();
  const { data: organizations } = useOrganizations();

  return (
    <SettingsDropdownInput
      testId="org-selector"
      name="organization"
      placeholder="Please select an organization"
      selectedKey={orgId || ""}
      items={
        organizations?.map((org) => ({ key: org.id, label: org.name })) || []
      }
      onSelectionChange={(org) => {
        setOrgId(org ? org.toString() : null);
      }}
    />
  );
}

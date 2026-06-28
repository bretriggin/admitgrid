"use client";

import { USER_ROLES, type UserRole } from "@/types/userProfile";

const checkboxClassName = "rounded border-slate-300 text-blue-700 focus:ring-blue-700";

type UserRoleCheckboxesProps = {
  selectedRoles: UserRole[];
  onChange: (roles: UserRole[]) => void;
  idPrefix: string;
};

export function UserRoleCheckboxes({
  selectedRoles,
  onChange,
  idPrefix,
}: UserRoleCheckboxesProps) {
  function toggleRole(role: UserRole) {
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter((entry) => entry !== role));
      return;
    }

    onChange([...selectedRoles, role]);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {USER_ROLES.map((role) => (
        <label key={role} htmlFor={`${idPrefix}-${role}`} className="flex items-center gap-2 text-sm">
          <input
            id={`${idPrefix}-${role}`}
            type="checkbox"
            checked={selectedRoles.includes(role)}
            onChange={() => toggleRole(role)}
            className={checkboxClassName}
          />
          {role}
        </label>
      ))}
    </div>
  );
}

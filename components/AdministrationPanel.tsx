"use client";

import { useMemo, useState } from "react";
import {
  activateUserAction,
  approveAccessRequestAction,
  deactivateUserAction,
  rejectAccessRequestAction,
  updateManagedUserAction,
} from "@/lib/auth/accessActions";
import { UserRoleCheckboxes } from "@/components/UserRoleCheckboxes";
import {
  TeamsList,
  UserTeamCheckboxes,
} from "@/components/admin/UserTeamCheckboxes";
import {
  AdminSection,
  dangerButtonClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  StatusBadge,
} from "@/components/admin/AdminUi";
import { getUserDisplayName } from "@/lib/auth/profile";
import type { Team } from "@/types/team";
import type { UserAccessRequest } from "@/types/userAccessRequest";
import type { ManagedUserProfile, UserRole } from "@/types/userProfile";

type AdministrationPanelProps = {
  pendingRequests: UserAccessRequest[];
  activeUsers: ManagedUserProfile[];
  inactiveUsers: ManagedUserProfile[];
  teams: Team[];
};

function formatRequestedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RolesList({ roles }: { roles: UserRole[] }) {
  if (roles.length === 0) {
    return <span className="text-sm text-slate-500">No roles assigned</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span
          key={role}
          className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function UserCard({
  name,
  email,
  badge,
  fields,
  actions,
}: {
  name: string;
  email: string;
  badge?: React.ReactNode;
  fields: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">{name}</h3>
            {badge}
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">{email}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <DetailField key={field.label} label={field.label}>
            {field.value}
          </DetailField>
        ))}
      </dl>

      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{actions}</div>
      ) : null}
    </article>
  );
}

type EditUserState = {
  profileId: string;
  facility: string;
  roles: UserRole[];
  teamIds: string[];
  isExecutive: boolean;
  isSystemOwner: boolean;
};

export function AdministrationPanel({
  pendingRequests,
  activeUsers,
  inactiveUsers,
  teams,
}: AdministrationPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<EditUserState | null>(null);

  const approveRequest = useMemo(
    () => pendingRequests.find((request) => request.id === approveRequestId) ?? null,
    [approveRequestId, pendingRequests],
  );

  const [approveFacility, setApproveFacility] = useState("");
  const [approveRoles, setApproveRoles] = useState<UserRole[]>([]);
  const [approveTeamIds, setApproveTeamIds] = useState<string[]>([]);
  const [approveExecutive, setApproveExecutive] = useState(false);
  const [approveInitialPassword, setApproveInitialPassword] = useState("");

  function openApproveModal(request: UserAccessRequest) {
    setApproveRequestId(request.id);
    setApproveFacility(request.facility);
    setApproveRoles([]);
    setApproveTeamIds([]);
    setApproveExecutive(false);
    setApproveInitialPassword("");
    setError(null);
    setMessage(null);
  }

  function openEditModal(user: ManagedUserProfile) {
    if (user.isSystemOwner) {
      return;
    }

    setEditUser({
      profileId: user.id,
      facility: user.facility,
      roles: user.roles,
      teamIds: user.teams.map((team) => team.id),
      isExecutive: user.isExecutive,
      isSystemOwner: user.isSystemOwner,
    });
    setError(null);
    setMessage(null);
  }

  async function handleApprove() {
    alert("handleApprove clicked");
    if (!approveRequest) {
      return;
    }

    setBusyId(approveRequest.id);
    setError(null);

    try {
      alert("calling approveAccessRequestAction");
      const result = await approveAccessRequestAction({
        requestId: approveRequest.id,
        facility: approveFacility,
        roles: approveRoles,
        isExecutive: approveExecutive,
        initialPassword: approveInitialPassword,
        teamIds: approveTeamIds,
      });
      alert("approveAccessRequestAction returned: " + JSON.stringify(result));

      if (!result.success) {
        setError(result.error ?? "Unable to approve request.");
        return;
      }

      setApproveRequestId(null);
      setMessage(`Approved access for ${approveRequest.email}.`);
    } catch (error) {
      alert("Approval error: " + (error instanceof Error ? error.message : String(error)));
      console.error("[AdministrationPanel] handleApprove failed:", error);
      setError(error instanceof Error ? error.message : "Unable to approve request.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requestId: string) {
    setBusyId(requestId);
    setError(null);

    const result = await rejectAccessRequestAction(requestId);
    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to reject request.");
      return;
    }

    setMessage("Access request rejected.");
  }

  async function handleReactivate(profileId: string) {
    setBusyId(profileId);
    setError(null);

    const result = await activateUserAction(profileId);
    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to reactivate user.");
      return;
    }

    setMessage("User reactivated.");
  }

  async function handleDeactivate(profileId: string) {
    setBusyId(profileId);
    setError(null);

    const result = await deactivateUserAction(profileId);
    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to deactivate user.");
      return;
    }

    setEditUser(null);
    setMessage("User deactivated.");
  }

  async function handleSaveUser() {
    if (!editUser || editUser.isSystemOwner) {
      return;
    }

    setBusyId(editUser.profileId);
    setError(null);

    const result = await updateManagedUserAction({
      profileId: editUser.profileId,
      facility: editUser.facility,
      roles: editUser.roles,
      isExecutive: editUser.isExecutive,
      teamIds: editUser.teamIds,
    });

    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to update user.");
      return;
    }

    setEditUser(null);
    setMessage("User updated.");
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <AdminSection
        title="Pending Access Requests"
        description="Review new access requests before users can sign in."
        count={pendingRequests.length}
      >
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending access requests.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {pendingRequests.map((request) => (
              <UserCard
                key={request.id}
                name={`${request.firstName} ${request.lastName}`.trim()}
                email={request.email}
                fields={[
                  { label: "Facility", value: request.facility || "—" },
                  { label: "Job Title", value: request.jobTitle || "—" },
                  { label: "Requested Date", value: formatRequestedDate(request.requestedAt) },
                ]}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => openApproveModal(request)}
                      disabled={busyId === request.id}
                      className={primaryButtonClassName}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(request.id)}
                      disabled={busyId === request.id}
                      className={dangerButtonClassName}
                    >
                      Reject
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Active Users"
        description="Approved users who can currently access AdmitGrid."
        count={activeUsers.length}
      >
        {activeUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No active users.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {activeUsers.map((user) => (
              <UserCard
                key={user.id}
                name={getUserDisplayName(user)}
                email={user.email}
                badge={
                  user.isSystemOwner ? (
                    <StatusBadge label="System Owner" tone="blue" />
                  ) : null
                }
                fields={[
                  { label: "Facility", value: user.facility || "—" },
                  { label: "Job Title", value: user.jobTitle || "—" },
                  { label: "Roles", value: <RolesList roles={user.roles} /> },
                  { label: "Teams", value: <TeamsList teams={user.teams} /> },
                  {
                    label: "Executive Status",
                    value: (
                      <StatusBadge
                        label={user.isExecutive ? "Executive" : "Standard"}
                        tone={user.isExecutive ? "blue" : "slate"}
                      />
                    ),
                  },
                  {
                    label: "Active Status",
                    value: <StatusBadge label="Active" tone="green" />,
                  },
                ]}
                actions={
                  user.isSystemOwner ? (
                    <p className="text-xs text-slate-500">
                      System Owner accounts are protected from changes.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className={secondaryButtonClassName}
                    >
                      Edit
                    </button>
                  )
                }
              />
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Inactive Users"
        description="Rejected or deactivated users who cannot access AdmitGrid."
        count={inactiveUsers.length}
      >
        {inactiveUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No inactive users.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {inactiveUsers.map((user) => (
              <UserCard
                key={user.id}
                name={getUserDisplayName(user)}
                email={user.email}
                badge={
                  user.isSystemOwner ? (
                    <StatusBadge label="System Owner" tone="blue" />
                  ) : (
                    <StatusBadge
                      label={
                        user.approvalStatus === "Rejected"
                          ? "Rejected"
                          : user.approvalStatus === "Pending"
                            ? "Pending"
                            : "Inactive"
                      }
                      tone={
                        user.approvalStatus === "Rejected"
                          ? "red"
                          : user.approvalStatus === "Pending"
                            ? "amber"
                            : "slate"
                      }
                    />
                  )
                }
                fields={[
                  { label: "Facility", value: user.facility || "—" },
                  { label: "Job Title", value: user.jobTitle || "—" },
                ]}
                actions={
                  user.isSystemOwner ? null : user.approvalStatus === "Approved" &&
                    !user.isActive ? (
                    <button
                      type="button"
                      onClick={() => void handleReactivate(user.id)}
                      disabled={busyId === user.id}
                      className={primaryButtonClassName}
                    >
                      Reactivate
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </AdminSection>

      {approveRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold">Approve access request</h3>
            <p className="mt-1 text-sm text-slate-500">
              {approveRequest.firstName} {approveRequest.lastName} · {approveRequest.email}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="approve-facility" className="mb-1 block text-sm text-slate-600">
                  Facility
                </label>
                <input
                  id="approve-facility"
                  value={approveFacility}
                  onChange={(event) => setApproveFacility(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Roles</p>
                <UserRoleCheckboxes
                  idPrefix="approve"
                  selectedRoles={approveRoles}
                  onChange={setApproveRoles}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Teams</p>
                <UserTeamCheckboxes
                  idPrefix="approve-teams"
                  teams={teams}
                  selectedTeamIds={approveTeamIds}
                  onChange={setApproveTeamIds}
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={approveExecutive}
                  onChange={(event) => setApproveExecutive(event.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                Grant Executive access
              </label>

              <div>
                <label
                  htmlFor="approve-initial-password"
                  className="mb-1 block text-sm text-slate-600"
                >
                  Initial sign-in password
                </label>
                <input
                  id="approve-initial-password"
                  type="password"
                  autoComplete="new-password"
                  required={!approveRequest.authUserId}
                  minLength={6}
                  value={approveInitialPassword}
                  onChange={(event) => setApproveInitialPassword(event.target.value)}
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {approveRequest.authUserId
                    ? "Optional if credentials already exist. Provide a new temporary password to reset access."
                    : "Required. Share this temporary password with the user so they can sign in after approval."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveRequestId(null)}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  alert("Approve button clicked");
                  void handleApprove();
                }}
                disabled={false}
                className={primaryButtonClassName}
              >
                Approve user
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editUser && !editUser.isSystemOwner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold">Edit user</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-facility" className="mb-1 block text-sm text-slate-600">
                  Facility
                </label>
                <input
                  id="edit-facility"
                  value={editUser.facility}
                  onChange={(event) =>
                    setEditUser((current) =>
                      current ? { ...current, facility: event.target.value } : current,
                    )
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Roles</p>
                <UserRoleCheckboxes
                  idPrefix="edit"
                  selectedRoles={editUser.roles}
                  onChange={(roles) =>
                    setEditUser((current) => (current ? { ...current, roles } : current))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Teams</p>
                <UserTeamCheckboxes
                  idPrefix="edit"
                  teams={teams}
                  selectedTeamIds={editUser.teamIds}
                  onChange={(teamIds) =>
                    setEditUser((current) => (current ? { ...current, teamIds } : current))
                  }
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editUser.isExecutive}
                  onChange={(event) =>
                    setEditUser((current) =>
                      current ? { ...current, isExecutive: event.target.checked } : current,
                    )
                  }
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                Grant Executive access
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void handleDeactivate(editUser.profileId)}
                disabled={busyId === editUser.profileId}
                className={dangerButtonClassName}
              >
                Deactivate user
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveUser()}
                  disabled={busyId === editUser.profileId}
                  className={primaryButtonClassName}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

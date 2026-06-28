"use client";

import { useMemo, useState } from "react";
import { createTeamAction, updateTeamAction } from "@/lib/administration/teamActions";
import {
  AdminCard,
  AdminFeedback,
  AdminSection,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/admin/AdminUi";
import type { Facility } from "@/types/facility";
import { TEAM_TYPES, type Team, type TeamType } from "@/types/team";

type TeamsSectionProps = {
  teams: Team[];
  facilities: Facility[];
};

type EditTeamState = {
  teamId: string;
  name: string;
  facilityId: string;
  teamType: TeamType;
};

export function TeamsSection({ teams, facilities }: TeamsSectionProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamFacilityId, setNewTeamFacilityId] = useState("");
  const [newTeamType, setNewTeamType] = useState<TeamType>("Admissions");
  const [editTeam, setEditTeam] = useState<EditTeamState | null>(null);

  const activeFacilities = useMemo(
    () => facilities.filter((facility) => facility.isActive),
    [facilities],
  );

  async function handleCreate() {
    setBusyId("create");
    setError(null);
    setMessage(null);

    const result = await createTeamAction({
      name: newTeamName,
      facilityId: newTeamFacilityId,
      teamType: newTeamType,
    });

    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to create team.");
      return;
    }

    setNewTeamName("");
    setMessage("Team created.");
  }

  async function handleSave() {
    if (!editTeam) {
      return;
    }

    setBusyId(editTeam.teamId);
    setError(null);
    setMessage(null);

    const result = await updateTeamAction({
      teamId: editTeam.teamId,
      name: editTeam.name,
      facilityId: editTeam.facilityId,
      teamType: editTeam.teamType,
    });

    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to update team.");
      return;
    }

    setEditTeam(null);
    setMessage("Team updated.");
  }

  return (
    <div className="space-y-4">
      <AdminFeedback message={message} error={error} />

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <p className="text-sm font-semibold text-slate-700">Add team</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Team name"
            className={inputClassName}
          />
          <select
            value={newTeamFacilityId}
            onChange={(event) => setNewTeamFacilityId(event.target.value)}
            className={inputClassName}
          >
            <option value="">Select facility</option>
            {activeFacilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          <select
            value={newTeamType}
            onChange={(event) => setNewTeamType(event.target.value as TeamType)}
            className={inputClassName}
          >
            {TEAM_TYPES.map((teamType) => (
              <option key={teamType} value={teamType}>
                {teamType}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={
              busyId === "create" ||
              !newTeamName.trim() ||
              !newTeamFacilityId ||
              activeFacilities.length === 0
            }
            className={primaryButtonClassName}
          >
            Add team
          </button>
        </div>
        {activeFacilities.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Create an active facility before adding teams.
          </p>
        ) : null}
      </div>

      <AdminSection
        title="Teams"
        description="Organize staff by facility and functional team type."
        count={teams.length}
      >
        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">No teams yet. Add your first team above.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <AdminCard
                key={team.id}
                title={team.name}
                subtitle={team.facilityName}
                fields={[{ label: "Team Type", value: team.teamType }]}
                actions={
                  <button
                    type="button"
                    onClick={() =>
                      setEditTeam({
                        teamId: team.id,
                        name: team.name,
                        facilityId: team.facilityId,
                        teamType: team.teamType,
                      })
                    }
                    className={secondaryButtonClassName}
                  >
                    Edit
                  </button>
                }
              />
            ))}
          </div>
        )}
      </AdminSection>

      {editTeam ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold">Edit team</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-team-name" className="mb-1 block text-sm text-slate-600">
                  Team name
                </label>
                <input
                  id="edit-team-name"
                  value={editTeam.name}
                  onChange={(event) =>
                    setEditTeam((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="edit-team-facility" className="mb-1 block text-sm text-slate-600">
                  Facility
                </label>
                <select
                  id="edit-team-facility"
                  value={editTeam.facilityId}
                  onChange={(event) =>
                    setEditTeam((current) =>
                      current ? { ...current, facilityId: event.target.value } : current,
                    )
                  }
                  className={inputClassName}
                >
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                      {!facility.isActive ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-team-type" className="mb-1 block text-sm text-slate-600">
                  Team type
                </label>
                <select
                  id="edit-team-type"
                  value={editTeam.teamType}
                  onChange={(event) =>
                    setEditTeam((current) =>
                      current
                        ? { ...current, teamType: event.target.value as TeamType }
                        : current,
                    )
                  }
                  className={inputClassName}
                >
                  {TEAM_TYPES.map((teamType) => (
                    <option key={teamType} value={teamType}>
                      {teamType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTeam(null)}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busyId === editTeam.teamId}
                className={primaryButtonClassName}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

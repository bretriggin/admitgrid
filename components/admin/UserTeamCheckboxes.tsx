"use client";

import type { Team } from "@/types/team";

const checkboxClassName = "rounded border-slate-300 text-blue-700 focus:ring-blue-700";

type UserTeamCheckboxesProps = {
  teams: Team[];
  selectedTeamIds: string[];
  onChange: (teamIds: string[]) => void;
  idPrefix: string;
};

export function UserTeamCheckboxes({
  teams,
  selectedTeamIds,
  onChange,
  idPrefix,
}: UserTeamCheckboxesProps) {
  const teamsByFacility = teams.reduce<Map<string, Team[]>>((groups, team) => {
    const existing = groups.get(team.facilityName) ?? [];
    existing.push(team);
    groups.set(team.facilityName, existing);
    return groups;
  }, new Map());

  function toggleTeam(teamId: string) {
    if (selectedTeamIds.includes(teamId)) {
      onChange(selectedTeamIds.filter((entry) => entry !== teamId));
      return;
    }

    onChange([...selectedTeamIds, teamId]);
  }

  if (teams.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No teams available. Create facilities and teams first.
      </p>
    );
  }

  return (
    <div className="max-h-56 space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-3">
      {[...teamsByFacility.entries()].map(([facilityName, facilityTeams]) => (
        <div key={facilityName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {facilityName}
          </p>
          <div className="mt-2 grid gap-2">
            {facilityTeams.map((team) => (
              <label
                key={team.id}
                htmlFor={`${idPrefix}-${team.id}`}
                className="flex items-start gap-2 text-sm"
              >
                <input
                  id={`${idPrefix}-${team.id}`}
                  type="checkbox"
                  checked={selectedTeamIds.includes(team.id)}
                  onChange={() => toggleTeam(team.id)}
                  className={`${checkboxClassName} mt-0.5`}
                />
                <span>
                  <span className="font-medium text-slate-900">{team.name}</span>
                  <span className="block text-xs text-slate-500">{team.teamType}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import type { AssignedTeam } from "@/types/team";

export function TeamsList({ teams }: { teams: AssignedTeam[] }) {
  if (teams.length === 0) {
    return <span className="text-sm text-slate-500">No teams assigned</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {teams.map((team) => (
        <span
          key={team.id}
          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
          title={`${team.facilityName} · ${team.teamType}`}
        >
          {team.name}
        </span>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  createFacilityAction,
  updateFacilityAction,
} from "@/lib/administration/facilityActions";
import {
  AdminCard,
  AdminFeedback,
  AdminSection,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  StatusBadge,
} from "@/components/admin/AdminUi";
import type { Facility } from "@/types/facility";

type FacilitiesSectionProps = {
  facilities: Facility[];
};

type EditFacilityState = {
  facilityId: string;
  name: string;
  isActive: boolean;
};

export function FacilitiesSection({ facilities }: FacilitiesSectionProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [editFacility, setEditFacility] = useState<EditFacilityState | null>(null);

  async function handleCreate() {
    setBusyId("create");
    setError(null);
    setMessage(null);

    const result = await createFacilityAction({ name: newFacilityName });
    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to create facility.");
      return;
    }

    setNewFacilityName("");
    setMessage("Facility created.");
  }

  async function handleSave() {
    if (!editFacility) {
      return;
    }

    setBusyId(editFacility.facilityId);
    setError(null);
    setMessage(null);

    const result = await updateFacilityAction({
      facilityId: editFacility.facilityId,
      name: editFacility.name,
      isActive: editFacility.isActive,
    });

    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Unable to update facility.");
      return;
    }

    setEditFacility(null);
    setMessage("Facility updated.");
  }

  return (
    <div className="space-y-4">
      <AdminFeedback message={message} error={error} />

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <p className="text-sm font-semibold text-slate-700">Add facility</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newFacilityName}
            onChange={(event) => setNewFacilityName(event.target.value)}
            placeholder="Facility name"
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={busyId === "create" || !newFacilityName.trim()}
            className={`${primaryButtonClassName} shrink-0`}
          >
            Add facility
          </button>
        </div>
      </div>

      <AdminSection
        title="Facilities"
        description="Manage SNF locations available for teams and user assignments."
        count={facilities.length}
      >
        {facilities.length === 0 ? (
          <p className="text-sm text-slate-500">No facilities yet. Add your first facility above.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {facilities.map((facility) => (
              <AdminCard
                key={facility.id}
                title={facility.name}
                badge={
                  <StatusBadge
                    label={facility.isActive ? "Active" : "Inactive"}
                    tone={facility.isActive ? "green" : "slate"}
                  />
                }
                fields={[
                  {
                    label: "Status",
                    value: facility.isActive ? "Available for teams" : "Hidden from new assignments",
                  },
                ]}
                actions={
                  <button
                    type="button"
                    onClick={() =>
                      setEditFacility({
                        facilityId: facility.id,
                        name: facility.name,
                        isActive: facility.isActive,
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

      {editFacility ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold">Edit facility</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-facility-name" className="mb-1 block text-sm text-slate-600">
                  Facility name
                </label>
                <input
                  id="edit-facility-name"
                  value={editFacility.name}
                  onChange={(event) =>
                    setEditFacility((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  className={inputClassName}
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editFacility.isActive}
                  onChange={(event) =>
                    setEditFacility((current) =>
                      current ? { ...current, isActive: event.target.checked } : current,
                    )
                  }
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                Active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditFacility(null)}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busyId === editFacility.facilityId}
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

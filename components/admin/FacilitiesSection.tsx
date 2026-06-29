"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  createFacilityAction,
  updateFacilityAction,
} from "@/lib/administration/facilityActions";
import type {
  CreateFacilityResult,
  FacilityInsertDebug,
} from "@/lib/administration/facilityActionTypes";
import { useFacility } from "@/components/FacilityProvider";
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

type ClientDebugTrace = {
  at: string;
  message: string;
};

function sortFacilitiesByName(facilities: Facility[]): Facility[] {
  return [...facilities].sort((left, right) => left.name.localeCompare(right.name));
}

function appendClientTrace(
  setTrace: Dispatch<SetStateAction<ClientDebugTrace[]>>,
  message: string,
) {
  const entry = { at: new Date().toISOString(), message };
  setTrace((current) => [...current, entry]);
  console.log(`[FacilitiesSection] ${message}`);
}

function formatDebugJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function FacilitiesSection({ facilities: initialFacilities }: FacilitiesSectionProps) {
  const router = useRouter();
  const { reloadFacilities } = useFacility();
  const [facilities, setFacilities] = useState(initialFacilities);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [editFacility, setEditFacility] = useState<EditFacilityState | null>(null);
  const [clientTrace, setClientTrace] = useState<ClientDebugTrace[]>([]);
  const [serverDebug, setServerDebug] = useState<FacilityInsertDebug | null>(null);
  const [lastActionResult, setLastActionResult] = useState<CreateFacilityResult | null>(null);

  const isCreateDisabled = busyId === "create" || !newFacilityName.trim();

  useEffect(() => {
    setFacilities(initialFacilities);
  }, [initialFacilities]);

  async function handleCreate() {
    appendClientTrace(setClientTrace, "handleCreate() entered");
    setBusyId("create");
    setError(null);
    setMessage(null);
    setServerDebug(null);
    setLastActionResult(null);

    try {
      appendClientTrace(
        setClientTrace,
        `Calling createFacilityAction({ name: ${JSON.stringify(newFacilityName)} })`,
      );

      const result = await createFacilityAction({ name: newFacilityName });

      setLastActionResult(result);
      setServerDebug(result.debug);
      appendClientTrace(
        setClientTrace,
        `createFacilityAction returned success=${String(result.success)}`,
      );

      if (!result.success) {
        const displayError = result.error ?? "Unknown server action failure.";
        setError(displayError);
        appendClientTrace(setClientTrace, `Server action error: ${displayError}`);
        return;
      }

      if (!result.facility) {
        const displayError = "Server action reported success but returned no facility row.";
        setError(displayError);
        appendClientTrace(setClientTrace, displayError);
        return;
      }

      setFacilities((current) =>
        sortFacilitiesByName([
          ...current.filter((facility) => facility.id !== result.facility!.id),
          result.facility!,
        ]),
      );
      setNewFacilityName("");
      setMessage(`Facility created: ${result.facility.name}`);
      appendClientTrace(setClientTrace, `Facility added to list: ${result.facility.id}`);

      router.refresh();
      void reloadFacilities().catch((reloadError) => {
        appendClientTrace(
          setClientTrace,
          `reloadFacilities failed: ${reloadError instanceof Error ? reloadError.message : String(reloadError)}`,
        );
      });
    } catch (createError) {
      console.error("[FacilitiesSection] createFacilityAction threw:", createError);

      const errorMessage =
        createError instanceof Error
          ? `${createError.name}: ${createError.message}`
          : String(createError);

      setError(errorMessage);
      appendClientTrace(setClientTrace, `createFacilityAction threw: ${errorMessage}`);

      if (!serverDebug) {
        setServerDebug({
          serverActionCalled: false,
          steps: ["Server action was not reached — client threw before or during the request."],
          insertStatement: `supabase.from("facilities").insert({ name }).select('id, name, "isActive", "createdAt"').single()`,
          insertPayload: { name: newFacilityName.trim() },
          selectColumns: 'id, name, "isActive", "createdAt"',
          profileId: null,
          supabaseData: null,
          supabaseError: formatDebugJson(createError),
        });
      }
    } finally {
      setBusyId(null);
      appendClientTrace(setClientTrace, "handleCreate() finished");
    }
  }

  async function handleSave() {
    if (!editFacility) {
      return;
    }

    setBusyId(editFacility.facilityId);
    setError(null);
    setMessage(null);

    try {
      const result = await updateFacilityAction({
        facilityId: editFacility.facilityId,
        name: editFacility.name,
        isActive: editFacility.isActive,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to update facility.");
        return;
      }

      setFacilities((current) =>
        sortFacilitiesByName(
          current.map((facility) =>
            facility.id === editFacility.facilityId
              ? {
                  ...facility,
                  name: editFacility.name.trim(),
                  isActive: editFacility.isActive,
                }
              : facility,
          ),
        ),
      );
      setEditFacility(null);
      setMessage("Facility updated.");
      router.refresh();
      void reloadFacilities().catch(console.error);
    } catch (updateError) {
      console.error("[FacilitiesSection] updateFacilityAction threw:", updateError);

      const errorMessage =
        updateError instanceof Error
          ? `${updateError.name}: ${updateError.message}`
          : String(updateError);

      setError(errorMessage);
    } finally {
      setBusyId(null);
    }
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
            aria-disabled={isCreateDisabled}
            onClick={() => {
              appendClientTrace(setClientTrace, "Add facility button clicked");
              appendClientTrace(
                setClientTrace,
                `Button state — disabled=${String(isCreateDisabled)} busy=${String(busyId === "create")} nameEmpty=${String(!newFacilityName.trim())} name=${JSON.stringify(newFacilityName)}`,
              );
              if (isCreateDisabled) {
                appendClientTrace(setClientTrace, "Create aborted — button is disabled");
                if (!newFacilityName.trim()) {
                  setError("Enter a facility name before clicking Add facility.");
                }
                return;
              }
              void handleCreate();
            }}
            className={`${primaryButtonClassName} shrink-0 ${isCreateDisabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {busyId === "create" ? "Adding..." : "Add facility"}
          </button>
        </div>
        {isCreateDisabled && !newFacilityName.trim() ? (
          <p className="mt-2 text-xs text-amber-700">
            Button is disabled until you enter a facility name.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-300 bg-slate-900 p-4 text-xs text-slate-100">
        <p className="mb-2 font-semibold uppercase tracking-wide text-slate-300">
          Add Facility debug trace
        </p>
        <p className="mb-3 text-slate-400">
          Click Add facility to populate this panel. Every click is logged even when the name field
          is empty.
        </p>

        <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-300">Client trace</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {clientTrace.length > 0
                  ? clientTrace.map((entry) => `${entry.at}  ${entry.message}`).join("\n")
                  : "No client events yet."}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Exact Supabase insert</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {serverDebug?.insertStatement ??
                  `await supabase.from("facilities").insert({ name: ${JSON.stringify(newFacilityName.trim())} }).select('id, name, "isActive", "createdAt"').single()`}
              </pre>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                insert payload: {formatDebugJson(serverDebug?.insertPayload ?? { name: newFacilityName.trim() })}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Server action reached?</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {String(serverDebug?.serverActionCalled ?? lastActionResult?.debug.serverActionCalled ?? false)}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Supabase response.data</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {formatDebugJson(serverDebug?.supabaseData ?? lastActionResult?.debug.supabaseData ?? null)}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Supabase response.error</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-red-300">
                {formatDebugJson(serverDebug?.supabaseError ?? lastActionResult?.debug.supabaseError ?? null)}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Server steps</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {(serverDebug?.steps ?? lastActionResult?.debug.steps ?? []).join("\n") || "None"}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Full server action result</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {formatDebugJson(lastActionResult)}
              </pre>
            </div>
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

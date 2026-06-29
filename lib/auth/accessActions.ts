"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveUserProfileForAuthUser } from "@/lib/auth/bootstrap";
import { exposeAuthErrorForUi, isNextRedirectError } from "@/lib/auth/errors";
import { getLoginBlockMessage, hasPendingAccessRequestForEmail } from "@/lib/auth/userManagement";
import {
  getAdminSupabaseClientIfAvailable,
  getDataSupabaseClient,
  getSupabaseClientForMutation,
} from "@/lib/supabase/dataClient";
import { hasServiceRoleKey, shouldUseRegularSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSystemOwnerUserProfile } from "@/lib/auth/session";
import {
  assertMutableManagedProfile,
  isSystemOwnerAuthUser,
  SYSTEM_OWNER_PROTECTED,
} from "@/lib/auth/profileGuards";
import { replaceUserTeamAssignments } from "@/lib/administration/queries";
import type { AccessRequestInput } from "@/types/userAccessRequest";
import { USER_ROLES, type UserRole } from "@/types/userProfile";

type SignInResult = { success: false; error: string };

type SubmitAccessRequestResult =
  | { success: true }
  | { success: false; error: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function adminClientUnavailableMessage(): string {
  if (!hasServiceRoleKey()) {
    return "Creating sign-in credentials requires SUPABASE_SERVICE_ROLE_KEY. Add it to your environment and restart the server.";
  }

  if (shouldUseRegularSupabaseClient()) {
    return "Creating sign-in credentials requires the Supabase service role client. In development, set SUPABASE_SERVICE_ROLE_KEY in .env.local and restart the dev server.";
  }

  return "Supabase admin client failed to initialize. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
}

function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

const ADMIN_AUTH_TIMEOUT_MS = 15_000;

async function withTimeout<T>(
  label: string,
  promise: Promise<T>,
  timeoutMs = ADMIN_AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function createAuthUserForAccessRequest(
  admin: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, string>,
) {
  const { data, error } = await withTimeout(
    "admin.auth.admin.createUser",
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  );

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create sign-in credentials.");
  }

  return data.user;
}

async function provisionApprovedUser(input: {
  supabase: SupabaseClient;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  facility: string;
  jobTitle: string;
  roles: string[];
  isExecutive: boolean;
  teamIds?: string[];
  existingProfileId?: string | null;
}) {
  const now = new Date().toISOString();
  let profileId = input.existingProfileId ?? null;

  if (profileId) {
    const guard = await assertMutableManagedProfile(input.supabase, profileId);

    if (!guard.ok) {
      throw new Error(guard.error);
    }
  }

  if (profileId) {
    const { error } = await input.supabase
      .from("user_profiles")
      .update({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        facility: input.facility,
        jobTitle: input.jobTitle,
        approvalStatus: "Approved",
        isActive: true,
        isExecutive: input.isExecutive,
      })
      .eq("id", profileId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data: profile, error } = await input.supabase
      .from("user_profiles")
      .insert({
        authUserId: input.authUserId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        facility: input.facility,
        jobTitle: input.jobTitle,
        approvalStatus: "Approved",
        isActive: true,
        isExecutive: input.isExecutive,
        isSystemOwner: false,
        createdAt: now,
      })
      .select("id")
      .single();

    if (error || !profile) {
      throw new Error(error?.message ?? "Unable to create user profile.");
    }

    profileId = profile.id;
  }

  if (!profileId) {
    throw new Error("Unable to resolve user profile id.");
  }

  await replaceUserRoles(input.supabase, profileId, input.roles);
  await replaceUserTeamAssignments(input.supabase, profileId, input.teamIds ?? []);
  return profileId;
}

export async function submitAccessRequest(
  input: AccessRequestInput,
): Promise<SubmitAccessRequestResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = normalizeEmail(input.email);
  const facility = input.facility.trim();
  const jobTitle = input.jobTitle.trim();

  if (!firstName || !lastName || !email || !facility || !jobTitle) {
    return { success: false, error: "All fields are required." };
  }

  try {
    const supabase = await getDataSupabaseClient();
    const now = new Date().toISOString();

    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id, approvalStatus, isActive")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.approvalStatus === "Approved" && existingProfile.isActive) {
      return { success: false, error: "An active account with this email already exists." };
    }

    const { data: existingRequest } = await supabase
      .from("user_access_requests")
      .select("id")
      .eq("email", email)
      .eq("status", "Pending")
      .maybeSingle();

    if (existingRequest) {
      return { success: false, error: "An access request for this email is already pending." };
    }

    const { error: requestError } = await supabase.from("user_access_requests").insert({
      firstName,
      lastName,
      email,
      facility,
      jobTitle,
      requestedAt: now,
      status: "Pending",
      authUserId: null,
      reviewedAt: null,
      reviewedByProfileId: null,
    });

    if (requestError) {
      return { success: false, error: requestError.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    console.error("Error submitting access request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to submit access request.",
    };
  }
}

async function replaceUserRoles(supabase: SupabaseClient, profileId: string, roles: string[]) {
  const guard = await assertMutableManagedProfile(supabase, profileId);

  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const validRoles = roles.filter(isValidRole);

  await supabase.from("user_roles").delete().eq("userProfileId", profileId);

  if (validRoles.length === 0) {
    return;
  }

  const { error } = await supabase.from("user_roles").insert(
    validRoles.map((role) => ({
      userProfileId: profileId,
      role,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function approveAccessRequestAction(input: {
  requestId: string;
  facility: string;
  roles: string[];
  isExecutive: boolean;
  initialPassword: string;
  teamIds?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("approve step 1: loading system owner profile");
    const owner = await requireSystemOwnerUserProfile();
    console.log("approve step 2: system owner profile loaded", owner.id);

    console.log("approve step 3: loading supabase client");
    const supabase = await getSupabaseClientForMutation();
    console.log("approve step 4: supabase client loaded");

    const authAdmin = getAdminSupabaseClientIfAvailable();
    const now = new Date().toISOString();
    const facility = input.facility.trim();
    const initialPassword = input.initialPassword.trim();

    console.log("approve step 5: loading request");
    const { data: request, error: requestError } = await supabase
      .from("user_access_requests")
      .select("id, authUserId, email, firstName, lastName, jobTitle, facility, status")
      .eq("id", input.requestId)
      .maybeSingle();
    console.log("approve step 6: request loaded", {
      found: Boolean(request),
      requestError: requestError?.message ?? null,
    });

    if (requestError || !request) {
      return { success: false, error: "Access request not found." };
    }

    if (request.status !== "Pending") {
      return { success: false, error: "This request has already been reviewed." };
    }

    let authUserId = request.authUserId;
    let existingProfileId: string | null = null;

    if (authUserId) {
      console.log("approve step 7: loading existing profile");
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("authUserId", authUserId)
        .maybeSingle();
      console.log("approve step 8: existing profile loaded", {
        profileId: existingProfile?.id ?? null,
      });

      existingProfileId = existingProfile?.id ?? null;

      if (initialPassword.length >= 6) {
        if (!hasServiceRoleKey() || !authAdmin) {
          return { success: false, error: adminClientUnavailableMessage() };
        }

        console.log("approve step 9: updating auth user password");
        try {
          const { error: passwordError } = await withTimeout(
            "admin.auth.admin.updateUserById",
            authAdmin.auth.admin.updateUserById(authUserId, {
              password: initialPassword,
            }),
          );
          console.log("approve step 10: auth user password update finished", {
            passwordError: passwordError?.message ?? null,
          });

          if (passwordError) {
            console.error("[approveAccessRequestAction] Password update failed:", passwordError);
            return { success: false, error: `Password update failed: ${passwordError.message}` };
          }
        } catch (error) {
          console.error("[approveAccessRequestAction] Password update failed:", error);
          return {
            success: false,
            error: `Password update failed: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    } else {
      if (initialPassword.length < 6) {
        return { success: false, error: "Initial password must be at least 6 characters." };
      }

      if (!hasServiceRoleKey()) {
        return { success: false, error: adminClientUnavailableMessage() };
      }

      if (!authAdmin) {
        return { success: false, error: adminClientUnavailableMessage() };
      }

      console.log("approve step 11: creating auth user");
      try {
        const authUser = await createAuthUserForAccessRequest(
          authAdmin,
          normalizeEmail(request.email),
          initialPassword,
          {
            firstName: request.firstName,
            lastName: request.lastName,
            facility: facility || request.facility,
            jobTitle: request.jobTitle,
          },
        );
        console.log("approve step 12: auth user created", authUser.id);

        authUserId = authUser.id;
      } catch (error) {
        console.error("[approveAccessRequestAction] User creation failed:", error);
        return {
          success: false,
          error: `User creation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    if (!authUserId) {
      return { success: false, error: "Unable to create sign-in credentials for this user." };
    }

    console.log("approve step 13: provisioning profile, roles, and teams");
    try {
      await provisionApprovedUser({
        supabase,
        authUserId,
        email: normalizeEmail(request.email),
        firstName: request.firstName,
        lastName: request.lastName,
        facility: facility || request.facility,
        jobTitle: request.jobTitle,
        roles: input.roles,
        isExecutive: input.isExecutive,
        teamIds: input.teamIds,
        existingProfileId,
      });
      console.log("approve step 14: profile, roles, and teams provisioned");
    } catch (error) {
      console.error("[approveAccessRequestAction] Profile, role, or team assignment failed:", error);
      return {
        success: false,
        error: `Profile setup failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    console.log("approve step 15: updating request status");
    const { error: updateRequestError } = await supabase
      .from("user_access_requests")
      .update({
        status: "Approved",
        authUserId,
        reviewedAt: now,
        reviewedByProfileId: owner.id,
        facility: facility || request.facility,
      })
      .eq("id", request.id);
    console.log("approve step 16: request status update finished", {
      updateRequestError: updateRequestError?.message ?? null,
    });

    if (updateRequestError) {
      console.error("[approveAccessRequestAction] Request status update failed:", updateRequestError);
      return { success: false, error: `Request status update failed: ${updateRequestError.message}` };
    }

    console.log("approve step 17: approval complete");
    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    console.error("[approveAccessRequestAction] Unexpected error:", error);

    if (isNextRedirectError(error)) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to approve request.",
    };
  }
}

export async function rejectAccessRequestAction(
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const owner = await requireSystemOwnerUserProfile();
    const supabase = await getSupabaseClientForMutation();
    const now = new Date().toISOString();

    const { data: request, error: requestError } = await supabase
      .from("user_access_requests")
      .select("id, authUserId, status")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: "Access request not found." };
    }

    if (request.status !== "Pending") {
      return { success: false, error: "This request has already been reviewed." };
    }

    if (request.authUserId && (await isSystemOwnerAuthUser(supabase, request.authUserId))) {
      return { success: false, error: SYSTEM_OWNER_PROTECTED };
    }

    if (request.authUserId) {
      await supabase
        .from("user_profiles")
        .update({
          approvalStatus: "Rejected",
          isActive: false,
        })
        .eq("authUserId", request.authUserId);
    }

    const { error: updateRequestError } = await supabase
      .from("user_access_requests")
      .update({
        status: "Rejected",
        reviewedAt: now,
        reviewedByProfileId: owner.id,
      })
      .eq("id", requestId);

    if (updateRequestError) {
      return { success: false, error: updateRequestError.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to reject request.",
    };
  }
}

export async function activateUserAction(
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const supabase = await getSupabaseClientForMutation();

    const { error } = await supabase
      .from("user_profiles")
      .update({ isActive: true, approvalStatus: "Approved" })
      .eq("id", profileId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to activate user.",
    };
  }
}

export async function deactivateUserAction(
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const supabase = await getSupabaseClientForMutation();

    const guard = await assertMutableManagedProfile(supabase, profileId);
    if (!guard.ok) {
      return { success: false, error: guard.error };
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ isActive: false })
      .eq("id", profileId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to deactivate user.",
    };
  }
}

export async function updateManagedUserAction(input: {
  profileId: string;
  facility: string;
  roles: string[];
  isExecutive: boolean;
  teamIds?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const supabase = await getSupabaseClientForMutation();

    const guard = await assertMutableManagedProfile(supabase, input.profileId);
    if (!guard.ok) {
      return { success: false, error: guard.error };
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        facility: input.facility.trim(),
        isExecutive: input.isExecutive,
      })
      .eq("id", input.profileId);

    if (error) {
      return { success: false, error: error.message };
    }

    await replaceUserRoles(supabase, input.profileId, input.roles);
    await replaceUserTeamAssignments(supabase, input.profileId, input.teamIds ?? []);

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update user.",
    };
  }
}

export async function signInWithCredentials(
  email: string,
  password: string,
): Promise<SignInResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      return { success: false, error: signInError.message };
    }

    const user = signInData.user;

    if (!user) {
      return { success: false, error: "Sign-in succeeded but no user was returned." };
    }

    const profile = await resolveUserProfileForAuthUser(supabase, user);
    const pendingAccessRequest = user.email
      ? await hasPendingAccessRequestForEmail(user.email)
      : false;
    const blockMessage = getLoginBlockMessage(profile, pendingAccessRequest);

    if (blockMessage) {
      await supabase.auth.signOut();
      return { success: false, error: blockMessage };
    }

    redirect("/");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    return {
      success: false,
      error: exposeAuthErrorForUi(error, "signInWithCredentials"),
    };
  }
}

type AuthLikeError = {
  message?: string;
  name?: string;
  status?: number;
  code?: string;
};

export function isMissingAuthSessionError(error: AuthLikeError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    message.includes("auth session missing") ||
    message.includes("session missing") ||
    error.name === "AuthSessionMissingError"
  );
}

export function isBenignAuthError(error: AuthLikeError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  return isMissingAuthSessionError(error);
}

export function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const supabaseMessage = extractSupabaseAuthMessage(error);

  if (supabaseMessage) {
    return supabaseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as AuthLikeError).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function isGenericServerActionError(error: unknown): boolean {
  const message = getAuthErrorMessage(error, "");

  return (
    /unexpected response was received from the server/i.test(message) ||
    /an error occurred in the server actions render/i.test(message) ||
    /failed to fetch/i.test(message)
  );
}

export function extractSupabaseAuthMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const authError = error as AuthLikeError;
  const message = authError.message?.trim();

  if (!message) {
    return null;
  }

  const isSupabaseAuth =
    authError.name === "AuthApiError" ||
    authError.name === "AuthRetryableFetchError" ||
    authError.name === "AuthUnknownError" ||
    (typeof authError.code === "string" && authError.code.length > 0);

  if (!isSupabaseAuth) {
    return null;
  }

  if (authError.code) {
    return `${message} (${authError.code})`;
  }

  return message;
}

function formatDevelopmentError(error: unknown): string {
  const parts: string[] = [];

  const supabaseMessage = extractSupabaseAuthMessage(error);

  if (supabaseMessage) {
    parts.push(supabaseMessage);
  } else if (error instanceof Error) {
    parts.push(`${error.name}: ${error.message}`);

    if (error.stack) {
      parts.push(error.stack);
    }

    if ("cause" in error && error.cause) {
      parts.push(`Cause: ${formatDevelopmentError(error.cause)}`);
    }
  } else if (typeof error === "string") {
    parts.push(error);
  } else {
    parts.push(String(error));
  }

  try {
    if (typeof error === "object" && error !== null) {
      parts.push(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  } catch {
    // Ignore serialization failures.
  }

  if (isGenericServerActionError(error)) {
    parts.push(
      "[Debug] The server action likely failed before returning a result. Check server/Vercel logs for console.error output from signInWithCredentials.",
    );
  }

  return parts.filter(Boolean).join("\n\n");
}

/** Surface the real auth/server exception in the UI while debugging sign-in failures. */
export function exposeAuthErrorForUi(error: unknown, context: string): string {
  console.error(error);
  logServerAuthException(context, error);
  logSupabaseAuthError(context, error);

  const supabaseMessage = extractSupabaseAuthMessage(error);

  if (supabaseMessage) {
    return supabaseMessage;
  }

  if (process.env.NODE_ENV === "development") {
    return formatDevelopmentError(error);
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return getAuthErrorMessage(error, String(error));
}

export function logSupabaseAuthError(context: string, error: unknown): void {
  console.error(`[${context}] Supabase auth error object:`, error);

  if (typeof error !== "object" || error === null) {
    return;
  }

  const authError = error as AuthLikeError;

  console.error(`[${context}] Supabase auth error details:`, {
    message: authError.message,
    name: authError.name,
    status: authError.status,
    code: authError.code,
  });

  try {
    console.error(
      `[${context}] Supabase auth error JSON:`,
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
  } catch (serializationError) {
    console.error(`[${context}] Unable to serialize Supabase auth error:`, serializationError);
  }
}

export function logServerAuthException(context: string, error: unknown): void {
  console.error(`[${context}] Server exception:`, error);

  if (error instanceof Error) {
    console.error(`[${context}] Server exception message:`, error.message);

    if (error.stack) {
      console.error(`[${context}] Server exception stack:`, error.stack);
    }

    if ("cause" in error && error.cause) {
      console.error(`[${context}] Server exception cause:`, error.cause);
    }
  }
}

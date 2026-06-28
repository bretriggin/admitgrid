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

export function getAuthErrorMessage(error: unknown, fallback: string): string {
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

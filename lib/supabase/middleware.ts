import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveUserProfileForAuthUser } from "@/lib/auth/bootstrap";
import { fetchProfileGateInfo } from "@/lib/auth/profile";
import { isApprovedActiveProfile } from "@/types/userProfile";

/** Never redirect these routes — session refresh only (GET, POST, server actions). */
const PUBLIC_PATH_PREFIXES = ["/login", "/request-access", "/auth", "/api/auth"];

const PENDING_PATH = "/pending-approval";
const EXECUTIVE_PATH_PREFIX = "/executive";
const ADMINISTRATION_PATH = "/administration";
const LEGACY_ADMIN_PATH = "/executive/users";

function isFullyPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isExecutivePath(pathname: string): boolean {
  return pathname.startsWith(EXECUTIVE_PATH_PREFIX);
}

function isAdministrationPath(pathname: string): boolean {
  return pathname.startsWith(ADMINISTRATION_PATH) || pathname.startsWith(LEGACY_ADMIN_PATH);
}

/** Server Actions POST to the current route; navigation redirects break the action response. */
function redirectForNavigation(
  request: NextRequest,
  pathname: string,
): NextResponse | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  if (isFullyPublicPath(pathname)) {
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  const isPendingRoute = pathname.startsWith(PENDING_PATH);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    const redirect = redirectForNavigation(request, "/login");

    if (redirect) {
      return redirect;
    }

    return supabaseResponse;
  }

  await resolveUserProfileForAuthUser(supabase, user);

  const gate = await fetchProfileGateInfo(supabase, user.id);
  const isApproved = gate ? isApprovedActiveProfile(gate) : false;

  if (!isApproved) {
    if (!isPendingRoute) {
      const redirect = redirectForNavigation(request, PENDING_PATH);

      if (redirect) {
        return redirect;
      }
    }

    return supabaseResponse;
  }

  if (pathname.startsWith(LEGACY_ADMIN_PATH)) {
    const redirect = redirectForNavigation(request, ADMINISTRATION_PATH);

    if (redirect) {
      return redirect;
    }
  }

  if (isAdministrationPath(pathname) && !gate?.isSystemOwner) {
    const redirect = redirectForNavigation(request, "/");

    if (redirect) {
      return redirect;
    }
  }

  if (isExecutivePath(pathname) && !gate?.isExecutive) {
    const redirect = redirectForNavigation(request, "/");

    if (redirect) {
      return redirect;
    }
  }

  if (isPendingRoute) {
    const redirect = redirectForNavigation(request, "/");

    if (redirect) {
      return redirect;
    }
  }

  if (authError) {
    const redirect = redirectForNavigation(request, "/login");

    if (redirect) {
      return redirect;
    }
  }

  return supabaseResponse;
}

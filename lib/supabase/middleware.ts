import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveUserProfileForAuthUser } from "@/lib/auth/bootstrap";
import { fetchProfileGateInfo } from "@/lib/auth/profile";
import { isApprovedActiveProfile } from "@/types/userProfile";

const PUBLIC_PATHS = ["/login", "/request-access"];
const PENDING_PATH = "/pending-approval";
const EXECUTIVE_PATH_PREFIX = "/executive";
const ADMINISTRATION_PATH = "/administration";
const LEGACY_ADMIN_PATH = "/executive/users";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isExecutivePath(pathname: string): boolean {
  return pathname.startsWith(EXECUTIVE_PATH_PREFIX);
}

function isAdministrationPath(pathname: string): boolean {
  return pathname.startsWith(ADMINISTRATION_PATH) || pathname.startsWith(LEGACY_ADMIN_PATH);
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
  const isPublic = isPublicPath(pathname);
  const isPendingRoute = pathname.startsWith(PENDING_PATH);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  await resolveUserProfileForAuthUser(supabase, user);

  const gate = await fetchProfileGateInfo(supabase, user.id);
  const isApproved = gate ? isApprovedActiveProfile(gate) : false;

  if (!isApproved) {
    if (!isPendingRoute && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = PENDING_PATH;
      return NextResponse.redirect(url);
    }

    if (isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = PENDING_PATH;
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (pathname.startsWith(LEGACY_ADMIN_PATH)) {
    const url = request.nextUrl.clone();
    url.pathname = ADMINISTRATION_PATH;
    return NextResponse.redirect(url);
  }

  if (isAdministrationPath(pathname) && !gate?.isSystemOwner) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isExecutivePath(pathname) && !gate?.isExecutive) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isPublic || isPendingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (authError) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

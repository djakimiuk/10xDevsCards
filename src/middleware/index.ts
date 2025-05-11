import { sequence } from "astro:middleware";
import { createServerSupabaseClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Public routes regex array
const PUBLIC_ROUTES = [
  /^\/auth($|\/.*)/, // /auth and all subpaths
  /^\/api\/auth($|\/.*)/, // /api/auth and all subpaths
  /^\/$/, // home page
  // Add any other specific public files like favicon.ico or manifest.json if needed
  // /^\/favicon\.ico$/,
  // /^\/manifest\.json$/,
];

const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some((pattern) => pattern.test(path));
};

// Middleware for handling Supabase session and populating locals
export const supabaseSessionMiddleware = async (context, next) => {
  try {
    const supabase = createServerSupabaseClient({ cookies: context.cookies });

    // Get session and user data securely
    const [
      {
        data: { session },
        error: sessionError,
      },
      {
        data: { user },
        error: userError,
      },
    ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

    if (sessionError) {
      logger.error("Error getting session in middleware:", sessionError);
    }

    if (userError) {
      logger.error("Error getting user in middleware:", userError);
    }

    // Add supabase instance to locals
    context.locals.supabase = supabase;
    context.locals.session = session;
    context.locals.user = user || null;

    // The response object needs to be awaited before returning.
    const response = await next();
    return response;
  } catch (error) {
    logger.error("Unexpected error in supabaseSessionMiddleware:", error);
    // Allow Astro's default error page to handle this or return a generic error response
    // For now, we'll let it propagate to Astro's error handling by calling next()
    // or returning a new Response if absolutely necessary and next() isn't viable.
    // However, middleware should generally call next() or redirect.
    // If an error here is critical enough to stop everything, consider how to handle.
    // For a simple pass-through on error:
    return await next();
  }
};

// Middleware for protecting routes based on authentication status
const authGuardMiddleware = async (context, next) => {
  const { locals, request, redirect } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (isPublicRoute(path)) {
    return await next(); // Allow access to public routes
  }

  // If it's not a public route and there's no session, redirect to login
  if (!locals.session) {
    // Preserve search params if any, e.g., for a 'redirectAfterLogin' param
    const loginUrl = new URL("/auth/login", url.origin);
    // Example: loginUrl.searchParams.set('redirect_to', path);
    return redirect(loginUrl.pathname + loginUrl.search);
  }

  // User is authenticated, or it's a public route
  return await next();
};

// Sequence the middleware. supabaseSessionMiddleware runs first.
export const onRequest = sequence(supabaseSessionMiddleware, authGuardMiddleware);

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies: astroCookies, redirect }) => {
  const sessionCookieNames: string[] = [];

  // Get all cookie names using Object.entries
  for (const [name] of Object.entries(astroCookies)) {
    if (name.startsWith("sb-")) {
      sessionCookieNames.push(name);
    }
  }

  // Delete all session cookies
  sessionCookieNames.forEach((name) => {
    astroCookies.delete(name, {
      path: "/", // Ensure cookie is deleted for all paths
    });
  });

  return redirect("/auth/login");
};

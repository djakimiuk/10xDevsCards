import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  const serviceKey = import.meta.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const openRouterKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;

  const status = {
    PUBLIC_SUPABASE_SERVICE_ROLE_KEY_status: serviceKey ? "SET" : "NOT SET or EMPTY",
    PUBLIC_SUPABASE_SERVICE_ROLE_KEY_length: serviceKey?.length ?? 0,
    PUBLIC_SUPABASE_SERVICE_ROLE_KEY_snippet: serviceKey?.substring(0, 5) ?? "N/A",
    PUBLIC_SUPABASE_URL_status: url ? "SET" : "NOT SET or EMPTY",
    PUBLIC_SUPABASE_ANON_KEY_status: anonKey ? "SET" : "NOT SET or EMPTY",
    PUBLIC_OPENROUTER_API_KEY_status: openRouterKey ? "SET" : "NOT SET or EMPTY",
  };

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

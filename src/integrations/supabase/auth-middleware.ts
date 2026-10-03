import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const requireSupabaseAuth = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase server environment variables are missing.",
    );
  }

  const authHeader =
    getRequestHeader("authorization");

  console.log(
    "[AUTH] Authorization:",
    authHeader ? "FOUND" : "MISSING",
  );

  if (!authHeader) {
    throw new Error(
      "Authentication failed: Authorization header missing.",
    );
  }

  const match =
    authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new Error(
      "Authentication failed: Invalid Authorization header.",
    );
  }

  const token = match[1].trim();

  console.log(
    "[AUTH] Token:",
    token ? "FOUND" : "MISSING",
  );

  const supabase =
    createClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  console.log(
    "[AUTH] User:",
    user?.id ?? "NONE",
  );

  if (error) {
    console.error(
      "[AUTH] Supabase error:",
      error.message,
      error.code,
      error.status,
    );
  }

  if (!user) {
    throw new Error(
      `Authentication failed: ${
        error?.message ?? "User not found"
      }`,
    );
  }

  console.log(
    "[AUTH] SUCCESS:",
    user.id,
  );

  return next({
    context: {
      supabase,
      userId: user.id,
    },
  });
});
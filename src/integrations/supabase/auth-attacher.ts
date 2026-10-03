import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const attachSupabaseAuth =
  createMiddleware({
    type: "function",
  }).client(async ({ next }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    console.log(
      "[Supabase Auth] Server function token:",
      token ? "FOUND" : "MISSING",
    );

    return next({
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });
  });
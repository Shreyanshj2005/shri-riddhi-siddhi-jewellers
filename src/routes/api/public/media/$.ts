import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves files from the private "media" storage bucket to the public website.
 * Product photos, hero videos and banners are uploaded by admins and referenced
 * in the database as /api/public/media/<path>.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = decodeURIComponent(params._splat ?? "").replace(/^\/+/, "");
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const range = request.headers.get("range");

        // Use a short-lived signed URL and stream through so Range requests (video) work.
        const { data: signed, error } = await supabaseAdmin.storage.from("media").createSignedUrl(path, 600);
        if (error || !signed?.signedUrl) return new Response("Not found", { status: 404 });

        const upstream = await fetch(signed.signedUrl, { headers: range ? { range } : undefined });
        if (!upstream.ok && upstream.status !== 206) return new Response("Not found", { status: 404 });

        const headers = new Headers();
        for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
          const v = upstream.headers.get(h);
          if (v) headers.set(h, v);
        }
        headers.set("cache-control", "public, max-age=31536000, immutable");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});

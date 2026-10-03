import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { adminUploadMedia } from "@/lib/admin.functions";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-card p-4 md:p-5 ${className}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string | number | null | undefined; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function AreaField({ label, value, onChange, rows = 4 }: { label: string; value: string | null | undefined; onChange: (v: string) => void; rows?: number }) {
  return (
    <Field label={label}>
      <Textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options, allowEmpty = true }: {
  label: string; value: string | null | undefined; onChange: (v: string) => void; options: readonly string[]; allowEmpty?: boolean;
}) {
  return (
    <Field label={label}>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center p-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 0.78;

async function fileToBase64(file: Blob): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i += 8192) binary += String.fromCharCode(...buf.subarray(i, i + 8192));
  return btoa(binary);
}

async function optimizeImage(file: File): Promise<{ file: Blob; fileName: string; contentType: string }> {
  // Keep non-raster uploads (for example MP4/WebM hero videos) untouched.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return { file, fileName: file.name, contentType: file.type || "application/octet-stream" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, fileName: file.name, contentType: file.type || "application/octet-stream" };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (webp && webp.size < file.size) {
    const base = file.name.replace(/\.[^.]+$/, "");
    return { file: webp, fileName: `${base}.webp`, contentType: "image/webp" };
  }

  // If WebP is not supported or would be larger, keep the original.
  return { file, fileName: file.name, contentType: file.type || "application/octet-stream" };
}

export function UploadButton({ kind = "product", multiple = false, accept = "image/*", label = "Upload image", onUploaded }: {
  kind?: string; multiple?: boolean; accept?: string; label?: string;
  onUploaded: (files: { url: string; path: string; name: string }[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex">
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={busy}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            const out = [];
            for (const f of files) {
              const optimized = await optimizeImage(f);
              const base64 = await fileToBase64(optimized.file);
              const res = await adminUploadMedia({
                data: {
                  fileName: optimized.fileName,
                  contentType: optimized.contentType,
                  base64,
                  kind,
                },
              });
              out.push({ ...res, name: optimized.fileName });
            }
            onUploaded(out);
            toast.success(`${out.length} file${out.length > 1 ? "s" : ""} uploaded`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
        <span className="cursor-pointer">
          {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {label}
        </span>
      </Button>
    </label>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminDeleteOffer, adminGetOffers, adminOffersQuery, adminSaveOffer } from "@/lib/admin.functions";
import type { Offer } from "@/lib/types";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, UploadButton } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_adminapp/admin/offers")({
  head: () => ({ meta: [{ title: "Offers & Promotions — SRSJ Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: OffersAdmin,
});

const empty = (): Partial<Offer> & { title: string } => ({ title: "", badge: "EXCLUSIVE OFFER", description: "", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 1 });

function OffersAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(adminOffersQuery);
  const [form, setForm] = useState(empty());
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function edit(offer: Offer) { setEditing(offer.id); setForm({ ...offer }); }
  function reset() { setEditing(null); setForm(empty()); }

  async function save() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      await adminSaveOffer({ data: { ...form, title: form.title.trim() } });
      await qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      await qc.invalidateQueries({ queryKey: ["home"] });
      reset();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this offer?")) return;
    await adminDeleteOffer({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["admin", "offers"] });
    await qc.invalidateQueries({ queryKey: ["home"] });
  }

  return (
    <div>
      <PageHeader title="Offers & Promotions" description="Control the animated homepage offer carousel without editing code." action={<Button onClick={reset}><Plus className="mr-2 h-4 w-4" /> New Offer</Button>} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg">Live offers</h2><span className="text-xs text-muted-foreground">{data.length} saved</span></div>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : data.length === 0 ? <p className="text-sm text-muted-foreground">No saved offers yet. The website currently shows its built-in offer cards.</p> : (
            <div className="space-y-3">
              {data.map((offer) => (
                <div key={offer.id} className="flex gap-3 border border-border p-3">
                  {offer.image_url && <img src={offer.image_url} alt="" className="h-20 w-28 shrink-0 object-cover" />}
                  <div className="min-w-0 flex-1"><p className="font-medium">{offer.title}</p><p className="text-xs text-muted-foreground">{offer.badge} · {offer.description}</p><p className="mt-1 text-xs">{offer.is_active ? "Active" : "Hidden"} · Order {offer.sort_order}</p></div>
                  <div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" onClick={() => edit(offer)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => remove(offer.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-lg">{editing ? "Edit offer" : "Create offer"}</h2>
          <div className="space-y-4">
            <Field label="Headline"><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Flat 25% OFF" /></Field>
            <Field label="Badge"><Input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="DIAMOND OFFER" /></Field>
            <Field label="Description"><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Diamond jewellery making charges" /></Field>
            <Field label="Offer image"><div className="space-y-2"><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="/images/seed/banner-diamond.jpg" /><UploadButton kind="offer" accept="image/jpeg,image/png,image/webp" label="Upload offer image" onUploaded={(files) => { const first = files[0]; if (first) setForm({ ...form, image_url: first.url }); }} /></div></Field>
            <Field label="Link"><Input value={form.link ?? ""} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/diamond-jewellery" /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Display order"><Input type="number" value={form.sort_order ?? 1} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field><Field label="Active"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.is_active ? "yes" : "no"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "yes" })}><option value="yes">Visible</option><option value="no">Hidden</option></select></Field></div>
            <div className="flex gap-2 pt-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Update Offer" : "Save Offer"}</Button>{editing && <Button variant="outline" onClick={reset}>Cancel</Button>}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>; }

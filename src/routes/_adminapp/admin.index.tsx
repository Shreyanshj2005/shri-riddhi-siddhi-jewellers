import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardQuery } from "@/lib/admin.functions";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Spinner } from "@/components/admin/ui";
import { formatINR, formatDate } from "@/lib/format";


export const Route = createFileRoute("/_adminapp/admin/")({
  head: () => ({ meta: [{ title: "Store Dashboard — SRSJ Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Dashboard,
});

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl ${tone}`}>{value}</p>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery(adminDashboardQuery);
  if (isLoading || !data) return <Spinner />;
  const s = data.stats;

  return (
    <div>
      <PageHeader
        title="Store Dashboard"
        description="Everything you publish here appears on the website instantly."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Published" value={s.published} />
        <Stat label="Drafts" value={s.drafts} />
        <Stat label="Hidden" value={s.hidden} />
        <Stat label="Out of stock" value={s.outOfStock} tone="text-destructive" />
        <Stat label="New enquiries" value={s.newEnquiries} />
        <Stat label="All enquiries" value={s.enquiries} />
        <Stat label="Reviews" value={s.reviews} />
        <Stat label="Media files" value={s.media} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg">Latest enquiries</h2>
          {data.recentEnquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentEnquiries.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.customer_name} · {e.phone}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.product_name ?? e.message ?? "General enquiry"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg">Recently updated products</h2>
          <ul className="divide-y divide-border">
            {data.recentProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatINR(Number(p.price))} · {p.status}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg">Today's rates</h2>
          <ul className="divide-y divide-border">
            {data.rates.map((r) => (
              <li key={r.key} className="flex justify-between py-2 text-sm">
                <span>{r.label}</span>
                <span className="font-medium">{r.current_rate ? `${formatINR(Number(r.current_rate))} ${r.unit ?? ""}` : "Not set"}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg">Recent activity</h2>
          {data.audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {data.audit.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2">
                  <span className="truncate">{a.action.replace(/_/g, " ")} · {a.entity}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

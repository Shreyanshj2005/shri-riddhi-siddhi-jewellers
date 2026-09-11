import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import {
  LayoutDashboard,
  Package,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Tag,
} from "lucide-react";

const NAV = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/admin/products",
    label: "Products",
    icon: Package,
    exact: true,
  },
  {
    to: "/admin/offers",
    label: "Offers & Promotions",
    icon: Tag,
    exact: false,
  },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.to
          : pathname.startsWith(item.to);

        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/admin" className="font-display text-base tracking-wide">
            SRSJ <span className="text-muted-foreground">Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View site
          </a>

          <Button size="sm" variant="outline" onClick={signOut}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside
          className="hidden w-60 shrink-0 border-r border-border bg-card lg:block"
          style={{ minHeight: "calc(100vh - 3.5rem)" }}
        >
          <div className="sticky top-14">{nav}</div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 top-14 z-30 bg-background/95 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              {nav}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

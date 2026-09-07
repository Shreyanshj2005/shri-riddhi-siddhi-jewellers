import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Gem, ShieldCheck, Star, IndianRupee } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Rate, Review } from "@/lib/types";
import { formatINR, formatDateShort } from "@/lib/format";

export function SectionHeading({ eyebrow, title, subtitle, align = "center", tone = "light", action }: { eyebrow?: string; title: string; subtitle?: string | null; align?: "center" | "left"; tone?: "light" | "dark"; action?: ReactNode }) {
  return (
    <div className={cn("mb-10 lg:mb-14 flex flex-col gap-3", align === "center" ? "items-center text-center" : "items-start text-left", action && "sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn(align === "center" ? "items-center text-center" : "items-start")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className={cn("font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1]", align === "center" ? "gold-rule-center" : "gold-rule", tone === "dark" && "text-ink-foreground")}>{title}</h2>
        {subtitle && <p className={cn("mt-4 max-w-xl text-sm sm:text-[0.95rem] leading-relaxed", tone === "dark" ? "text-ink-muted" : "text-muted-foreground")}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAllLink({ to, search, params, label = "View All", tone = "light" }: { to: string; search?: Record<string, unknown>; params?: Record<string, string>; label?: string; tone?: "light" | "dark" }) {
  return (
    <Link to={to} search={search as never} params={params as never} className={cn("group inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.25em] whitespace-nowrap", tone === "dark" ? "text-gold" : "text-foreground hover:text-gold")}>
      {label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function ImageTile({ img, title, subtitle, to, search, params, className, aspect = "aspect-[4/5]" }: { img: string; title: string; subtitle?: string; to: string; search?: Record<string, unknown>; params?: Record<string, string>; className?: string; aspect?: string }) {
  return (
    <Link to={to} search={search as never} params={params as never} className={cn("group relative block overflow-hidden bg-muted", aspect, className)}>
      <img src={img} alt={title} loading="lazy" width={800} height={1000} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 lg:p-7 text-ink-foreground">
        {subtitle && <p className="eyebrow mb-1.5">{subtitle}</p>}
        <p className="font-serif text-xl lg:text-2xl">{title}</p>
        <span className="mt-3 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-gold opacity-0 -translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">Shop now <ArrowRight className="h-3 w-3" /></span>
      </div>
    </Link>
  );
}

export function WhyUs({ items }: { items: { title: string; text: string }[] }) {
  const icons = [ShieldCheck, Award, Gem, IndianRupee];
  return (
    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => {
        const Icon = icons[i % icons.length]!;
        return (
          <div key={it.title} className="bg-background p-8 lg:p-10">
            <Icon className="h-6 w-6 text-gold" strokeWidth={1.25} />
            <p className="mt-5 font-serif text-xl">{it.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="flex h-full flex-col border border-border bg-card p-7">
      <div className="flex text-gold">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-current" : "opacity-30")} />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed">“{r.review_text}”</blockquote>
      <figcaption className="mt-5 flex items-center justify-between text-xs">
        <span className="font-medium tracking-wide">{r.customer_name}</span>
        <span className="text-muted-foreground">{r.source}{r.review_date ? ` · ${formatDateShort(r.review_date)}` : ""}</span>
      </figcaption>
    </figure>
  );
}

export function RateStrip({ rates }: { rates: Rate[] }) {
  const shown = rates.filter((r) => r.current_rate && r.key.startsWith("gold") || r.key === "silver");
  if (!shown.length) return null;
  const updated = rates.reduce<string | null>((acc, r) => (!acc || r.updated_at > acc ? r.updated_at : acc), null);
  return (
    <div className="border-y border-border bg-champagne/40">
      <div className="container-luxe flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-xs">
        <span className="eyebrow">Today's Rates</span>
        {shown.map((r) => (
          <span key={r.key} className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium">{formatINR(r.current_rate)}</span>
            <span className="text-[0.6rem] text-muted-foreground">/g</span>
          </span>
        ))}
        {updated && <span className="text-[0.62rem] text-muted-foreground">Updated {formatDateShort(updated)}</span>}
      </div>
    </div>
  );
}

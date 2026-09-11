import {
  ArrowRight,
  BadgePercent,
  CircleDollarSign,
  Gem,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export function OfferBenefits() {
  return (
    <section className="bg-champagne/35 py-16 sm:py-20 lg:py-24">
      <div className="container-luxe">
        <div className="mb-10 text-center sm:mb-14">
          <p className="eyebrow">More Value With Every Purchase</p>

          <h2 className="gold-rule-center mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl">
            Exchange & Cashback Benefits
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Our current benefit highlights for eligible jewellery purchases.
            Terms and valuation conditions apply.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BenefitCard
            icon={Gem}
            title="Diamond Jewellery"
            exchange="95% Exchange"
            cashback="85% Cashback"
          />

          <BenefitCard
            icon={CircleDollarSign}
            title="Gold Jewellery"
            exchange="100% Exchange"
            cashback="95% Cashback"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <MiniBenefit
            icon={BadgePercent}
            title="Flat 25% OFF"
            text="Diamond jewellery making charges"
          />

          <MiniBenefit
            icon={ShieldCheck}
            title="Coupon RSJ"
            text="Extra 5% OFF where applicable"
          />

          <MiniBenefit
            icon={ArrowRight}
            title="Easy Enquiry"
            text="Ask the showroom for eligibility"
          />
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  exchange,
  cashback,
}: {
  icon: typeof Gem;
  title: string;
  exchange: string;
  cashback: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-border bg-background p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold hover:shadow-card sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{title}</p>

          <h3 className="mt-3 font-serif text-2xl sm:text-3xl">
            Premium Benefit
          </h3>
        </div>

        <Icon
          className="h-7 w-7 text-gold"
          strokeWidth={1.25}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="border border-border bg-champagne/30 p-5">
          <p className="font-serif text-2xl sm:text-3xl">
            {exchange.split(" ")[0]}
          </p>

          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
            Exchange
          </p>
        </div>

        <div className="border border-border bg-champagne/30 p-5">
          <p className="font-serif text-2xl sm:text-3xl">
            {cashback.split(" ")[0]}
          </p>

          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
            Cashback
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BadgePercent;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-border bg-background p-5">
      <Icon
        className="h-5 w-5 text-gold"
        strokeWidth={1.25}
      />

      <p className="mt-4 font-serif text-xl">
        {title}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export function GoldInvestmentPlan() {
  return (
    <section className="container-luxe py-16 sm:py-20 lg:py-28">
      <div className="grid overflow-hidden border border-border bg-ink text-ink-foreground lg:grid-cols-12">

        {/* Investment Plan Poster */}
        <div className="relative flex min-h-[500px] items-center justify-center overflow-hidden bg-[#f6efe1] p-4 sm:min-h-[600px] sm:p-6 lg:col-span-7 lg:min-h-[680px] lg:p-8">
          <img
            src="/images/seed/investment-plan.jpg"
            alt="SHRI RIDDHI SIDDHI JEWELLERS Gold Investment Plan"
            loading="lazy"
            className="h-full max-h-[650px] w-full object-contain object-center transition-transform duration-[1.5s] hover:scale-[1.03]"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-5 lg:p-14">
          <p className="eyebrow text-gold">
            Secure Your Gold Future
          </p>

          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
            Be-misaal Gold Investment Plan
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            Start your plan from ₹2,000 with a flexible approach to
            building your gold future.
          </p>

          <div className="mt-7 space-y-3 text-sm">
            <p>✓ Start investment from ₹2,000</p>
            <p>✓ Certified pure 24KT gold</p>
            <p>✓ No monthly binding</p>
            <p>
              ✓ Choose jewellery or applicable cash option at plan end
            </p>
          </div>

          <p className="mt-6 text-[0.68rem] leading-relaxed text-ink-muted">
            Plan terms, eligibility, valuation and end-of-plan options
            are subject to showroom policy.
          </p>

          <Link
            to="/contact"
            className="mt-8 inline-flex w-fit items-center gap-2 border border-gold px-5 py-3 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-ink"
          >
            Enquire About Plan

            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
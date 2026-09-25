import Link from "next/link";
import type { PlanType } from "@prisma/client";
import { planName, planAccent } from "@/lib/subscription-plans";
import { formatValidity } from "@/lib/validations/subscription-plan";
import { formatNumber, formatUtcDate } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

/**
 * The customer's membership, shown at the top of the Subscriptions section: which plan they
 * bought, when they bought it, how long it runs and when it ends, plus the points balance it
 * feeds. A Server Component — the data is already on the server, so nothing is fetched from
 * the browser and there is no loading state.
 */

export interface MembershipView {
  id: string;
  status: string;
  startsAt: Date;
  expiresAt: Date;
  /** When the payment was confirmed; older simulated purchases fall back to createdAt. */
  purchasedAt: Date;
  pointsCredited: number;
  pricePaid: number;
  planType: PlanType;
  validityYears: number;
  validityMonths: number;
  validityDays: number;
}

const fmt = (d: Date) => formatUtcDate(d, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Whole days between now and the expiry, floored at 0. */
function daysLeft(expiresAt: Date): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-[#8A8A8A]">{label}</dt>
      <dd className="mt-1 text-[13px] text-primary">{value}</dd>
    </div>
  );
}

export default function MembershipPanel({
  memberships,
  points,
}: {
  /** Newest first. An empty list renders the "no membership yet" state. */
  memberships: MembershipView[];
  /** Spendable points — the same balance the checkout redeems against. */
  points: number;
}) {
  /*
   * The one that counts is the active membership that runs longest — the same one
   * getActiveMembership() hands the checkout, so this panel and the points it redeems against
   * can never disagree. With none active, the most recent purchase is shown as history.
   */
  const active = memberships
    .filter((m) => m.status === "ACTIVE")
    .sort((a, b) => +new Date(b.expiresAt) - +new Date(a.expiresAt));
  const current = active[0] ?? memberships[0] ?? null;
  const others = memberships.filter((m) => m.id !== current?.id);

  if (!current) {
    return (
      <div className="mb-8 rounded-2xl border border-[#EEE] bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A]">Membership</p>
            <p className="mt-1 font-serif text-[18px] text-primary">No membership yet</p>
            <p className="mt-0.5 text-[13px] text-[#8A8A8A]">
              Members earn points on every plan, redeemable at checkout.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8A8A]">Available points</p>
              <p className="mt-0.5 font-serif text-[20px] leading-none text-primary">
                {formatNumber(points)} <span className="text-[11px] text-[#8A8A8A]">pts</span>
              </p>
            </div>
            <Link
              href="/#membership"
              className="inline-flex items-center border border-black px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accent = planAccent(current.planType);
  const validityLabel =
    formatValidity(current.validityYears, current.validityMonths, current.validityDays) || "—";
  const remaining = daysLeft(current.expiresAt);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[#EEE] bg-white">
      <span className="block h-1 w-full" style={{ backgroundColor: accent }} aria-hidden="true" />

      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A]">Membership</p>
            <div className="mt-1 flex items-center gap-2.5">
              <h3 className="font-serif text-[20px] text-primary" style={{ color: accent }}>
                {planName(current.planType)}
              </h3>
              <StatusBadge status={current.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8A8A]">Available points</p>
            <p className="mt-0.5 font-serif text-[20px] leading-none text-primary">
              {formatNumber(points)} <span className="text-[11px] text-[#8A8A8A]">pts</span>
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#EEE] pt-4 sm:grid-cols-4">
          <Field label="Purchased" value={fmt(current.purchasedAt)} />
          <Field label="Valid for" value={validityLabel} />
          <Field label="Starts" value={fmt(current.startsAt)} />
          <Field label="Expires" value={fmt(current.expiresAt)} />
        </dl>

        <p className="mt-4 text-[12px] text-[#8A8A8A]">
          {current.status === "ACTIVE"
            ? `${formatNumber(remaining)} day${remaining === 1 ? "" : "s"} remaining · ${formatNumber(current.pointsCredited)} pts credited with this plan`
            : `${formatNumber(current.pointsCredited)} pts were credited with this plan`}
        </p>
      </div>

      {others.length > 0 && (
        <div className="border-t border-[#EEE] bg-cream/40 px-5 py-4 md:px-6">
          {/* "Other", not "previous": a customer can hold a second membership that is still running. */}
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8A8A]">Other memberships</p>
          <ul className="mt-2 space-y-1.5">
            {others.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <span className="text-primary">{planName(m.planType)}</span>
                <span className="text-[#8A8A8A]">
                  {fmt(m.startsAt)} – {fmt(m.expiresAt)} · {m.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

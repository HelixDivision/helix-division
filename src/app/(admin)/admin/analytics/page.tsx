import type { Metadata } from "next";
import Link from "next/link";

import { MetricBarList } from "@/components/admin/MetricBarList";
import { SalesTrendChart } from "@/components/admin/SalesTrendChart";
import { StatCard } from "@/components/admin/StatCard";
import { cn, formatCurrency } from "@/lib/utils";
import { getAnalyticsDashboard } from "@/server/services/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics | Admin | Helix Division",
};

interface AnalyticsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const RANGES = [7, 30, 90];

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const daysRaw = Number(typeof params.days === "string" ? params.days : 30);
  const days = RANGES.includes(daysRaw) ? daysRaw : 30;
  const data = await getAnalyticsDashboard(days);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
            Analytics
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            First-party store &amp; traffic metrics · last {days} days
            {data.gaConfigured ? " · Google Analytics connected" : ""}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?days=${r}`}
              className={cn(
                "font-heading rounded-md border px-3 py-1 text-xs tracking-wide uppercase transition-colors",
                r === days
                  ? "border-accent-crimson bg-accent-crimson/10 text-accent-crimson"
                  : "border-border text-foreground-muted hover:text-foreground-primary",
              )}
            >
              {r}d
            </Link>
          ))}
        </div>
      </div>

      {/* Audience */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visitors" value={data.visitors} hint={`${data.pageViews} page views`} />
        <StatCard
          label="New / Returning"
          value={`${data.newVisitors} / ${data.returningVisitors}`}
        />
        <StatCard label="Customers" value={data.customers} hint={`+${data.newCustomers} new`} />
        <StatCard
          label="Subscribers"
          value={data.subscribers}
          hint={`+${data.newSubscribers} new`}
        />
      </section>

      {/* Commerce */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(data.revenue)}
          hint={`${data.orders} orders`}
        />
        <StatCard label="Avg Order Value" value={formatCurrency(data.averageOrderValue)} />
        <StatCard
          label="Conversion Rate"
          value={pct(data.conversionRate)}
          hint="purchases / visitors"
        />
        <StatCard
          label="Add-to-Cart Rate"
          value={pct(data.addToCartRate)}
          hint="sessions w/ add-to-cart"
        />
        <StatCard
          label="Checkout Completion"
          value={pct(data.checkoutCompletionRate)}
          hint="purchases / begin-checkouts"
        />
      </section>

      <SalesTrendChart points={data.salesTrend} />

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricBarList
          title="Best-Selling Products"
          items={data.bestSellers}
          formatValue={(v) => `${v} sold`}
        />
        <MetricBarList
          title="Product Performance (views)"
          items={data.productPerformance}
          formatValue={(v) => `${v} views`}
        />
        <MetricBarList
          title="Most Visited Pages"
          items={data.topPages}
          formatValue={(v) => `${v} views`}
        />
        <MetricBarList
          title="Traffic Sources"
          items={data.trafficSources}
          formatValue={(v) => `${v} views`}
        />
        <MetricBarList title="Device Breakdown" items={data.deviceBreakdown} />
        <MetricBarList title="Countries" items={data.countries} />
        <MetricBarList
          title="Internal Search Terms"
          items={data.searchTerms}
          emptyLabel="No on-site searches recorded yet."
          formatValue={(v) => `${v}×`}
        />
      </section>

      {!data.gaConfigured && (
        <p className="text-foreground-muted text-xs">
          Tip: set <code>NEXT_PUBLIC_GA_ID</code> to also stream traffic into Google Analytics 4.
          Store metrics above always stay first-party inside this dashboard.
        </p>
      )}
    </div>
  );
}

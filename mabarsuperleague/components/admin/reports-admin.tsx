"use client";

import { useEffect, useMemo, useState } from "react";

import { api, type MonthlyReport, type MonthlyRow } from "@/lib/admin/api";
import { ErrorNote, Select } from "@/components/admin/ui";

/*
 * Palette — validated with the data-viz palette checker against a dark surface:
 * gold #c98500 + blue #3987e5 pass the lightness band, chroma floor, CVD
 * separation (ΔE 27.4 protan), normal-vision floor (30.7) and 3:1 contrast.
 * The brand's #FFB800 sits outside the dark lightness band, so this deeper gold
 * stands in for it on charts.
 */
const SERIES_REVENUE = "#c98500";
const SERIES_PRIZE = "#3987e5";
const GRID = "rgba(255,255,255,0.07)";
const TEXT_MUTED = "rgba(255,255,255,0.35)";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_SHORT[Number(m) - 1]} ${y}`;
}
function monthShort(key: string) {
  const [, m] = key.split("-");
  return MONTH_SHORT[Number(m) - 1];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Compact money for axis ticks, so they stay short and unread-noisy. */
function rupiahShort(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${Math.round(n / 1_000_000)}jt`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return String(n);
}

/** "Nice" axis maximum so ticks land on round numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => value <= s * mag) ?? 10;
  return step * mag;
}

/* ------------------------------------------------------------------ tiles */

function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warning";
}) {
  const color =
    tone === "good" ? "#6FCF97" : tone === "warning" ? "#E0A04F" : "#FFFFFF";
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-4">
      <span className="text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
        {label}
      </span>
      {/* Proportional figures on a display-size number, never tabular-nums. */}
      <span
        className="font-display text-[26px] font-extrabold leading-tight"
        style={{ color }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[12px] font-semibold text-white/35">{sub}</span>
      )}
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-6 py-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-extrabold text-white">
          {title}
        </h2>
        {hint && (
          <p className="text-[12.5px] font-semibold text-white/40">{hint}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="size-2.5 rounded-[3px]"
        style={{ background: color }}
      />
      {/* Text wears a text token; the swatch carries identity. */}
      <span className="text-[12px] font-bold text-white/55">{label}</span>
    </span>
  );
}

/* ----------------------------------------------------------- money chart */

/** Grouped columns: money in vs money committed, on one shared rupiah axis. */
function MoneyChart({ months }: { months: MonthlyRow[] }) {
  const [hover, setHover] = useState<number | null>(null);

  // The SVG scales to its container, so the viewBox ratio *is* the rendered
  // height. This width is tuned for the wider half of the two-chart row, so it
  // ends up the same height as the participants chart beside it.
  const W = 620;
  const PLOT_H = 128;
  const AXIS_H = 24;
  // Top padding so the highest tick label is not clipped by the viewBox.
  const PAD_T = 10;
  const H = PAD_T + PLOT_H + AXIS_H;
  const PAD_L = 52;
  const PAD_R = 8;

  const max = niceMax(
    Math.max(1, ...months.flatMap((m) => [m.revenue, m.prizePool])),
  );
  const plotW = W - PAD_L - PAD_R;
  const band = plotW / Math.max(months.length, 1);
  const barW = Math.min(24, band * 0.3);
  const GAP = 2; // surface gap between the two bars of a pair
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  const y = (v: number) => PAD_T + PLOT_H - (v / max) * PLOT_H;
  const baseline = PAD_T + PLOT_H;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <LegendKey color={SERIES_REVENUE} label="Entry fees collected" />
        <LegendKey color={SERIES_PRIZE} label="Prize pool committed" />
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[520px]"
          role="img"
          aria-label="Entry fees collected versus prize pool committed, by month"
        >
          {ticks.map((t) => (
            <g key={t}>
              {/* hairline, solid, one step off surface */}
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y(t)}
                y2={y(t)}
                stroke={GRID}
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={10.5}
                fill={TEXT_MUTED}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {rupiahShort(t)}
              </text>
            </g>
          ))}

          {months.map((m, i) => {
            const cx = PAD_L + band * i + band / 2;
            const xRev = cx - barW - GAP / 2;
            const xPri = cx + GAP / 2;
            const active = hover === i;
            return (
              <g key={m.key}>
                {active && (
                  <rect
                    x={PAD_L + band * i}
                    y={PAD_T}
                    width={band}
                    height={PLOT_H}
                    fill="rgba(255,255,255,0.03)"
                  />
                )}
                <rect
                  x={xRev}
                  y={y(m.revenue)}
                  width={barW}
                  height={baseline - y(m.revenue)}
                  fill={SERIES_REVENUE}
                  rx={4}
                />
                {/* square off the baseline end of the rounded rect */}
                <rect
                  x={xRev}
                  y={baseline - 4}
                  width={barW}
                  height={4}
                  fill={SERIES_REVENUE}
                />
                <rect
                  x={xPri}
                  y={y(m.prizePool)}
                  width={barW}
                  height={baseline - y(m.prizePool)}
                  fill={SERIES_PRIZE}
                  rx={4}
                />
                <rect
                  x={xPri}
                  y={baseline - 4}
                  width={barW}
                  height={4}
                  fill={SERIES_PRIZE}
                />

                <text
                  x={cx}
                  y={baseline + 17}
                  textAnchor="middle"
                  fontSize={11}
                  fill={TEXT_MUTED}
                  fontWeight={700}
                >
                  {monthShort(m.key)}
                </text>

                {/* generous hit target, wider than the marks */}
                <rect
                  x={PAD_L + band * i}
                  y={0}
                  width={band}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>

        {hover !== null && months[hover] && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-white/[0.14] bg-[#0A0B0D] px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            style={{
              left: `${((PAD_L + band * hover + band / 2) / W) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="mb-1 text-[11.5px] font-extrabold text-white">
              {monthLabel(months[hover].key)}
            </div>
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <span className="flex items-center gap-2 text-[11.5px] font-semibold text-white/70">
                <span
                  className="size-2 rounded-[2px]"
                  style={{ background: SERIES_REVENUE }}
                />
                In {rupiah(months[hover].revenue)}
              </span>
              <span className="flex items-center gap-2 text-[11.5px] font-semibold text-white/70">
                <span
                  className="size-2 rounded-[2px]"
                  style={{ background: SERIES_PRIZE }}
                />
                Prize {rupiah(months[hover].prizePool)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- participants chart */

/** Single series → one hue, no legend box; the card title says what it is. */
function ParticipantsChart({ months }: { months: MonthlyRow[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 440;
  const PLOT_H = 118;
  const AXIS_H = 24;
  // Room for the top tick label and the direct label above the tallest column.
  const PAD_T = 18;
  const H = PAD_T + PLOT_H + AXIS_H;
  const PAD_L = 30;
  const PAD_R = 8;

  const max = niceMax(Math.max(1, ...months.map((m) => m.participantsConfirmed)));
  const plotW = W - PAD_L - PAD_R;
  const band = plotW / Math.max(months.length, 1);
  const barW = Math.min(24, band * 0.42);
  const y = (v: number) => PAD_T + PLOT_H - (v / max) * PLOT_H;
  const baseline = PAD_T + PLOT_H;

  // Label the extreme only — never a number on every column.
  const peak = months.reduce(
    (best, m, i) =>
      m.participantsConfirmed > (months[best]?.participantsConfirmed ?? -1) ? i : best,
    0,
  );

  return (
    <div className="relative overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[280px]"
        role="img"
        aria-label="Confirmed participants by month"
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(f * max)}
              y2={y(f * max)}
              stroke={GRID}
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(f * max) + 4}
              textAnchor="end"
              fontSize={10}
              fill={TEXT_MUTED}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(f * max)}
            </text>
          </g>
        ))}

        {months.map((m, i) => {
          const x = PAD_L + band * i + (band - barW) / 2;
          return (
            <g key={m.key}>
              <rect
                x={x}
                y={y(m.participantsConfirmed)}
                width={barW}
                height={baseline - y(m.participantsConfirmed)}
                fill={SERIES_REVENUE}
                rx={4}
              />
              <rect
                x={x}
                y={baseline - 4}
                width={barW}
                height={4}
                fill={SERIES_REVENUE}
              />
              {i === peak && m.participantsConfirmed > 0 && (
                <text
                  x={x + barW / 2}
                  y={y(m.participantsConfirmed) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={800}
                  fill="#FFFFFF"
                >
                  {m.participantsConfirmed}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={baseline + 17}
                textAnchor="middle"
                fontSize={11}
                fill={TEXT_MUTED}
                fontWeight={700}
              >
                {monthShort(m.key)}
              </text>
              <rect
                x={PAD_L + band * i}
                y={0}
                width={band}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && months[hover] && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg border border-white/[0.14] bg-[#0A0B0D] px-3 py-1.5 text-[11.5px] font-semibold whitespace-nowrap text-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          style={{
            left: `${((PAD_L + band * hover + band / 2) / W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-extrabold text-white">
            {monthLabel(months[hover].key)}
          </span>{" "}
          · {months[hover].participantsConfirmed} confirmed
          {months[hover].participantsPending > 0 &&
            ` · ${months[hover].participantsPending} pending`}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- game breakdown */

/** Magnitude by identity → horizontal bars in a single hue, value at the tip. */
function GameBars({ rows }: { rows: MonthlyReport["byGame"] }) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((r) => r.revenue));

  if (top.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] font-semibold text-white/35">
        No revenue recorded yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {top.map((r) => (
        <div key={r.game} className="flex items-center gap-3">
          <span className="w-[110px] shrink-0 truncate text-[12.5px] font-bold text-white/65">
            {r.game}
          </span>
          <div className="h-[14px] min-w-0 flex-1">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${Math.max((r.revenue / max) * 100, r.revenue > 0 ? 2 : 0)}%`,
                background: SERIES_REVENUE,
              }}
            />
          </div>
          <span
            className="w-[92px] shrink-0 text-right text-[12px] font-bold text-white/55"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {rupiahShort(r.revenue)}
          </span>
        </div>
      ))}
      {rows.length > top.length && (
        <span className="text-[11.5px] font-semibold text-white/30">
          + {rows.length - top.length} more game
          {rows.length - top.length === 1 ? "" : "s"} — see the table below
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export function ReportsAdmin() {
  const [data, setData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await api.monthlyReport();
        if (active) setData(d);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const years = useMemo(
    () =>
      Array.from(new Set((data?.months ?? []).map((m) => m.key.slice(0, 4)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [data],
  );

  const months = useMemo(
    () =>
      (data?.months ?? []).filter((m) => !year || m.key.startsWith(year)),
    [data, year],
  );

  const totals = useMemo(
    () =>
      months.reduce(
        (a, m) => ({
          tournaments: a.tournaments + m.tournaments,
          participantsConfirmed: a.participantsConfirmed + m.participantsConfirmed,
          participantsPending: a.participantsPending + m.participantsPending,
          revenue: a.revenue + m.revenue,
          prizePool: a.prizePool + m.prizePool,
          net: a.net + m.net,
        }),
        {
          tournaments: 0,
          participantsConfirmed: 0,
          participantsPending: 0,
          revenue: 0,
          prizePool: 0,
          net: 0,
        },
      ),
    [months],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
        Loading report…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Monthly report
          </h1>
          <p className="mt-1 max-w-[620px] text-sm font-semibold text-white/45">
            Grouped by the month each tournament <em>starts</em>, so every column
            on a row describes the same set of tournaments.
          </p>
        </div>
        {years.length > 1 && (
          <div className="w-full sm:w-36">
            <Select
              label="YEAR"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <ErrorNote message={error} />

      {months.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
          No tournament activity to report yet.
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatTile label="Tournaments" value={String(totals.tournaments)} />
            <StatTile
              label="Participants"
              value={String(totals.participantsConfirmed)}
              sub={
                totals.participantsPending > 0
                  ? `${totals.participantsPending} awaiting review`
                  : "all confirmed"
              }
            />
            <StatTile
              label="Entry fees in"
              value={rupiah(totals.revenue)}
              tone="good"
            />
            <StatTile label="Prize committed" value={rupiah(totals.prizePool)} />
            <StatTile
              label="Net"
              value={`${totals.net < 0 ? "−" : "+"}${rupiah(Math.abs(totals.net))}`}
              tone={totals.net < 0 ? "warning" : "good"}
              sub={totals.net < 0 ? "prizes exceed fees" : "fees exceed prizes"}
            />
          </div>

          {/* The two time series sit side by side; money gets the wider column
              because it carries two bars per month. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card
              title="Money by month"
              hint="Fees count once a payment is confirmed. Prize is the pool committed — there are no payout records, so it is allocation, not verified spend."
            >
              <MoneyChart months={months} />
            </Card>
            {/* A hint here also levels the two card headers, so both plots
                start on the same line. */}
            <Card
              title="Confirmed participants by month"
              hint="Registrations still awaiting payment review are not counted."
            >
              {/* Bottom-aligned so its baseline meets the money chart's, which
                  sits lower because that card carries a legend row. */}
              <div className="mt-auto">
                <ParticipantsChart months={months} />
              </div>
            </Card>
          </div>

          <Card title="Entry fees by game" hint="Top games by money collected.">
            <GameBars rows={data?.byGame ?? []} />
          </Card>

          {/* Table view — every value stays readable without a tooltip */}
          <Card title="Monthly breakdown">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
                    <th className="px-3 py-2.5">Month</th>
                    <th className="px-3 py-2.5 text-right">Tournaments</th>
                    <th className="px-3 py-2.5 text-right">Confirmed</th>
                    <th className="px-3 py-2.5 text-right">Pending</th>
                    <th className="px-3 py-2.5 text-right">Fees in</th>
                    <th className="px-3 py-2.5 text-right">Prize</th>
                    <th className="px-3 py-2.5 text-right">Net</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
                  {months.map((m) => (
                    <tr
                      key={m.key}
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <td className="px-3 py-2.5 text-[13px] font-extrabold text-white">
                        {monthLabel(m.key)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-white/70">
                        {m.tournaments}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-white/70">
                        {m.participantsConfirmed}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-white/45">
                        {m.participantsPending || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-white/70">
                        {rupiah(m.revenue)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-white/70">
                        {rupiah(m.prizePool)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right text-[13px] font-extrabold"
                        style={{ color: m.net < 0 ? "#E0A04F" : "#6FCF97" }}
                      >
                        {m.net < 0 ? "−" : "+"}
                        {rupiah(Math.abs(m.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    className="border-t border-white/[0.12]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    <td className="px-3 py-2.5 text-[12px] font-extrabold uppercase tracking-[1px] text-white/45">
                      Total
                    </td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-white">
                      {totals.tournaments}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-white">
                      {totals.participantsConfirmed}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-white/50">
                      {totals.participantsPending || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-white">
                      {rupiah(totals.revenue)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-white">
                      {rupiah(totals.prizePool)}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-[13px] font-extrabold"
                      style={{ color: totals.net < 0 ? "#E0A04F" : "#6FCF97" }}
                    >
                      {totals.net < 0 ? "−" : "+"}
                      {rupiah(Math.abs(totals.net))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Current state, deliberately outside the monthly grouping */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Awaiting review"
              value={String(data?.outstanding.pendingReview ?? 0)}
              sub={
                data && data.outstanding.pendingReview > 0
                  ? `${rupiah(data.outstanding.pendingValue)} unverified`
                  : "nothing queued"
              }
              tone={
                data && data.outstanding.pendingReview > 0 ? "warning" : "neutral"
              }
            />
            <StatTile
              label="Registered users"
              value={String(data?.users ?? 0)}
            />
            <StatTile
              label="Avg per tournament"
              value={
                totals.tournaments > 0
                  ? (totals.participantsConfirmed / totals.tournaments).toFixed(1)
                  : "0"
              }
              sub="confirmed participants"
            />
            <StatTile
              label="Cost recovery"
              value={
                totals.prizePool > 0
                  ? `${Math.round((totals.revenue / totals.prizePool) * 100)}%`
                  : "—"
              }
              sub="fees ÷ prize committed"
            />
          </div>
        </>
      )}
    </div>
  );
}

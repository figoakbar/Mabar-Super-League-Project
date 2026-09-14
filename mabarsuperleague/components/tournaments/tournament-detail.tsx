"use client";

import { useState } from "react";
import Link from "next/link";

import {
  api,
  formatLabel,
  type Participant,
  tierLabel,
  type TournamentDetail as TournamentDetailData,
} from "@/lib/admin/api";
import {
  accentFor,
  avatarBg,
  formatDate,
  rupiah,
} from "@/lib/data/tournament-view";

type MyStatus = "none" | "pending" | "confirmed" | "rejected";

// Knockout round labels sized to the bracket (e.g. 16 → R16 → QF → SF → Final).
function knockoutStages(bracketSize: number): string[] {
  let size = 2;
  while (size < Math.max(bracketSize, 2)) size *= 2;
  const out: string[] = [];
  while (size >= 2) {
    out.push(
      size === 2
        ? "Grand Final"
        : size === 4
          ? "Semifinals"
          : size === 8
            ? "Quarterfinals"
            : `Round of ${size}`,
    );
    size /= 2;
  }
  return out;
}

// Stage-flow chips derived from the tournament's real format + bracket size.
function stagesFor(format: string, bracketSize: number) {
  const labels =
    format === "racing"
      ? ["Practice", "Qualifying", "Race"]
      : format === "group_knockout"
        ? ["Group Stage", ...knockoutStages(Math.max(2, Math.floor(bracketSize / 2)))]
        : knockoutStages(bracketSize);
  return labels.map((label, i) => {
    const last = i === labels.length - 1;
    return {
      label,
      bg: last ? "rgba(255,184,0,0.1)" : "rgba(255,255,255,0.04)",
      border: last ? "rgba(255,184,0,0.4)" : "rgba(255,255,255,0.12)",
      color: last ? "#FFB800" : "rgba(255,255,255,0.7)",
    };
  });
}

const medals = [
  { rank: "1st", label: "+ Champion badge", medalBg: "rgba(255,184,0,0.15)", medalColor: "#FFB800", border: "rgba(255,184,0,0.35)", share: 0.5 },
  { rank: "2nd", label: "Runner-up", medalBg: "rgba(199,206,220,0.12)", medalColor: "#C7CEDC", border: "rgba(255,255,255,0.1)", share: 0.3 },
  { rank: "3rd", label: "Third place", medalBg: "rgba(217,142,82,0.12)", medalColor: "#D98E52", border: "rgba(255,255,255,0.1)", share: 0.2 },
];

export function TournamentDetail({
  t,
  username,
}: {
  t: TournamentDetailData;
  username: string;
}) {
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Everyone registered for this tournament (the live participation roster).
  // Seeded from the server-rendered tournament, then refreshed after a submit.
  const [roster, setRoster] = useState<Participant[]>(t.participants);
  // The current user's own registration status for this tournament.
  const [myStatus, setMyStatus] = useState<MyStatus>(() => {
    const mine = t.participants.filter((p) => p.team === username);
    return mine.length > 0 ? mine[mine.length - 1].status : "none";
  });

  async function refreshRoster() {
    try {
      const all = await api.listParticipants(t.id);
      setRoster(all);
      const mine = all.filter((p) => p.team === username);
      if (mine.length > 0) setMyStatus(mine[mine.length - 1].status);
    } catch {
      // backend down — keep the server-rendered roster
    }
  }

  const submitted = myStatus === "pending" || myStatus === "confirmed";
  const fileName = receipt?.name ?? "";

  async function submitRegistration() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Register the player, 2. attach the payment receipt for admin review.
      const participant = await api.createParticipant({
        tournamentId: t.id,
        team: username,
        captain: username,
        status: "pending",
      });
      if (receipt) await api.uploadReceipt(participant.id, receipt);
      setMyStatus("pending");
      await refreshRoster();
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Registration failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Presentation values derived from the real backend tournament.
  const accent = accentFor(t.game);
  const gameLabel = t.game.toUpperCase();
  const prizeStr = `Rp ${t.prizePool.toLocaleString("id-ID")}`;
  const feeStr = rupiah(t.entryFee);
  const regEnds = formatDate(t.registrationDeadline);
  const stages = stagesFor(t.format, t.maxTeams);
  // The registration/start milestones always show; admin-defined rows follow.
  const scheduleRows = [
    { key: "reg", label: "Registration closes", date: regEnds, dot: "#FFB800", ring: "rgba(255,184,0,0.3)" },
    { key: "start", label: "Tournament starts", date: formatDate(t.startDate), dot: accent, ring: "rgba(255,255,255,0.12)" },
    ...t.schedule.map((s) => ({
      key: s.id,
      label: s.label,
      date: [formatDate(s.date), s.time].filter(Boolean).join(" · "),
      dot: "rgba(255,255,255,0.3)",
      ring: "rgba(255,255,255,0.1)",
    })),
  ];
  const activeRoster = roster.filter((p) => p.status !== "rejected");
  const formatItems = [
    { label: "FORMAT", value: formatLabel(t.format) },
    { label: "GAME", value: t.game },
    ...(t.platforms ? [{ label: "PLATFORMS", value: t.platforms }] : []),
    { label: "BRACKET SIZE", value: `${t.maxTeams} players` },
    { label: "ENTRY FEE", value: feeStr },
    { label: "PRIZE POOL", value: prizeStr },
    { label: "REGISTRATION CLOSES", value: regEnds },
  ];

  const prizeTotal = t.prizePool;
  const slots = t.maxTeams;
  const filled = roster.filter((p) => p.status === "confirmed").length;
  const fillPct = slots > 0 ? Math.round((filled / slots) * 100) : 0;
  const slotsLeft = Math.max(0, slots - filled);
  const canSubmit = !!fileName && agreed && !submitted;

  function copyAccount() {
    navigator.clipboard?.writeText("883009123456");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Header banner */}
      <section className="relative overflow-hidden border-b border-white/[0.08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_30%,transparent_100%)]"
        />
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: accent }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-6 pb-10 pt-9 sm:px-10">
          <Link
            href="/tournaments"
            className="text-[13px] font-extrabold text-white/45 transition-colors hover:text-white"
          >
            ← Back to tournaments
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="text-[11px] font-extrabold tracking-[1.5px]"
                  style={{ color: accent }}
                >
                  {gameLabel} · ONLINE
                </span>
                <div className="flex items-center gap-1.5 rounded-full bg-[#6FCF97]/[0.12] px-2.5 py-1">
                  <span className="size-1.5 rounded-full bg-[#6FCF97] [animation:pulse-soft_1.4s_ease-in-out_infinite]" />
                  <span className="text-[10.5px] font-extrabold text-[#6FCF97]">
                    REGISTRATION OPEN
                  </span>
                </div>
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-[1.1] text-white sm:text-[38px]">
                {t.name}
              </h1>
              <span className="text-sm font-semibold text-white/50">
                Hosted by Indonesia Arcadia Gaming League Official · Registration closes{" "}
                <span className="font-extrabold text-[#FFB800]">{regEnds}</span>
              </span>
              {t.description && (
                <p className="max-w-[560px] text-[13.5px] font-semibold leading-[1.6] text-white/45">
                  {t.description}
                </p>
              )}
            </div>

            <div className="flex gap-6 rounded-xl border border-white/[0.08] bg-[#101114] px-[22px] py-4">
              <div className="flex flex-col gap-px">
                <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                  PRIZE POOL
                </span>
                <span className="font-display text-xl font-extrabold text-[#FFB800]">
                  {prizeStr}
                </span>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div className="flex flex-col gap-px">
                <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                  ENTRY FEE
                </span>
                <span className="font-display text-xl font-extrabold text-white">
                  {feeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-8 px-6 pb-20 pt-9 sm:px-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-7">
          {/* Rules & terms buttons */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/docs/rules.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-[#FFB800]/35 bg-[#FFB800]/10 px-4 py-3.5 font-display text-[15px] font-extrabold text-[#FFB800] transition hover:brightness-110"
              >
                📄 View Rules
              </a>
              <a
                href="/docs/terms.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-white/[0.14] bg-white/[0.04] px-4 py-3.5 font-display text-[15px] font-extrabold text-white/70 transition hover:text-white hover:brightness-110"
              >
                📋 Terms & Conditions
              </a>
            </div>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6">
            <h2 className="font-display text-xl font-extrabold text-white">
              Tournament Format
            </h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {formatItems.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col gap-0.5 rounded-[10px] border border-white/[0.06] bg-black/30 px-4 py-3.5"
                >
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                    {f.label}
                  </span>
                  <span className="text-[14.5px] font-extrabold text-white">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-2.5">
              <span className="text-xs font-extrabold tracking-[1px] text-white/40">
                STAGE FLOW
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {stages.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <div
                      className="rounded-[10px] border px-4 py-2 text-[12.5px] font-extrabold"
                      style={{ background: s.bg, borderColor: s.border, color: s.color }}
                    >
                      {s.label}
                    </div>
                    {i < stages.length - 1 && (
                      <span className="font-extrabold text-white/30">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Season points */}
          <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold text-white">
                Season Points
              </h2>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.5px]"
                style={
                  t.tier === "exhibition"
                    ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }
                    : { background: "rgba(255,184,0,0.12)", color: "#FFB800" }
                }
              >
                {tierLabel(t.tier)}
              </span>
            </div>

            {t.tier === "exhibition" ? (
              <p className="text-[13.5px] font-semibold text-white/45">
                Exhibition match — this tournament doesn&apos;t award season
                points or affect records.
              </p>
            ) : t.format === "racing" ? (
              <p className="text-[13.5px] font-semibold text-white/45">
                Season points are awarded by your final standing · points reset
                each season.
              </p>
            ) : (
              <>
                <p className="-mt-1 text-[12.5px] font-semibold text-white/40">
                  What each placement earns toward the seasonal leaderboard ·
                  points reset each season.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["Champion", t.seasonPoints.champion, "#FFB800"],
                      ["Runner-up", t.seasonPoints.runnerUp, "#C7CEDC"],
                      ["Semifinal", t.seasonPoints.semifinal, "#D98E52"],
                    ] as const
                  ).map(([label, pts, color]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-0.5 rounded-[10px] border border-white/[0.06] bg-black/30 px-4 py-3.5"
                    >
                      <span
                        className="font-display text-[22px] font-extrabold"
                        style={{ color }}
                      >
                        {pts}
                        <span className="ml-1 text-[12px] font-bold text-white/40">
                          pts
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-white/45">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Registration form */}
          <div
            id="register-form"
            className="flex flex-col gap-[18px] rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6"
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-extrabold text-white">
                Registration &amp; Payment
              </h2>
              <span className="text-[13px] font-semibold text-white/45">
                {myStatus === "confirmed"
                  ? "You're in! Your payment has been verified by an admin."
                  : myStatus === "pending"
                    ? "We've received your registration — your payment is being verified."
                    : "Transfer the entry fee, then upload your payment receipt below. Admin verifies within 1×24 hours."}
              </span>
            </div>

            {myStatus === "confirmed" ? (
              <div className="flex items-center gap-3.5 rounded-xl border border-[#6FCF97]/40 bg-[#6FCF97]/[0.1] px-[18px] py-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#6FCF97]/20 text-lg text-[#6FCF97]">
                  ✓
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-[15px] font-extrabold text-[#6FCF97]">
                    Tournament joined
                  </span>
                  <span className="text-[13px] font-semibold text-white/55">
                    Your payment is verified — you&apos;re an official
                    participant. See you on the bracket.
                  </span>
                </div>
              </div>
            ) : myStatus === "pending" ? (
              <div className="flex items-center gap-3.5 rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/[0.08] px-[18px] py-5">
                <span className="mt-1.5 size-[10px] shrink-0 self-start rounded-full bg-[#FFB800] [animation:pulse-soft_1.4s_ease-in-out_infinite]" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-[15px] font-extrabold text-[#FFB800]">
                    Waiting for verification
                  </span>
                  <span className="text-[13px] font-semibold text-white/55">
                    We&apos;ve received your payment receipt. An admin will
                    confirm your spot within 1×24 hours.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {myStatus === "rejected" && (
                  <div className="rounded-[10px] border border-[#E07A72]/30 bg-[#E07A72]/10 px-4 py-2.5 text-[13px] font-semibold text-[#E07A72]">
                    Your previous payment couldn&apos;t be verified. Please
                    transfer again and re-upload a valid receipt.
                  </div>
                )}
                {/* Step 1 */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-extrabold tracking-[1px] text-white/40">
                    STEP 1 — TRANSFER ENTRY FEE ({feeStr})
                  </span>
              <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[10px] border border-white/[0.08] bg-black/30 px-[18px] py-4">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-11 place-items-center rounded-[10px] border border-[#4FA3E0]/35 bg-[#4FA3E0]/[0.12]">
                    <span className="font-display text-xs font-extrabold text-[#4FA3E0]">
                      BCA
                    </span>
                  </div>
                  <div className="flex flex-col gap-px">
                    <span className="font-display text-lg font-extrabold tracking-wider text-white">
                      8830 0912 3456
                    </span>
                    <span className="text-xs font-bold text-white/45">
                      a.n. PT Indonesia Arcadia Gaming League Indonesia
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyAccount}
                  className="rounded-[10px] border px-[18px] py-2.5 font-display text-[13px] font-extrabold transition hover:brightness-110"
                  style={{
                    background: copied
                      ? "rgba(111,207,151,0.15)"
                      : "rgba(255,184,0,0.1)",
                    borderColor: copied
                      ? "rgba(111,207,151,0.4)"
                      : "rgba(255,184,0,0.35)",
                    color: copied ? "#6FCF97" : "#FFB800",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <span className="text-xs font-semibold text-white/40">
                Include your username in the transfer note, e.g.{" "}
                <span className="font-extrabold text-white/65">
                  &quot;S5 — YourUsername&quot;
                </span>
                .
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-extrabold tracking-[1px] text-white/40">
                STEP 2 — UPLOAD PAYMENT RECEIPT
              </span>
              {!fileName ? (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 border-dashed border-white/15 bg-black/20 px-5 py-8 text-center transition-colors hover:border-[#FFB800]/50 hover:bg-[#FFB800]/[0.04]">
                  <span className="grid size-11 place-items-center rounded-full bg-[#FFB800]/10 text-xl text-[#FFB800]">
                    ↑
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    Click to upload receipt
                  </span>
                  <span className="text-xs font-semibold text-white/40">
                    JPG, PNG, or PDF · max 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setReceipt(f);
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3.5 rounded-[10px] border border-[#6FCF97]/35 bg-[#6FCF97]/[0.08] px-[18px] py-3.5">
                  <div className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-[#6FCF97]/15 text-base text-[#6FCF97]">
                    ✓
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="truncate text-[13.5px] font-extrabold text-white">
                      {fileName}
                    </span>
                    <span className="text-[11.5px] font-bold text-[#6FCF97]">
                      Receipt attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="cursor-pointer px-2 py-1 text-xs font-extrabold text-white/40 transition-colors hover:text-[#FF8A80]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

                {/* Agreement + submit */}
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-[10px] border bg-black/25 px-4 py-3.5"
                  style={{
                    borderColor: agreed
                      ? "rgba(255,184,0,0.4)"
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-[17px] shrink-0 cursor-pointer accent-[#FFB800]"
                  />
                  <span className="text-[13px] font-semibold leading-[1.6] text-white/65">
                    I have read and agree to the{" "}
                    <span className="font-extrabold text-[#FFB800]">
                      Official Rulebook
                    </span>
                    . I understand that check-in is mandatory, admin decisions
                    are final, and violations may result in disqualification
                    without refund.
                  </span>
                </label>

                {submitError && (
                  <div className="rounded-[10px] border border-[#E07A72]/30 bg-[#E07A72]/10 px-4 py-2.5 text-[13px] font-semibold text-[#E07A72]">
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitRegistration}
                  disabled={!canSubmit || submitting}
                  className="w-full rounded-xl py-3.5 font-display text-base font-extrabold transition enabled:cursor-pointer enabled:hover:brightness-110"
                  style={{
                    background: canSubmit ? "#FFB800" : "rgba(255,255,255,0.06)",
                    color: canSubmit ? "#0A0B0D" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Registration"}
                </button>
              </>
            )}
          </div>

          {/* Prize split */}
          <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6">
            <h2 className="font-display text-xl font-extrabold text-white">
              Prize Distribution
            </h2>
            <div className="grid grid-cols-3 gap-3.5">
              {medals.map((p) => (
                <div
                  key={p.rank}
                  className="flex flex-col items-center gap-1.5 rounded-[10px] border bg-black/30 px-3.5 py-4 text-center"
                  style={{ borderColor: p.border }}
                >
                  <div
                    className="grid size-[34px] place-items-center rounded-full font-display text-[15px] font-extrabold"
                    style={{ background: p.medalBg, color: p.medalColor }}
                  >
                    {p.rank}
                  </div>
                  <span className="font-display text-lg font-extrabold text-white">
                    {rupiah(prizeTotal * p.share)}
                  </span>
                  <span className="text-[11.5px] font-bold text-white/40">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-7">
          {/* Slots */}
          <div className="flex flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-white">
                Participants
              </h2>
              <span
                className="font-display text-lg font-extrabold"
                style={{ color: accent }}
              >
                {filled}/{slots}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full"
                style={{ width: `${fillPct}%`, background: accent }}
              />
            </div>
            <span className="text-[12.5px] font-bold text-white/45">
              {slotsLeft} slots remaining — closes automatically when full.
            </span>
            <div className="mt-1 flex flex-col">
              {activeRoster.length === 0 ? (
                <div className="py-6 text-center text-[13px] font-semibold text-white/40">
                  No one has registered yet — be the first to join.
                </div>
              ) : (
                activeRoster.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0"
                  >
                    <div
                      className="grid size-8 shrink-0 place-items-center rounded-[9px] font-display text-xs font-extrabold text-white"
                      style={{ background: avatarBg(p.team) }}
                    >
                      {p.team.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13.5px] font-extrabold text-white">
                        {p.team}
                        {p.team === username && (
                          <span className="ml-1.5 text-[11px] font-bold text-white/40">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                    {p.status === "pending" ? (
                      <span className="rounded-[5px] bg-[#FFB800]/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.5px] text-[#FFB800]">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-[5px] bg-[#6FCF97]/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.5px] text-[#6FCF97]">
                        Joined
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="flex flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-[#101114] px-[26px] py-6">
            <h2 className="font-display text-xl font-extrabold text-white">
              Schedule
            </h2>
            <div className="flex flex-col">
              {scheduleRows.map((s) => (
                <div
                  key={s.key}
                  className="flex gap-3.5 border-b border-white/[0.05] py-2.5 last:border-0"
                >
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="size-2.5 rounded-full border-2"
                      style={{ background: s.dot, borderColor: s.ring }}
                    />
                  </div>
                  <div className="flex flex-col gap-px">
                    <span className="text-[13.5px] font-extrabold text-white">
                      {s.label}
                    </span>
                    <span className="text-xs font-bold text-white/45">
                      {s.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2 rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/[0.06] px-6 py-5">
            <span className="font-display text-base font-extrabold text-[#FFB800]">
              Questions?
            </span>
            <span className="text-[13px] font-semibold leading-[1.6] text-white/60">
              Join the official Discord for bracket announcements, match
              scheduling, and admin support.
            </span>
            <Link href="#" className="text-[13px] font-extrabold text-[#FFB800]">
              Open Discord →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

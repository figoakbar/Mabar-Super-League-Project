"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Trash2 } from "lucide-react";

import { Avatar } from "@/components/shared/user-menu";
import { api, API_ORIGIN } from "@/lib/admin/api";
import { avatarSrc, formatDate } from "@/lib/data/tournament-view";
import type { SessionUser } from "@/lib/auth/dal";

const labelClass =
  "text-[11.5px] font-extrabold tracking-[0.8px] text-white/45";
const inputClass =
  "w-full rounded-xl border border-white/[0.12] bg-[#0A0B0D] px-3.5 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#FFB800]/60 disabled:opacity-50";

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
    <section className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-6 py-6">
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

function Note({ kind, children }: { kind: "ok" | "error"; children: string }) {
  const ok = kind === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className="rounded-lg px-3.5 py-2.5 text-[13px] font-bold"
      style={{
        background: ok ? "rgba(111,207,151,0.1)" : "rgba(224,122,114,0.1)",
        border: `1px solid ${ok ? "rgba(111,207,151,0.3)" : "rgba(224,122,114,0.3)"}`,
        color: ok ? "#6FCF97" : "#E07A72",
      }}
    >
      {children}
    </p>
  );
}

export function ProfileEditor({ user }: { user: SessionUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: user.username,
    phone: user.phone,
    consoleId: user.consoleId,
    pcId: user.pcId,
    instagram: user.instagram,
  });
  const [savedAt, setSavedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const dirty =
    form.username !== user.username ||
    form.phone !== user.phone ||
    form.consoleId !== user.consoleId ||
    form.pcId !== user.pcId ||
    form.instagram !== user.instagram;

  async function pickAvatar(file: File) {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const updated = await api.uploadAvatar(file);
      setAvatar(updated.avatarUrl);
      // Refresh so the header picks up the new picture too.
      router.refresh();
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function clearAvatar() {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const updated = await api.removeAvatar();
      setAvatar(updated.avatarUrl);
      router.refresh();
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.updateProfile(form);
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwDone(false);
    if (pw.next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword({
        ...(user.hasPassword ? { currentPassword: pw.current } : {}),
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setPwDone(true);
      router.refresh();
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change it");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Header + picture */}
      <section className="flex flex-wrap items-center gap-6 rounded-xl border border-white/[0.08] bg-[#101114] px-6 py-6">
        {/* Explicit box so the camera button anchors to the picture itself. */}
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <Avatar
            username={form.username || user.username}
            avatar={avatarSrc(avatar, API_ORIGIN)}
            size={96}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-[#101114] bg-[#FFB800] text-[#0A0B0D] transition hover:brightness-110 disabled:opacity-60"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickAvatar(f);
            }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-display text-3xl font-extrabold text-white">
            {user.username}
          </h1>
          <span className="text-[13px] font-semibold text-white/45">
            {user.email} · joined {formatDate(user.createdAt)}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase"
              style={
                user.role === "admin"
                  ? { background: "rgba(255,184,0,0.14)", color: "#FFB800" }
                  : {
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.6)",
                    }
              }
            >
              {user.role}
            </span>
            {avatar && (
              <button
                type="button"
                onClick={() => void clearAvatar()}
                disabled={avatarBusy}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.14] px-2.5 py-1 text-[11.5px] font-bold text-white/50 transition-colors hover:text-white disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                Remove picture
              </button>
            )}
            <span className="text-[11.5px] font-semibold text-white/30">
              JPG, PNG, WEBP or GIF · max 2 MB
            </span>
          </div>
          {avatarBusy && (
            <span className="text-[12px] font-bold text-[#FFB800]">
              Uploading…
            </span>
          )}
          {avatarError && <Note kind="error">{avatarError}</Note>}
        </div>
      </section>

      {/* Profile details */}
      <Card
        title="Profile details"
        hint="Your username is what other players see on brackets and participant lists."
      >
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>USERNAME</span>
              <input
                value={form.username}
                onChange={(e) => set("username")(e.target.value)}
                minLength={3}
                maxLength={30}
                required
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>EMAIL</span>
              <input value={user.email} disabled className={inputClass} />
              <span className="text-[11px] font-semibold text-white/30">
                Email can&apos;t be changed here — it identifies your account.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>PHONE NUMBER</span>
              <input
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                placeholder="08xx xxxx xxxx"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>INSTAGRAM</span>
              <input
                value={form.instagram}
                onChange={(e) => set("instagram")(e.target.value)}
                placeholder="@yourhandle"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>CONSOLE GAMER ID</span>
              <input
                value={form.consoleId}
                onChange={(e) => set("consoleId")(e.target.value)}
                placeholder="PSN ID / Xbox Gamertag"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>PC GAMER ID</span>
              <input
                value={form.pcId}
                onChange={(e) => set("pcId")(e.target.value)}
                placeholder="Steam ID / Epic username"
                className={inputClass}
              />
            </label>
          </div>

          {saveError && <Note kind="error">{saveError}</Note>}
          {savedAt > 0 && !saveError && !dirty && (
            <Note kind="ok">Profile saved.</Note>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!dirty || saving}
              className="cursor-pointer rounded-xl bg-[#FFB800] px-5 py-2.5 font-display text-sm font-extrabold text-[#0A0B0D] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() =>
                  setForm({
                    username: user.username,
                    phone: user.phone,
                    consoleId: user.consoleId,
                    pcId: user.pcId,
                    instagram: user.instagram,
                  })
                }
                className="cursor-pointer text-[13px] font-bold text-white/45 transition-colors hover:text-white"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card
        title={user.hasPassword ? "Change password" : "Set a password"}
        hint={
          user.hasPassword
            ? "Use at least 8 characters."
            : "You signed up with Google. Add a password so you can also log in with your email."
        }
      >
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {user.hasPassword && (
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>CURRENT PASSWORD</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, current: e.target.value }))
                  }
                  required
                  className={inputClass}
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>NEW PASSWORD</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                required
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>CONFIRM NEW PASSWORD</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) =>
                  setPw((p) => ({ ...p, confirm: e.target.value }))
                }
                required
                className={inputClass}
              />
            </label>
          </div>

          {pwError && <Note kind="error">{pwError}</Note>}
          {pwDone && <Note kind="ok">Password updated.</Note>}

          <button
            type="submit"
            disabled={pwBusy}
            className="w-fit cursor-pointer rounded-xl border border-white/[0.14] px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-white/[0.06] disabled:opacity-50"
          >
            {pwBusy ? (
              "Saving…"
            ) : (
              <>
                <Check className="mr-1.5 inline size-4 align-[-3px]" />
                {user.hasPassword ? "Update password" : "Set password"}
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

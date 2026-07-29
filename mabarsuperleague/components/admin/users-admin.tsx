"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

import { api, type AdminUser } from "@/lib/admin/api";
import { btn, ErrorNote } from "@/components/admin/ui";
import { avatarBg, formatDate } from "@/lib/data/tournament-view";

/** Signed-in accounts, with role management. */
export function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(q?: string) {
    setError(null);
    try {
      setRows(await api.listUsers(q));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listUsers();
        if (active) setRows(data);
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

  async function toggleRole(u: AdminUser) {
    const next = u.role === "admin" ? "user" : "admin";
    if (
      next === "admin" &&
      !confirm(`Give ${u.username} full admin access to this panel?`)
    ) {
      return;
    }
    setBusyId(u.id);
    setError(null);
    try {
      await api.updateUser(u.id, { role: next });
      await load(query || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the role");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: AdminUser) {
    if (
      !confirm(
        `Delete ${u.username} (${u.email})? Their registrations stay, but they lose access.`,
      )
    ) {
      return;
    }
    setBusyId(u.id);
    setError(null);
    try {
      await api.deleteUser(u.id);
      await load(query || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the account");
    } finally {
      setBusyId(null);
    }
  }

  const admins = rows.filter((u) => u.role === "admin").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Users
          </h1>
          <p className="mt-1 text-sm font-semibold text-white/45">
            {loading
              ? "Loading accounts…"
              : `${rows.length} registered · ${admins} admin${admins === 1 ? "" : "s"}`}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            void load(query.trim() || undefined);
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or username"
            className="w-56 rounded-lg border border-white/[0.12] bg-[#0A0B0D] px-3.5 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFB800]/60"
          />
          <button type="submit" className={btn.ghost}>
            Search
          </button>
        </form>
      </div>

      <ErrorNote message={error} />

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114]">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
              <th className="px-5 py-3.5">Account</th>
              <th className="px-5 py-3.5">Sign-in</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5">Last login</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                  No accounts match that search.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-[10px] font-display text-xs font-extrabold text-white"
                          style={{ background: avatarBg(u.username) }}
                        >
                          {u.username.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-extrabold text-white">
                            {u.username}
                            {isSelf && (
                              <span className="ml-1.5 text-[11px] font-bold text-white/40">
                                (you)
                              </span>
                            )}
                          </span>
                          <span className="truncate text-xs font-semibold text-white/40">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.hasPassword && (
                          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10.5px] font-extrabold text-white/55">
                            PASSWORD
                          </span>
                        )}
                        {u.avatarUrl && (
                          <span className="rounded-md bg-[#4FA3E0]/[0.14] px-2 py-0.5 text-[10.5px] font-extrabold text-[#4FA3E0]">
                            GOOGLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase"
                        style={
                          u.role === "admin"
                            ? { background: "rgba(255,184,0,0.14)", color: "#FFB800" }
                            : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-white/60">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-white/60">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => void toggleRole(u)}
                          title={
                            isSelf
                              ? "You cannot change your own role"
                              : u.role === "admin"
                                ? "Revoke admin"
                                : "Make admin"
                          }
                          className={`${btn.chip} disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          {u.role === "admin" ? (
                            <ShieldOff className="mr-1 inline size-3.5 align-[-2px]" />
                          ) : (
                            <ShieldCheck className="mr-1 inline size-3.5 align-[-2px]" />
                          )}
                          {u.role === "admin" ? "Revoke admin" : "Make admin"}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => void remove(u)}
                          className={`${btn.danger} disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <Trash2 className="mr-1 inline size-3.5 align-[-2px]" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs font-semibold text-white/35">
        Admin rights are also granted automatically to any email listed in the
        backend&apos;s <span className="font-extrabold text-white/55">ADMIN_EMAILS</span>{" "}
        setting, applied on each sign-in.
      </p>
    </div>
  );
}

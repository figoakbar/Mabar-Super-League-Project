// Client for the MSL backend (NestJS), used by both the public pages and /admin.
//
// Requests take one of two routes:
//   • Server-side (RSC, server actions) → straight to the backend.
//   • Browser → through /api/msl, a Next.js route handler that attaches the
//     caller's session token. The token lives in an httpOnly cookie, so browser
//     JavaScript never sees it and cannot leak it.
//
// Override the backend URL with API_URL (server) / NEXT_PUBLIC_API_URL.

/** Direct backend base URL — server-side use only. */
export const API_BASE_SERVER =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001/api";

/** Same-origin proxy the browser talks to. */
export const API_BASE_BROWSER = "/api/msl";

const onServer = typeof window === "undefined";

export const API_BASE = onServer ? API_BASE_SERVER : API_BASE_BROWSER;

/** Origin of the API, used to build URLs for uploaded files (/uploads/...). */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
  "http://localhost:3001";

// open = registration open · closed = registration closed, ready to draw ·
// ongoing = playing · completed = finished.
export type TournamentStatus = "open" | "closed" | "ongoing" | "completed";

/** Tournament format — decides how the bracket / results are displayed. */
export type TournamentFormat = "knockout" | "group_knockout" | "racing";

export const FORMAT_OPTIONS: { value: TournamentFormat; label: string }[] = [
  { value: "knockout", label: "Knockout" },
  { value: "group_knockout", label: "Group & Knockout Stage" },
  { value: "racing", label: "Racing" },
];

export const formatLabel = (f: string) =>
  FORMAT_OPTIONS.find((o) => o.value === f)?.label ?? f;

/** Tournament tier — weights the season points a result awards. */
export type TournamentTier = "minor" | "major" | "championship" | "exhibition";

export const TIER_OPTIONS: { value: TournamentTier; label: string }[] = [
  { value: "minor", label: "Minor (×1)" },
  { value: "major", label: "Major (×2)" },
  { value: "championship", label: "Championship (×3)" },
  { value: "exhibition", label: "Exhibition (no points)" },
];

export const tierLabel = (t: string) =>
  TIER_OPTIONS.find((o) => o.value === t)?.label ?? t;

export const RACE_SESSIONS = ["practice", "qualifying", "race"] as const;
export type RaceSession = (typeof RACE_SESSIONS)[number];

export type RaceResult = {
  id: string;
  session: RaceSession;
  driver: string;
  position: number | null;
  lapTime: string;
  notes: string;
  tournamentId: string;
  createdAt: string;
};

/** A row of the tournament's schedule timeline, set by an admin. */
export type ScheduleItem = {
  id: string;
  label: string;
  date: string;
  time: string;
  position: number;
  tournamentId: string;
  createdAt: string;
};

/** Schedule payload when creating/updating a tournament (no ids yet). */
export type ScheduleInput = {
  label: string;
  date?: string;
  time?: string;
  position?: number;
};

export type Tournament = {
  id: string;
  name: string;
  game: string;
  /** Comma-separated supported platforms, e.g. "PS5, Xbox Series X|S, PC". */
  platforms: string;
  description: string;
  status: TournamentStatus;
  format: TournamentFormat;
  /** Season-points weight: minor ×1 · major ×2 · championship ×3. */
  tier: TournamentTier;
  prizePool: number;
  entryFee: number;
  maxTeams: number;
  startDate: string;
  registrationDeadline: string;
  registeredTeams: number;
  /** How many matches exist — 0 means the draw hasn't been made yet. */
  matchCount: number;
  schedule: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
};

export type Participant = {
  id: string;
  team: string;
  captain: string;
  contact: string;
  status: "pending" | "confirmed" | "rejected";
  receiptUrl: string | null;
  reviewedAt: string | null;
  tournamentId: string;
  createdAt: string;
  tournament?: {
    id: string;
    name: string;
    game?: string;
    status?: TournamentStatus;
  };
};

export type Match = {
  id: string;
  round: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: "scheduled" | "completed";
  playedAt: string;
  tournamentId: string;
  createdAt: string;
  tournament?: { id: string; name: string; tier?: TournamentTier };
};

export type TournamentDetail = Tournament & {
  participants: Participant[];
  matches: Match[];
};

/**
 * A public player-directory card. Every stat is derived server-side from real
 * match history and registrations — no private account fields are exposed.
 */
export type PublicPlayer = {
  username: string;
  avatarUrl: string;
  memberSince: number;
  wins: number;
  losses: number;
  winRate: number;
  trophies: number;
  mainGame: string;
  records: { game: string; w: number; l: number }[];
  championships: string[];
  tournaments: { name: string; game: string; date: string; result: string }[];
};

/** One ranked row on the seasonal leaderboard. */
export type LeaderboardEntry = {
  username: string;
  avatarUrl: string;
  points: number;
  wins: number;
  losses: number;
  mainGame: string;
  tournaments: number;
};

export type LeaderboardData = {
  season: string;
  seasons: string[];
  players: LeaderboardEntry[];
};

/** Body accepted when creating or updating a tournament. */
export type TournamentInput = Partial<Omit<Tournament, "schedule">> & {
  schedule?: ScheduleInput[];
};

/** One month of league activity, grouped by tournament start month. */
export type MonthlyRow = {
  key: string;
  tournaments: number;
  participantsConfirmed: number;
  participantsPending: number;
  revenue: number;
  prizePool: number;
  net: number;
};

export type GameRow = {
  game: string;
  tournaments: number;
  participants: number;
  revenue: number;
  prizePool: number;
};

export type MonthlyReport = {
  months: MonthlyRow[];
  byGame: GameRow[];
  totals: Omit<MonthlyRow, "key">;
  outstanding: { pendingReview: number; pendingValue: number };
  users: number;
};

/** A registered account as shown in the admin Users list. */
export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  phone: string;
  consoleId: string;
  pcId: string;
  instagram: string;
  avatarUrl: string;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  activeSessions: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Reports (admin only)
  monthlyReport: () => request<MonthlyReport>("/reports/monthly"),

  // The signed-in user's own profile
  updateProfile: (data: {
    username?: string;
    phone?: string;
    consoleId?: string;
    pcId?: string;
    instagram?: string;
  }) =>
    request<AdminUser>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  changePassword: (data: {
    currentPassword?: string;
    newPassword: string;
  }) =>
    request<{ ok: true }>("/auth/me/password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeAvatar: () =>
    request<AdminUser>("/auth/me/avatar", { method: "DELETE" }),
  /** Upload a profile picture (multipart). */
  uploadAvatar: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    // No Content-Type header: the browser sets the multipart boundary.
    const res = await fetch(`${API_BASE}/auth/me/avatar`, {
      method: "POST",
      body,
    });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const b = await res.json();
        if (b?.message) {
          message = Array.isArray(b.message) ? b.message.join(", ") : b.message;
        }
      } catch {
        // keep default
      }
      throw new Error(message);
    }
    return (await res.json()) as AdminUser;
  },

  // Users (admin only)
  listUsers: (q?: string) =>
    request<AdminUser[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  updateUser: (id: string, data: { role?: string; username?: string }) =>
    request<AdminUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/users/${id}`, {
      method: "DELETE",
    }),

  // Public player directory (stats derived from real matches)
  listPlayers: () => request<PublicPlayer[]>("/players"),

  // Seasonal leaderboard (ranked by season points)
  leaderboard: (season?: string) =>
    request<LeaderboardData>(
      `/leaderboard${season ? `?season=${encodeURIComponent(season)}` : ""}`,
    ),

  // Tournaments
  listTournaments: () => request<Tournament[]>("/tournaments"),
  getTournament: (id: string) => request<TournamentDetail>(`/tournaments/${id}`),
  createTournament: (data: TournamentInput) =>
    request<Tournament>("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTournament: (id: string, data: TournamentInput) =>
    request<Tournament>(`/tournaments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTournament: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/tournaments/${id}`, {
      method: "DELETE",
    }),

  // Participants
  listParticipants: (tournamentId?: string, team?: string) => {
    const qs = new URLSearchParams();
    if (tournamentId) qs.set("tournamentId", tournamentId);
    if (team) qs.set("team", team);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Participant[]>(`/participants${suffix}`);
  },
  /** The current user's registrations across all tournaments. */
  myRegistrations: (username: string) =>
    request<Participant[]>(
      `/participants?team=${encodeURIComponent(username)}`,
    ),
  createParticipant: (data: Partial<Participant> & { tournamentId: string }) =>
    request<Participant>("/participants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateParticipant: (id: string, data: Partial<Participant>) =>
    request<Participant>(`/participants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteParticipant: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/participants/${id}`, {
      method: "DELETE",
    }),
  /** Upload a payment receipt (multipart) for a registration. */
  uploadReceipt: async (participantId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    // No Content-Type header: the browser sets the multipart boundary.
    const res = await fetch(
      `${API_BASE}/participants/${participantId}/receipt`,
      { method: "POST", body },
    );
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const b = await res.json();
        if (b?.message) {
          message = Array.isArray(b.message) ? b.message.join(", ") : b.message;
        }
      } catch {
        // keep default
      }
      throw new Error(message);
    }
    return (await res.json()) as Participant;
  },

  // Matches
  listMatches: (tournamentId?: string) =>
    request<Match[]>(
      `/matches${tournamentId ? `?tournamentId=${tournamentId}` : ""}`,
    ),
  /** Shuffle confirmed participants into a fresh draw; returns the new matches. */
  generateDraw: (tournamentId: string) =>
    request<Match[]>("/matches/generate", {
      method: "POST",
      body: JSON.stringify({ tournamentId }),
    }),
  createMatch: (data: Partial<Match> & { tournamentId: string }) =>
    request<Match>("/matches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  setScore: (id: string, scoreA: number, scoreB: number) =>
    request<Match>(`/matches/${id}/score`, {
      method: "PATCH",
      body: JSON.stringify({ scoreA, scoreB }),
    }),
  deleteMatch: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/matches/${id}`, {
      method: "DELETE",
    }),

  // Race results (racing-format tournaments)
  listRaceResults: (tournamentId?: string) =>
    request<RaceResult[]>(
      `/race-results${tournamentId ? `?tournamentId=${tournamentId}` : ""}`,
    ),
  createRaceResult: (
    data: Partial<RaceResult> & { tournamentId: string; session: RaceSession },
  ) =>
    request<RaceResult>("/race-results", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRaceResult: (id: string, data: Partial<RaceResult>) =>
    request<RaceResult>(`/race-results/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteRaceResult: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/race-results/${id}`, {
      method: "DELETE",
    }),
};

# Mabar Super League

Monorepo for the Mabar Super League esports tournament platform.

## Layout

```
.
├── mabarsuperleague/   # Frontend — Next.js 16 (App Router)
├── backend/            # Backend — NestJS (scaffold placeholder)
└── .github/workflows/  # CI
```

Both apps live in one repository, but the CI pipeline is **path-aware**: a change
that only touches the backend will not rebuild the frontend, and vice versa.

## CI — how the "not naive" part works

`.github/workflows/ci.yml` runs on every push to `main` and on every pull
request, in four jobs:

1. **`changes`** — uses [`dorny/paths-filter`](https://github.com/dorny/paths-filter)
   to detect whether `mabarsuperleague/**` and/or `backend/**` changed, and
   exposes that as job outputs.
2. **`frontend`** — `npm ci → lint → build`, but guarded by
   `if: needs.changes.outputs.frontend == 'true'`, so it is **skipped** when no
   frontend file changed.
3. **`backend`** — `npm ci → lint → test → build`, guarded the same way for
   `backend`.
4. **`ci`** — an aggregate gate that always runs. Set **this** as the required
   status check in branch protection; skipped app jobs count as success and only
   a real failure blocks a merge.

Editing `.github/workflows/ci.yml` itself triggers both app jobs, so pipeline
changes are always exercised.

## Local development

```bash
# Frontend
cd mabarsuperleague && npm install && npm run dev

# Backend (once the NestJS app is scaffolded — see backend/README.md)
cd backend && npm install && npm run start:dev
```

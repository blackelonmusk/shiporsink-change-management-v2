# Ship or Sink Change Management

A workspace for change managers and project leads to organize stakeholders, track readiness, prepare conversations, and get contextual AI coaching.

[Live app](https://change.shiporsink.ai) · [Ship or Sink](https://shiporsink.ai) · [Companion AI API](https://github.com/blackelonmusk/shiporsink-ai-api)

## The product problem

Change work spans people, projects, and follow-through. This app brings stakeholder records, readiness scores, milestones, and coaching into one workflow so a project lead can move from identifying a concern to planning a conversation or task.

This is the Next.js rebuild of the [original Internet Computer version](https://github.com/blackelonmusk/shiporsink-change-management).

## Implemented in this repository

- Project creation and management, stakeholder records, and a reusable people directory.
- Engagement, performance, and ADKAR scores, notes, and stakeholder history.
- Groups, milestones, follow-ups, conversation scripts, and project templates.
- Analytics and report views derived from project data. These are application heuristics, not validated predictions of change outcomes.
- AI coaching through the companion API, plus saved chat messages and insights.
- AI-generated task suggestions and a Tick PM integration.
- Supabase email/password authentication, project invitations, and a shared-project listing.

## Access and product decisions

The browser signs in through Supabase. API routes validate bearer tokens and use a server-side service-role client. Because that client bypasses RLS, route-level authorization is essential; database policies do not substitute for those checks.

The shared-project listing finds invitations using the authenticated user's email. Many project routes still require project ownership. Invitation and listing support should not be read as complete collaborator editing or organization-wide role management.

The app keeps reusable people separate from project-specific stakeholder context. Coaching consumes project records; generated advice is not evidence that an intervention happened or succeeded.

## Architecture

Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase Auth/Postgres, TanStack Query, Recharts, and Vercel. The Anthropic SDK supports task generation; Resend supports invitation email. Chat coaching calls the separate AI API.

| Path | Responsibility |
| --- | --- |
| `app/api/` | Authenticated application endpoints |
| `lib/auth.ts` | Token validation and project ownership helpers |
| `lib/supabase.ts` | Browser and server clients |
| `components/` | Project, people, coaching, and reporting interfaces |
| `supabase/migrations/` | Partial database migration history |

## Local setup

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. On PowerShell, use `Copy-Item .env.local.example .env.local`.

Configure the following variables locally or in the deployment environment:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser key; public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-side database access |
| `ANTHROPIC_API_KEY` | Private key for task generation |
| `RESEND_API_KEY` | Private key for invitation email |

The SQL in this checkout is not a complete fresh-install schema. A matching database, grants, policies, and a configured coaching API are required for the full workflow. Do not apply the old milestones migration blindly to an existing database; its project references need review against the current `change_projects` schema.

Use `npm run build` to check the application build. No automated test script is defined in this package.

## Current boundaries

- This is an application portfolio project, not a complete enterprise administration platform.
- Multi-user authorization needs review across all routes, including cross-app operations; the presence of authentication is not a tenant-isolation guarantee.
- Local operations-dashboard work exists separately from the public baseline and is not assumed to be included in every checkout.
- Environment files are excluded from Git except the empty example. Removing a file from the latest revision does not remove older Git objects or revoke credentials.

Built by Brandon Mann as part of Ship or Sink.

# Race Calendar

A personal race calendar for planning, tracking, and sharing your running season. Built as a single-page app with a Vercel KV backend for persistent storage across devices and shareable read-only links.

![Paper and Rave themes — screenshots go here]

## Features

- **Two themes.** Paper (warm, serif, editorial) and Rave (dark, bold, uppercase). Toggle in the header; choice persists per device.
- **Races and life events.** Track races with type, distance, location, status, priority, and notes. Block off vacations, weddings, injuries, work travel, and other commitments.
- **Smart conflict detection.** Automatically flags tight recovery windows (≤14 days) between big races, and warns when races overlap with life events.
- **Year strip visualization.** Every year gets a month-by-month strip showing race dots, event blocks, and conflict zones at a glance.
- **Persistent cloud storage.** Your calendar syncs across devices via Vercel KV — no account required, identified by an anonymous browser ID.
- **Shareable links.** Generate a read-only URL for friends that auto-syncs when you edit. Recipients can view or copy it into their own calendar.
- **Import / export.** Back up or migrate your calendar as JSON.
- **Cute empty state.** An animated runner bouncing along a dashed track greets new users.

## Stack

- **Frontend:** React 18 via CDN, Babel Standalone for in-browser JSX, single-file `index.html`
- **Backend:** Vercel Serverless Functions (Node.js) in `api/`
- **Storage:** Vercel KV (Redis-compatible)
- **Hosting:** Vercel (static site + serverless)
- **Fonts:** Fraunces, DM Sans, JetBrains Mono (Paper); Anton, Space Mono (Rave)

No build step. No `npm install` required for development — open `index.html` directly (though API routes only run on Vercel).

## Project structure

```
race-calendar/
├── index.html          # Entire frontend — React app, themes, forms, logic
├── package.json        # Declares @vercel/kv dependency for API routes
├── .gitignore
├── README.md
└── api/
    ├── user.js         # GET/POST/DELETE a user's personal calendar
    └── share.js        # GET/POST/DELETE shareable calendar snapshots
```

## Deploy from scratch

### 1. Clone or upload to GitHub

Create a new repo and add all files above. Using GitHub's web UI, you can create `api/user.js` directly by typing the slash in the filename — no local setup needed.

### 2. Import to Vercel

Go to [vercel.com/new](https://vercel.com/new), select your repo, click **Deploy**. First deploy will succeed but the app will show a "Couldn't reach server" banner until you add storage.

### 3. Provision Vercel KV

In your Vercel project dashboard:

1. Click the **Storage** tab
2. **Create Database** → choose **KV** (or Redis via Marketplace)
3. **Connect to Project**

Vercel automatically injects the required environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) into your deployment.

### 4. Redeploy

Go to **Deployments** → click `⋯` on the latest → **Redeploy**. Takes ~20 seconds. Your calendar is now live and persistent at `<project>.vercel.app`.

## How storage works

### User identity

Each browser generates a random 20-character ID on first visit, stored in `localStorage` under `race-calendar-user-id`. This ID is sent with every API call and scopes your data. No account, no login.

**Implications:**
- Clearing browser data = losing access (use Export JSON first)
- Different browsers = different calendars (use Export → Import to sync)
- Incognito sessions are fresh every time

### Data model

An item is either a race or an event:

```json
{
  "id": "race-1234567890",
  "kind": "race",
  "name": "Brooklyn Half",
  "date": "2026-05-16",
  "endDate": "",
  "dateLabel": "",
  "distance": "13.1 mi",
  "types": ["half"],
  "status": "confirmed",
  "location": "Brooklyn, NY",
  "notes": "",
  "priority": false,
  "optionGroup": ""
}
```

Event items use `"kind": "event"` and have `category` instead of `types`/`status`/`distance`.

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/user?id=<userId>` | GET | Fetch your calendar items |
| `/api/user?id=<userId>` | POST | Save your calendar items |
| `/api/user?id=<userId>` | DELETE | Wipe your calendar |
| `/api/share?id=<shareId>` | GET | Load a shared calendar (read-only) |
| `/api/share` | POST | Create or update a shared snapshot; returns `shareId` |
| `/api/share?id=<shareId>` | DELETE | Stop sharing (invalidates the link) |

`user:<userId>` and `share:<shareId>` are the KV keys.

### Share link lifecycle

1. Click **Share** → app calls `POST /api/share` with your items, gets back an 8-char `shareId`, saves it to localStorage
2. Every subsequent edit automatically re-posts to the same `shareId` so the link stays current
3. **Stop sharing** deletes the KV key; the link immediately 404s

## Local development

Because the frontend uses CDN React + Babel Standalone, you can edit `index.html` and refresh. The API routes, however, require Vercel's runtime.

```bash
npm i -g vercel
vercel dev
```

This runs the full stack locally at `http://localhost:3000` with KV proxied from your production database (or use `vercel env pull` for local env vars).

## Customization

Everything is in one file. Common changes:

- **Race types and colors:** edit the `TYPES` object at the top of the script
- **Status labels and badge colors:** edit `STATUSES`
- **Event categories:** edit `EVENT_CATEGORIES`
- **Themes:** edit the `THEMES` object — colors, fonts, radii, uppercase rules
- **Conflict threshold:** the "14 days" window is hardcoded in `detectRaceConflicts`

## Known limitations

- **No accounts.** Cross-device access requires Export/Import JSON or logging in with the same browser profile.
- **No concurrent edit protection.** Last write wins if you edit the same calendar from two tabs at once.
- **1000 item cap** per user/share, enforced server-side to keep KV payloads reasonable.
- **Free tier limits.** Vercel KV free tier is ~30K ops/month. A personal calendar uses a few hundred at most; if you share a link that many people hit, watch your dashboard.

## Roadmap ideas

- [ ] Real authentication (Clerk, NextAuth, or Vercel's built-in auth)
- [ ] Training plan integration (taper windows, long-run scheduling)
- [ ] iCal export so races show up in Google Calendar / Apple Calendar
- [ ] Public race database — auto-fill by race name
- [ ] Strava integration for completed race verification
- [ ] Collaborative editing for relay teams
- [ ] Mobile-first polish (current layout is responsive but not native-feeling)

## License

MIT — use it, fork it, remix it.

## Credits

Built with Claude. Designed by a runner for runners.

# SvelteKit + Payload CMS Monolith Deployment Guide

**User:** Marcin (Dutch, based in Rotterdam)  
**Project:** "Rend" - Full-stack monolith (SvelteKit frontend + Payload CMS 3.0 backend)  
**Deployment:** Coolify on Greenhost  
**Status:** ✅ SOLVED - Fully static frontend with CMS-driven prerendering

## Architecture

```
Frontend:  SvelteKit (SSG - Static Site Generation)
Backend:   Payload CMS 3.0 (Next.js) with SQLite
Hosting:   Single Coolify instance on Greenhost
Admin UI:  /admin/* routes (server-rendered, protected)
API:       /api/* routes (Payload REST/GraphQL)
```

**Key constraint:** Monolith = both frontend and backend in same process/container

## Current Problem

✅ **SOLVED** - See "Solution Implemented" below

**Previous issue (now fixed):**
- SvelteKit tried to prerender all routes to static HTML at build time
- `src/routes/+page.server.ts` had a `load()` function that queries the database
- Database was empty at build time → Drizzle/SQLite query failed
- Prerender aborted with exit code 1

## Build Process

**File:** `build.mjs` (root)

```
1. Create dev.db if missing
2. Generate initial migration if needed
3. Run: pnpm run build:migrate (Payload migrations)
4. Run: pnpm run build:next (Next.js build for /admin, /api)
5. Run: pnpm run build:sveltekit (Vite build with prerender)
   ↓ FAILS HERE - prerender tries to access database
```

**Key issue:** Step 5 runs prerender without data. Need to either:
- Skip prerendering routes that query the database
- Populate database before prerender
- Use ISR/on-demand generation instead

## Solution Implemented

✅ **Switched to fully static frontend (Option B/C hybrid)**

**What changed:**
1. **Adapter switch:** `@sveltejs/adapter-node` → `@sveltejs/adapter-static`
2. **Root page prerendering:** `src/routes/+page.server.ts` - Marks `export const prerender = true`
3. **Dynamic route generation:** `src/routes/[slug]/+page.server.ts` - Implements `entries()` function:
   - Fetches all pages from Payload CMS at build time
   - Dynamically generates static HTML for each page
   - Falls back gracefully if database unavailable
4. **SvelteKit config:** Updated `svelte.config.js`:
   - `prerender.entries: ['*']` - Prerender all routes
   - `handleUnseenRoutes: 'warn'` - Gracefully handle dynamic routes

**Build output:**
```
build/
├── index.html              ← root page (static)
├── drag.html              ← generated from [slug] entries
├── subaru.html            ← generated from [slug] entries
├── __data.json            ← SvelteKit data files
└── media/images/          ← static assets
```

**Workflow after implementation:**
1. Edit content in Payload CMS
2. Run `pnpm run build` locally
3. Static files regenerate from database
4. Push to repo → Coolify automatically rebuilds and redeploys

## Goals & Constraints

**What Marcin wants:**
- ✅ SSG for public pages (fast, static)
- ✅ Admin protected at `/admin/*` (server-rendered)
- ✅ Payload API for content management
- ✅ Local API integration (not REST)
- ❓ **Unclear:** Should `/` be static or dynamic? (Currently queries DB)

**Known preferences:**
- Methodical approach (test-and-verify mindset)
- Dutch communication preference
- Small 4-person startup team
- Working on Minecraft modding, cooking in parallel

## Technical Stack

- **Frontend:** SvelteKit 2.57.1, Vite 8.0.10, Svelte 5.55.4
- **Backend:** Payload 3.84.0, Next.js 16.2.4, Payload SQLite adapter
- **Database:** SQLite (dev.db in repo root, created at build time)
- **Image handling:** sharp 0.34.5, WebP/AVIF conversion (discussed but not yet implemented)
- **Build:** pnpm workspaces, TypeScript 5.7.3, Node 22.14.0

## Previous Discussions

### Image Variants (Solved Strategy)
- Upload: Accept JPEG/PNG on upload
- Generate: 5 size variants (480, 768, 960, 1024, 1440) based on original dimensions
- Format: Auto-convert to WebP + AVIF (storage optimization)
- Display: `<picture>` with srcset, account for 2x DPR
- Rule: Only generate variants < 85% of original width, never upsample

### Component Imports
- Discussed automating `index.ts` barrel exports for components
- Solution: `scripts/generate-indexes.js` run on `npm run dev` and `npm run build`

### Git Hosting
- Evaluated self-hosted (Forgejo, GitLab CE) vs hosted (GitHub, GitLab SaaS)
- Condensed recommendations to 3 options for team discussion via Discord

### Payload Config Import Issue
- Error: `Cannot find module '/app/.svelte-kit/output/server/app/cms/src/payload.config.ts'`
- Root cause: Importing from source during build, not compiled output
- Attempted fix: Dynamic import in `hooks.server.ts`
- Current blocker: Need proper path resolution at runtime

## Solution Options for Prerender Issue

### ✅ Option B+C (Implemented): Populate Database + Separate Static Rendering
Hybrid approach combining the best of both options.

**Implementation details:**
- Database migrations run during build (`build:migrate` step)
- All collections synced from database at prerender time
- `entries()` function in dynamic routes queries database and generates static pages
- Clean separation: Admin stays at `/admin/*`, API at `/api/*`, frontend is pure static

**Pros:** 
- True SSG for all pages (fast, cacheable)
- Content updates trigger rebuild (fresh data)
- Admin interface still server-rendered and protected
- Works great with Coolify webhooks for automated rebuilds

**Cons:** 
- Requires rebuild for content updates (not instant)
- Can't add new pages without redeploying

### Option A: Skip Prerendering Database Routes (Previous consideration)
```typescript
// src/routes/+page.server.ts
export const prerender = false;

export async function load({ locals }) {
  // This page will be server-rendered on demand, not prerendered
  const posts = await locals.payload.find({ collection: 'posts' });
  return { posts };
}
```

**Pros:** Simplest, homepage stays dynamic
**Cons:** Lose SSG benefits for homepage

### Option B: Populate Database at Build Time
```javascript
// In build.mjs, before running build:sveltekit
await runCommand('pnpm', ['payload', 'seed'], {
  cwd: path.resolve(__dirname, 'app/cms'),
  env: { PAYLOAD_CONFIG_PATH: './src/payload.config.ts' }
})
```

**Pros:** True SSG for all pages
**Cons:** Need a seed script; requires data to exist; breaks for dynamic content

### Option C: Separate Static + Payload
- Homepage: Truly static (no database queries)
- Content pages: Load from JSON file generated at build time
- Payload admin: Separate from static rendering

**Pros:** Clean separation, proper SSG
**Cons:** Requires restructuring how content is accessed

## Key Files to Know

- `build.mjs` - Build orchestration script
- `svelte.config.js` - SvelteKit configuration (prerender settings)
- `src/hooks.server.ts` - Payload initialization, request locals
- `src/routes/+page.server.ts` - Homepage load function (currently failing)
- `src/routes/_slug_/+page.server.ts` - Referenced in error but may also query DB
- `app/cms/src/payload.config.ts` - Payload CMS configuration

## Future Considerations

**When updating collections:**
1. Edit collection schema in Payload CMS
2. Payload automatically generates migration file
3. Commit migration to git (important!)
4. Push to repo
5. Coolify pulls code → runs migration → rebuilds static site
6. If migration isn't committed, Coolify build will fail or data won't sync

**Performance optimization (if needed):**
- Vite plugin timings show normal SvelteKit compilation overhead (~90% of build time)
- No action needed unless builds exceed 5+ minutes
- Can optimize by reducing Svelte component complexity or using Vite build cache

**Content update workflow options:**
1. **Manual:** Edit CMS → run `pnpm run build` locally → push changes
2. **Automated via Coolify webhook:** Set up Payload CMS to trigger Coolify rebuild on content save
3. **Scheduled:** Configure Coolify to rebuild on a schedule (hourly, daily, etc.)

## Notes for Future Reference

**Collection schema migrations:**
- Always commit migration files generated by Payload
- Location: `app/cms/src/migrations/`
- Format: `YYYYMMDD_HHMMSS.ts` and `.json`
- Auto-generated when you change `Collections.ts` files

**Static site benefits:**
- Can serve from any static host (CDN, S3, Netlify, Vercel, etc.)
- No runtime server needed (except for `/admin` and `/api` which run separately)
- Extremely fast (pure HTML/CSS/JS delivery)
- Highly cacheable and SEO-friendly

**What to Ask/Check Next Time (if issues arise)**

1. **Build failures:** Check if migrations are committed/pushed
2. **Content not updating:** Verify `pnpm run build` regenerated HTML files
3. **Coolify deployment:** Ensure `build/` directory is configured as output
4. **Performance:** Use `pnpm run preview` to test production build locally first

## Coolify-Specific Notes

- Deployment server: Greenhost
- Build container: nixpacks-based (ghcr.io/railwayapp/nixpacks:ubuntu-*)
- Proxy: Traefik v3.1
- Database: SQLite (not network-based)
- Team feature: Basic (permissions still have security issues in Coolify)

## Action Items

- [x] Decide on SSG strategy (chose B+C hybrid)
- [x] Implement chosen solution (fully static with CMS-driven prerendering)
- [x] Test build locally (confirmed static files generated: index.html, slug-based pages)
- [x] Commit all changes and migrations
- [ ] Push to repo and test Coolify deployment
- [ ] (Optional) Set up Payload webhook for automated rebuilds
- [ ] (Optional) Test content update workflow (edit CMS → rebuild → verify changes)
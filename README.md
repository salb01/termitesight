# TermiteSight

Mobile-first termite and WDO inspection app centered around an interactive map inspection canvas.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS
- Mapbox GL JS (satellite map)
- Supabase (database + storage)

## Features in v1

- Address search with Mapbox geocoding
- Satellite map inspection canvas
- Add and edit structure footprints as GeoJSON polygons
- Structure labels on map
- Place finding markers tied to selected structures
- Finding detail drawer for category and notes
- Photo attachment upload to Supabase Storage
- Save inspection draft to Supabase tables
- WDO report PDF export (client-side)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env.local
```

3. Fill in your Mapbox and Supabase values.

4. Run local development server:

```bash
npm run dev
```

5. Apply database schema to Supabase SQL editor using `supabase/schema.sql`.

## Vercel deployment

- Import this repository into Vercel.
- Set environment variables from `.env.example` in the Vercel dashboard.
- Deploy with default Next.js build settings.


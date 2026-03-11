# TermiteSight Repository Rules

TermiteSight is a mobile-first termite inspection application.

Purpose:
Allow termite inspectors to perform inspections visually using a map-based structure footprint workflow.

Core philosophy:
Inspection begins with the structure footprint, not forms.

Key principles:

* Mobile-first design
* Minimal typing
* Tap-based workflow
* Visual inspection markers
* Everything tied to structure geometry

Technology requirements:

Frontend

* Next.js
* React
* TypeScript
* TailwindCSS

Mapping

* Mapbox GL JS
* Satellite imagery

Backend

* Supabase (Postgres + Storage)

Deployment

* Vercel

Architecture rules:

1. Structure geometry must be stored as GeoJSON.
2. Findings must reference a structure and map coordinates.
3. Photos must attach to findings.
4. The inspection map canvas is the core UI component.
5. UI must prioritize large touch targets for field use.

Do not introduce unnecessary libraries.
Keep components modular and simple.

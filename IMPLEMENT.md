# TermiteSight Implementation Plan

Phase 1 — Map Canvas

Build the core inspection interface.

Requirements:

Mapbox satellite map
Address search
Editable footprint polygon
Structure labels
Add garage/patio/deck structures
Marker placement
Finding detail drawer

Phase 2 — Findings

Add structured findings workflow.

Features:

Finding category
Severity level
Inspection area
Recommendation
Narrative generation

Phase 3 — Photos

Features:

Photo capture
Attach photo to finding
Annotate photo
Store in Supabase storage

Phase 4 — Reports

Generate WDO inspection report.

Include:

Property information
Structure diagram
Findings list
Photos
Inspector notes
Limitations statement

Output PDF format.

Phase 5 — Data Persistence

Use Supabase database.

Tables:

inspections
structures
findings
photos
reports

Phase 6 — Performance

Add offline support.

Use local storage caching.

Sync inspection data when network returns.

# TermiteSight Product Specification

TermiteSight is a termite inspection field tool.

The product focuses exclusively on termite and WDO inspections.

It is not a general inspection platform.

The workflow centers around a map-assisted structure footprint.

Inspection Flow

1. Search property address
2. Load satellite map
3. Create or edit structure footprint
4. Add additional structures
5. Place termite findings
6. Attach photos
7. Generate WDO report

Primary Users

* Termite inspectors
* Pest control companies
* WDO inspectors

Primary Screen

Map Inspection Canvas

Features

Structure footprint editing
Marker placement for findings
Photo capture
Inspection notes
Treatment recommendations

Finding Categories

Evidence

* Active termites
* Mud tubes
* Frass
* Wood damage

Conditions

* Wood-to-soil contact
* Moisture
* Cellulose debris

Access

* Inaccessible area
* Obstructed area

Recommendations

* Treatment needed
* Repair needed
* Monitor

Data Model

inspections
structures
findings
photos
reports

Structure footprints stored as GeoJSON polygons.

Markers store map coordinates and structure references.

Reports must generate a WDO-compatible PDF.

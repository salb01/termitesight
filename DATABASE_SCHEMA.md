# TermiteSight Database Schema

inspections

* id
* address
* latitude
* longitude
* client_name
* inspection_date
* inspector_name
* status

structures

* id
* inspection_id
* name
* type
* geometry_geojson

findings

* id
* inspection_id
* structure_id
* category
* subtype
* severity
* area
* recommendation
* latitude
* longitude
* notes

photos

* id
* inspection_id
* finding_id
* file_url
* caption
* timestamp

reports

* id
* inspection_id
* pdf_url
* generated_at

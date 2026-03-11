"use client";

import { jsPDF } from "jspdf";
import mapboxgl, { GeoJSONSource, LngLatLike, MapMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { geocodeAddress, mapboxToken } from "@/lib/mapbox";
import { supabase } from "@/lib/supabase";
import { Finding, FindingCategory, Structure, StructureType } from "@/lib/types";

const categories: FindingCategory[] = [
  "active termites",
  "mud tubes",
  "frass",
  "wood damage",
  "wood-to-soil contact",
  "moisture",
  "cellulose debris",
  "inaccessible area",
  "obstructed area",
  "treatment needed",
  "repair needed",
  "monitor"
];

const structureTypes: StructureType[] = ["primary", "garage", "patio", "deck"];

function uid() {
  return crypto.randomUUID();
}

function polygonCenter(geometry: GeoJSON.Polygon): [number, number] {
  const ring = geometry.coordinates[0];
  const totals = ring.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0]
  );
  return [totals[0] / ring.length, totals[1] / ring.length];
}

const defaultPolygon = (center: [number, number]): GeoJSON.Polygon => {
  const [lng, lat] = center;
  const d = 0.00012;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - d, lat - d],
        [lng + d, lat - d],
        [lng + d, lat + d],
        [lng - d, lat + d],
        [lng - d, lat - d]
      ]
    ]
  };
};

export function MapInspectionCanvas() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ label: string; lng: number; lat: number }>>([]);
  const [activeCenter, setActiveCenter] = useState<[number, number]>([-97.7431, 30.2672]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [isEditingFootprint, setIsEditingFootprint] = useState(false);
  const [editVertexIndex, setEditVertexIndex] = useState<number | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"move" | "structure" | "finding">("move");

  const selectedFinding = useMemo(
    () => findings.find((finding) => finding.id === selectedFindingId) ?? null,
    [findings, selectedFindingId]
  );

  useEffect(() => {
    if (!mapElRef.current || mapRef.current || !mapboxToken) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: activeCenter as LngLatLike,
      zoom: 19,
      pitch: 0,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("structures", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "structure-fill",
        type: "fill",
        source: "structures",
        paint: {
          "fill-color": "#14b8a6",
          "fill-opacity": 0.25
        }
      });
      map.addLayer({
        id: "structure-line",
        type: "line",
        source: "structures",
        paint: {
          "line-color": "#0f766e",
          "line-width": 3
        }
      });
      map.addLayer({
        id: "structure-label",
        type: "symbol",
        source: "structures",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 13,
          "text-offset": [0, 0.2]
        },
        paint: {
          "text-color": "#ffffff"
        }
      });

      map.addSource("findings", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "finding-points",
        type: "circle",
        source: "findings",
        paint: {
          "circle-radius": 8,
          "circle-color": "#dc2626",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fef2f2"
        }
      });
    });

    map.on("click", (event) => handleMapTap(event));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const src = map.getSource("structures") as GeoJSONSource;
    const features = structures.map((structure) => ({
      type: "Feature" as const,
      properties: {
        id: structure.id,
        name: structure.name,
        type: structure.type
      },
      geometry: structure.geometry
    }));
    src.setData({ type: "FeatureCollection", features });

    const findingSource = map.getSource("findings") as GeoJSONSource;
    findingSource.setData({
      type: "FeatureCollection",
      features: findings.map((finding) => ({
        type: "Feature" as const,
        properties: {
          id: finding.id,
          severity: finding.severity
        },
        geometry: {
          type: "Point" as const,
          coordinates: [finding.lng, finding.lat]
        }
      }))
    });
  }, [findings, structures]);

  function handleMapTap(event: MapMouseEvent) {
    if (mode === "structure") {
      const newStructure: Structure = {
        id: uid(),
        name: `Structure ${structures.length + 1}`,
        type: structureTypes[Math.min(structures.length, structureTypes.length - 1)],
        geometry: defaultPolygon([event.lngLat.lng, event.lngLat.lat])
      };
      setStructures((existing) => [...existing, newStructure]);
      setSelectedStructureId(newStructure.id);
      setMode("move");
      return;
    }

    if (mode === "finding") {
      if (!selectedStructureId) {
        return;
      }
      const finding: Finding = {
        id: uid(),
        structureId: selectedStructureId,
        category: "active termites",
        severity: "moderate",
        recommendation: "Further treatment evaluation needed.",
        notes: "",
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
        photos: []
      };
      setFindings((existing) => [...existing, finding]);
      setSelectedFindingId(finding.id);
      return;
    }

    if (isEditingFootprint && selectedStructureId && editVertexIndex !== null) {
      setStructures((existing) =>
        existing.map((structure) => {
          if (structure.id !== selectedStructureId) {
            return structure;
          }
          const points = [...structure.geometry.coordinates[0]];
          points[editVertexIndex] = [event.lngLat.lng, event.lngLat.lat];
          if (editVertexIndex === 0) {
            points[points.length - 1] = [event.lngLat.lng, event.lngLat.lat];
          }
          if (editVertexIndex === points.length - 1) {
            points[0] = [event.lngLat.lng, event.lngLat.lat];
          }
          return {
            ...structure,
            geometry: {
              ...structure.geometry,
              coordinates: [points]
            }
          };
        })
      );
      setEditVertexIndex(null);
    }
  }

  async function handleSearch() {
    const matches = await geocodeAddress(query);
    setResults(matches);
  }

  function jumpTo(lng: number, lat: number, label: string) {
    setActiveCenter([lng, lat]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 19 });
    setQuery(label);
    setResults([]);
  }

  function beginFootprintEdit(structureId: string) {
    setSelectedStructureId(structureId);
    setIsEditingFootprint(true);
  }

  function persistInspection() {
    if (!supabase) {
      return;
    }

    void (async () => {
      const inspectionId = uid();
      await supabase.from("inspections").insert({
        id: inspectionId,
        address: query || "Unknown address",
        latitude: activeCenter[1],
        longitude: activeCenter[0],
        client_name: "",
        inspector_name: "",
        status: "draft"
      });

      if (structures.length > 0) {
        await supabase.from("structures").insert(
          structures.map((structure) => ({
            id: structure.id,
            inspection_id: inspectionId,
            name: structure.name,
            type: structure.type,
            geometry_geojson: structure.geometry
          }))
        );
      }

      if (findings.length > 0) {
        await supabase.from("findings").insert(
          findings.map((finding) => ({
            id: finding.id,
            inspection_id: inspectionId,
            structure_id: finding.structureId,
            category: finding.category,
            severity: finding.severity,
            recommendation: finding.recommendation,
            latitude: finding.lat,
            longitude: finding.lng,
            notes: finding.notes
          }))
        );
      }
    })();
  }

  async function uploadPhoto(file: File, findingId: string) {
    if (!supabase) {
      return;
    }

    const path = `${findingId}/${Date.now()}-${file.name}`;
    await supabase.storage.from("finding-photos").upload(path, file);
    const {
      data: { publicUrl }
    } = supabase.storage.from("finding-photos").getPublicUrl(path);

    setFindings((existing) =>
      existing.map((finding) =>
        finding.id === findingId ? { ...finding, photos: [...finding.photos, publicUrl] } : finding
      )
    );
  }

  function exportPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("TermiteSight WDO Inspection Report", 14, 18);
    pdf.setFontSize(12);
    pdf.text(`Address: ${query || "Not set"}`, 14, 30);
    pdf.text(`Structures: ${structures.length}`, 14, 38);
    pdf.text(`Findings: ${findings.length}`, 14, 46);

    let y = 58;
    findings.forEach((finding, index) => {
      pdf.text(`${index + 1}. ${finding.category} (${finding.severity})`, 14, y);
      y += 8;
      pdf.text(`Recommendation: ${finding.recommendation}`, 18, y);
      y += 8;
      pdf.text(`Notes: ${finding.notes || "n/a"}`, 18, y);
      y += 10;
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }
    });

    pdf.save("wdo-report.pdf");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-900">
      <header className="space-y-3 border-b border-zinc-800 p-4">
        <h1 className="text-xl font-semibold">TermiteSight</h1>
        <div className="flex gap-2">
          <input
            className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm"
            placeholder="Search property address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="h-12 rounded-xl bg-brand-600 px-4 text-sm font-semibold"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2">
            {results.map((result) => (
              <button
                key={`${result.lng}-${result.lat}`}
                className="w-full rounded-lg bg-zinc-800 p-2 text-left text-sm"
                onClick={() => jumpTo(result.lng, result.lat, result.label)}
              >
                {result.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="relative flex-1">
        {!mapboxToken ? (
          <div className="p-4 text-sm text-red-300">
            Map unavailable. Set NEXT_PUBLIC_MAPBOX_TOKEN.
          </div>
        ) : (
          <div className="h-[56vh] w-full" ref={mapElRef} />
        )}

        <div className="absolute bottom-3 left-2 right-2 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900/95 p-2 shadow-xl">
          <button className="h-12 rounded-xl bg-zinc-800 text-sm" onClick={() => setMode("structure")}>
            Add Structure
          </button>
          <button className="h-12 rounded-xl bg-zinc-800 text-sm" onClick={() => setMode("finding")}>
            Add Finding
          </button>
          <button className="h-12 rounded-xl bg-zinc-800 text-sm" onClick={persistInspection}>
            Save Draft
          </button>
          <button className="h-12 rounded-xl bg-brand-600 text-sm font-semibold" onClick={exportPdf}>
            Export WDO PDF
          </button>
        </div>
      </div>

      <section className="space-y-2 border-t border-zinc-800 p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Structures</h2>
        <div className="max-h-32 space-y-2 overflow-y-auto">
          {structures.map((structure) => {
            const [centerLng, centerLat] = polygonCenter(structure.geometry);
            return (
              <div
                className={`rounded-xl border p-2 ${selectedStructureId === structure.id ? "border-brand-500" : "border-zinc-700"}`}
                key={structure.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm"
                    value={structure.name}
                    onChange={(event) =>
                      setStructures((existing) =>
                        existing.map((item) =>
                          item.id === structure.id ? { ...item, name: event.target.value } : item
                        )
                      )
                    }
                  />
                  <button
                    className="h-10 rounded-lg bg-zinc-800 px-3 text-xs"
                    onClick={() => beginFootprintEdit(structure.id)}
                  >
                    Edit
                  </button>
                </div>
                {isEditingFootprint && selectedStructureId === structure.id && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {structure.geometry.coordinates[0].map((_, index) => (
                      <button
                        key={index}
                        className={`h-9 min-w-10 rounded-lg px-2 text-xs ${editVertexIndex === index ? "bg-brand-600" : "bg-zinc-800"}`}
                        onClick={() => setEditVertexIndex(index)}
                      >
                        V{index + 1}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="mt-2 h-9 rounded-lg bg-zinc-800 px-3 text-xs"
                  onClick={() => mapRef.current?.flyTo({ center: [centerLng, centerLat], zoom: 20 })}
                >
                  Focus
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {selectedFinding && (
        <aside className="space-y-3 border-t border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-base font-semibold">Finding Details</h3>
          <select
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm"
            value={selectedFinding.category}
            onChange={(event) =>
              setFindings((existing) =>
                existing.map((finding) =>
                  finding.id === selectedFinding.id
                    ? { ...finding, category: event.target.value as FindingCategory }
                    : finding
                )
              )
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-20 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            placeholder="Notes"
            value={selectedFinding.notes}
            onChange={(event) =>
              setFindings((existing) =>
                existing.map((finding) =>
                  finding.id === selectedFinding.id ? { ...finding, notes: event.target.value } : finding
                )
              )
            }
          />
          <input
            className="block w-full text-sm"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadPhoto(file, selectedFinding.id);
              }
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            {selectedFinding.photos.map((photo) => (
              <a
                key={photo}
                href={photo}
                target="_blank"
                className="truncate rounded bg-zinc-800 p-2 text-xs"
                rel="noreferrer"
              >
                Photo
              </a>
            ))}
          </div>
        </aside>
      )}
    </main>
  );
}

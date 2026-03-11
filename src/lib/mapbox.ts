export const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(query: string) {
  if (!mapboxToken || !query.trim()) {
    return [];
  }

  const endpoint = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  endpoint.searchParams.set("access_token", mapboxToken);
  endpoint.searchParams.set("country", "US");
  endpoint.searchParams.set("autocomplete", "true");
  endpoint.searchParams.set("limit", "5");

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    features: Array<{ place_name: string; center: [number, number] }>;
  };

  return data.features.map((feature) => ({
    label: feature.place_name,
    lng: feature.center[0],
    lat: feature.center[1]
  }));
}

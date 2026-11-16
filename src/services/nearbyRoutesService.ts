import { CyclingRoute } from '../types';
import { calculateDynamicRouteDifficulty } from '../data/cyclingRoutes';

export interface NearbyRoutesResponse {
  ok: boolean;
  source: 'google_maps' | 'openstreetmap';
  betaNotice?: string;
  routes: CyclingRoute[];
}

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
}

const clientCache = new Map<string, { data: NearbyRoutesResponse; expiresAt: number }>();

export function computeHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Number((2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(1));
}

export async function fetchNearbyRealRoutes(
  lat: number,
  lng: number,
  options: { targetDistanceKm?: number; difficulty?: 'all' | 'Kolay' | 'Orta' | 'Zor'; radiusKm?: number } | number = 18
): Promise<NearbyRoutesResponse> {
  const opts = typeof options === 'number' ? { radiusKm: options } : options;
  const targetDistanceKm = opts.targetDistanceKm ?? 25;
  const difficulty = opts.difficulty ?? 'all';
  const radiusKm = opts.radiusKm ?? Math.min(45, Math.max(5, Math.round(targetDistanceKm / 2.05)));

  const key = `${lat.toFixed(2)}_${lng.toFixed(2)}_${radiusKm}_${targetDistanceKm}_${difficulty}`;
  const hit = clientCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data;
  }

  const resp = await fetch('/api/routes/nearby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, radiusKm, targetDistanceKm, difficulty }),
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.error || `Yakın rotalar alınamadı (HTTP ${resp.status})`);
  }

  const json = await resp.json();
  const routes: CyclingRoute[] = (Array.isArray(json.routes) ? json.routes : []).map((r: CyclingRoute) => ({
    ...r,
    calculatedDifficulty: calculateDynamicRouteDifficulty({
      distanceKm: r.distanceKm,
      climbM: r.climbM,
      maxGradientPct: r.maxGradientPct,
      avgGradientPct: r.avgGradientPct,
      surface: r.surface,
    }),
  }));

  const normalized: NearbyRoutesResponse = {
    ok: true,
    source: json.source === 'google_maps' ? 'google_maps' : 'openstreetmap',
    betaNotice: json.betaNotice,
    routes,
  };

  if (routes.length > 0) {
    clientCache.set(key, { data: normalized, expiresAt: Date.now() + 5 * 60 * 1000 });
  }

  return normalized;
}

export async function geocodeLocationQuery(query: string): Promise<GeocodedLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const resp = await fetch(`/api/routes/geocode?q=${encodeURIComponent(trimmed)}`);
  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.error || 'Konum arama başarısız oldu.');
  }
  const json = await resp.json();
  return Array.isArray(json.results) ? json.results : [];
}

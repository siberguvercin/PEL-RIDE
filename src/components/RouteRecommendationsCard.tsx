import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Wind,
  ChevronRight,
  Navigation,
  FolderPlus,
  Folder,
  Star,
  LocateFixed,
  Search,
  Loader2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { CyclingRoute, LatLng, RouteCollection } from '../types';
import {
  CYCLING_ROUTES,
  getRouteOfTheDay,
  filterCyclingRoutes,
  calculateRouteWindScore,
  calculateDynamicRouteDifficulty
} from '../data/cyclingRoutes';
import { routeCollectionService } from '../services/routeCollectionService';
import {
  fetchNearbyRealRoutes,
  geocodeLocationQuery,
  computeHaversineKm
} from '../services/nearbyRoutesService';

interface RouteRecommendationsCardProps {
  currentLocation?: LatLng | null;
  currentWindDeg?: number;
  onRequestLocation?: () => void;
  onSelectRouteOnMap: (route: CyclingRoute) => void;
  onStartRideWithRoute: (route: CyclingRoute) => void;
  onInspectRoute: (route: CyclingRoute) => void;
  onGoToAllRoutesMap: () => void;
  onOpenCollections?: () => void;
  onManageRouteCollections?: (route: CyclingRoute) => void;
}

export const RouteRecommendationsCard: React.FC<RouteRecommendationsCardProps> = ({
  currentLocation,
  currentWindDeg = 45,
  onRequestLocation,
  onSelectRouteOnMap,
  onInspectRoute,
  onGoToAllRoutesMap,
  onOpenCollections,
  onManageRouteCollections
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('nearby');
  const [collections, setCollections] = useState<RouteCollection[]>(() =>
    routeCollectionService.getCollections()
  );
  const [nearbyRoutes, setNearbyRoutes] = useState<CyclingRoute[]>([]);
  const [nearbySource, setNearbySource] = useState<'google_maps' | 'openstreetmap' | null>(null);
  const [nearbyBetaNotice, setNearbyBetaNotice] = useState<string | undefined>(undefined);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [manualCenter, setManualCenter] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);

  useEffect(() => {
    const unsub = routeCollectionService.subscribe((cols) => {
      setCollections(cols);
    });
    return () => unsub();
  }, []);

  const activeOrigin = manualCenter
    ? { lat: manualCenter.lat, lng: manualCenter.lng }
    : currentLocation
    ? { lat: currentLocation.lat, lng: currentLocation.lng }
    : null;

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setIsLoadingNearby(true);
    setNearbyError(null);
    try {
      const res = await fetchNearbyRealRoutes(lat, lng, 18);
      setNearbyRoutes(res.routes);
      setNearbySource(res.source);
      setNearbyBetaNotice(res.betaNotice);
      if (res.routes.length === 0) {
        setNearbyError('Bu konum çevresinde bisiklet rotası bulunamadı. Farklı bir ilçe/şehir deneyebilirsiniz.');
      }
    } catch (err: any) {
      setNearbyError(err?.message || 'Yakındaki rotalar şu anda yüklenemedi.');
    } finally {
      setIsLoadingNearby(false);
    }
  }, []);

  useEffect(() => {
    if (activeOrigin) {
      loadNearby(activeOrigin.lat, activeOrigin.lng);
    }
  }, [activeOrigin?.lat.toFixed(2), activeOrigin?.lng.toFixed(2), loadNearby]);

  const handleRequestGps = () => {
    setManualCenter(null);
    if (onRequestLocation) {
      onRequestLocation();
    } else if (navigator.geolocation) {
      setIsLoadingNearby(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setManualCenter({ lat, lng, label: 'Mevcut GPS Konumunuz' });
          loadNearby(lat, lng);
        },
        (err) => {
          setIsLoadingNearby(false);
          setNearbyError(`GPS izni alınamadı (${err.message}). Aşağıdan şehir veya ilçe arayabilirsiniz.`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsSearchingLocation(true);
    setNearbyError(null);
    try {
      const hits = await geocodeLocationQuery(locationQuery);
      if (hits.length === 0) {
        setNearbyError('Girilen konum bulunamadı. Örnek: "Kadıköy, İstanbul" veya "Konak, İzmir".');
      } else {
        const first = hits[0];
        const shortLabel = first.name.split(',').slice(0, 2).join(', ');
        setManualCenter({ lat: first.lat, lng: first.lng, label: shortLabel });
        setSelectedFilter('nearby');
      }
    } catch (err: any) {
      setNearbyError(err?.message || 'Konum arama sırasında hata oluştu.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Enrich catalog routes with distance to user if location exists
  const enrichedCatalog = filterCyclingRoutes('', 'all', currentWindDeg).map((r) => ({
    ...r,
    source: 'catalog' as const,
    distanceFromUserKm: activeOrigin
      ? computeHaversineKm(activeOrigin.lat, activeOrigin.lng, r.startPoint.lat, r.startPoint.lng)
      : undefined,
  }));

  const enrichedNearby = nearbyRoutes.map((r) => ({
    ...r,
    windMatch: calculateRouteWindScore(r, currentWindDeg),
    calculatedDifficulty: r.calculatedDifficulty || calculateDynamicRouteDifficulty(r),
  }));

  const { route: catalogFeatured, windMatch: catalogWindMatch, reason: catalogReason } =
    getRouteOfTheDay(currentWindDeg);

  // Featured route prioritizes closest nearby real route when available
  const featuredRoute = enrichedNearby[0] || catalogFeatured;
  const featuredWindMatch = enrichedNearby[0]?.windMatch || catalogWindMatch;
  const featuredReason = enrichedNearby[0]
    ? `Konumunuzdan ${enrichedNearby[0].distanceFromUserKm ?? ''} km mesafede, gerçek yol geometrisi ve ölçülen irtifa ile oluşturuldu.`
    : catalogReason;

  // Compute filtered routes
  let filteredRoutes: Array<
    CyclingRoute & {
      windMatch: ReturnType<typeof calculateRouteWindScore>;
      calculatedDifficulty: NonNullable<CyclingRoute['calculatedDifficulty']>;
    }
  > = [];

  if (selectedFilter === 'nearby') {
    filteredRoutes = enrichedNearby;
  } else if (selectedFilter.startsWith('col:')) {
    const targetColId = selectedFilter.replace('col:', '');
    const targetCol = collections.find((c) => c.id === targetColId);
    const colRouteIds = targetCol?.routeIds || [];
    const pool = [...enrichedNearby, ...enrichedCatalog];
    const seen = new Set<string>();
    filteredRoutes = pool.filter((r) => {
      if (!colRouteIds.includes(r.id) || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  } else if (selectedFilter === 'wind') {
    const pool = enrichedNearby.length > 0 ? [...enrichedNearby, ...enrichedCatalog] : enrichedCatalog;
    filteredRoutes = pool.sort((a, b) => b.windMatch.score - a.windMatch.score);
  } else if (selectedFilter === 'all') {
    filteredRoutes = [...enrichedNearby, ...enrichedCatalog].sort((a, b) => {
      if (a.distanceFromUserKm != null && b.distanceFromUserKm != null) {
        return a.distanceFromUserKm - b.distanceFromUserKm;
      }
      return 0;
    });
  } else {
    const pool = [...enrichedNearby, ...filterCyclingRoutes('', selectedFilter as 'flat' | 'climb' | 'gravel', currentWindDeg)];
    filteredRoutes = pool.filter((r) => {
      if (selectedFilter === 'flat') return r.category === 'Coastal' || (r.category === 'Road' && r.climbM < 250);
      if (selectedFilter === 'climb') return r.category === 'Climb' || r.climbM >= 300;
      if (selectedFilter === 'gravel') return r.category === 'Gravel' || r.category === 'MTB';
      return true;
    });
  }

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#FC4C02] flex items-center justify-center shrink-0 border border-[#E2E4E9]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[#18181B]">
                Rota Önerileri &amp; Yakınımdaki Parkurlar
              </h2>
              <span className="text-xs font-mono text-[#71717A]">
                · {enrichedNearby.length > 0 ? `${enrichedNearby.length} yakın` : `${CYCLING_ROUTES.length} katalog`}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              {manualCenter
                ? `${manualCenter.label} çevresindeki gerçek bisiklet güzergahları`
                : currentLocation
                ? `GPS konumunuza (${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}) göre gerçek yollar`
                : 'Konum izni verin veya ilçe/şehir arayarak yakınınızdaki gerçek rotaları çıkarın'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCollections && (
            <button
              onClick={onOpenCollections}
              className="h-8 px-3 rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Koleksiyonlarımı Yönet"
            >
              <Folder className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Koleksiyonlar ({collections.length})</span>
            </button>
          )}
          <button
            onClick={onGoToAllRoutesMap}
            className="h-8 px-3 rounded-lg bg-white hover:bg-[#F8F9FA] border border-[#E2E4E9] text-xs font-semibold text-[#FC4C02] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Haritada Gör</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Location Discovery Bar (GPS + City/District Search) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={handleRequestGps}
          disabled={isLoadingNearby}
          className="h-9 px-3 rounded-lg bg-[#18181B] hover:bg-[#27272A] disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          {isLoadingNearby ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FC4C02]" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-[#FC4C02]" />
          )}
          <span>{currentLocation ? 'Konumu Yenile' : 'Konumuma Göre Bul'}</span>
        </button>

        <form onSubmit={handleLocationSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="İlçe veya şehir ara (örn. Kadıköy, Bostanlı, Çankaya)..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] focus:border-[#FC4C02] text-xs text-[#18181B] placeholder:text-[#71717A] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingLocation || !locationQuery.trim()}
            className="h-9 px-3.5 rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] disabled:opacity-50 border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition cursor-pointer whitespace-nowrap"
          >
            {isSearchingLocation ? 'Aranıyor...' : 'Bölge Seç'}
          </button>
        </form>
      </div>

      {/* Beta notice if Google Maps BICYCLE routes are used */}
      {nearbySource === 'google_maps' && nearbyBetaNotice && (
        <div className="px-3 py-2 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] text-[11px] text-[#52525B] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          <span>{nearbyBetaNotice}</span>
        </div>
      )}

      {/* Featured Highlight Card */}
      <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#FC4C02]">
            <Navigation className="w-3.5 h-3.5" />
            <span>{enrichedNearby.length > 0 ? 'Size En Yakın Önerilen Parkur' : 'Günün Rota Önerisi'}</span>
          </span>
          <div className="flex items-center gap-2 text-[11px] text-[#52525B] font-mono">
            {featuredRoute.distanceFromUserKm != null && (
              <span>{featuredRoute.distanceFromUserKm} km uzakta ·</span>
            )}
            {featuredRoute.calculatedDifficulty && (
              <span>
                {featuredRoute.calculatedDifficulty.level} (%{featuredRoute.calculatedDifficulty.score}) ·
              </span>
            )}
            <span className="font-semibold text-[#18181B]">
              %{featuredWindMatch.score} {featuredWindMatch.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#18181B] leading-tight">
              {featuredRoute.name}
            </h3>
            <p className="text-xs text-[#52525B] max-w-xl">{featuredReason}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onInspectRoute(featuredRoute)}
              className="h-9 px-3.5 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition cursor-pointer whitespace-nowrap"
            >
              Profil Analizi
            </button>
            <button
              onClick={() => onSelectRouteOnMap(featuredRoute)}
              className="h-9 px-4 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Rotayı Yükle</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-[#E2E4E9] mt-3.5 pt-3 border-t border-[#E2E4E9] text-center">
          <div className="px-2">
            <span className="text-[11px] text-[#71717A] block">Mesafe</span>
            <span className="text-sm font-bold font-mono text-[#18181B]">
              {featuredRoute.distanceKm} km
            </span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-[#71717A] block">Tırmanış</span>
            <span className="text-sm font-bold font-mono text-[#FC4C02]">
              +{featuredRoute.climbM} m
            </span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-[#71717A] block">Süre</span>
            <span className="text-sm font-bold font-mono text-[#18181B]">
              ~{featuredRoute.estimatedTimeMin} dk
            </span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-[#71717A] block">Kategori</span>
            <span className="text-xs font-semibold text-[#18181B] truncate block mt-0.5">
              {featuredRoute.category}
            </span>
          </div>
        </div>
      </div>

      {/* Category & Collection Segmented Filter Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('nearby')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedFilter === 'nearby'
              ? 'bg-[#18181B] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
          <span>Yakınımdaki ({enrichedNearby.length})</span>
        </button>

        <button
          onClick={() => setSelectedFilter('wind')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedFilter === 'wind'
              ? 'bg-[#FC4C02] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Rüzgara Uygun</span>
        </button>

        <button
          onClick={() => setSelectedFilter('all')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-[#FC4C02] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          Tümü ({enrichedNearby.length + CYCLING_ROUTES.length})
        </button>

        {collections.map((col) => {
          const isSelected = selectedFilter === `col:${col.id}`;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedFilter(isSelected ? 'nearby' : `col:${col.id}`)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#FC4C02] text-white'
                  : 'bg-[#F8F9FA] text-[#18181B] border border-[#E2E4E9] hover:border-[#D0D5DD]'
              }`}
            >
              <span>{col.name}</span>
              <span className="font-mono text-[11px] opacity-75">{col.routeIds.length}</span>
            </button>
          );
        })}

        <button
          onClick={() => setSelectedFilter('flat')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            selectedFilter === 'flat'
              ? 'bg-[#FC4C02] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          Hız &amp; Düzlük
        </button>

        <button
          onClick={() => setSelectedFilter('climb')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            selectedFilter === 'climb'
              ? 'bg-[#FC4C02] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          Tırmanış &amp; KOM
        </button>

        <button
          onClick={() => setSelectedFilter('gravel')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            selectedFilter === 'gravel'
              ? 'bg-[#FC4C02] text-white'
              : 'bg-[#F8F9FA] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
          }`}
        >
          Gravel &amp; Doğa
        </button>
      </div>

      {/* Nearby Loading / Prompt / Empty States */}
      {selectedFilter === 'nearby' && isLoadingNearby && (
        <div className="p-8 text-center bg-[#F8F9FA] rounded-xl border border-[#E2E4E9] space-y-2">
          <Loader2 className="w-6 h-6 text-[#FC4C02] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#18181B]">
            Çevrenizdeki gerçek bisiklet yolları ve yükselti profilleri hesaplanıyor...
          </p>
        </div>
      )}

      {selectedFilter === 'nearby' && !isLoadingNearby && filteredRoutes.length === 0 && (
        <div className="p-6 text-center bg-[#F8F9FA] rounded-xl border border-dashed border-[#D0D5DD] space-y-3">
          <LocateFixed className="w-6 h-6 text-[#FC4C02] mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#18181B]">
              {nearbyError || 'Konumunuza Yakın Gerçek Rotaları Çıkarın'}
            </h4>
            <p className="text-xs text-[#71717A] max-w-md mx-auto">
              Tarayıcı konum izni verin veya yukarıdaki arama kutusuna bulunduğunuz ilçe/şehri yazın; etrafınızdaki parklar, sahil hatları ve gerçek yollar üzerinden bisiklet rotaları hesaplansın.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRequestGps}
              className="h-8 px-3.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-semibold cursor-pointer"
            >
              GPS Konumunu Kullan
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className="h-8 px-3.5 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] cursor-pointer"
            >
              Katalog Rotalarını Göster
            </button>
          </div>
        </div>
      )}

      {/* Non-nearby empty state */}
      {selectedFilter !== 'nearby' && filteredRoutes.length === 0 && (
        <div className="p-6 text-center bg-[#F8F9FA] rounded-xl border border-dashed border-[#D0D5DD] space-y-2">
          <Folder className="w-6 h-6 text-[#71717A] mx-auto" />
          <h4 className="text-xs font-bold text-[#18181B]">Bu Kategoride Henüz Rota Yok</h4>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            Rota kartlarındaki yıldız veya klasör simgesine dokunarak bu koleksiyona rota ekleyebilirsiniz.
          </p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="mt-1 h-8 px-3.5 rounded-lg bg-[#FC4C02] text-white text-xs font-semibold cursor-pointer"
          >
            Tüm Rotaları Göster
          </button>
        </div>
      )}

      {/* Route Cards Grid */}
      {filteredRoutes.length > 0 && !(selectedFilter === 'nearby' && isLoadingNearby) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRoutes.map((route) => {
            const isFav = routeCollectionService.isFavorite(route.id);

            return (
              <div
                key={route.id}
                onClick={() => onInspectRoute(route)}
                className="p-3.5 rounded-xl bg-white hover:bg-[#FAFAFB] border border-[#E2E4E9] hover:border-[#FC4C02]/60 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Unboxed Typographic Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#71717A] truncate">
                      <span className="font-semibold text-[#FC4C02]">{route.category}</span>
                      <span>·</span>
                      <span>
                        {route.calculatedDifficulty.level} (%{route.calculatedDifficulty.score})
                      </span>
                      {route.distanceFromUserKm != null && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[#18181B]">{route.distanceFromUserKm} km uzakta</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-mono font-semibold text-[#52525B]">
                        %{route.windMatch.score} Rüzgar
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          routeCollectionService.toggleFavorite(route.id);
                        }}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isFav
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-[#71717A] hover:text-amber-500 hover:bg-[#F4F5F7]'
                        }`}
                        title={isFav ? 'Favorilerimden Çıkar' : 'Favorilerime Ekle'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {onManageRouteCollections && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onManageRouteCollections(route);
                          }}
                          className="p-1 text-[#71717A] hover:text-[#FC4C02] hover:bg-[#F4F5F7] rounded-md transition cursor-pointer"
                          title="Koleksiyonlara Ekle / Çıkar"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-bold text-[#18181B] group-hover:text-[#FC4C02] transition line-clamp-1">
                    {route.name}
                  </h4>
                  <p className="text-xs text-[#71717A] line-clamp-2 mt-1 leading-relaxed">
                    {route.description}
                  </p>
                </div>

                {/* Bottom Metrics & Actions */}
                <div className="mt-3 pt-2.5 border-t border-[#ECEEF2] flex items-center justify-between gap-2">
                  <div className="flex items-center divide-x divide-[#ECEEF2] text-xs">
                    <div className="pr-3">
                      <span className="text-[#71717A] text-[10px] block">Mesafe</span>
                      <strong className="text-[#18181B] font-mono">{route.distanceKm} km</strong>
                    </div>
                    <div className="px-3">
                      <span className="text-[#71717A] text-[10px] block">Tırmanış</span>
                      <strong className="text-[#FC4C02] font-mono">+{route.climbM} m</strong>
                    </div>
                    <div className="pl-3">
                      <span className="text-[#71717A] text-[10px] block">Süre</span>
                      <strong className="text-[#18181B] font-mono">~{route.estimatedTimeMin} dk</strong>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRouteOnMap(route);
                    }}
                    className="h-8 px-3 rounded-lg bg-[#F8F9FA] hover:bg-[#FC4C02] text-[#18181B] hover:text-white border border-[#E2E4E9] hover:border-[#FC4C02] text-xs font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title="Haritada İncele"
                  >
                    <Navigation className="w-3 h-3" />
                    <span className="hidden sm:inline">Harita</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

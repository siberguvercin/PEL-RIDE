import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import {
  Compass,
  Navigation as NavIcon,
  Plus,
  Trash2,
  Upload,
  MapPin,
  TrendingUp,
  Search,
  Bike,
  Zap,
  Wind,
  Thermometer,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Snowflake,
  ArrowUp,
  RefreshCw,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Shirt,
  Eye,
  Route,
  Layers,
  ChevronRight,
  Download,
  Trophy,
  Crown,
  Globe,
  FolderPlus,
  Folder,
  Star,
  Bookmark,
  LocateFixed,
  Info,
  X,
  SkipForward,
  SlidersHorizontal
} from 'lucide-react';
import { LatLng, TrailSpot, ActiveRider, CyclingRoute, SavedRide, RouteCollection } from '../types';
import {
  WeatherData,
  fetchLocalWeather,
  fetchBatchWeather,
  getWindCardinalDirection
} from '../services/weatherService';
import { apiKeyService } from '../services/apiKeyService';
import {
  CYCLING_ROUTES,
  filterCyclingRoutes,
  calculateRouteWindScore,
  calculateDynamicRouteDifficulty
} from '../data/cyclingRoutes';
import {
  fetchNearbyRealRoutes,
  geocodeLocationQuery,
  computeHaversineKm
} from '../services/nearbyRoutesService';
import { routeCollectionService } from '../services/routeCollectionService';
import { RouteDetailModal } from './RouteDetailModal';
import { RankedProgressionCard } from './RankedProgressionCard';

const INITIAL_CENTER = { lat: 41.0082, lng: 28.9784 }; // Istanbul center

// Popular curated trails for map markers
const CURATED_TRAILS: TrailSpot[] = [
  {
    id: 'trail-belgrad',
    name: 'Belgrad Ormanı Neşetsuyu Gravel Parkuru',
    category: 'Gravel',
    distanceKm: 28.4,
    climbM: 420,
    difficulty: 'Orta',
    lat: 41.178,
    lng: 28.986,
    description: 'Doğal toprak zemin, gölet kıyıları ve akıcı orman inişleri.',
    routeId: 'route-belgrad-gravel'
  },
  {
    id: 'trail-cadde',
    name: 'Caddebostan - Pendik Sahil Yolu',
    category: 'Coastal',
    distanceKm: 42.5,
    climbM: 65,
    difficulty: 'Kolay',
    lat: 40.962,
    lng: 29.065,
    description: 'Düz asfalt, kesintisiz Marmara Denizi manzarası ve peloton temposu.',
    routeId: 'route-cadde-tuzla'
  },
  {
    id: 'trail-polonez',
    name: 'Polonezköy - Riva Vadisi Karadeniz KOM Döngüsü',
    category: 'Climb',
    distanceKm: 38.0,
    climbM: 680,
    difficulty: 'Zor',
    lat: 41.114,
    lng: 29.208,
    description: 'Teknik virajlar, vadi rampaları ve Karadeniz kıyı tırmanışı.',
    routeId: 'route-polonez-riva'
  },
  {
    id: 'trail-eymir',
    name: 'Ankara Eymir & Mogan Gölleri Doğal Gravel Parkuru',
    category: 'Gravel',
    distanceKm: 34.6,
    climbM: 340,
    difficulty: 'Orta',
    lat: 39.825,
    lng: 32.831,
    description: 'Trafikten izole göl kenarı asfaltı ve doğal toprak patikalar.',
    routeId: 'route-eymir-mogan'
  },
  {
    id: 'trail-urla',
    name: 'İzmir Urla Bağ Yolu & Çeşmealtı Gran Fondo Parkuru',
    category: 'Road',
    distanceKm: 52.0,
    climbM: 620,
    difficulty: 'Orta',
    lat: 38.358,
    lng: 26.772,
    description: 'Zeytinlikler arasında tırmanış ve Ege rüzgarıyla buluşma.',
    routeId: 'route-urla-cesmealti'
  },
  {
    id: 'trail-uludag',
    name: 'Bursa Çekirge - Uludağ Zirve (HC Tırmanış)',
    category: 'Climb',
    distanceKm: 31.8,
    climbM: 1720,
    difficulty: 'Epik',
    lat: 40.198,
    lng: 29.028,
    description: '1720 metre dikey irtifa kazanımlı efsanevi HC dağ zirvesi tırmanışı.',
    routeId: 'route-uludag-hc'
  }
];

// Helper to calculate distance along polyline
function calculateDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const lat1 = points[i - 1].lat;
    const lon1 = points[i - 1].lng;
    const lat2 = points[i].lat;
    const lon2 = points[i].lng;
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return total;
}

// Polyline Manager Subcomponent with Athletic Orange (#FC4C02)
function MapPolylineLayer({
  points,
  color = '#FC4C02',
  weight = 5
}: {
  points: LatLng[];
  color?: string;
  weight?: number;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (points.length >= 2) {
      const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: weight,
        map,
      });

      if (points.length > 3) {
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 220, left: 60 });
      }
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, points, color, weight]);

  return null;
}

// Weather Icon component based on iconType
function WeatherIconDisplay({
  iconType,
  className = 'w-4 h-4'
}: {
  iconType: WeatherData['iconType'];
  className?: string;
}) {
  switch (iconType) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-500`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-400`} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-500`} />;
    case 'cloud-lightning':
      return <CloudLightning className={`${className} text-purple-600`} />;
    case 'snow':
      return <Snowflake className={`${className} text-cyan-400`} />;
    case 'fog':
      return <Cloud className={`${className} text-slate-300`} />;
    default:
      return <Sun className={`${className} text-amber-500`} />;
  }
}

interface GoogleMapViewProps {
  currentLocation: LatLng | null;
  activeRiders: ActiveRider[];
  selectedPreloadedRoute?: CyclingRoute | null;
  savedRides?: SavedRide[];
  ftpWatts?: number;
  onOpenLeaderboard?: () => void;
  onSelectTrail?: (trail: TrailSpot) => void;
  onSelectRoute?: (route: CyclingRoute) => void;
  onSelectRiderByName?: (riderName: string) => void;
  onOpenSegments?: () => void;
  onOpenCollections?: () => void;
  onManageRouteCollections?: (route: CyclingRoute) => void;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  currentLocation,
  activeRiders,
  selectedPreloadedRoute,
  savedRides = [],
  ftpWatts = 245,
  onOpenLeaderboard,
  onSelectTrail,
  onSelectRoute,
  onSelectRiderByName,
  onOpenSegments,
  onOpenCollections,
  onManageRouteCollections
}) => {
  const map = useMap();
  const [mapType, setMapType] = useState<google.maps.MapTypeId | 'terrain'>('terrain');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<LatLng[]>([]);
  const [activeLoadedRoute, setActiveLoadedRoute] = useState<CyclingRoute | null>(null);
  const [trails] = useState<TrailSpot[]>(CURATED_TRAILS);
  const [selectedTrail, setSelectedTrail] = useState<TrailSpot | null>(null);
  const [isFollowingRider, setIsFollowingRider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real nearby routes & Route Suggestion module state
  const [nearbyRoutes, setNearbyRoutes] = useState<CyclingRoute[]>([]);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number } | null>(currentLocation);
  const [nearbyCenterLabel, setNearbyCenterLabel] = useState<string>('');
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const lastFetchedCenterRef = useRef<string>('');

  // Rota Önerisi selector state
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<'all' | 'Kolay' | 'Orta' | 'Zor'>('all');
  const [suggestedDistanceKm, setSuggestedDistanceKm] = useState<number>(25);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState<boolean>(true);
  const [skippedRouteIds, setSkippedRouteIds] = useState<string[]>([]);
  const [skipCount, setSkipCount] = useState<number>(0);

  // Collections state
  const [collections, setCollections] = useState<RouteCollection[]>(() =>
    routeCollectionService.getCollections()
  );

  useEffect(() => {
    const unsub = routeCollectionService.subscribe((cols) => {
      setCollections(cols);
    });
    return () => unsub();
  }, []);

  // Floating On-Map Route Explorer Carousel State
  const [isRouteCarouselExpanded, setIsRouteCarouselExpanded] = useState<boolean>(true);
  const [routeCategoryFilter, setRouteCategoryFilter] = useState<string>('nearby');
  const [inspectedRouteModal, setInspectedRouteModal] = useState<CyclingRoute | null>(null);

  // Weather & Wind Overlay States
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [weatherLayerMode, setWeatherLayerMode] = useState<'all' | 'wind' | 'temp'>('all');
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});
  const [activeWeatherSpot, setActiveWeatherSpot] = useState<WeatherData | null>(null);
  const [isWeatherRadarOpen, setIsWeatherRadarOpen] = useState<boolean>(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [simulatedHeadingDeg, setSimulatedHeadingDeg] = useState<number>(90);

  const loadNearbyRoutes = async (
    lat: number,
    lng: number,
    label = 'Konumunuz',
    opts?: {
      targetDistanceKm?: number;
      difficulty?: 'all' | 'Kolay' | 'Orta' | 'Zor';
      forceRefresh?: boolean;
    }
  ) => {
    const dist = opts?.targetDistanceKm ?? suggestedDistanceKm;
    const diff = opts?.difficulty ?? suggestedDifficulty;
    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${dist},${diff}`;
    if (!opts?.forceRefresh && key === lastFetchedCenterRef.current && nearbyRoutes.length > 0) return;
    lastFetchedCenterRef.current = key;
    setIsLoadingNearby(true);
    setNearbyError(null);
    setNearbyCenter({ lat, lng });
    setNearbyCenterLabel(label);
    try {
      const res = await fetchNearbyRealRoutes(lat, lng, {
        targetDistanceKm: dist,
        difficulty: diff,
      });
      setNearbyRoutes(res.routes);
      setSkippedRouteIds([]);
      if (res.routes.length > 0 && (opts?.forceRefresh || (!activeLoadedRoute && !selectedPreloadedRoute))) {
        loadRouteOntoMap(res.routes[0]);
      }
    } catch (err: any) {
      setNearbyError(err?.message || 'Yakındaki rotalar yüklenemedi.');
    } finally {
      setIsLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      loadNearbyRoutes(currentLocation.lat, currentLocation.lng, 'GPS Konumunuz');
    }
  }, [currentLocation?.lat, currentLocation?.lng]);

  const handleRequestSuggestion = () => {
    const target = nearbyCenter || currentLocation;
    if (target) {
      loadNearbyRoutes(target.lat, target.lng, nearbyCenterLabel || 'GPS Konumunuz', {
        targetDistanceKm: suggestedDistanceKm,
        difficulty: suggestedDifficulty,
        forceRefresh: true,
      });
      setRouteCategoryFilter('nearby');
      return;
    }
    if (navigator.geolocation) {
      setIsLoadingNearby(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (map) {
            map.panTo(loc);
            map.setZoom(13);
          }
          loadNearbyRoutes(loc.lat, loc.lng, 'GPS Konumunuz', {
            targetDistanceKm: suggestedDistanceKm,
            difficulty: suggestedDifficulty,
            forceRefresh: true,
          });
          setRouteCategoryFilter('nearby');
        },
        () => {
          loadNearbyRoutes(INITIAL_CENTER.lat, INITIAL_CENTER.lng, 'İstanbul Merkez', {
            targetDistanceKm: suggestedDistanceKm,
            difficulty: suggestedDifficulty,
            forceRefresh: true,
          });
          setRouteCategoryFilter('nearby');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      loadNearbyRoutes(INITIAL_CENTER.lat, INITIAL_CENTER.lng, 'İstanbul Merkez', {
        targetDistanceKm: suggestedDistanceKm,
        difficulty: suggestedDifficulty,
        forceRefresh: true,
      });
      setRouteCategoryFilter('nearby');
    }
  };

  const handleSearchAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = areaSearchInput.trim();
    if (!q) return;
    setIsLoadingNearby(true);
    setNearbyError(null);
    try {
      const results = await geocodeLocationQuery(q);
      const geo = results[0];
      if (!geo) {
        setNearbyError('Aranan bölge bulunamadı.');
        setIsLoadingNearby(false);
        return;
      }
      if (map) {
        map.panTo({ lat: geo.lat, lng: geo.lng });
        map.setZoom(13);
      }
      lastFetchedCenterRef.current = '';
      await loadNearbyRoutes(geo.lat, geo.lng, geo.name.split(',')[0] || q, {
        forceRefresh: true,
      });
      setRouteCategoryFilter('nearby');
    } catch (err: any) {
      setNearbyError(err?.message || 'Bölge araması başarısız oldu.');
      setIsLoadingNearby(false);
    }
  };

  // React to incoming preloaded route (e.g. from HomeView recommendations)
  useEffect(() => {
    if (selectedPreloadedRoute) {
      loadRouteOntoMap(selectedPreloadedRoute);
    }
  }, [selectedPreloadedRoute]);

  const loadRouteOntoMap = (route: CyclingRoute) => {
    const routeWithDiff = {
      ...route,
      calculatedDifficulty: route.calculatedDifficulty || calculateDynamicRouteDifficulty(route)
    };
    setActiveLoadedRoute(routeWithDiff);
    setPlannedRoute(route.waypoints);
    setGpxFileName(`${route.name} (${route.distanceKm}km)`);
    setIsPlanning(false);

    if (map && route.waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      route.waypoints.forEach((p) => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 240, left: 60 });
    }
  };

  // Load weather for all key hotspots
  const refreshWeatherData = async () => {
    setIsLoadingWeather(true);
    try {
      const pointsToFetch = trails.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng }));
      if (currentLocation) {
        pointsToFetch.push({ id: 'user-loc', lat: currentLocation.lat, lng: currentLocation.lng });
      } else {
        pointsToFetch.push({ id: 'center-loc', lat: INITIAL_CENTER.lat, lng: INITIAL_CENTER.lng });
      }

      const results = await fetchBatchWeather(pointsToFetch);
      setWeatherMap(results);

      // Default active spot to user location or center
      const defaultSpot = results['user-loc'] || results['center-loc'] || Object.values(results)[0];
      if (defaultSpot && !activeWeatherSpot) {
        setActiveWeatherSpot(defaultSpot);
      }
    } catch (err) {
      console.error('Weather update error:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    refreshWeatherData();
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation && isFollowingRider && map) {
      map.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation, isFollowingRider, map]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (map) {
            map.panTo(loc);
            map.setZoom(14);
          }
          setIsFollowingRider(true);
          lastFetchedCenterRef.current = '';
          loadNearbyRoutes(loc.lat, loc.lng, 'GPS Konumunuz');
        },
        (err) => {
          setMapNotice('GPS konumu alınamadı: ' + err.message);
          setTimeout(() => setMapNotice(null), 4000);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (!isPlanning || !e.detail.latLng) return;
    const newPoint: LatLng = {
      lat: e.detail.latLng.lat,
      lng: e.detail.latLng.lng,
    };
    setPlannedRoute((prev) => [...prev, newPoint]);
  };

  const handleGpxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGpxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const trkpts = Array.from(xml.querySelectorAll('trkpt, rtept, wpt'));

        const points: LatLng[] = trkpts
          .map((el) => {
            const lat = parseFloat(el.getAttribute('lat') || '');
            const lng = parseFloat(el.getAttribute('lon') || '');
            const eleEl = el.querySelector('ele');
            const alt = eleEl ? parseFloat(eleEl.textContent || '0') : 0;
            return { lat, lng, alt };
          })
          .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

        if (points.length < 2) {
          setMapNotice('GPX dosyasında geçerli rota noktası bulunamadı.');
          setTimeout(() => setMapNotice(null), 4000);
          return;
        }

        setPlannedRoute(points);
        setActiveLoadedRoute(null);
        setIsPlanning(false);
      } catch (err: any) {
        setMapNotice('GPX okuma hatası: ' + err.message);
        setTimeout(() => setMapNotice(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearRoute = () => {
    setPlannedRoute([]);
    setActiveLoadedRoute(null);
    setGpxFileName(null);
  };

  const routeDistanceKm = (calculateDistance(plannedRoute) / 1000).toFixed(2);

  // Active weather data for quick summary badge
  const heroWeather =
    (currentLocation && weatherMap['user-loc']) ||
    weatherMap['center-loc'] ||
    Object.values(weatherMap)[0];

  const currentWindDeg = heroWeather ? heroWeather.windDirection : 45;

  const refCenter = nearbyCenter || currentLocation;
  const catalogWithDistance: CyclingRoute[] = CYCLING_ROUTES.map((r) => ({
    ...r,
    source: 'catalog',
    distanceFromUserKm:
      refCenter && r.waypoints[0]
        ? Math.round(computeHaversineKm(refCenter.lat, refCenter.lng, r.waypoints[0].lat, r.waypoints[0].lng) * 10) / 10
        : undefined
  }));

  const combinedPool: CyclingRoute[] = [...nearbyRoutes, ...catalogWithDistance];

  let filteredRecommendations: (CyclingRoute & { windMatch: ReturnType<typeof calculateRouteWindScore>; calculatedDifficulty: NonNullable<CyclingRoute['calculatedDifficulty']> })[] = [];

  if (routeCategoryFilter === 'nearby') {
    const baseList =
      nearbyRoutes.length > 0
        ? nearbyRoutes
        : [...catalogWithDistance].sort((a, b) => (a.distanceFromUserKm ?? 9999) - (b.distanceFromUserKm ?? 9999));

    const mapped = baseList
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.surface.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      })
      .map((r) => ({
        ...r,
        windMatch: calculateRouteWindScore(r, currentWindDeg),
        calculatedDifficulty: r.calculatedDifficulty || calculateDynamicRouteDifficulty(r)
      }));

    filteredRecommendations = mapped.sort((a, b) => {
      if (suggestedDifficulty !== 'all') {
        const aMatch = a.calculatedDifficulty.level === suggestedDifficulty ? 0 : 1;
        const bMatch = b.calculatedDifficulty.level === suggestedDifficulty ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      const aDiffDist = Math.abs(a.distanceKm - suggestedDistanceKm);
      const bDiffDist = Math.abs(b.distanceKm - suggestedDistanceKm);
      return aDiffDist - bDiffDist;
    });
  } else if (routeCategoryFilter.startsWith('col:')) {
    const targetColId = routeCategoryFilter.replace('col:', '');
    const targetCol = collections.find((c) => c.id === targetColId);
    const colRouteIds = targetCol?.routeIds || [];
    filteredRecommendations = combinedPool
      .filter((r) => colRouteIds.includes(r.id))
      .map((r) => ({
        ...r,
        windMatch: calculateRouteWindScore(r, currentWindDeg),
        calculatedDifficulty: r.calculatedDifficulty || calculateDynamicRouteDifficulty(r)
      }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredRecommendations = filteredRecommendations.filter(
        (r) => r.name.toLowerCase().includes(q) || r.surface.toLowerCase().includes(q)
      );
    }
  } else {
    const baseFiltered = filterCyclingRoutes(
      searchQuery,
      routeCategoryFilter as any,
      currentWindDeg
    ).map((r) => ({
      ...r,
      distanceFromUserKm:
        refCenter && r.waypoints[0]
          ? Math.round(computeHaversineKm(refCenter.lat, refCenter.lng, r.waypoints[0].lat, r.waypoints[0].lng) * 10) / 10
          : undefined
    }));
    const nearbyFiltered =
      routeCategoryFilter === 'all'
        ? nearbyRoutes
            .filter((r) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return r.name.toLowerCase().includes(q) || r.surface.toLowerCase().includes(q);
            })
            .map((r) => ({
              ...r,
              windMatch: calculateRouteWindScore(r, currentWindDeg),
              calculatedDifficulty: r.calculatedDifficulty || calculateDynamicRouteDifficulty(r)
            }))
        : [];
    filteredRecommendations = [...nearbyFiltered, ...baseFiltered];
  }

  const hasGoogleBikeRoute =
    activeLoadedRoute?.source === 'google_maps' ||
    filteredRecommendations.some((r) => r.source === 'google_maps');

  const handleSkipCurrentSuggestion = () => {
    const pool = filteredRecommendations.length > 0 ? filteredRecommendations : nearbyRoutes;
    if (pool.length === 0) {
      handleRequestSuggestion();
      return;
    }
    const currentId = activeLoadedRoute?.id;
    const updatedSkipped = currentId && !skippedRouteIds.includes(currentId)
      ? [...skippedRouteIds, currentId]
      : skippedRouteIds;

    setSkipCount((c) => c + 1);
    const remaining = pool.filter((r) => !updatedSkipped.includes(r.id));
    if (remaining.length > 0) {
      setSkippedRouteIds(updatedSkipped);
      loadRouteOntoMap(remaining[0]);
    } else {
      const currentIdx = pool.findIndex((r) => r.id === currentId);
      const nextRoute = pool[(currentIdx + 1) % pool.length];
      setSkippedRouteIds(currentId ? [currentId] : []);
      loadRouteOntoMap(nextRoute);
    }
  };

  // Calculate dynamic difficulty on the fly for active route if loaded
  const activeDifficulty = activeLoadedRoute
    ? activeLoadedRoute.calculatedDifficulty || calculateDynamicRouteDifficulty(activeLoadedRoute)
    : null;
  const activeRampCount = activeLoadedRoute
    ? activeLoadedRoute.rampCount ?? Math.max(1, Math.round(activeLoadedRoute.climbM / 45))
    : 0;

  // Athlete Stats for Ranked Progression Card
  const totalKm = savedRides.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalClimb = savedRides.reduce((acc, r) => acc + r.climbM, 0);

  return (
    <div className="flex flex-col h-full w-full bg-[#F4F5F7] text-[#18181B] overflow-y-auto">
      {mapNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
          <span>{mapNotice}</span>
          <button onClick={() => setMapNotice(null)} className="text-amber-700 font-bold cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Map Action Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 p-3 bg-white border-b border-[#E2E4E9]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#FC4C02]/10 text-[#FC4C02]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold flex items-center gap-2 text-[#18181B]">
              Harita ve Yakın Rotalar
              <span className="text-[11px] text-[#FC4C02] font-semibold">
                · {activeRiders.length} aktif sporcu
              </span>
            </h1>
            <p className="text-xs text-[#71717A]">
              {nearbyRoutes.length > 0
                ? `${nearbyCenterLabel || 'Konumunuz'} çevresinde ${nearbyRoutes.length} gerçek rota bulundu`
                : 'Konumunuzu açarak çevrenizdeki bisiklet rotalarını yükleyin'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <form onSubmit={handleSearchAreaSubmit} className="hidden lg:flex items-center gap-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={areaSearchInput}
                onChange={(e) => setAreaSearchInput(e.target.value)}
                placeholder="Semt veya şehir ara..."
                className="w-44 bg-[#F4F5F7] text-xs text-[#18181B] pl-7 pr-2.5 py-1.5 rounded-lg border border-[#E2E4E9] focus:border-[#FC4C02] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingNearby || !areaSearchInput.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-xs font-semibold text-[#18181B] border border-[#E2E4E9] cursor-pointer disabled:opacity-50"
            >
              Ara
            </button>
          </form>

          {/* Toggle Floating Carousel Button */}
          <button
            onClick={() => setIsRouteCarouselExpanded(!isRouteCarouselExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              isRouteCarouselExpanded
                ? 'bg-[#FC4C02] text-white border-[#FC4C02]'
                : 'bg-white text-[#18181B] border-[#E2E4E9] hover:bg-[#F4F5F7]'
            }`}
            title="Harita Üstü Rota Önerilerini Aç/Kapat"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Rotalar ({nearbyRoutes.length + CYCLING_ROUTES.length})</span>
          </button>

          {/* Manage Collections Button */}
          {onOpenCollections && (
            <button
              onClick={onOpenCollections}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] transition cursor-pointer"
              title="Özel Rota Koleksiyonlarımı Yönet"
            >
              <Folder className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span className="hidden sm:inline">Koleksiyonlar</span>
              <span className="text-[11px] font-mono text-[#71717A]">{collections.length}</span>
            </button>
          )}

          {/* Live KOM Segments */}
          {onOpenSegments && (
            <button
              onClick={onOpenSegments}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-xs font-semibold text-[#18181B] border border-[#E2E4E9] transition cursor-pointer"
              title="Canlı KOM Segmentleri"
            >
              <Zap className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span className="hidden sm:inline">Segmentler</span>
            </button>
          )}

          {/* Weather & Wind Layer Toggle */}
          <div className="flex items-center bg-[#F4F5F7] p-0.5 rounded-lg border border-[#E2E4E9]">
            <button
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                showWeatherOverlay
                  ? 'bg-[#FC4C02] text-white'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
              title="Hava ve Rüzgar Katmanını Aç/Kapat"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Hava</span>
            </button>

            {showWeatherOverlay && (
              <div className="flex items-center pl-1 border-l border-[#E2E4E9] ml-1 gap-0.5">
                <button
                  onClick={() => setWeatherLayerMode('all')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                    weatherLayerMode === 'all'
                      ? 'bg-white text-[#FC4C02]'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setWeatherLayerMode('wind')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                    weatherLayerMode === 'wind'
                      ? 'bg-white text-[#FC4C02]'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Rüzgar
                </button>
                <button
                  onClick={() => setWeatherLayerMode('temp')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                    weatherLayerMode === 'temp'
                      ? 'bg-white text-[#FC4C02]'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Sıcaklık
                </button>
              </div>
            )}
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center bg-[#F4F5F7] p-0.5 rounded-lg border border-[#E2E4E9]">
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                mapType === 'terrain'
                  ? 'bg-white text-[#FC4C02]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Arazi
            </button>
            <button
              onClick={() => setMapType('roadmap' as any)}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                mapType === 'roadmap'
                  ? 'bg-white text-[#FC4C02]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Yol
            </button>
            <button
              onClick={() => setMapType('hybrid' as any)}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                mapType === 'hybrid'
                  ? 'bg-white text-[#FC4C02]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Uydu
            </button>
          </div>

          {/* Route Planning Button */}
          <button
            onClick={() => setIsPlanning(!isPlanning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              isPlanning
                ? 'bg-[#FC4C02] text-white border-[#FC4C02]'
                : 'bg-white text-[#18181B] border-[#E2E4E9] hover:bg-[#F4F5F7]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {isPlanning ? 'Nokta Ekle' : 'Rota Çiz'}
          </button>

          {/* GPX Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleGpxUpload}
            accept=".gpx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F4F5F7] text-xs font-semibold text-[#18181B] border border-[#E2E4E9] transition cursor-pointer"
            title="GPX Rota Dosyası Yükle"
          >
            <Upload className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span className="hidden sm:inline">GPX</span>
          </button>

          {/* Locate Me */}
          <button
            onClick={handleLocateMe}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isFollowingRider
                ? 'bg-[#FC4C02] text-white border-[#FC4C02]'
                : 'bg-white text-[#18181B] border-[#E2E4E9] hover:bg-[#F4F5F7]'
            }`}
            title="Konumuma Git"
          >
            <NavIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Container (Interactive Google Map with Route Suggestion Module & Floating Carousel) */}
      <div className="relative w-full h-[560px] md:h-[640px] shrink-0 border-b border-[#E2E4E9]">
        <Map
          defaultCenter={INITIAL_CENTER}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapType}
          onClick={handleMapClick}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Active Athletic Orange Polyline */}
          <MapPolylineLayer points={plannedRoute} color="#FC4C02" weight={5} />

          {/* User Current GPS Location Marker */}
          {currentLocation && (
            <AdvancedMarker position={{ lat: currentLocation.lat, lng: currentLocation.lng }}>
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#FC4C02]/20 absolute" />
                <div className="w-6 h-6 rounded-full bg-[#FC4C02] border-2 border-white flex items-center justify-center text-white shadow-md z-10">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <div className="absolute -bottom-5 px-1.5 py-0.5 rounded bg-white text-[#18181B] text-[9px] font-bold border border-[#E2E4E9] whitespace-nowrap shadow-sm">
                  BEN ({currentLocation.alt ? Math.round(currentLocation.alt) + 'm' : 'GPS'})
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Real-time Other Active Riders */}
          {activeRiders.map((rider) => (
            <AdvancedMarker
              key={rider.id}
              position={{ lat: rider.lat, lng: rider.lng }}
              onClick={() => onSelectRiderByName && onSelectRiderByName(rider.name)}
            >
              <div className="relative flex flex-col items-center cursor-pointer group">
                <div className="w-6 h-6 rounded-full bg-[#18181B] border-2 border-white flex items-center justify-center text-white shadow-md">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-white border border-[#E2E4E9] text-[#18181B] text-[10px] font-bold whitespace-nowrap shadow-sm flex items-center gap-1">
                  <span>{rider.name}</span>
                  <span className="text-[#FC4C02] font-mono text-[9px] font-bold">
                    {rider.speed.toFixed(1)} km/s
                  </span>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Curated Trail Points & Integrated Weather Overlays */}
          {trails.map((trail) => {
            const w = weatherMap[trail.id];

            let windBorderColor = 'border-emerald-500';
            let windTextColor = 'text-emerald-700';
            if (w) {
              if (w.windSpeed >= 28) {
                windBorderColor = 'border-rose-500';
                windTextColor = 'text-rose-700';
              } else if (w.windSpeed >= 18) {
                windBorderColor = 'border-[#FC4C02]';
                windTextColor = 'text-[#FC4C02]';
              } else if (w.windSpeed >= 12) {
                windBorderColor = 'border-amber-500';
                windTextColor = 'text-amber-700';
              }
            }

            return (
              <AdvancedMarker
                key={trail.id}
                position={{ lat: trail.lat, lng: trail.lng }}
                onClick={() => {
                  setSelectedTrail(trail);
                  if (w) setActiveWeatherSpot(w);

                  if (trail.routeId) {
                    const matchedRoute = CYCLING_ROUTES.find((r) => r.id === trail.routeId);
                    if (matchedRoute) {
                      loadRouteOntoMap(matchedRoute);
                    }
                  }

                  if (map) {
                    map.panTo({ lat: trail.lat, lng: trail.lng });
                    map.setZoom(13);
                  }
                }}
              >
                <div className="cursor-pointer group flex flex-col items-center">
                  {/* Weather Overlay Bubble (Top) */}
                  {showWeatherOverlay && w && (
                    <div
                      className={`mb-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-xs border shadow-md flex items-center gap-1.5 transition-transform group-hover:scale-105 ${windBorderColor}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWeatherSpot(w);
                        setSelectedTrail(trail);
                        setIsWeatherRadarOpen(true);
                      }}
                    >
                      {(weatherLayerMode === 'all' || weatherLayerMode === 'temp') && (
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#242428] pr-1 border-r border-[#E5E5EB]">
                          <WeatherIconDisplay iconType={w.iconType} className="w-3 h-3" />
                          <span>{w.temperature}°C</span>
                        </div>
                      )}

                      {(weatherLayerMode === 'all' || weatherLayerMode === 'wind') && (
                        <div className={`flex items-center gap-1 text-[11px] font-extrabold ${windTextColor}`}>
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center bg-white shadow-xs"
                            style={{
                              transform: `rotate(${w.windDirection}deg)`,
                              transition: 'transform 0.4s ease'
                            }}
                          >
                            <ArrowUp className="w-3 h-3 text-[#FC4C02] stroke-[3]" />
                          </div>
                          <span>{w.windSpeed} km/s</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trail Location Chip */}
                  <div className="px-2.5 py-1 rounded-full bg-white border border-[#FC4C02] text-[#FC4C02] text-xs font-bold shadow-md flex items-center gap-1 group-hover:scale-105 transition">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trail.name.split(' ')[0]}</span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Nearby real route start markers */}
          {nearbyRoutes.map((nr) => {
            const startPt = nr.waypoints[0];
            if (!startPt) return null;
            return (
              <AdvancedMarker
                key={`marker-${nr.id}`}
                position={{ lat: startPt.lat, lng: startPt.lng }}
                onClick={() => loadRouteOntoMap(nr)}
              >
                <div className="px-2 py-1 rounded-lg bg-[#18181B] border border-white text-white text-[10px] font-semibold shadow-md cursor-pointer flex items-center gap-1">
                  <Route className="w-3 h-3 text-[#FC4C02]" />
                  <span>{nr.distanceKm} km</span>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Route Start and End Markers */}
          {plannedRoute.length > 0 && (
            <>
              <AdvancedMarker position={{ lat: plannedRoute[0].lat, lng: plannedRoute[0].lng }}>
                <div className="px-2.5 py-1 rounded-lg bg-[#18181B] text-white text-[11px] font-bold shadow-md border border-white flex items-center gap-1">
                  <span>BAŞLANGIÇ</span>
                </div>
              </AdvancedMarker>
              <AdvancedMarker
                position={{
                  lat: plannedRoute[plannedRoute.length - 1].lat,
                  lng: plannedRoute[plannedRoute.length - 1].lng
                }}
              >
                <div className="px-2.5 py-1 rounded-lg bg-[#FC4C02] text-white text-[11px] font-bold shadow-md border border-white flex items-center gap-1">
                  <span>VARIŞ</span>
                </div>
              </AdvancedMarker>
            </>
          )}
        </Map>

        {/* ROTA ÖNERİSİ MODÜLÜ (Integrated Over Google Maps Top-Left) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-auto">
          {isSuggestionPanelOpen ? (
            <div className="w-[292px] sm:w-[318px] bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E4E9] shadow-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#ECEEF2]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF4EE] border border-[#FCD5C3] text-[#FC4C02] flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#18181B] leading-none">
                      Rota Önerisi
                    </h3>
                    <span className="text-[10px] text-[#71717A] block mt-0.5 truncate max-w-[165px]">
                      {nearbyCenterLabel || (currentLocation ? 'GPS Konumunuz' : 'Konum seçin')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="p-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#FC4C02] border border-[#E2E4E9] transition cursor-pointer"
                    title="Mevcut GPS Konumunu Al"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSuggestionPanelOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#71717A] hover:text-[#18181B] transition cursor-pointer"
                    title="Modülü Küçült"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Difficulty Level Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  <span>Zorluk Seviyesi</span>
                  <span className="text-[#FC4C02]">
                    {suggestedDifficulty === 'all' ? 'Dengeli' : suggestedDifficulty}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['all', 'Kolay', 'Orta', 'Zor'] as const).map((lvl) => {
                    const active = suggestedDifficulty === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSuggestedDifficulty(lvl)}
                        className={`py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-[#18181B] text-white border-[#18181B]'
                            : 'bg-[#F8F9FA] text-[#52525B] border-[#E2E4E9] hover:border-[#FC4C02]/40'
                        }`}
                      >
                        {lvl === 'all' ? 'Tümü' : lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distance Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  <span>Hedef Mesafe</span>
                  <span className="font-mono text-xs font-bold text-[#18181B] tabular-nums">
                    {suggestedDistanceKm} km
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[10, 25, 45, 70].map((kmVal) => {
                    const active = suggestedDistanceKm === kmVal;
                    return (
                      <button
                        key={kmVal}
                        type="button"
                        onClick={() => setSuggestedDistanceKm(kmVal)}
                        className={`py-1 rounded-lg text-[11px] font-mono font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-[#FFF4EE] text-[#FC4C02] border-[#FC4C02]'
                            : 'bg-[#F8F9FA] text-[#52525B] border-[#E2E4E9] hover:text-[#18181B]'
                        }`}
                      >
                        {kmVal}km
                      </button>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={suggestedDistanceKm}
                  onChange={(e) => setSuggestedDistanceKm(Number(e.target.value))}
                  className="w-full accent-[#FC4C02] h-1.5 bg-[#E2E4E9] rounded-lg cursor-pointer"
                />
              </div>

              {/* Generate & Skip Controls */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleRequestSuggestion}
                  disabled={isLoadingNearby}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoadingNearby ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoadingNearby ? 'Hesaplanıyor' : 'Rota Öner'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipCurrentSuggestion}
                  className="py-2 px-2.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] border border-[#E2E4E9] text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Mevcut rotayı atla ve sıradaki öneriyi haritada göster"
                >
                  <SkipForward className="w-3.5 h-3.5 text-[#FC4C02]" />
                  <span>Atla</span>
                  {skipCount > 0 && (
                    <span className="font-mono text-[10px] font-bold text-[#FC4C02] tabular-nums">
                      ({skipCount})
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSuggestionPanelOpen(true)}
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E2E4E9] shadow-lg text-xs font-bold text-[#18181B] hover:border-[#FC4C02] transition cursor-pointer flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Rota Önerisi</span>
              <span className="font-mono text-[11px] text-[#FC4C02] tabular-nums">
                {suggestedDistanceKm}km · {suggestedDifficulty === 'all' ? 'Tümü' : suggestedDifficulty}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
            </button>
          )}
        </div>

        {/* ACTIVE LOADED ROUTE HUD (Floating Top Right on Map) */}
        {(activeLoadedRoute || plannedRoute.length > 0) && (
          <div className="hidden md:block absolute top-3 right-3 w-88 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-[#E2E4E9] shadow-lg z-20 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
                  <span className="text-[#FC4C02] uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {activeLoadedRoute ? activeLoadedRoute.category : 'ÖZEL ROTA'}
                  </span>
                  {activeDifficulty && (
                    <span className="text-[#52525B]">
                      · {activeDifficulty.level} (%{activeDifficulty.score})
                    </span>
                  )}
                  {activeLoadedRoute?.distanceFromUserKm !== undefined && (
                    <span className="text-[#71717A] font-mono">
                      · {activeLoadedRoute.distanceFromUserKm} km
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#18181B] leading-tight line-clamp-1 mt-0.5">
                  {activeLoadedRoute ? activeLoadedRoute.name : gpxFileName || 'Çizilen Rota'}
                </h3>
              </div>
              <button
                onClick={clearRoute}
                className="text-[#71717A] hover:text-rose-600 transition p-1 cursor-pointer shrink-0"
                title="Rotayı Kaldır"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Metric Strip including Ramp Count */}
            <div className="grid grid-cols-4 divide-x divide-[#ECEEF2] text-center bg-[#F8F9FA] py-2 rounded-lg border border-[#E2E4E9]">
              <div>
                <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Mesafe</span>
                <span className="text-xs font-bold font-mono text-[#18181B] tabular-nums">
                  {activeLoadedRoute ? activeLoadedRoute.distanceKm : routeDistanceKm} km
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Tırmanış</span>
                <span className="text-xs font-bold font-mono text-[#FC4C02] tabular-nums">
                  +{activeLoadedRoute ? activeLoadedRoute.climbM : '0'}m
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Rampa</span>
                <span className="text-xs font-bold font-mono text-[#18181B] tabular-nums">
                  {activeLoadedRoute ? activeRampCount : 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Süre</span>
                <span className="text-xs font-bold font-mono text-[#18181B] tabular-nums">
                  {activeLoadedRoute ? `~${activeLoadedRoute.estimatedTimeMin}dk` : `${plannedRoute.length}pt`}
                </span>
              </div>
            </div>

            {activeDifficulty && (
              <p className="text-[11px] text-[#52525B] leading-snug line-clamp-2">
                {activeDifficulty.summary}
              </p>
            )}

            <div className="flex items-center gap-1.5 pt-0.5">
              {activeLoadedRoute && (
                <button
                  onClick={() => setInspectedRouteModal(activeLoadedRoute)}
                  className="flex-1 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition cursor-pointer text-center"
                >
                  İrtifa
                </button>
              )}
              <button
                onClick={handleSkipCurrentSuggestion}
                className="py-1.5 px-2.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition cursor-pointer flex items-center gap-1"
                title="Rotayı Atla"
              >
                <SkipForward className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>Atla</span>
              </button>
              {onSelectRoute && activeLoadedRoute && (
                <button
                  onClick={() => onSelectRoute(activeLoadedRoute)}
                  className="flex-1 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Başlat</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* FLOATING ON-MAP ROUTE RECOMMENDATIONS CAROUSEL */}
        <div className="absolute bottom-3 left-3 right-3 md:left-6 md:right-6 z-20 pointer-events-auto">
          {isRouteCarouselExpanded ? (
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E4E9] shadow-lg p-3 space-y-2.5">
              {/* Carousel Header & Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-[#ECEEF2]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FC4C02]/10 text-[#FC4C02] flex items-center justify-center">
                    <Route className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
                    Yakın Rotalar ve Öneriler
                    <span className="text-[11px] font-mono text-[#FC4C02]">
                      ({filteredRecommendations.length})
                    </span>
                  </h3>
                  {isLoadingNearby && (
                    <span className="text-[11px] text-[#71717A] flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Rotalar hesaplanıyor...
                    </span>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setRouteCategoryFilter('nearby')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      routeCategoryFilter === 'nearby'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>Yakınımdaki</span>
                  </button>
                  <button
                    onClick={() => setRouteCategoryFilter('all')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      routeCategoryFilter === 'all'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setRouteCategoryFilter('wind')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      routeCategoryFilter === 'wind'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    <Wind className="w-3 h-3" />
                    <span>Rüzgara Uygun</span>
                  </button>

                  {collections.map((col) => {
                    const isSel = routeCategoryFilter === `col:${col.id}`;
                    return (
                      <button
                        key={col.id}
                        onClick={() => setRouteCategoryFilter(isSel ? 'all' : `col:${col.id}`)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                          isSel
                            ? 'bg-[#FC4C02] text-white'
                            : 'bg-[#F4F5F7] text-[#18181B] hover:border-[#FC4C02]/40 border border-[#E2E4E9]'
                        }`}
                      >
                        <span>{col.name}</span>
                        <span className="text-[10px] font-mono opacity-75">
                          ({col.routeIds.length})
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setRouteCategoryFilter('flat')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      routeCategoryFilter === 'flat'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    Hız
                  </button>
                  <button
                    onClick={() => setRouteCategoryFilter('climb')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      routeCategoryFilter === 'climb'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    Tırmanış
                  </button>
                  <button
                    onClick={() => setRouteCategoryFilter('gravel')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      routeCategoryFilter === 'gravel'
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
                    }`}
                  >
                    Gravel
                  </button>

                  {/* Collapse Button */}
                  <button
                    onClick={() => setIsRouteCarouselExpanded(false)}
                    className="p-1 hover:bg-[#F4F5F7] text-[#71717A] hover:text-[#18181B] rounded-md transition cursor-pointer ml-1"
                    title="Paneli Küçült"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {hasGoogleBikeRoute && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#52525B]">
                  <Info className="w-3.5 h-3.5 text-[#FC4C02] shrink-0" />
                  <span>
                    Google Haritalar bisiklet yönlendirmesi önizleme modundadır; saha ve trafik koşullarına dikkat edin.
                  </span>
                </div>
              )}

              {nearbyError && (
                <div className="text-[11px] text-rose-600 font-medium">{nearbyError}</div>
              )}

              {/* Horizontal Scrollable Route Cards Carousel */}
              {filteredRecommendations.length === 0 ? (
                <div className="p-4 text-center bg-white rounded-xl border border-dashed border-[#E2E4E9] text-xs text-[#71717A]">
                  Bu filtrede rota bulunamadı. Konum butonuna basabilir veya semt/şehir arayabilirsiniz.
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth snap-x">
                  {filteredRecommendations.map((route) => {
                    const isActive = activeLoadedRoute?.id === route.id;
                    const diff = route.calculatedDifficulty;
                    const isFav = routeCollectionService.isFavorite(route.id);
                    const assignedCols = collections.filter((c) => c.routeIds.includes(route.id));

                    return (
                      <div
                        key={route.id}
                        onClick={() => loadRouteOntoMap(route)}
                        className={`w-72 sm:w-80 shrink-0 p-3 rounded-xl bg-white border cursor-pointer transition-all snap-start flex flex-col justify-between ${
                          isActive
                            ? 'border-2 border-[#FC4C02]'
                            : 'border-[#E2E4E9] hover:border-[#FC4C02]/60'
                        }`}
                      >
                        <div>
                          {/* Top Metadata Row */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-semibold text-[#FC4C02] truncate">
                              {route.category} · {diff.level} (%{diff.score})
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {route.distanceFromUserKm !== undefined && (
                                <span className="text-[10px] font-mono text-[#71717A]">
                                  {route.distanceFromUserKm} km
                                </span>
                              )}

                              {/* Quick Favorite Star */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  routeCollectionService.toggleFavorite(route.id);
                                }}
                                className={`p-1 rounded transition cursor-pointer ${
                                  isFav
                                    ? 'text-amber-500'
                                    : 'text-[#71717A] hover:text-amber-500'
                                }`}
                                title={isFav ? 'Favorilerimden Kaldır' : 'Favorilerime Ekle'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                              </button>

                              {onManageRouteCollections && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onManageRouteCollections(route);
                                  }}
                                  className="p-1 text-[#71717A] hover:text-[#FC4C02] rounded transition cursor-pointer"
                                  title="Koleksiyonlara Ekle / Çıkar"
                                >
                                  <FolderPlus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Title & Surface */}
                          <h4 className="text-xs font-bold text-[#18181B] line-clamp-1 leading-tight">
                            {route.name}
                          </h4>
                          <p className="text-[11px] text-[#71717A] truncate mt-0.5">
                            {route.surface} · {route.rampCount ?? Math.max(1, Math.round(route.climbM / 45))} Rampa · %{route.windMatch.score} Rüzgar
                          </p>
                        </div>

                        {/* 3 Metrics & Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-[#ECEEF2] flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px]">
                            <div>
                              <span className="text-[9px] text-[#71717A] block font-semibold">MESAFE</span>
                              <strong className="text-[#18181B] font-mono tabular-nums">{route.distanceKm} km</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#71717A] block font-semibold">TIRMANIŞ</span>
                              <strong className="text-[#FC4C02] font-mono tabular-nums">+{route.climbM} m</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#71717A] block font-semibold">RAMPA</span>
                              <strong className="text-[#18181B] font-mono tabular-nums">
                                {route.rampCount ?? Math.max(1, Math.round(route.climbM / 45))}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedRouteModal(route);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[10px] font-semibold text-[#18181B] border border-[#E2E4E9] transition cursor-pointer"
                              title="İrtifa Profili ve Zorluk Analizini Gör"
                            >
                              İncele
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                loadRouteOntoMap(route);
                                if (onSelectRoute) onSelectRoute(route);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Bike className="w-3 h-3" />
                              <span>Sür</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Minimized Floating Bar */
            <button
              onClick={() => setIsRouteCarouselExpanded(true)}
              className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg border border-[#E2E4E9] shadow-lg text-xs font-semibold text-[#18181B] hover:text-[#FC4C02] transition cursor-pointer flex items-center gap-2 mx-auto"
            >
              <Route className="w-4 h-4 text-[#FC4C02]" />
              <span>Rota Önerileri ({filteredRecommendations.length} Parkur) · Haritada Keşfet</span>
              <ChevronUp className="w-4 h-4 text-[#71717A]" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE LOWER CONTENT AREA */}
      <div className="p-3 sm:p-5 space-y-5 max-w-7xl mx-auto w-full">
        {/* 1. SPORCU RANK & LİG DURUMU */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E2E4E9] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FC4C02]/10 text-[#FC4C02] flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#18181B]">
                  Sporcu Seviyesi ve Lig Derecesi
                </h2>
                <p className="text-[11px] text-[#71717A]">
                  Kaydedilen rotalar, tırmanış irtifası ve FTP güç puanlarıyla hesaplanan lig dereceniz
                </p>
              </div>
            </div>

            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span className="hidden sm:inline">Liderlik Tablosu</span>
                <ChevronRight className="w-3 h-3 text-[#FC4C02]" />
              </button>
            )}
          </div>

          <RankedProgressionCard
            stats={{
              totalDistanceKm: totalKm,
              totalClimbM: totalClimb,
              ftpWatts: ftpWatts || 245,
              ridesCount: savedRides.length
            }}
            onOpenLeaderboard={onOpenLeaderboard || (() => {})}
          />
        </div>

        {/* 2. TÜM PARKUR VE YAKIN ROTA KATALOĞU */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-2">
                Yakındaki Rotalar ve Parkur Kataloğu
                <span className="text-xs font-mono text-[#FC4C02]">
                  ({filteredRecommendations.length})
                </span>
              </h3>
              <p className="text-xs text-[#71717A]">
                Gerçek yol ağı, yükseklik verisi ve rüzgar uyumuyla hesaplanan rotalar
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#71717A]" />
              <input
                type="text"
                placeholder="Parkur, rota veya zemin ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F5F7] text-xs text-[#18181B] pl-8 pr-3 py-2 rounded-lg border border-[#E2E4E9] focus:border-[#FC4C02] outline-none"
              />
            </div>
          </div>

          {/* Filter Tabs in Lower Catalog */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setRouteCategoryFilter('nearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                routeCategoryFilter === 'nearby'
                  ? 'bg-[#FC4C02] text-white'
                  : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
              }`}
            >
              Yakınımdaki ({nearbyRoutes.length || CYCLING_ROUTES.length})
            </button>
            <button
              onClick={() => setRouteCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                routeCategoryFilter === 'all'
                  ? 'bg-[#FC4C02] text-white'
                  : 'bg-[#F4F5F7] text-[#52525B] hover:text-[#18181B] border border-[#E2E4E9]'
              }`}
            >
              Tüm Rotalar ({nearbyRoutes.length + CYCLING_ROUTES.length})
            </button>

            {collections.map((col) => {
              const isSel = routeCategoryFilter === `col:${col.id}`;
              return (
                <button
                  key={col.id}
                  onClick={() => setRouteCategoryFilter(isSel ? 'all' : `col:${col.id}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-[#FC4C02] text-white'
                      : 'bg-[#F4F5F7] text-[#18181B] hover:border-[#FC4C02]/40 border border-[#E2E4E9]'
                  }`}
                >
                  <span>{col.name}</span>
                  <span className="text-[10px] font-mono opacity-75">
                    ({col.routeIds.length})
                  </span>
                </button>
              );
            })}

            {onOpenCollections && (
              <button
                onClick={onOpenCollections}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] border border-[#E2E4E9] transition whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                title="Yeni Koleksiyon Ekle / Düzenle"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>Koleksiyon Yönet</span>
              </button>
            )}
          </div>

          {/* Empty State for Catalog */}
          {filteredRecommendations.length === 0 && (
            <div className="p-8 text-center bg-[#F8F9FA] rounded-xl border border-dashed border-[#E2E4E9] space-y-2">
              <Folder className="w-8 h-8 text-[#71717A] mx-auto opacity-50" />
              <h4 className="text-xs font-bold uppercase text-[#18181B]">Bu Listede Rota Bulunamadı</h4>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Rotaların üzerindeki yıldız veya klasör simgesine basarak koleksiyonlara kolayca parkur ekleyebilirsiniz.
              </p>
              <button
                onClick={() => setRouteCategoryFilter('all')}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#FC4C02] text-white text-xs font-bold cursor-pointer"
              >
                Tüm Rotaları Listele
              </button>
            </div>
          )}

          {/* Grid of Routes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecommendations.map((route) => {
              const diff = route.calculatedDifficulty;
              const isLoaded = activeLoadedRoute?.id === route.id;
              const isFav = routeCollectionService.isFavorite(route.id);

              return (
                <div
                  key={route.id}
                  onClick={() => loadRouteOntoMap(route)}
                  className={`p-4 rounded-xl bg-white border cursor-pointer transition flex flex-col justify-between ${
                    isLoaded
                      ? 'border-2 border-[#FC4C02]'
                      : 'border-[#E2E4E9] hover:border-[#FC4C02]/50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-[#FC4C02]">
                        {route.category} · {diff.level} (%{diff.score})
                      </span>

                      <div className="flex items-center gap-1">
                        {route.distanceFromUserKm !== undefined && (
                          <span className="text-[11px] font-mono text-[#71717A]">
                            {route.distanceFromUserKm} km
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            routeCollectionService.toggleFavorite(route.id);
                          }}
                          className={`p-1 rounded transition cursor-pointer ${
                            isFav
                              ? 'text-amber-500'
                              : 'text-[#71717A] hover:text-amber-500'
                          }`}
                          title={isFav ? 'Favorilerimden Kaldır' : 'Favorilerime Ekle'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        {onManageRouteCollections && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onManageRouteCollections(route);
                            }}
                            className="p-1 text-[#71717A] hover:text-[#FC4C02] rounded transition cursor-pointer"
                            title="Koleksiyonlara Ekle / Çıkar"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#18181B] leading-tight">
                      {route.name}
                    </h4>
                    <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                      {route.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#ECEEF2] space-y-2.5">
                    <div className="grid grid-cols-4 divide-x divide-[#ECEEF2] text-center text-xs bg-[#F8F9FA] py-2 rounded-lg border border-[#E2E4E9]">
                      <div>
                        <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Mesafe</span>
                        <strong className="text-[#18181B] font-mono tabular-nums">{route.distanceKm} km</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Tırmanış</span>
                        <strong className="text-[#FC4C02] font-mono tabular-nums">+{route.climbM}m</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Rampa</span>
                        <strong className="text-[#18181B] font-mono tabular-nums">
                          {route.rampCount ?? Math.max(1, Math.round(route.climbM / 45))}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block font-semibold uppercase">Süre</span>
                        <strong className="text-[#18181B] font-mono tabular-nums">~{route.estimatedTimeMin}dk</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedRouteModal(route);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-xs font-semibold text-[#18181B] border border-[#E2E4E9] transition cursor-pointer text-center"
                      >
                        İrtifa ve Profil
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadRouteOntoMap(route);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold transition cursor-pointer text-center"
                      >
                        Haritada Çiz
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Route Detail Modal for deep inspection */}
      {inspectedRouteModal && (
        <RouteDetailModal
          route={inspectedRouteModal}
          currentWindDeg={currentWindDeg}
          onClose={() => setInspectedRouteModal(null)}
          onLoadOnMap={(r) => {
            loadRouteOntoMap(r);
            setInspectedRouteModal(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onStartRide={(r) => {
            loadRouteOntoMap(r);
            setInspectedRouteModal(null);
            if (onSelectRoute) onSelectRoute(r);
          }}
          onManageCollections={onManageRouteCollections}
        />
      )}
    </div>
  );
};

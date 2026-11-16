/**
 * Cycling Weather & Wind Telemetry Service
 * Real-time meteorological data powered by Open-Meteo & Aero Vector Physics.
 * Provides live temperature, wind vectors, gusts, and ride preparation recommendations.
 */

export interface WeatherData {
  lat: number;
  lng: number;
  temperature: number; // °C
  apparentTemperature: number; // °C
  windSpeed: number; // km/h
  windDirection: number; // 0-360 degrees
  windDirectionLabel: string; // e.g. "Kuzey (K)"
  windGusts: number; // km/h
  humidity: number; // %
  weatherCode: number;
  condition: string; // e.g. "Açık ve Güneşli"
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'cloud-lightning' | 'snow' | 'fog';
  timestamp: number;
  rideScore: number; // 0 - 100
  rideStatus: 'Mükemmel' | 'Çok İyi' | 'İyi' | 'Dikkatli Olun' | 'Zorlu / Uyarı';
  rideAdvice: string;
  gearRecommendation: string;
}

// In-memory cache for weather readings with 5 minutes TTL
const cache = new Map<string, { data: WeatherData; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Convert degree to Turkish cardinal direction
export function getWindCardinalDirection(deg: number): { label: string; short: string } {
  const normalized = (deg % 360 + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return { label: 'Kuzey (K)', short: 'K' };
  if (normalized >= 22.5 && normalized < 67.5) return { label: 'Kuzeydoğu (KD)', short: 'KD' };
  if (normalized >= 67.5 && normalized < 112.5) return { label: 'Doğu (D)', short: 'D' };
  if (normalized >= 112.5 && normalized < 157.5) return { label: 'Güneydoğu (GD)', short: 'GD' };
  if (normalized >= 157.5 && normalized < 202.5) return { label: 'Güney (G)', short: 'G' };
  if (normalized >= 202.5 && normalized < 247.5) return { label: 'Güneybatı (GB)', short: 'GB' };
  if (normalized >= 247.5 && normalized < 292.5) return { label: 'Batı (B)', short: 'B' };
  return { label: 'Kuzeybatı (KB)', short: 'KB' };
}

// Translate WMO weather code to cycling context
export function parseWmoWeather(code: number): {
  condition: string;
  iconType: WeatherData['iconType'];
  penalty: number;
} {
  switch (code) {
    case 0:
      return { condition: 'Açık & Güneşli', iconType: 'sun', penalty: 0 };
    case 1:
      return { condition: 'Çoğunlukla Açık', iconType: 'sun', penalty: 2 };
    case 2:
      return { condition: 'Parçalı Bulutlu', iconType: 'cloud-sun', penalty: 5 };
    case 3:
      return { condition: 'Kapalı & Bulutlu', iconType: 'cloud', penalty: 10 };
    case 45:
    case 48:
      return { condition: 'Sisli / Düşük Görüş', iconType: 'fog', penalty: 25 };
    case 51:
    case 53:
    case 55:
      return { condition: 'Hafif Çiseleme', iconType: 'rain', penalty: 20 };
    case 61:
    case 63:
      return { condition: 'Yağmurlu (Islak Asfalt)', iconType: 'rain', penalty: 35 };
    case 65:
      return { condition: 'Kuvvetli Yağmur', iconType: 'rain', penalty: 50 };
    case 71:
    case 73:
    case 75:
      return { condition: 'Kar Yağışlı', iconType: 'snow', penalty: 60 };
    case 80:
    case 81:
    case 82:
      return { condition: 'Sağanak Yağış', iconType: 'rain', penalty: 45 };
    case 95:
    case 96:
    case 99:
      return { condition: 'Gök Gürültülü Fırtına', iconType: 'cloud-lightning', penalty: 70 };
    default:
      return { condition: 'Ilıman Hava', iconType: 'cloud-sun', penalty: 5 };
  }
}

// Compute Ride Readiness Score (0-100) and advice for cycling preparation
export function computeRideReadiness(
  temp: number,
  windSpeed: number,
  windGusts: number,
  weatherPenalty: number
): {
  score: number;
  status: WeatherData['rideStatus'];
  advice: string;
  gearRecommendation: string;
} {
  let score = 100;

  // Temperature impact (ideal 16°C - 24°C)
  if (temp < 5) score -= 30;
  else if (temp < 12) score -= 15;
  else if (temp > 35) score -= 35;
  else if (temp > 29) score -= 15;

  // Wind speed impact (cycling is sensitive to wind)
  if (windSpeed > 40) score -= 40;
  else if (windSpeed > 28) score -= 25;
  else if (windSpeed > 18) score -= 12;
  else if (windSpeed > 10) score -= 5;

  // Gust impact
  if (windGusts > 45) score -= 20;
  else if (windGusts > 32) score -= 10;

  // Weather code penalty
  score -= weatherPenalty;

  // Clamp 10 - 100
  score = Math.max(12, Math.min(100, Math.round(score)));

  let status: WeatherData['rideStatus'] = 'Mükemmel';
  let advice = 'Sürüş için kusursuz koşullar. Yüksek tempo ve uzun mesafe için ideal.';
  let gearRecommendation = 'Kısa kollu jarse, bib şort, UV korumalı gözlük ve 1x matara.';

  if (score >= 85) {
    status = 'Mükemmel';
    advice = 'Yol tutuşu ve rüzgar direnci minimum. Antrenman ve rekor denemesi için en uygun zaman.';
    if (temp < 15) {
      gearRecommendation = 'Kısa jarse + rüzgar yeleği (gilet), hafif kol ısıtıcılar.';
    } else {
      gearRecommendation = 'Standart aero jarse, güneş koruyucu krem ve elektrolitli matara.';
    }
  } else if (score >= 70) {
    status = 'Çok İyi';
    if (windSpeed > 18) {
      advice = `Hafif rüzgar (${windSpeed} km/sa). Grup sürüşlerinde pelotonun içine saklanmak watt tasarrufu sağlar.`;
      gearRecommendation = 'Aero kesim forma, hafif rüzgarlık cepte hazır olsun.';
    } else {
      advice = 'Güvenli ve keyifli bir antrenman sürüşü için dengeli hava şartları.';
      gearRecommendation = 'Mevsimlik jarse ve bisiklet eldivenleri.';
    }
  } else if (score >= 55) {
    status = 'İyi';
    if (temp < 10) {
      advice = 'Hava serin. Isınma turlarını uzun tutun ve inişlerde üşümemeye dikkat edin.';
      gearRecommendation = 'Termal rüzgar ceketi, uzun parmak eldiven, boyunluk ve dizlik.';
    } else if (windSpeed > 25) {
      advice = `Dikkate değer rüzgar (${windSpeed} km/sa, hamleler ${windGusts} km/sa). Yüksek profilli jantlarda yan rüzgara dikkat edin.`;
      gearRecommendation = 'Alçak profil jant seti tercihi, rüzgar geçirmeyen jarse.';
    } else {
      advice = 'Yol zemini nemli veya parçalı bulutlu olabilir, virajlarda temkinli olun.';
      gearRecommendation = 'Su itici hafif rüzgarlık, sarı/şeffaf lensli gözlük.';
    }
  } else if (score >= 40) {
    status = 'Dikkatli Olun';
    advice = `Sert rüzgar veya düşük sıcaklık. Güzergahı rüzgar yönüne göre (giderken karşı, dönerken arka) planlayın.`;
    gearRecommendation = 'Rüzgar ceketi, su geçirmez yelek, güçlü ön/arka güvenlik ışığı.';
  } else {
    status = 'Zorlu / Uyarı';
    advice = `Şiddetli hava veya fırtına riski (${windSpeed} km/sa rüzgar). Kapalı alan veya roller antrenmanı düşünün.`;
    gearRecommendation = 'Tam donanımlı yağmurluk, çamurluk, yüksek lümenli çakar lambalar.';
  }

  return { score, status, advice, gearRecommendation };
}

/**
 * Fetch real-time weather from Open-Meteo API with caching and fallback
 */
export async function fetchLocalWeather(lat: number, lng: number): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned status ${response.status}`);
    }

    const json = await response.json();
    const cur = json.current;

    const temp = Math.round(cur.temperature_2m);
    const apparentTemp = Math.round(cur.apparent_temperature);
    const windSpeed = Math.round(cur.wind_speed_10m);
    const windDirection = Math.round(cur.wind_direction_10m);
    const windGusts = Math.round(cur.wind_gusts_10m || cur.wind_speed_10m * 1.3);
    const humidity = Math.round(cur.relative_humidity_2m);
    const weatherCode = cur.weather_code || 0;

    const { condition, iconType, penalty } = parseWmoWeather(weatherCode);
    const dirInfo = getWindCardinalDirection(windDirection);
    const { score, status, advice, gearRecommendation } = computeRideReadiness(
      temp,
      windSpeed,
      windGusts,
      penalty
    );

    const result: WeatherData = {
      lat,
      lng,
      temperature: temp,
      apparentTemperature: apparentTemp,
      windSpeed,
      windDirection,
      windDirectionLabel: dirInfo.label,
      windGusts,
      humidity,
      weatherCode,
      condition,
      iconType,
      timestamp: now,
      rideScore: score,
      rideStatus: status,
      rideAdvice: advice,
      gearRecommendation
    };

    cache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

export const fetchCyclingWeather = fetchLocalWeather;

/**
 * Fetch batch weather for multiple hotspots (e.g. curated trails + user location)
 */
export async function fetchBatchWeather(
  points: Array<{ id: string; lat: number; lng: number }>
): Promise<Record<string, WeatherData>> {
  const results: Record<string, WeatherData> = {};
  await Promise.all(
    points.map(async (pt) => {
      try {
        results[pt.id] = await fetchLocalWeather(pt.lat, pt.lng);
      } catch {
        // silently handled by fallback in fetchLocalWeather
      }
    })
  );
  return results;
}

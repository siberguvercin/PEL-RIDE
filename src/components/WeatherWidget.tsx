import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Sun,
  Wind,
  Droplets,
  Compass,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface WeatherData {
  temp: number;
  apparentTemp: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  windDirectionText: string;
  humidity: number;
  precipitationMm: number;
  weatherCode: number;
  weatherText: string;
  cyclingScore: number;
  cyclingAdvice: string;
}

interface WeatherWidgetProps {
  currentLocation: { lat: number; lng: number } | null;
}

// Convert degrees to Turkish compass directions
function getWindDirectionText(deg: number): string {
  const directions = ['Kuzey (Yıldız)', 'Kuzeydoğu (Poyraz)', 'Doğu (Gündoğusu)', 'Güneydoğu (Keşişleme)', 'Güney (Kıble)', 'Güneybatı (Lodos)', 'Batı (Günbatısı)', 'Kuzeybatı (Karayel)'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function getWeatherText(code: number): string {
  if (code === 0) return 'Açık & Güneşli';
  if (code === 1 || code === 2) return 'Parçalı Bulutlu';
  if (code === 3) return 'Bulutlu';
  if (code >= 45 && code <= 48) return 'Sisli';
  if (code >= 51 && code <= 55) return 'Hafif Çisenti';
  if (code >= 61 && code <= 65) return 'Yağmurlu';
  if (code >= 71 && code <= 77) return 'Karlı';
  if (code >= 80 && code <= 82) return 'Sağanak Yağış';
  if (code >= 95) return 'Fırtınalı';
  return 'Genel Olarak Açık';
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ currentLocation }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const lat = currentLocation?.lat || 41.0082;
  const lng = currentLocation?.lng || 28.9784;

  const fetchWeather = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.current) {
        const cur = data.current;
        const temp = Math.round(cur.temperature_2m);
        const apparent = Math.round(cur.apparent_temperature);
        const windSpeed = Math.round(cur.wind_speed_10m);
        const windDir = cur.wind_direction_10m;
        const precip = cur.precipitation || 0;
        const code = cur.weather_code || 0;

        // Calculate cycling comfort score out of 100
        let score = 95;
        if (windSpeed > 25) score -= 20;
        else if (windSpeed > 15) score -= 10;

        if (temp < 8) score -= 20;
        else if (temp > 32) score -= 20;
        else if (temp >= 16 && temp <= 24) score += 5;

        if (precip > 0.5) score -= 35;
        else if (precip > 0) score -= 15;

        score = Math.max(20, Math.min(100, score));

        let advice = 'Mükemmel sürüş havası! Kadansınızı koruyun.';
        if (windSpeed > 22) advice = 'Rüzgar sert; aero pozisyona geçin ve peloton arkasına sığının.';
        if (precip > 0) advice = 'Zemin ıslak olabilir; virajlarda fren mesafesine dikkat edin.';
        if (temp < 10) advice = 'Hava serin; rüzgar geçirmez yelek ve eldiven önerilir.';

        setWeather({
          temp,
          apparentTemp: apparent,
          windSpeedKmH: windSpeed,
          windDirectionDeg: windDir,
          windDirectionText: getWindDirectionText(windDir),
          humidity: Math.round(cur.relative_humidity_2m),
          precipitationMm: precip,
          weatherCode: code,
          weatherText: getWeatherText(code),
          cyclingScore: score,
          cyclingAdvice: advice,
        });
        setLastUpdated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
      setErrorMsg('Canlı hava durumu verisi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 mins
    return () => clearInterval(interval);
  }, [lat, lng]);

  if (!weather && errorMsg) {
    return (
      <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <button
          type="button"
          onClick={fetchWeather}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#F4F4F6] hover:bg-[#EAEAEF] text-xs font-bold text-[#242428] border border-[#E5E5EB] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Tekrar Dene</span>
        </button>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 border-b border-[#ECEEF2] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FC4C02]/10 text-[#FC4C02]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#18181B]">
              Bisiklet Hava ve Rüzgar Durumu
            </h3>
            <span className="text-[11px] text-[#71717A]">
              GPS Konumu · Güncelleme: {lastUpdated || 'Az önce'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchWeather}
          disabled={loading}
          className="p-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#71717A] hover:text-[#FC4C02] border border-[#E2E4E9] transition cursor-pointer"
          title="Hava Durumunu Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hairline-divided 4-Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] border border-[#ECEEF2] rounded-lg bg-[#F8F9FA]">
        <div className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Sıcaklık</span>
            <div className="text-xl font-bold font-mono text-[#18181B]">
              {weather.temp}°<small className="text-xs text-[#71717A]">C</small>
            </div>
            <span className="text-[11px] text-[#71717A] truncate block">
              {weather.weatherText}
            </span>
          </div>
          <Sun className="w-5 h-5 text-amber-500" />
        </div>

        <div className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Rüzgar</span>
            <div className="text-xl font-bold font-mono text-[#FC4C02]">
              {weather.windSpeedKmH} <small className="text-xs text-[#71717A]">km/sa</small>
            </div>
            <span className="text-[11px] text-[#71717A] truncate block">
              {weather.windDirectionText.split(' ')[0]}
            </span>
          </div>
          <div
            className="w-7 h-7 rounded-full bg-white border border-[#E2E4E9] flex items-center justify-center text-[#FC4C02] transition-transform duration-500"
            style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
            title={`Rüzgar Yönü: ${weather.windDirectionDeg}°`}
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        <div className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Nem ve Yağış</span>
            <div className="text-xl font-bold font-mono text-[#18181B]">
              %{weather.humidity}
            </div>
            <span className="text-[11px] text-[#71717A] block">
              {weather.precipitationMm > 0 ? `${weather.precipitationMm} mm yağış` : 'Kuru zemin'}
            </span>
          </div>
          <Droplets className="w-5 h-5 text-sky-500" />
        </div>

        <div className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Sürüş Skoru</span>
            <div className="text-xl font-bold font-mono text-[#FC4C02]">
              %{weather.cyclingScore}
            </div>
            <span className="text-[11px] text-[#52525B] font-semibold block">
              {weather.cyclingScore >= 80 ? 'Mükemmel' : weather.cyclingScore >= 60 ? 'Uygun' : 'Zorlayıcı'}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#FC4C02]" />
        </div>
      </div>

      {/* Weather Advice Note */}
      <div className="mt-3 pt-2.5 border-t border-[#ECEEF2] flex items-center gap-2 text-xs text-[#52525B]">
        <span className="text-[#18181B] font-semibold shrink-0">Sürüş Tavsiyesi:</span>
        <span className="truncate">{weather.cyclingAdvice}</span>
      </div>
    </div>
  );
};

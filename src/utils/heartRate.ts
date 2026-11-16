import { HeartRateZoneInfo, HrZoneDistribution } from '../types';

export const DEFAULT_MAX_HR = 190;

export function getHeartRateZones(maxHr: number = DEFAULT_MAX_HR): HeartRateZoneInfo[] {
  return [
    {
      zone: 1,
      name: 'Bölge 1: Aktif Yenilenme',
      minBpm: 0,
      maxBpm: Math.round(maxHr * 0.6),
      color: '#38bdf8', // sky
      bgLight: 'rgba(56, 189, 248, 0.15)',
      description: 'Isınma, toparlanma ve laktat temizliği (< %60 Maks Nabız)'
    },
    {
      zone: 2,
      name: 'Bölge 2: Yağ Yakımı & Dayanıklılık',
      minBpm: Math.round(maxHr * 0.6),
      maxBpm: Math.round(maxHr * 0.7),
      color: '#34d399', // emerald
      bgLight: 'rgba(52, 211, 153, 0.15)',
      description: 'Temel aerobik kapasite ve mitokondri gelişimi (%60 - %70)'
    },
    {
      zone: 3,
      name: 'Bölge 3: Tempo & Ritim',
      minBpm: Math.round(maxHr * 0.7),
      maxBpm: Math.round(maxHr * 0.8),
      color: '#F59E0B', // amber tempo
      bgLight: 'rgba(245, 158, 11, 0.12)',
      description: 'Grup sürüşü ve sabit hızlı tempo antrenmanı (%70 - %80)'
    },
    {
      zone: 4,
      name: 'Bölge 4: Laktat Eşiği (FTP)',
      minBpm: Math.round(maxHr * 0.8),
      maxBpm: Math.round(maxHr * 0.9),
      color: '#FC4C02', // pro orange threshold
      bgLight: 'rgba(252, 76, 2, 0.12)',
      description: 'Zorlu tırmanışlar ve kaçış atakları sürdürme (%80 - %90)'
    },
    {
      zone: 5,
      name: 'Bölge 5: Maksimum Efor & VO2 Max',
      minBpm: Math.round(maxHr * 0.9),
      maxBpm: maxHr,
      color: '#f87171', // red
      bgLight: 'rgba(248, 113, 113, 0.15)',
      description: 'Sprint finişi ve yüksek anaerobik patlama (> %90)'
    }
  ];
}

export function getCurrentZone(bpm: number, maxHr: number = DEFAULT_MAX_HR): HeartRateZoneInfo {
  const zones = getHeartRateZones(maxHr);
  if (bpm <= 0) return zones[0];
  if (bpm < zones[0].maxBpm) return zones[0];
  if (bpm < zones[1].maxBpm) return zones[1];
  if (bpm < zones[2].maxBpm) return zones[2];
  if (bpm < zones[3].maxBpm) return zones[3];
  return zones[4];
}

export function calculateEstimatedCalories(
  durationSec: number,
  avgHr: number,
  weightKg: number = 72,
  age: number = 28
): number {
  if (durationSec <= 0 || avgHr <= 40) return 0;
  const hours = durationSec / 3600;
  // Keytel formula for cycling energy expenditure
  const kcalPerMinute = ((-55.0969 + (0.6309 * avgHr) + (0.1988 * weightKg) + (0.2017 * age)) / 4.184);
  const total = Math.max(1, Math.round(kcalPerMinute * (durationSec / 60)));
  return isNaN(total) ? Math.round(hours * 550) : total;
}

export function calculateZonePercentages(distribution?: HrZoneDistribution): { z1: number; z2: number; z3: number; z4: number; z5: number } {
  if (!distribution) return { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  const total = (distribution.z1Sec || 0) + (distribution.z2Sec || 0) + (distribution.z3Sec || 0) + (distribution.z4Sec || 0) + (distribution.z5Sec || 0);
  if (total <= 0) return { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  return {
    z1: Math.round((distribution.z1Sec / total) * 100),
    z2: Math.round((distribution.z2Sec / total) * 100),
    z3: Math.round((distribution.z3Sec / total) * 100),
    z4: Math.round((distribution.z4Sec / total) * 100),
    z5: Math.round((distribution.z5Sec / total) * 100),
  };
}

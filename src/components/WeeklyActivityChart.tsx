import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Activity, BarChart3, TrendingUp } from 'lucide-react';
import { SavedRide } from '../types';

interface WeeklyActivityChartProps {
  savedRides: SavedRide[];
}

interface DayBucket {
  dayKey: string;
  shortLabel: string;
  fullDateLabel: string;
  distanceKm: number;
  durationSec: number;
  climbM: number;
  ridesCount: number;
  isToday: boolean;
}

type ChartMode = 'bar' | 'area';

function getLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDurationCompact(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (hours > 0) {
    return `${hours} sa ${mins} dk`;
  }
  return `${mins} dk`;
}

interface TooltipPayloadItem {
  payload?: DayBucket;
}

const CustomActivityTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (!active || !payload || !payload.length || !payload[0]?.payload) {
    return null;
  }

  const d = payload[0].payload;

  return (
    <div className="bg-[#242428] text-white px-3.5 py-2.5 rounded-xl border border-[#3B3B42] shadow-lg text-xs min-w-[165px]">
      <div className="font-bold text-[#F3F4F6] mb-1.5 flex items-center justify-between gap-3">
        <span>{d.fullDateLabel}</span>
        {d.isToday && (
          <span className="text-[10px] font-semibold text-[#FC4C02]">Bugün</span>
        )}
      </div>
      <div className="space-y-1 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#9CA3AF] font-sans text-[11px]">Mesafe</span>
          <span className="font-black text-[#FC4C02]">
            {d.distanceKm.toFixed(1)} km
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#9CA3AF] font-sans text-[11px]">Sürüş</span>
          <span className="font-semibold text-white">{d.ridesCount} kayıt</span>
        </div>
        {d.ridesCount > 0 && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#9CA3AF] font-sans text-[11px]">Süre</span>
              <span className="font-semibold text-white">
                {formatDurationCompact(d.durationSec)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#9CA3AF] font-sans text-[11px]">Tırmanış</span>
              <span className="font-semibold text-white">
                {Math.round(d.climbM)} m
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  savedRides,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('bar');

  const { days, totalKm, avgKm, totalRides, totalDurationSec, peakDay } =
    useMemo(() => {
      const now = new Date();
      const todayKey = getLocalDayKey(now);
      const buckets: DayBucket[] = [];
      const bucketByKey = new Map<string, DayBucket>();

      const weekdayFormatter = new Intl.DateTimeFormat('tr-TR', {
        weekday: 'short',
      });
      const fullDateFormatter = new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      });

      for (let offset = 6; offset >= 0; offset--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - offset
        );
        const key = getLocalDayKey(d);
        const isToday = key === todayKey;
        const shortDay = weekdayFormatter
          .format(d)
          .replace('.', '');
        const bucket: DayBucket = {
          dayKey: key,
          shortLabel: isToday ? 'Bugün' : shortDay,
          fullDateLabel: fullDateFormatter.format(d),
          distanceKm: 0,
          durationSec: 0,
          climbM: 0,
          ridesCount: 0,
          isToday,
        };
        buckets.push(bucket);
        bucketByKey.set(key, bucket);
      }

      for (const ride of savedRides) {
        if (!ride?.date) continue;
        const parsed = new Date(ride.date);
        if (Number.isNaN(parsed.getTime())) continue;
        const rideKey = getLocalDayKey(parsed);
        const target = bucketByKey.get(rideKey);
        if (!target) continue;

        target.distanceKm += Number(ride.distanceKm) || 0;
        target.durationSec += Number(ride.durationSec) || 0;
        target.climbM += Number(ride.climbM) || 0;
        target.ridesCount += 1;
      }

      for (const b of buckets) {
        b.distanceKm = Math.round(b.distanceKm * 100) / 100;
      }

      const sumKm = buckets.reduce((acc, b) => acc + b.distanceKm, 0);
      const sumRides = buckets.reduce((acc, b) => acc + b.ridesCount, 0);
      const sumDuration = buckets.reduce((acc, b) => acc + b.durationSec, 0);

      let maxDay: DayBucket | null = null;
      for (const b of buckets) {
        if (b.distanceKm > 0 && (!maxDay || b.distanceKm > maxDay.distanceKm)) {
          maxDay = b;
        }
      }

      return {
        days: buckets,
        totalKm: sumKm,
        avgKm: sumKm / 7,
        totalRides: sumRides,
        totalDurationSec: sumDuration,
        peakDay: maxDay,
      };
    }, [savedRides]);

  const yDomainMax = useMemo(() => {
    const maxVal = Math.max(...days.map((d) => d.distanceKm), 0);
    if (maxVal <= 0) return 10;
    return Math.ceil(maxVal * 1.2);
  }, [days]);

  return (
    <section
      aria-label="Son 7 Günlük Sürüş Mesafesi Grafiği"
      className="bg-white border border-[#E5E5EB] rounded-2xl p-4 sm:p-5 shadow-xs"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F0F4] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF2ED] border border-[#FED7C7] flex items-center justify-center text-[#FC4C02] shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#242428]">
              Son 7 Gün Aktivite Grafiği
            </h3>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Günlük sürüş mesafesi (km) · {days[0]?.fullDateLabel} –{' '}
              {days[days.length - 1]?.fullDateLabel}
            </p>
          </div>
        </div>

        {/* Interactive Chart Type Switcher */}
        <div
          role="group"
          aria-label="Grafik görünümü"
          className="inline-flex items-center bg-[#F4F4F6] p-1 rounded-xl border border-[#E5E5EB] self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setChartMode('bar')}
            aria-pressed={chartMode === 'bar'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              chartMode === 'bar'
                ? 'bg-white text-[#242428] shadow-xs border border-[#E5E5EB]'
                : 'text-[#6B7280] hover:text-[#242428]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span>Çubuk</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('area')}
            aria-pressed={chartMode === 'area'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              chartMode === 'area'
                ? 'bg-white text-[#242428] shadow-xs border border-[#E5E5EB]'
                : 'text-[#6B7280] hover:text-[#242428]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span>Alan</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Strip (Tabular Figures, Single Level) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0F0F4] border-b border-[#F0F0F4] py-3">
        <div className="pb-2 sm:pb-0 sm:pr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
            7 Gün Toplam
          </span>
          <strong className="text-base sm:text-lg font-black font-mono tabular-nums text-[#FC4C02]">
            {totalKm.toFixed(1)}{' '}
            <span className="text-[11px] font-bold text-[#6B7280]">km</span>
          </strong>
        </div>

        <div className="pb-2 sm:pb-0 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
            Günlük Ortalama
          </span>
          <strong className="text-base sm:text-lg font-black font-mono tabular-nums text-[#242428]">
            {avgKm.toFixed(1)}{' '}
            <span className="text-[11px] font-bold text-[#6B7280]">km</span>
          </strong>
        </div>

        <div className="pt-2 sm:pt-0 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
            Sürüş / Süre
          </span>
          <strong className="text-base sm:text-lg font-black font-mono tabular-nums text-[#242428]">
            {totalRides}{' '}
            <span className="text-[11px] font-semibold text-[#6B7280] font-sans">
              · {formatDurationCompact(totalDurationSec)}
            </span>
          </strong>
        </div>

        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
            En Yoğun Gün
          </span>
          <strong className="text-base sm:text-lg font-black font-mono tabular-nums text-[#242428]">
            {peakDay ? (
              <>
                {peakDay.distanceKm.toFixed(1)}{' '}
                <span className="text-[11px] font-semibold text-[#6B7280] font-sans">
                  km ({peakDay.shortLabel})
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[#9CA3AF]">—</span>
            )}
          </strong>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="pt-4">
        <div className="w-full min-w-0 h-[224px]">
          <ResponsiveContainer width="100%" height={224}>
            {chartMode === 'bar' ? (
              <BarChart
                data={days}
                margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EFEFF4"
                />
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                  dy={6}
                />
                <YAxis
                  domain={[0, yDomainMax]}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(val: number) => `${val} km`}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(252, 76, 2, 0.06)' }}
                  content={<CustomActivityTooltip />}
                />
                <Bar
                  dataKey="distanceKm"
                  name="Mesafe"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={42}
                >
                  {days.map((entry) => (
                    <Cell
                      key={entry.dayKey}
                      fill={
                        entry.distanceKm <= 0
                          ? '#E5E5EB'
                          : entry.isToday
                          ? '#FC4C02'
                          : '#FB7A43'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart
                data={days}
                margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="pelWeeklyKmFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FC4C02" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#FC4C02" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EFEFF4"
                />
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                  dy={6}
                />
                <YAxis
                  domain={[0, yDomainMax]}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(val: number) => `${val} km`}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip content={<CustomActivityTooltip />} />
                <Area
                  type="monotone"
                  dataKey="distanceKm"
                  name="Mesafe"
                  stroke="#FC4C02"
                  strokeWidth={2.5}
                  fill="url(#pelWeeklyKmFill)"
                  activeDot={{
                    r: 5,
                    fill: '#FC4C02',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {totalKm === 0 && (
          <p className="mt-2.5 text-center text-[11px] text-[#6B7280] bg-[#FAFAFC] border border-[#F0F0F4] rounded-xl py-2 px-3">
            Son 7 günde henüz kaydedilmiş sürüş bulunmuyor. Harita üzerinden yeni bir sürüş kaydettiğinizde günlük mesafe grafiğiniz burada otomatik olarak güncellenir.
          </p>
        )}
      </div>
    </section>
  );
};

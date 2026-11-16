import { EvaluatedBadge, MilestoneBadge, PersistedUserBadge, SavedRide } from '../types';

export const MILESTONE_BADGES: MilestoneBadge[] = [
  {
    id: 'first_ride',
    title: 'İlk Pedal',
    description: 'İlk GPS sürüşünü kaydet ve PEL yolculuğuna başla.',
    category: 'consistency',
    tier: 'bronze',
    iconKey: 'flag',
    xpReward: 50,
    targetValue: 1,
    unit: 'sürüş',
  },
  {
    id: 'early_bird',
    title: 'Erken Kuş Sürüşü',
    description: 'Saat 08:00 öncesinde bir sürüş başlat veya tamamla.',
    category: 'time',
    tier: 'bronze',
    iconKey: 'sunrise',
    xpReward: 100,
    targetValue: 1,
    unit: 'sürüş',
  },
  {
    id: 'night_owl',
    title: 'Gece Sürüşü',
    description: 'Saat 20:00 sonrasında akşam sürüşü tamamla.',
    category: 'time',
    tier: 'silver',
    iconKey: 'moon',
    xpReward: 100,
    targetValue: 1,
    unit: 'sürüş',
  },
  {
    id: 'total_100km',
    title: '100 km Toplam',
    description: 'Tüm sürüşlerinde toplam 100 km mesafeye ulaş.',
    category: 'distance',
    tier: 'silver',
    iconKey: 'compass',
    xpReward: 250,
    targetValue: 100,
    unit: 'km',
  },
  {
    id: 'total_500km',
    title: '500 km Yolcu',
    description: 'Tüm sürüşlerinde toplam 500 km mesafeye ulaş.',
    category: 'distance',
    tier: 'gold',
    iconKey: 'compass',
    xpReward: 500,
    targetValue: 500,
    unit: 'km',
  },
  {
    id: 'total_1000km',
    title: '1.000 km Ultra',
    description: 'Tüm sürüşlerinde toplam 1.000 km barajını aş.',
    category: 'distance',
    tier: 'pro',
    iconKey: 'award',
    xpReward: 1000,
    targetValue: 1000,
    unit: 'km',
  },
  {
    id: 'single_50km',
    title: 'Gran Fondo 50',
    description: 'Tek bir sürüşte en az 50 km mesafe katet.',
    category: 'distance',
    tier: 'silver',
    iconKey: 'zap',
    xpReward: 200,
    targetValue: 50,
    unit: 'km',
  },
  {
    id: 'single_100km',
    title: 'Century 100',
    description: 'Tek bir sürüşte kesintisiz 100 km tamamla.',
    category: 'distance',
    tier: 'gold',
    iconKey: 'flame',
    xpReward: 450,
    targetValue: 100,
    unit: 'km',
  },
  {
    id: 'climb_1000m',
    title: 'Tırmanış Avcısı',
    description: 'Toplam 1.000 m irtifa kazanımı elde et.',
    category: 'elevation',
    tier: 'silver',
    iconKey: 'mountain',
    xpReward: 200,
    targetValue: 1000,
    unit: 'm',
  },
  {
    id: 'climb_5000m',
    title: 'Alpinist',
    description: 'Toplam 5.000 m kümülatif tırmanışa ulaş.',
    category: 'elevation',
    tier: 'pro',
    iconKey: 'mountain',
    xpReward: 600,
    targetValue: 5000,
    unit: 'm',
  },
  {
    id: 'speed_45kmh',
    title: 'Hız Tutkunu',
    description: 'Bir sürüşte en az 45 km/s maksimum hıza ulaş.',
    category: 'performance',
    tier: 'silver',
    iconKey: 'gauge',
    xpReward: 150,
    targetValue: 45,
    unit: 'km/s',
  },
  {
    id: 'jump_20',
    title: 'Atlama Ustası',
    description: 'Sürüşlerinde toplam 20 atlama veya rampa geçişi kaydet.',
    category: 'performance',
    tier: 'gold',
    iconKey: 'zap',
    xpReward: 200,
    targetValue: 20,
    unit: 'atlama',
  },
  {
    id: 'rides_10',
    title: 'İstikrarlı Sporcu',
    description: 'Toplam 10 farklı sürüş aktivitesi tamamla.',
    category: 'consistency',
    tier: 'gold',
    iconKey: 'calendar',
    xpReward: 300,
    targetValue: 10,
    unit: 'sürüş',
  },
  {
    id: 'weekend_rider',
    title: 'Hafta Sonu Savaşçısı',
    description: 'Cumartesi veya Pazar günü en az 25 km tek sürüş yap.',
    category: 'time',
    tier: 'bronze',
    iconKey: 'calendar',
    xpReward: 120,
    targetValue: 25,
    unit: 'km',
  },
];

function getRideStartDate(ride: SavedRide): Date {
  const firstPointTs = ride.points?.[0]?.ts;
  if (typeof firstPointTs === 'number' && Number.isFinite(firstPointTs) && firstPointTs > 0) {
    return new Date(firstPointTs);
  }
  const parsed = new Date(ride.date);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function evaluateUserBadges(
  savedRides: SavedRide[],
  persistedBadges: PersistedUserBadge[] = []
): EvaluatedBadge[] {
  const sortedChronological = [...savedRides].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const persistedMap = new Map<string, PersistedUserBadge>();
  for (const pb of persistedBadges) {
    persistedMap.set(pb.badgeId, pb);
  }

  let runningDistance = 0;
  let runningClimb = 0;
  let runningJumps = 0;
  let runningRides = 0;

  let firstRideMatch: SavedRide | undefined;
  let earlyBirdMatch: SavedRide | undefined;
  let nightOwlMatch: SavedRide | undefined;
  let total100Match: SavedRide | undefined;
  let total500Match: SavedRide | undefined;
  let total1000Match: SavedRide | undefined;
  let single50Match: SavedRide | undefined;
  let single100Match: SavedRide | undefined;
  let climb1000Match: SavedRide | undefined;
  let climb5000Match: SavedRide | undefined;
  let speed45Match: SavedRide | undefined;
  let jump20Match: SavedRide | undefined;
  let rides10Match: SavedRide | undefined;
  let weekendMatch: SavedRide | undefined;

  let maxSingleDist = 0;
  let maxSpeedObserved = 0;
  let maxWeekendDist = 0;

  for (const ride of sortedChronological) {
    runningRides += 1;
    runningDistance += Number(ride.distanceKm || 0);
    runningClimb += Number(ride.climbM || 0);
    runningJumps += Number(ride.jumpCount || 0);

    const rideDist = Number(ride.distanceKm || 0);
    const rideSpeed = Number(ride.maxSpeedKmH || 0);
    maxSingleDist = Math.max(maxSingleDist, rideDist);
    maxSpeedObserved = Math.max(maxSpeedObserved, rideSpeed);

    const startDate = getRideStartDate(ride);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();

    if (!firstRideMatch) firstRideMatch = ride;
    if (!earlyBirdMatch && hour < 8) earlyBirdMatch = ride;
    if (!nightOwlMatch && hour >= 20) nightOwlMatch = ride;
    if (!total100Match && runningDistance >= 100) total100Match = ride;
    if (!total500Match && runningDistance >= 500) total500Match = ride;
    if (!total1000Match && runningDistance >= 1000) total1000Match = ride;
    if (!single50Match && rideDist >= 50) single50Match = ride;
    if (!single100Match && rideDist >= 100) single100Match = ride;
    if (!climb1000Match && runningClimb >= 1000) climb1000Match = ride;
    if (!climb5000Match && runningClimb >= 5000) climb5000Match = ride;
    if (!speed45Match && rideSpeed >= 45) speed45Match = ride;
    if (!jump20Match && runningJumps >= 20) jump20Match = ride;
    if (!rides10Match && runningRides >= 10) rides10Match = ride;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      maxWeekendDist = Math.max(maxWeekendDist, rideDist);
      if (!weekendMatch && rideDist >= 25) {
        weekendMatch = ride;
      }
    }
  }

  return MILESTONE_BADGES.map((badge) => {
    let currentValue = 0;
    let triggerRide: SavedRide | undefined;

    switch (badge.id) {
      case 'first_ride':
        currentValue = runningRides;
        triggerRide = firstRideMatch;
        break;
      case 'early_bird':
        currentValue = earlyBirdMatch ? 1 : 0;
        triggerRide = earlyBirdMatch;
        break;
      case 'night_owl':
        currentValue = nightOwlMatch ? 1 : 0;
        triggerRide = nightOwlMatch;
        break;
      case 'total_100km':
        currentValue = Math.round(runningDistance * 10) / 10;
        triggerRide = total100Match;
        break;
      case 'total_500km':
        currentValue = Math.round(runningDistance * 10) / 10;
        triggerRide = total500Match;
        break;
      case 'total_1000km':
        currentValue = Math.round(runningDistance * 10) / 10;
        triggerRide = total1000Match;
        break;
      case 'single_50km':
        currentValue = Math.round(maxSingleDist * 10) / 10;
        triggerRide = single50Match;
        break;
      case 'single_100km':
        currentValue = Math.round(maxSingleDist * 10) / 10;
        triggerRide = single100Match;
        break;
      case 'climb_1000m':
        currentValue = Math.round(runningClimb);
        triggerRide = climb1000Match;
        break;
      case 'climb_5000m':
        currentValue = Math.round(runningClimb);
        triggerRide = climb5000Match;
        break;
      case 'speed_45kmh':
        currentValue = Math.round(maxSpeedObserved * 10) / 10;
        triggerRide = speed45Match;
        break;
      case 'jump_20':
        currentValue = runningJumps;
        triggerRide = jump20Match;
        break;
      case 'rides_10':
        currentValue = runningRides;
        triggerRide = rides10Match;
        break;
      case 'weekend_rider':
        currentValue = Math.round(maxWeekendDist * 10) / 10;
        triggerRide = weekendMatch;
        break;
      default:
        break;
    }

    const persisted = persistedMap.get(badge.id);
    const unlocked = Boolean(persisted || triggerRide || currentValue >= badge.targetValue);
    const clampedCurrent = unlocked ? Math.max(currentValue, badge.targetValue) : currentValue;
    const progressPct = unlocked
      ? 100
      : Math.min(99, Math.max(0, Math.round((clampedCurrent / badge.targetValue) * 100)));

    return {
      ...badge,
      unlocked,
      unlockedAt: persisted?.unlockedAt || triggerRide?.date,
      triggerRideTitle: persisted?.triggerRideTitle || triggerRide?.title,
      currentValue: clampedCurrent,
      progressPct,
    };
  });
}

export function getBadgeTierLabel(tier: MilestoneBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'Bronz';
    case 'silver':
      return 'Gümüş';
    case 'gold':
      return 'Altın';
    case 'pro':
      return 'Pro';
  }
}

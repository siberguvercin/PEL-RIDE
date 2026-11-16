import { LeagueTier, RankedDivision } from '../types';

export const RANKED_DIVISIONS: RankedDivision[] = [
  {
    tier: 'Bronze',
    division: 1,
    name: 'Bronz I',
    rankTitle: 'Çaylak Pedal',
    minPoints: 0,
    maxPoints: 349,
    color: '#cd7f32',
    badgeBg: 'from-[#3a2618] to-[#20150d]',
    glowColor: 'rgba(205, 127, 50, 0.4)',
    borderColor: '#8c5324',
    icon: '🥉'
  },
  {
    tier: 'Bronze',
    division: 2,
    name: 'Bronz II',
    rankTitle: 'Yol Çaylağı',
    minPoints: 350,
    maxPoints: 699,
    color: '#d68c45',
    badgeBg: 'from-[#422c1b] to-[#24170e]',
    glowColor: 'rgba(214, 140, 69, 0.4)',
    borderColor: '#995f2d',
    icon: '🥉'
  },
  {
    tier: 'Bronze',
    division: 3,
    name: 'Bronz III',
    rankTitle: 'Peloton Adayı',
    minPoints: 700,
    maxPoints: 999,
    color: '#e09858',
    badgeBg: 'from-[#4a321f] to-[#291a10]',
    glowColor: 'rgba(224, 152, 88, 0.45)',
    borderColor: '#ab6c35',
    icon: '🥉'
  },
  {
    tier: 'Silver',
    division: 1,
    name: 'Gümüş I',
    rankTitle: 'İstikrarlı Rüzgar',
    minPoints: 1000,
    maxPoints: 1499,
    color: '#c0c0c0',
    badgeBg: 'from-[#2a343a] to-[#141b1f]',
    glowColor: 'rgba(192, 192, 192, 0.4)',
    borderColor: '#82959e',
    icon: '🥈'
  },
  {
    tier: 'Silver',
    division: 2,
    name: 'Gümüş II',
    rankTitle: 'Kadans Ustası',
    minPoints: 1500,
    maxPoints: 1999,
    color: '#d4d8db',
    badgeBg: 'from-[#323d45] to-[#171f24]',
    glowColor: 'rgba(212, 216, 219, 0.45)',
    borderColor: '#97a6af',
    icon: '🥈'
  },
  {
    tier: 'Silver',
    division: 3,
    name: 'Gümüş III',
    rankTitle: 'Yol Savaşçısı',
    minPoints: 2000,
    maxPoints: 2499,
    color: '#e2e6e8',
    badgeBg: 'from-[#3b4750] to-[#1a2329]',
    glowColor: 'rgba(226, 230, 232, 0.5)',
    borderColor: '#abbbc5',
    icon: '🥈'
  },
  {
    tier: 'Gold',
    division: 1,
    name: 'Altın I',
    rankTitle: 'Peloton Öncüsü',
    minPoints: 2500,
    maxPoints: 3199,
    color: '#ffd700',
    badgeBg: 'from-[#423a13] to-[#211d08]',
    glowColor: 'rgba(255, 215, 0, 0.45)',
    borderColor: '#b89c00',
    icon: '🥇'
  },
  {
    tier: 'Gold',
    division: 2,
    name: 'Altın II',
    rankTitle: 'Tırmanış Avcısı',
    minPoints: 3200,
    maxPoints: 3899,
    color: '#ffdf33',
    badgeBg: 'from-[#4d4317] to-[#262109]',
    glowColor: 'rgba(255, 223, 51, 0.5)',
    borderColor: '#cca800',
    icon: '🥇'
  },
  {
    tier: 'Gold',
    division: 3,
    name: 'Altın III',
    rankTitle: 'Dağlar Kralı (KOM)',
    minPoints: 3900,
    maxPoints: 4499,
    color: '#ffe666',
    badgeBg: 'from-[#574c1a] to-[#2c260b]',
    glowColor: 'rgba(255, 230, 102, 0.55)',
    borderColor: '#e6be00',
    icon: '🥇'
  },
  {
    tier: 'Platinum',
    division: 1,
    name: 'Platin I',
    rankTitle: 'Aero Roket',
    minPoints: 4500,
    maxPoints: 5299,
    color: '#00e5ff',
    badgeBg: 'from-[#0b3842] to-[#051c21]',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    borderColor: '#00a3b5',
    icon: '💠'
  },
  {
    tier: 'Platinum',
    division: 2,
    name: 'Platin II',
    rankTitle: 'Sprint Lideri',
    minPoints: 5300,
    maxPoints: 6199,
    color: '#33ebff',
    badgeBg: 'from-[#0e4450] to-[#072228]',
    glowColor: 'rgba(51, 235, 255, 0.5)',
    borderColor: '#00c4db',
    icon: '💠'
  },
  {
    tier: 'Platinum',
    division: 3,
    name: 'Platin III',
    rankTitle: 'Zamankarşı Canavarı',
    minPoints: 6200,
    maxPoints: 6999,
    color: '#66f0ff',
    badgeBg: 'from-[#12515e] to-[#082930]',
    glowColor: 'rgba(102, 240, 255, 0.55)',
    borderColor: '#00e5ff',
    icon: '💠'
  },
  {
    tier: 'Diamond',
    division: 1,
    name: 'Elmas I',
    rankTitle: 'Elit Kadro',
    minPoints: 7000,
    maxPoints: 7999,
    color: '#b347ff',
    badgeBg: 'from-[#371352] to-[#1a0826]',
    glowColor: 'rgba(179, 71, 255, 0.5)',
    borderColor: '#9320e6',
    icon: '💎'
  },
  {
    tier: 'Diamond',
    division: 2,
    name: 'Elmas II',
    rankTitle: 'Podyum Canavarı',
    minPoints: 8000,
    maxPoints: 8999,
    color: '#c266ff',
    badgeBg: 'from-[#421763] to-[#200a30]',
    glowColor: 'rgba(194, 102, 255, 0.55)',
    borderColor: '#a938fa',
    icon: '💎'
  },
  {
    tier: 'Diamond',
    division: 3,
    name: 'Elmas III',
    rankTitle: 'Efsane Tırmanıcı',
    minPoints: 9000,
    maxPoints: 9999,
    color: '#d185ff',
    badgeBg: 'from-[#4c1b73] to-[#260c3b]',
    glowColor: 'rgba(209, 133, 255, 0.6)',
    borderColor: '#be52ff',
    icon: '💎'
  },
  {
    tier: 'Champion',
    division: 1,
    name: 'Şampiyon (Elite)',
    rankTitle: 'Pro Peloton Kaptanı',
    minPoints: 10000,
    maxPoints: 14999,
    color: '#ff3d3d',
    badgeBg: 'from-[#4d0f0f] to-[#240606]',
    glowColor: 'rgba(255, 61, 61, 0.6)',
    borderColor: '#e61e1e',
    icon: '🏆'
  },
  {
    tier: 'Unreal',
    name: 'UNREAL',
    rankTitle: 'DURDURULAMAZ HÜKÜMDAR',
    minPoints: 15000,
    maxPoints: 999999,
    color: '#c5f36b',
    badgeBg: 'from-[#192b0e] via-[#321350] to-[#0c1a06]',
    glowColor: 'rgba(197, 243, 107, 0.7)',
    borderColor: '#c5f36b',
    icon: '👑'
  }
];

export function calculateUserRank(stats: {
  totalDistanceKm: number;
  totalClimbM: number;
  ftpWatts: number;
  ridesCount: number;
}) {
  // Activity stats + power performance based RP formula
  const distancePoints = Math.round(stats.totalDistanceKm * 18);
  const climbPoints = Math.round(stats.totalClimbM * 0.9);
  const powerPoints = Math.round((stats.ftpWatts || 200) * 8.5);
  const rideBonus = stats.ridesCount * 80;

  const totalPoints = Math.max(120, distancePoints + climbPoints + powerPoints + rideBonus);

  // Find division
  let currentDiv = RANKED_DIVISIONS[0];
  let nextDiv: RankedDivision | null = RANKED_DIVISIONS[1];

  for (let i = 0; i < RANKED_DIVISIONS.length; i++) {
    const div = RANKED_DIVISIONS[i];
    if (totalPoints >= div.minPoints) {
      currentDiv = div;
      nextDiv = RANKED_DIVISIONS[i + 1] || null;
    }
  }

  // Calculate percentage in current division
  let progressPct = 100;
  let pointsInTier = totalPoints - currentDiv.minPoints;
  let tierRange = currentDiv.maxPoints - currentDiv.minPoints;

  if (nextDiv) {
    tierRange = nextDiv.minPoints - currentDiv.minPoints;
    progressPct = Math.min(100, Math.max(0, Math.round((pointsInTier / tierRange) * 100)));
  }

  return {
    points: totalPoints,
    division: currentDiv,
    nextDivision: nextDiv,
    progressPct,
    pointsToNext: nextDiv ? nextDiv.minPoints - totalPoints : 0,
    breakdown: {
      distance: distancePoints,
      climb: climbPoints,
      power: powerPoints,
      rides: rideBonus
    }
  };
}

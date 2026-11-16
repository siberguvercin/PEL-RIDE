import { CyclingRoute, RouteDifficultyAssessment } from '../types';

/**
 * Automatically calculates route difficulty level ('Kolay' | 'Orta' | 'Zor')
 * using physical cycling biomechanics & terrain metrics:
 * 1. Elevation & Gradient Work (Climb meters, climb density m/km, max and average gradient %)
 * 2. Distance Endurance Factor (Metabolic and glycogen fatigue over distance in km)
 * 3. Surface Rolling Resistance Crr (Smooth asphalt 1.0x, gravel/dirt 1.30x, rough/rocky 1.45x)
 */
export function calculateDynamicRouteDifficulty(params: {
  distanceKm: number;
  climbM: number;
  maxGradientPct?: number;
  avgGradientPct?: number;
  surface?: string;
}): RouteDifficultyAssessment {
  const dist = Math.max(1, params.distanceKm);
  const climb = Math.max(0, params.climbM);
  const maxGrad = Math.max(0, params.maxGradientPct || 0);
  const avgGrad = Math.max(0, params.avgGradientPct || 0);
  const surfaceStr = (params.surface || '').toLowerCase();

  // 1. Elevation & Gradient Workload:
  // Climbing density (meters gained per km)
  const climbDensity = climb / dist; // e.g. 1.5 m/km flat, 15 m/km hilly, 54 m/km HC

  // Gradient work score (0 to 60)
  const gradientWork = (climb / 28) * 0.55;
  const densityWork = climbDensity * 0.75;
  const steepnessWork = Math.pow(maxGrad, 1.15) * 1.25;
  const rawGradientScore = Math.min(60, gradientWork + densityWork + steepnessWork);

  // 2. Distance Endurance Factor (0 to 30)
  const rawDistanceScore = Math.min(30, (dist / 85) * 30);

  // 3. Surface Resistance Multiplier (Rolling resistance Crr)
  let surfaceMultiplier = 1.0;
  let surfaceDesc = 'Düz Asfalt (Düşük Sürtünme)';

  if (surfaceStr.includes('patika') || surfaceStr.includes('mtb') || surfaceStr.includes('kaya')) {
    surfaceMultiplier = 1.45;
    surfaceDesc = 'Doğal Arazi / Taşlı Patika (Yüksek Sürtünme)';
  } else if (surfaceStr.includes('mıcır') || surfaceStr.includes('toprak') || surfaceStr.includes('gravel')) {
    surfaceMultiplier = 1.30;
    surfaceDesc = 'Gravel & Mıcır Zemin (Orta Sürtünme)';
  } else if (surfaceStr.includes('dağ') || surfaceStr.includes('kırsal') || surfaceStr.includes('taş')) {
    surfaceMultiplier = 1.12;
    surfaceDesc = 'Kırsal & Dağ Asfaltı';
  } else {
    surfaceMultiplier = 1.0;
    surfaceDesc = 'Pürüzsüz & Akıcı Asfalt';
  }

  // Combine components
  const baseScore = rawGradientScore + rawDistanceScore;
  const finalScore = Math.round(Math.min(100, Math.max(12, baseScore * surfaceMultiplier)));

  // Categorize into Kolay, Orta, Zor
  let level: 'Kolay' | 'Orta' | 'Zor' = 'Orta';
  let badgeBg = 'bg-amber-50';
  let badgeText = 'text-amber-800';
  let badgeBorder = 'border-amber-300';
  let label = 'Orta';
  let gearAdvice = 'Kompakt 50/34 aynakol ve 11-30T ruble önerilir.';
  let summary = 'Dengeli eğimler ve orta mesafe içeren ideal antrenman parkuru.';

  if (finalScore < 38) {
    level = 'Kolay';
    badgeBg = 'bg-emerald-50';
    badgeText = 'text-emerald-700';
    badgeBorder = 'border-emerald-300';
    label = 'Kolay';
    gearAdvice = 'Standart 52/36 veya 50/34 aynakol, 11-28T ruble. 90+ RPM yüksek kadans sürüşü için uygun.';
    summary = 'Düşük eğim, akıcı zemin ve düz hız/toparlanma etapları.';
  } else if (finalScore >= 65) {
    level = 'Zor';
    badgeBg = 'bg-[#FFF2ED]';
    badgeText = 'text-[#FC4C02]';
    badgeBorder = 'border-[#FC4C02]/40';
    label = finalScore >= 85 ? 'Zor (Epik HC)' : 'Zor';
    gearAdvice = '34T ön yaprak ve 32T veya 34T tırmanış rublesi. Z3/Z4 eşik watt kontrolü ve tempolu tırmanış tavsiye edilir.';
    summary = 'Yüksek dikey irtifa kazanımı, dik rampalar veya zorlu zemin direnci.';
  } else {
    level = 'Orta';
    badgeBg = 'bg-amber-50';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-300';
    label = 'Orta';
    gearAdvice = '50/34 aynakol ve 11-30T/32T ruble. Dalgalı rampalarda ritmi koruyun.';
    summary = 'Orta dereceli yokuşlar veya gravel zemin içeren dinamik antrenman.';
  }

  return {
    level,
    score: finalScore,
    badgeBg,
    badgeText,
    badgeBorder,
    label,
    breakdown: {
      gradientImpact: Math.round(rawGradientScore),
      distanceImpact: Math.round(rawDistanceScore),
      surfaceMultiplier,
      surfaceDescription: surfaceDesc
    },
    gearAndCadenceAdvice: gearAdvice,
    summary
  };
}

export const CYCLING_ROUTES: CyclingRoute[] = [
  {
    id: 'route-cadde-tuzla',
    name: 'Caddebostan - Tuzla Sahil Peloton Hız Koridoru',
    slug: 'caddebostan-tuzla-sahil',
    category: 'Coastal',
    difficulty: 'Kolay',
    distanceKm: 42.5,
    climbM: 65,
    descentM: 65,
    avgGradientPct: 0.3,
    maxGradientPct: 2.1,
    estimatedTimeMin: 85,
    surface: '%100 Kaymak Asfalt (Ayrılmış Bisiklet Yolu)',
    tags: ['Hız & Kadans', 'Aero Antrenman', 'Grup Sürüşü', 'Deniz Havası'],
    rating: 4.9,
    riderCount: 3840,
    recommendedWindDir: 'Kuzey / Kuzeydoğu (Poyraz)',
    idealWindDeg: 45,
    startPoint: { lat: 40.9628, lng: 29.0652, alt: 8 },
    endPoint: { lat: 40.8165, lng: 29.2984, alt: 6 },
    center: { lat: 40.892, lng: 29.18 },
    description: 'Marmara Denizi kıyısı boyunca uzanan, kesintisiz düz asfaltı ve geniş peloton emniyet şeridiyle İstanbul un en popüler antrenman ve hız rotası.',
    highlights: [
      'Kesintisiz 42 km ayrılmış bisiklet bandı ve düz profil',
      'Poyraz rüzgarında dönüşte yüksek hızlı rüzgar desteği',
      'Maltepe ve Kartal sahil kafelerinde güvenli mola noktaları',
      'Peloton draft antrenmanları ve FTP testleri için ideal'
    ],
    waypoints: [
      { lat: 40.9628, lng: 29.0652, alt: 8 },
      { lat: 40.9554, lng: 29.0782, alt: 7 },
      { lat: 40.9421, lng: 29.1023, alt: 6 },
      { lat: 40.9312, lng: 29.1245, alt: 7 },
      { lat: 40.9189, lng: 29.1456, alt: 8 },
      { lat: 40.9023, lng: 29.1724, alt: 6 },
      { lat: 40.8876, lng: 29.1987, alt: 7 },
      { lat: 40.8712, lng: 29.2245, alt: 5 },
      { lat: 40.8543, lng: 29.2489, alt: 7 },
      { lat: 40.8356, lng: 29.2734, alt: 6 },
      { lat: 40.8165, lng: 29.2984, alt: 6 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 8, gradientPct: 0.1 },
      { distKm: 5, elevM: 7, gradientPct: 0.2 },
      { distKm: 10, elevM: 10, gradientPct: 0.4 },
      { distKm: 18, elevM: 6, gradientPct: 0.0 },
      { distKm: 25, elevM: 12, gradientPct: 1.1 },
      { distKm: 32, elevM: 8, gradientPct: 0.2 },
      { distKm: 42.5, elevM: 6, gradientPct: 0.1 }
    ]
  },
  {
    id: 'route-belgrad-gravel',
    name: 'Belgrad Ormanı Neşetsuyu & Bentler Gravel Döngüsü',
    slug: 'belgrad-ormani-bentler-gravel',
    category: 'Gravel',
    difficulty: 'Orta',
    distanceKm: 28.4,
    climbM: 420,
    descentM: 420,
    avgGradientPct: 2.8,
    maxGradientPct: 8.5,
    estimatedTimeMin: 75,
    surface: '%75 Sertleştirilmiş Toprak & Mıcır / %25 Asfalt',
    tags: ['Gravel & Doğa', 'Tırmanış & Eğim', 'Rüzgar Korumalı', 'Orman Oksijeni'],
    rating: 4.8,
    riderCount: 2610,
    recommendedWindDir: 'Her Rüzgar (Orman İçi Tam Korumalı)',
    idealWindDeg: 0,
    startPoint: { lat: 41.1782, lng: 28.9864, alt: 115 },
    endPoint: { lat: 41.1782, lng: 28.9864, alt: 115 },
    center: { lat: 41.185, lng: 28.975 },
    description: 'Tarihi Valide ve Mahmut bentleri çevresinde, asırlık meşe ve kestane ağaçları altında akıcı virajlar ve eğlenceli gravel tırmanışları.',
    highlights: [
      'Şehir gürültüsünden ve araç trafiğinden %100 izole orman parkuru',
      'Yoğun ağaç örtüsü sayesinde fırtınalı havalarda dahi rüzgarsız sürüş',
      'Gravel ve cross-country bisikletler için optimize akıcı zemin',
      'Doğal su kaynakları ve gölet manzaralı seyir terasları'
    ],
    waypoints: [
      { lat: 41.1782, lng: 28.9864, alt: 115 },
      { lat: 41.1845, lng: 28.9812, alt: 132 },
      { lat: 41.1923, lng: 28.9745, alt: 158 },
      { lat: 41.1989, lng: 28.9634, alt: 184 },
      { lat: 41.1945, lng: 28.9512, alt: 145 },
      { lat: 41.1856, lng: 28.9589, alt: 128 },
      { lat: 41.1767, lng: 28.9698, alt: 142 },
      { lat: 41.1712, lng: 28.9789, alt: 120 },
      { lat: 41.1782, lng: 28.9864, alt: 115 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 115, gradientPct: 1.5 },
      { distKm: 4.2, elevM: 132, gradientPct: 2.8 },
      { distKm: 9.8, elevM: 175, gradientPct: 5.4 },
      { distKm: 14.5, elevM: 184, gradientPct: 7.8 },
      { distKm: 19.2, elevM: 140, gradientPct: -4.2 },
      { distKm: 24.1, elevM: 125, gradientPct: 2.1 },
      { distKm: 28.4, elevM: 115, gradientPct: -1.2 }
    ]
  },
  {
    id: 'route-polonez-riva',
    name: 'Polonezköy - Riva Vadisi Karadeniz KOM Döngüsü',
    slug: 'polonezkoy-riva-vadisi-kom',
    category: 'Climb',
    difficulty: 'Zor',
    distanceKm: 38.0,
    climbM: 680,
    descentM: 680,
    avgGradientPct: 3.6,
    maxGradientPct: 11.2,
    estimatedTimeMin: 110,
    surface: '%95 Kaliteli Asfalt / %5 Kırsal Yol',
    tags: ['Tırmanış & KOM', 'Watt Testi', 'Karadeniz Rüzgarı', 'Teknik İniş'],
    rating: 4.9,
    riderCount: 1940,
    recommendedWindDir: 'Güney / Lodos (İç Vadi Korunması)',
    idealWindDeg: 180,
    startPoint: { lat: 41.1145, lng: 29.2084, alt: 180 },
    endPoint: { lat: 41.1145, lng: 29.2084, alt: 180 },
    center: { lat: 41.165, lng: 29.22 },
    description: 'Beykoz un yemyeşil sırtlarından Karadeniz in kıyısındaki Riva ya inip vadi rampalarıyla tırmanan zorlu ve tatmin edici tırmanış antrenmanı rotası.',
    highlights: [
      '3 adet resmi segment tırmanışı (Cat 3 & Cat 4 rampalar)',
      'Riva Deresi boyunca uzanan ferah kırsal asfalt',
      'Teknik virajlı inişlerde yüksek hız dinamikleri',
      'Yokuş antrenmanları ve FTP eşiği zorlama için biçilmiş kaftan'
    ],
    waypoints: [
      { lat: 41.1145, lng: 29.2084, alt: 180 },
      { lat: 41.1298, lng: 29.2145, alt: 195 },
      { lat: 41.1467, lng: 29.2198, alt: 140 },
      { lat: 41.1712, lng: 29.2289, alt: 75 },
      { lat: 41.2189, lng: 29.2345, alt: 12 },
      { lat: 41.2045, lng: 29.2512, alt: 95 },
      { lat: 41.1756, lng: 29.2434, alt: 165 },
      { lat: 41.1423, lng: 29.2278, alt: 210 },
      { lat: 41.1145, lng: 29.2084, alt: 180 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 180, gradientPct: 1.2 },
      { distKm: 5.5, elevM: 195, gradientPct: 3.1 },
      { distKm: 12.0, elevM: 110, gradientPct: -5.8 },
      { distKm: 18.5, elevM: 12, gradientPct: -4.1 },
      { distKm: 24.2, elevM: 95, gradientPct: 6.9 },
      { distKm: 30.1, elevM: 185, gradientPct: 8.4 },
      { distKm: 38.0, elevM: 180, gradientPct: 2.1 }
    ]
  },
  {
    id: 'route-bogaz-fener',
    name: 'Boğaz Kıyısı: Beşiktaş - Sarıyer - Rumeli Feneri',
    slug: 'bogaz-sarieyer-rumeli-feneri',
    category: 'Road',
    difficulty: 'Orta',
    distanceKm: 32.2,
    climbM: 310,
    descentM: 295,
    avgGradientPct: 1.8,
    maxGradientPct: 6.8,
    estimatedTimeMin: 70,
    surface: '%100 Sahil Asfaltı',
    tags: ['Boğaz Manzarası', 'Sabah Erken Sürüş', 'Grup Temposu', 'Tarihi Doku'],
    rating: 4.7,
    riderCount: 4210,
    recommendedWindDir: 'Güney / Kıble (Kuzeye Çıkışta İtici Rüzgar)',
    idealWindDeg: 190,
    startPoint: { lat: 41.0428, lng: 29.0065, alt: 12 },
    endPoint: { lat: 41.2367, lng: 29.1389, alt: 45 },
    center: { lat: 41.14, lng: 29.07 },
    description: 'İstanbul Boğazı nın tüm yalıları ve kaleleri yanından geçip Karadeniz girişindeki tarihi Rumeli Feneri ne ulaşan ikonik rota.',
    highlights: [
      'Bebek, Emirgan ve Yeniköy yalıları boyunca kesintisiz deniz havası',
      'Hafta sonu sabah erken saatlerde sessiz ve akıcı peloton temposu',
      'Rumeli Feneri nde gün doğumu manzarası ve kahve molası',
      'Yol bisikletiyle düz ve hafif dalgalı harika hız etapları'
    ],
    waypoints: [
      { lat: 41.0428, lng: 29.0065, alt: 12 },
      { lat: 41.0645, lng: 29.0345, alt: 8 },
      { lat: 41.0823, lng: 29.0512, alt: 6 },
      { lat: 41.1089, lng: 29.0567, alt: 7 },
      { lat: 41.1423, lng: 29.0534, alt: 10 },
      { lat: 41.1712, lng: 29.0689, alt: 35 },
      { lat: 41.2045, lng: 29.1023, alt: 75 },
      { lat: 41.2367, lng: 29.1389, alt: 45 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 12, gradientPct: 0.1 },
      { distKm: 8.0, elevM: 8, gradientPct: 0.2 },
      { distKm: 16.5, elevM: 7, gradientPct: 0.1 },
      { distKm: 22.0, elevM: 15, gradientPct: 1.4 },
      { distKm: 27.5, elevM: 65, gradientPct: 4.8 },
      { distKm: 32.2, elevM: 45, gradientPct: -2.0 }
    ]
  },
  {
    id: 'route-eymir-mogan',
    name: 'Ankara Eymir & Mogan Gölleri Doğal Gravel Bağlantısı',
    slug: 'eymir-mogan-golleri-gravel',
    category: 'Gravel',
    difficulty: 'Orta',
    distanceKm: 34.6,
    climbM: 340,
    descentM: 340,
    avgGradientPct: 2.1,
    maxGradientPct: 7.2,
    estimatedTimeMin: 90,
    surface: '%65 Toprak Parkur / %35 Sessiz Asfalt',
    tags: ['Göl Kenarı', 'Gravel & Doğa', 'Trafikten Uzak', 'Düz & Tatlı Rampa'],
    rating: 4.8,
    riderCount: 1820,
    recommendedWindDir: 'Batı / Kuzeybatı',
    idealWindDeg: 280,
    startPoint: { lat: 39.8256, lng: 32.8312, alt: 965 },
    endPoint: { lat: 39.8256, lng: 32.8312, alt: 965 },
    center: { lat: 39.79, lng: 32.81 },
    description: 'Ankara nın akciğeri ODTÜ Eymir Gölü çemberi ile Mogan Gölü arasındaki doğal toprak patikaları birleştiren nefes kesici rota.',
    highlights: [
      'Araç trafiğine kapalı güvenli göl çemberi (10.5 km)',
      'Gölde su kuşları ve sazlıklar eşliğinde sakin antrenman',
      'Gravel ve dağ bisikletleri için ideal doğal zemin',
      'Hem yeni başlayanlar hem de dayanıklılık antrenmanı yapanlar için uygun'
    ],
    waypoints: [
      { lat: 39.8256, lng: 32.8312, alt: 965 },
      { lat: 39.8145, lng: 32.8245, alt: 968 },
      { lat: 39.8023, lng: 32.8112, alt: 975 },
      { lat: 39.7845, lng: 32.7989, alt: 985 },
      { lat: 39.7689, lng: 32.7845, alt: 972 },
      { lat: 39.7812, lng: 32.8023, alt: 980 },
      { lat: 39.8089, lng: 32.8267, alt: 970 },
      { lat: 39.8256, lng: 32.8312, alt: 965 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 965, gradientPct: 0.2 },
      { distKm: 7.5, elevM: 968, gradientPct: 0.4 },
      { distKm: 15.0, elevM: 985, gradientPct: 2.8 },
      { distKm: 22.4, elevM: 972, gradientPct: -1.5 },
      { distKm: 28.5, elevM: 980, gradientPct: 1.8 },
      { distKm: 34.6, elevM: 965, gradientPct: -1.0 }
    ]
  },
  {
    id: 'route-urla-cesmealti',
    name: 'İzmir Urla Bağ Yolu & Çeşmealtı Gran Fondo Parkuru',
    slug: 'urla-cesmealti-bag-yolu',
    category: 'Road',
    difficulty: 'Orta',
    distanceKm: 52.0,
    climbM: 620,
    descentM: 620,
    avgGradientPct: 2.5,
    maxGradientPct: 9.0,
    estimatedTimeMin: 120,
    surface: '%90 Pürüzsüz Asfalt / %10 Taş Yol',
    tags: ['Gran Fondo', 'Zeytinlikler', 'Ege Rüzgarı', 'Hafta Sonu Gezisi'],
    rating: 4.9,
    riderCount: 2150,
    recommendedWindDir: 'Kuzey / İmbat',
    idealWindDeg: 340,
    startPoint: { lat: 38.3582, lng: 26.7724, alt: 45 },
    endPoint: { lat: 38.3582, lng: 26.7724, alt: 45 },
    center: { lat: 38.38, lng: 26.74 },
    description: 'Ege nin zeytinlikleri ve taş evleri arasından geçip Çeşmealtı koylarına inen, Gran Fondo seviyesinde akıcı asfalt ve tatlı eğimler içeren rota.',
    highlights: [
      'Tarihi Urla Bağ Yolu boyunca uzanan pitoresk kırsal manzara',
      'Yaz aylarında serinletici Ege imbat rüzgarı',
      'Yol ve endurance bisikletçileri için konforlu asfalt kalitesi',
      'Kıyı kafelerinde espresso ve yerel lezzet molaları'
    ],
    waypoints: [
      { lat: 38.3582, lng: 26.7724, alt: 45 },
      { lat: 38.3712, lng: 26.7589, alt: 85 },
      { lat: 38.3945, lng: 26.7345, alt: 145 },
      { lat: 38.4189, lng: 26.7123, alt: 210 },
      { lat: 38.4312, lng: 26.7456, alt: 110 },
      { lat: 38.4123, lng: 26.7812, alt: 18 },
      { lat: 38.3845, lng: 26.7923, alt: 32 },
      { lat: 38.3582, lng: 26.7724, alt: 45 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 45, gradientPct: 1.1 },
      { distKm: 10.2, elevM: 85, gradientPct: 2.4 },
      { distKm: 21.5, elevM: 210, gradientPct: 5.6 },
      { distKm: 32.0, elevM: 110, gradientPct: -4.8 },
      { distKm: 42.1, elevM: 18, gradientPct: -3.2 },
      { distKm: 52.0, elevM: 45, gradientPct: 1.5 }
    ]
  },
  {
    id: 'route-uludag-hc',
    name: 'Bursa Çekirge - Uludağ Milli Parkı Zirve (HC Tırmanış)',
    slug: 'bursa-uludag-zirve-hc-tirmanis',
    category: 'Climb',
    difficulty: 'Epik',
    distanceKm: 31.8,
    climbM: 1720,
    descentM: 15,
    avgGradientPct: 5.4,
    maxGradientPct: 12.5,
    estimatedTimeMin: 140,
    surface: '%100 Dağ Asfaltı (Düzenli Bakımlı)',
    tags: ['HC Tırmanış', 'Saf Tırmanışçı', 'Alp Zirvesi', 'Maksimum İrtifa'],
    rating: 5.0,
    riderCount: 1180,
    recommendedWindDir: 'Güney / Doğu (Vadiden Sakin Esinti)',
    idealWindDeg: 120,
    startPoint: { lat: 40.1984, lng: 29.0289, alt: 180 },
    endPoint: { lat: 40.1045, lng: 29.1312, alt: 1900 },
    center: { lat: 40.15, lng: 29.08 },
    description: 'Türkiye nin en prestijli Hors Catégorie (HC) tırmanışı. 180 metreden 1900 metreye kesintisiz 32 kilometre rampa ve çam kokulu serin virajlar.',
    highlights: [
      'Kesintisiz 1,720 metre dikey irtifa kazanımı',
      'Cumhurbaşkanlığı Türkiye Bisiklet Turu kraliçe etabı parkuru',
      'Her kilometrede değişen bitki örtüsü ve serinleyen dağ havası',
      'Milli Park Zirvesinde bitiş zaferi ve unutulmaz iniş dinamikleri'
    ],
    waypoints: [
      { lat: 40.1984, lng: 29.0289, alt: 180 },
      { lat: 40.1845, lng: 29.0412, alt: 360 },
      { lat: 40.1689, lng: 29.0567, alt: 640 },
      { lat: 40.1512, lng: 29.0723, alt: 980 },
      { lat: 40.1345, lng: 29.0912, alt: 1320 },
      { lat: 40.1189, lng: 29.1123, alt: 1650 },
      { lat: 40.1045, lng: 29.1312, alt: 1900 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 180, gradientPct: 5.2 },
      { distKm: 5.0, elevM: 360, gradientPct: 6.4 },
      { distKm: 11.2, elevM: 640, gradientPct: 5.8 },
      { distKm: 18.0, elevM: 980, gradientPct: 7.1 },
      { distKm: 24.5, elevM: 1320, gradientPct: 8.2 },
      { distKm: 29.0, elevM: 1650, gradientPct: 9.5 },
      { distKm: 31.8, elevM: 1900, gradientPct: 6.2 }
    ]
  },
  {
    id: 'route-kemer-olympos',
    name: 'Antalya Kemer - Olympos Sahil & Kanyon Macerası',
    slug: 'kemer-olympos-sahil-kanyon',
    category: 'Gravel',
    difficulty: 'Zor',
    distanceKm: 48.0,
    climbM: 910,
    descentM: 910,
    avgGradientPct: 3.8,
    maxGradientPct: 10.5,
    estimatedTimeMin: 135,
    surface: '%50 Asfalt / %50 Sahil Gravel & Kanyon Yolu',
    tags: ['Akdeniz Mavisi', 'Kanyon Sürüşü', 'Gravel & Doğa', 'Epik Macera'],
    rating: 4.9,
    riderCount: 1490,
    recommendedWindDir: 'Kuzey / Karadan Denize',
    idealWindDeg: 350,
    startPoint: { lat: 36.6012, lng: 30.5623, alt: 15 },
    endPoint: { lat: 36.6012, lng: 30.5623, alt: 15 },
    center: { lat: 36.48, lng: 30.48 },
    description: 'Toros Dağları nın Akdeniz le buluştuğu çam ormanları, Phaselis antik koyları ve Olympos kanyon rampalarını birleştiren rüya gibi bir macera rotası.',
    highlights: [
      'Turkuaz Akdeniz manzarası ve antik Likya yolu geçişleri',
      'Tahtalı Dağı eteklerinde nefes kesici tırmanış sekansları',
      'Gravel bisikletler için yüksek zemin tutuşu ve akıcı virajlar',
      'Sürüş bitiminde deniz molası verme olanağı'
    ],
    waypoints: [
      { lat: 36.6012, lng: 30.5623, alt: 15 },
      { lat: 36.5645, lng: 30.5489, alt: 85 },
      { lat: 36.5189, lng: 30.5212, alt: 240 },
      { lat: 36.4678, lng: 30.4934, alt: 480 },
      { lat: 36.4321, lng: 30.4689, alt: 610 },
      { lat: 36.4189, lng: 30.4812, alt: 350 },
      { lat: 36.4412, lng: 30.5234, alt: 120 },
      { lat: 36.6012, lng: 30.5623, alt: 15 }
    ],
    elevationProfile: [
      { distKm: 0, elevM: 15, gradientPct: 1.5 },
      { distKm: 8.5, elevM: 85, gradientPct: 3.2 },
      { distKm: 19.0, elevM: 240, gradientPct: 5.1 },
      { distKm: 28.5, elevM: 480, gradientPct: 7.8 },
      { distKm: 34.0, elevM: 610, gradientPct: 9.4 },
      { distKm: 41.2, elevM: 220, gradientPct: -6.2 },
      { distKm: 48.0, elevM: 15, gradientPct: -2.1 }
    ]
  }
];

/**
 * Calculate wind compatibility score (0 - 100) for a given route against current wind angle
 */
export function calculateRouteWindScore(route: CyclingRoute, currentWindDeg: number = 45): {
  score: number;
  label: string;
  badgeColor: string;
  advice: string;
} {
  // Angle difference between current wind and route ideal wind
  let diff = Math.abs((currentWindDeg - route.idealWindDeg) % 360);
  if (diff > 180) diff = 360 - diff;

  // If wind matches ideal angle within 30 deg -> high tailwind/shelter score
  let score = Math.round(100 - (diff / 180) * 45);
  score = Math.max(50, Math.min(99, score));

  if (score >= 88) {
    return {
      score,
      label: 'Mükemmel Rüzgar Uyumu',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      advice: 'Bugünkü rüzgar açısı bu rota için en verimli itiş ve hız desteğini sağlıyor.'
    };
  } else if (score >= 75) {
    return {
      score,
      label: 'İyi Rüzgar Koşulu',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      advice: 'Hafif yan rüzgar var, grup sürüşünde enerji tasarrufu yapabilirsiniz.'
    };
  } else {
    return {
      score,
      label: 'Zorlayıcı / Dirençli',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      advice: 'Karşı rüzgar segmentleri bulunuyor, kadansı koruyup aero pozisyonda kalın.'
    };
  }
}

/**
 * Get route of the day selected intelligently based on wind or date
 */
export function getRouteOfTheDay(currentWindDeg: number = 45): {
  route: CyclingRoute;
  windMatch: ReturnType<typeof calculateRouteWindScore>;
  calculatedDifficulty: RouteDifficultyAssessment;
  reason: string;
} {
  // Sort routes by wind compatibility
  const scored = CYCLING_ROUTES.map((r) => ({
    route: r,
    windMatch: calculateRouteWindScore(r, currentWindDeg)
  })).sort((a, b) => b.windMatch.score - a.windMatch.score);

  const best = scored[0];
  const calculatedDifficulty = calculateDynamicRouteDifficulty(best.route);
  return {
    route: { ...best.route, calculatedDifficulty },
    windMatch: best.windMatch,
    calculatedDifficulty,
    reason: `Günün rüzgar yönüne (${currentWindDeg}°) göre en az karşı rüzgar direnci ve en yüksek sürüş konforu sunan rota.`
  };
}

/**
 * Search and filter cycling routes with dynamically computed difficulty & wind match
 */
export function filterCyclingRoutes(
  query: string = '',
  category: string = 'all',
  currentWindDeg: number = 45
): Array<
  CyclingRoute & {
    windMatch: ReturnType<typeof calculateRouteWindScore>;
    calculatedDifficulty: RouteDifficultyAssessment;
  }
> {
  return CYCLING_ROUTES.map((route) => {
    const calculatedDifficulty = calculateDynamicRouteDifficulty(route);
    const windMatch = calculateRouteWindScore(route, currentWindDeg);
    return {
      ...route,
      calculatedDifficulty,
      windMatch
    };
  }).filter((item) => {
    const matchesQuery =
      query.trim() === '' ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      item.difficulty.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      category === 'all' ||
      (category === 'wind' && item.windMatch.score >= 80) ||
      item.category.toLowerCase() === category.toLowerCase() ||
      (category === 'climb' && (item.category === 'Climb' || item.climbM > 400)) ||
      (category === 'flat' && item.climbM < 150);

    return matchesQuery && matchesCategory;
  });
}

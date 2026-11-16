export type BikeCategory =
  | 'road'
  | 'gravel'
  | 'mtb'
  | 'tt'
  | 'city_ebike'
  | 'frames'
  | 'groupsets'
  | 'wheelsets'
  | 'cockpit_saddle'
  | 'apparel_helmets'
  | 'accessories';

export type BikeCondition =
  | 'brand_new'
  | 'like_new'
  | 'very_clean'
  | 'good'
  | 'project_maintenance';

export interface BikeListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  category: BikeCategory;
  categoryLabel: string;
  brand: string;
  model: string;
  year?: number;
  condition: BikeCondition;
  conditionLabel: string;
  frameSize?: string;
  frameMaterial?: 'Karbon' | 'Alüminyum' | 'Titanyum' | 'Çelik' | 'Diğer';
  groupset?: string;
  wheelset?: string;
  weightKg?: number;
  city: string;
  district?: string;
  sellerName: string;
  sellerPhone?: string;
  sellerVerified: boolean;
  date: string;
  images: string[];
  isSold?: boolean;
  viewsCount?: number;
  favoritesCount?: number;
}

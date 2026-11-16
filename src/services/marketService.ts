import { BikeListing, BikeCategory } from '../types/market';
import { validateContent, cleanProfanity } from '../utils/profanityFilter';

const STORAGE_KEY = 'pel_bike_market_listings_v4';

// Strict Cycling-Only Keyword Whitelist & Blacklist for validation
const CYCLING_TERMS = [
  'bisiklet', 'yol bisikleti', 'gravel', 'mtb', 'dağ bisikleti', 'kronometre', 'tt',
  'kadro', 'maşa', 'karbon', 'alüminyum', 'titanyum', 'çelik',
  'jant', 'jant seti', 'tubeless', 'clincher', 'tubular', 'lastik', 'vittoria', 'continental', 'schwalbe', 'pirelli',
  'vites', 'aktarıcı', 'ruble', 'aynakol', 'zincir', 'fren', 'disk fren', 'hidrolik', 'kaliper', 'rotor',
  'shimano', 'sram', 'campagnolo', 'dura-ace', 'ultegra', '105', 'tiagra', 'sora', 'grx', 'red', 'force', 'rival', 'apex', 'deore', 'xt', 'xtr', 'xx1', 'gx',
  'specialized', 'trek', 'canyon', 'pinarello', 'giant', 'bianchi', 'colnago', 'scott', 'cannondale', 'merida', 'cervelo', 'bmc', 'orbea', 'cube',
  'roval', 'dt swiss', 'zipp', 'mavic', 'fulcrum', 'campagnolo', 'vision', 'enve', 'hunt',
  'gidon', 'boğaz', 'sele', 'sele borusu', 'pedal', 'kilitli pedal', 'spd', 'spd-sl', 'look', 'keo',
  'kask', 'forma', 'bib', 'tayt', 'rüzgarlık', 'yağmurluk', 'eldiven', 'ayakkabı', 'giro', 'poc', 'abus', 'kask', 'specialized', 'sidi',
  'matara', 'kafes', 'pompa', 'wahoo', 'garmin', 'bryton', 'trainer', 'tacx', 'kickr', 'saris', 'elite',
  'powermeter', 'güç ölçer', 'stages', 'favero', 'assioma', 'quarq', '4iiii'
];

const NON_CYCLING_BANNED_WORDS = [
  'araba', 'otomobil', 'motosiklet', 'scooter elektrikli', 'telefon', 'iphone', 'samsung',
  'ipad', 'tablet', 'laptop', 'bilgisayar', 'playstation', 'xbox', 'televizyon', 'tv',
  'koltuk', 'mobilya', 'yatak', 'bulaşık', 'çamaşır makinesi', 'buzdolabı', 'saat altın',
  'ev', 'arsa', 'daire', 'kedi', 'köpek', 'mama'
];

export const INITIAL_LISTINGS: BikeListing[] = [];


class MarketService {
  private listings: BikeListing[] = [];
  private listeners: Set<(listings: BikeListing[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      localStorage.removeItem('pel_bike_market_listings_v1');
      localStorage.removeItem('pel_bike_market_listings_v2');
      localStorage.removeItem('pel_bike_market_listings_v3');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.listings = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load market listings:', err);
    }
    this.listings = [];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.listings));
      this.notifyListeners();
    } catch (err) {
      console.warn('Failed to save market listings:', err);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.listings]));
  }

  public subscribe(callback: (listings: BikeListing[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.listings]);
    return () => this.listeners.delete(callback);
  }

  public getListings(): BikeListing[] {
    return [...this.listings];
  }

  public getListingById(id: string): BikeListing | undefined {
    return this.listings.find((item) => item.id === id);
  }

  /**
   * STRICT BICYCLE-ONLY CONTENT VALIDATOR
   * Enforces user request: "Ve 2.el ilanlar sadece bisikletlerle alakalı"
   */
  public validateCyclingRelevance(title: string, description: string, brand: string): { isValid: boolean; warning?: string } {
    const combinedText = `${title} ${description} ${brand}`.toLowerCase();

    // 1. Check for strictly banned non-cycling categories
    for (const banned of NON_CYCLING_BANNED_WORDS) {
      const regex = new RegExp(`\\b${banned}\\b`, 'i');
      if (regex.test(combinedText)) {
        return {
          isValid: false,
          warning: `Bu pazar yalnızca bisiklet, kadro ve bisiklet ekipmanlarına özeldir. İlanınızda bisiklet dışı ifade ("${banned}") tespit edildi.`
        };
      }
    }

    // 2. Check for at least one genuine cycling term
    const hasCyclingTerm = CYCLING_TERMS.some((term) => combinedText.includes(term.toLowerCase()));

    if (!hasCyclingTerm) {
      return {
        isValid: false,
        warning: 'PEL Pazarı sadece bisiklet sporuna özeldir. Lütfen başlık veya açıklamada bisiklet markası, modeli veya parça türünü (ör. yol bisikleti, kadro, jant, vites, kask vb.) belirtin.'
      };
    }

    // 3. Profanity & Sportsmanship check
    const profanityTitle = validateContent(title);
    if (!profanityTitle.isValid) {
      return { isValid: false, warning: profanityTitle.warningMessage };
    }
    const profanityDesc = validateContent(description);
    if (!profanityDesc.isValid) {
      return { isValid: false, warning: profanityDesc.warningMessage };
    }

    return { isValid: true };
  }

  public addListing(newListing: Omit<BikeListing, 'id' | 'date' | 'viewsCount' | 'favoritesCount'>): { success: boolean; error?: string; listing?: BikeListing } {
    const validation = this.validateCyclingRelevance(
      newListing.title,
      newListing.description,
      newListing.brand
    );

    if (!validation.isValid) {
      return { success: false, error: validation.warning };
    }

    const listing: BikeListing = {
      ...newListing,
      id: `bike-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: cleanProfanity(newListing.title),
      description: cleanProfanity(newListing.description),
      date: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      favoritesCount: 0
    };

    this.listings.unshift(listing);
    this.saveToStorage();
    return { success: true, listing };
  }

  public toggleSold(id: string) {
    this.listings = this.listings.map((l) => (l.id === id ? { ...l, isSold: !l.isSold } : l));
    this.saveToStorage();
  }

  public deleteListing(id: string) {
    this.listings = this.listings.filter((l) => l.id !== id);
    this.saveToStorage();
  }
}

export const marketService = new MarketService();

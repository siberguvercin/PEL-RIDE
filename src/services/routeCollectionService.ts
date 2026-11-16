import { RouteCollection, CyclingRoute } from '../types';

const STORAGE_KEY = 'pel_route_collections';

export const DEFAULT_COLLECTIONS: RouteCollection[] = [
  {
    id: 'col-favorites',
    name: 'Favorilerim',
    description: 'Sık sık sürdüğünüz ve en sevdiğiniz antrenman parkurları',
    icon: '⭐',
    color: '#FC4C02',
    isSystem: true,
    routeIds: ['route-belgrad-gravel', 'route-cadde-tuzla'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'col-weekly-goals',
    name: 'Haftalık Hedefler',
    description: 'Bu hafta hedeflenen haftalık antrenman ve kilometre rotaları',
    icon: '🎯',
    color: '#10B981',
    isSystem: true,
    routeIds: ['route-polonez-riva'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'col-tough-climbs',
    name: 'Zorlu Parkurlar',
    description: 'Yüksek eğim, HC zirveleri ve sınırları zorlayan tırmanış parkurları',
    icon: '⛰️',
    color: '#EF4444',
    isSystem: true,
    routeIds: ['route-polonez-riva', 'route-kartepe-climb'],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'col-gravel-adventure',
    name: 'Gravel & Doğa Keşfi',
    description: 'Orman içi toprak yollar, göl kıyıları ve doğal çakıl zemin rotaları',
    icon: '🌲',
    color: '#8B5CF6',
    isSystem: false,
    routeIds: ['route-belgrad-gravel', 'route-eymir-mogan'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2
  }
];

type Listener = (collections: RouteCollection[]) => void;

class RouteCollectionService {
  private collections: RouteCollection[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.collections = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse route collections from storage:', e);
    }
    // Default fallback
    this.collections = [...DEFAULT_COLLECTIONS];
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collections));
    } catch (e) {
      console.warn('Failed to save route collections to storage:', e);
    }
    this.notify();
  }

  private notify(): void {
    const list = [...this.collections];
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (err) {
        console.error('Error in route collection listener:', err);
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.collections]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCollections(): RouteCollection[] {
    return [...this.collections];
  }

  public getCollection(id: string): RouteCollection | undefined {
    return this.collections.find((c) => c.id === id);
  }

  public createCollection(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    routeIds?: string[];
  }): RouteCollection {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Koleksiyon adı boş olamaz.');
    }

    const newCollection: RouteCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      description: data.description?.trim() || 'Özel bisiklet rotaları koleksiyonu',
      icon: data.icon || '📁',
      color: data.color || '#FC4C02',
      isSystem: false,
      routeIds: Array.isArray(data.routeIds) ? Array.from(new Set(data.routeIds)) : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.collections.push(newCollection);
    this.save();
    return newCollection;
  }

  public updateCollection(
    id: string,
    updates: Partial<Omit<RouteCollection, 'id' | 'createdAt'>>
  ): void {
    const index = this.collections.findIndex((c) => c.id === id);
    if (index === -1) return;

    this.collections[index] = {
      ...this.collections[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.save();
  }

  public deleteCollection(id: string): boolean {
    const index = this.collections.findIndex((c) => c.id === id);
    if (index === -1) return false;

    // Prevent deleting default system collections if flagged
    if (this.collections[index].isSystem) {
      // Empty the routes instead of removing the whole system category
      this.collections[index].routeIds = [];
      this.collections[index].updatedAt = Date.now();
      this.save();
      return true;
    }

    this.collections.splice(index, 1);
    this.save();
    return true;
  }

  public toggleRouteInCollection(collectionId: string, routeId: string): boolean {
    const col = this.collections.find((c) => c.id === collectionId);
    if (!col) return false;

    const exists = col.routeIds.includes(routeId);
    if (exists) {
      col.routeIds = col.routeIds.filter((id) => id !== routeId);
    } else {
      col.routeIds.push(routeId);
    }
    col.updatedAt = Date.now();
    this.save();
    return !exists; // true if added, false if removed
  }

  public addRouteToCollection(collectionId: string, routeId: string): void {
    const col = this.collections.find((c) => c.id === collectionId);
    if (!col) return;

    if (!col.routeIds.includes(routeId)) {
      col.routeIds.push(routeId);
      col.updatedAt = Date.now();
      this.save();
    }
  }

  public removeRouteFromCollection(collectionId: string, routeId: string): void {
    const col = this.collections.find((c) => c.id === collectionId);
    if (!col) return;

    if (col.routeIds.includes(routeId)) {
      col.routeIds = col.routeIds.filter((id) => id !== routeId);
      col.updatedAt = Date.now();
      this.save();
    }
  }

  public isRouteInCollection(collectionId: string, routeId: string): boolean {
    const col = this.collections.find((c) => c.id === collectionId);
    return Boolean(col && col.routeIds.includes(routeId));
  }

  public getCollectionsForRoute(routeId: string): RouteCollection[] {
    return this.collections.filter((c) => c.routeIds.includes(routeId));
  }

  public isFavorite(routeId: string): boolean {
    return this.isRouteInCollection('col-favorites', routeId);
  }

  public toggleFavorite(routeId: string): boolean {
    return this.toggleRouteInCollection('col-favorites', routeId);
  }

  public resetToDefaults(): void {
    this.collections = JSON.parse(JSON.stringify(DEFAULT_COLLECTIONS));
    this.save();
  }
}

export const routeCollectionService = new RouteCollectionService();

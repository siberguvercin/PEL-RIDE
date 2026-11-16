import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Folder,
  Star,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  MapPin,
  TrendingUp,
  Bike,
  Compass,
  Download,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { RouteCollection, CyclingRoute } from '../types';
import { routeCollectionService } from '../services/routeCollectionService';
import { CYCLING_ROUTES } from '../data/cyclingRoutes';

interface RouteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeToManage?: CyclingRoute | null;
  onSelectRouteOnMap?: (route: CyclingRoute) => void;
  onSelectCollectionOnMap?: (collection: RouteCollection) => void;
}

const AVAILABLE_ICONS = ['⭐', '🎯', '⛰️', '🌲', '⚡', '🌊', '🚴', '🏆', '🔥', '💨', '☀️', '🏁'];
const AVAILABLE_COLORS = [
  '#FC4C02', // Athletic Orange
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4'  // Cyan
];

export const RouteCollectionModal: React.FC<RouteCollectionModalProps> = ({
  isOpen,
  onClose,
  routeToManage,
  onSelectRouteOnMap,
  onSelectCollectionOnMap
}) => {
  const [collections, setCollections] = useState<RouteCollection[]>(() =>
    routeCollectionService.getCollections()
  );
  const [activeTab, setActiveTab] = useState<'manage_route' | 'all_collections'>(
    routeToManage ? 'manage_route' : 'all_collections'
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  // New collection form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState('#FC4C02');
  const [selectedRouteIdsForNew, setSelectedRouteIdsForNew] = useState<string[]>(
    routeToManage ? [routeToManage.id] : []
  );

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const unsub = routeCollectionService.subscribe((updated) => {
      setCollections(updated);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (routeToManage) {
      setActiveTab('manage_route');
      setSelectedRouteIdsForNew([routeToManage.id]);
    } else {
      setActiveTab('all_collections');
    }
  }, [routeToManage, isOpen]);

  if (!isOpen) return null;

  const handleToggleRoute = (collectionId: string, routeId: string, collectionName: string) => {
    const isAdded = routeCollectionService.toggleRouteInCollection(collectionId, routeId);
    if (isAdded) {
      showToast(`"${collectionName}" koleksiyonuna eklendi ✓`);
    } else {
      showToast(`"${collectionName}" koleksiyonundan kaldırıldı`);
    }
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const created = routeCollectionService.createCollection({
        name: newName,
        description: newDescription,
        icon: newIcon,
        color: newColor,
        routeIds: selectedRouteIdsForNew
      });

      showToast(`"${created.name}" koleksiyonu başarıyla oluşturuldu!`);
      setNewName('');
      setNewDescription('');
      setNewIcon('📁');
      setNewColor('#FC4C02');
      setSelectedRouteIdsForNew(routeToManage ? [routeToManage.id] : []);
      setIsCreatingNew(false);
    } catch (err: any) {
      showToast(err.message || 'Koleksiyon oluşturulamadı.');
    }
  };

  const handleDeleteCollection = (id: string, name: string) => {
    if (window.confirm(`"${name}" koleksiyonunu silmek istediğinizden emin misiniz?`)) {
      routeCollectionService.deleteCollection(id);
      showToast(`"${name}" koleksiyonu silindi`);
    }
  };

  const handleExportCollectionGpx = (col: RouteCollection) => {
    const colRoutes = CYCLING_ROUTES.filter((r) => col.routeIds.includes(r.id));
    if (colRoutes.length === 0) {
      showToast('Bu koleksiyonda henüz indirmeye hazır rota bulunmuyor.');
      return;
    }

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PelotonCyclingApp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${col.name} - Bisiklet Rota Koleksiyonu</name>
    <desc>${col.description} (${colRoutes.length} rota)</desc>
  </metadata>
${colRoutes
  .map(
    (route) => `  <trk>
    <name>${route.name}</name>
    <desc>${route.surface} | +${route.climbM}m | ${route.distanceKm}km</desc>
    <trkseg>
${route.waypoints
  .map(
    (wp) =>
      `      <trkpt lat="${wp.lat}" lon="${wp.lng}"><ele>${wp.alt || 100}</ele></trkpt>`
  )
  .join('\n')}
    </trkseg>
  </trk>`
  )
  .join('\n')}
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koleksiyon-${col.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`"${col.name}" GPX arşivi indirildi ✓`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative text-[#18181B]">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#18181B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-[#FC4C02]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#ECEEF2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#FC4C02] flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#18181B] uppercase tracking-tight flex items-center gap-2">
                <span>Rota Koleksiyonları</span>
                <span className="text-[10px] bg-[#FC4C02] text-white px-2 py-0.5 rounded font-bold">
                  {collections.length} GRUP
                </span>
              </h3>
              <p className="text-xs text-[#878792]">
                Rotalarınızı Favorilerim, Haftalık Hedefler ve Zorlu Parkurlar gibi kategorilerde yönetin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs if routeToManage is given */}
        {routeToManage && (
          <div className="flex border-b border-[#F0F0F4] px-4 pt-2 bg-[#F7F7FA] gap-2">
            <button
              onClick={() => setActiveTab('manage_route')}
              className={`pb-2.5 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manage_route'
                  ? 'border-[#FC4C02] text-[#FC4C02]'
                  : 'border-transparent text-[#878792] hover:text-[#242428]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Bu Rotayı Ekle / Çıkar</span>
            </button>
            <button
              onClick={() => setActiveTab('all_collections')}
              className={`pb-2.5 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all_collections'
                  ? 'border-[#FC4C02] text-[#FC4C02]'
                  : 'border-transparent text-[#878792] hover:text-[#242428]'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Tüm Koleksiyonlarımı Yönet</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: MANAGE CURRENT ROUTE */}
          {activeTab === 'manage_route' && routeToManage && (
            <div className="space-y-4">
              {/* Route Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FC4C02]/25 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-[#FC4C02] bg-white px-2 py-0.5 rounded border border-[#FC4C02]/20">
                      {routeToManage.category}
                    </span>
                    {routeToManage.calculatedDifficulty && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded border ${routeToManage.calculatedDifficulty.badgeBg} ${routeToManage.calculatedDifficulty.badgeText} ${routeToManage.calculatedDifficulty.badgeBorder}`}
                      >
                        ⚡ {routeToManage.calculatedDifficulty.level} (%{routeToManage.calculatedDifficulty.score})
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-[#242428]">{routeToManage.name}</h4>
                  <p className="text-[11px] text-[#878792]">{routeToManage.surface}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#242428] block">{routeToManage.distanceKm} km</span>
                  <span className="text-[11px] font-bold text-[#FC4C02] block">+{routeToManage.climbM} m</span>
                </div>
              </div>

              {/* Collections Checkbox List */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-[#878792] block">
                  BU ROTAYI DAHİL ETMEK İSTEDİĞİNİZ KATEGORİLERİ SEÇİN:
                </label>

                <div className="space-y-2">
                  {collections.map((col) => {
                    const isInCollection = col.routeIds.includes(routeToManage.id);

                    return (
                      <div
                        key={col.id}
                        onClick={() => handleToggleRoute(col.id, routeToManage.id, col.name)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isInCollection
                            ? 'bg-[#FFF9F6] border-[#FC4C02] shadow-xs'
                            : 'bg-white border-[#E5E5EB] hover:border-[#FC4C02]/40 hover:bg-[#FDFDFE]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                            style={{ backgroundColor: `${col.color}15`, color: col.color }}
                          >
                            <span>{col.icon}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-black text-[#242428]">{col.name}</h5>
                              {col.isSystem && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                  Varsayılan
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#878792] line-clamp-1">{col.description}</p>
                            <span className="text-[10px] text-[#6B7280] font-semibold">
                              {col.routeIds.length} rota kayıtlı
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isInCollection
                              ? 'bg-[#FC4C02] text-white shadow-xs'
                              : 'border-2 border-[#D1D5DB] bg-white'
                          }`}
                        >
                          {isInCollection && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick inline button to create a new category */}
              {!isCreatingNew && (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-[#E5E5EB] hover:border-[#FC4C02] hover:bg-[#FFF9F6] text-xs font-black text-[#878792] hover:text-[#FC4C02] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yeni Özel Koleksiyon Oluştur</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: ALL COLLECTIONS EXPLORER & MANAGEMENT */}
          {(activeTab === 'all_collections' || !routeToManage) && (
            <div className="space-y-4">
              {/* Top Banner and Quick Add */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#878792]">
                  KAYITLI KOLEKSİYONLARINIZ
                </span>

                {!isCreatingNew && (
                  <button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setSelectedRouteIdsForNew([]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Koleksiyon Ekle</span>
                  </button>
                )}
              </div>

              {/* Collections Cards Grid */}
              <div className="space-y-3">
                {collections.map((col) => {
                  const colRoutes = CYCLING_ROUTES.filter((r) => col.routeIds.includes(r.id));
                  const totalDist = colRoutes.reduce((acc, r) => acc + r.distanceKm, 0);
                  const totalClimb = colRoutes.reduce((acc, r) => acc + r.climbM, 0);

                  return (
                    <div
                      key={col.id}
                      className="p-4 rounded-2xl bg-white border border-[#E5E5EB] shadow-xs hover:border-[#FC4C02]/40 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                            style={{ backgroundColor: `${col.color}18`, color: col.color }}
                          >
                            <span>{col.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-black text-[#242428]">{col.name}</h4>
                              <span
                                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${col.color}15`,
                                  color: col.color
                                }}
                              >
                                {colRoutes.length} ROTA
                              </span>
                            </div>
                            <p className="text-xs text-[#878792] mt-0.5">{col.description}</p>
                          </div>
                        </div>

                        {/* Top Action Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleExportCollectionGpx(col)}
                            className="p-1.5 rounded-lg text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
                            title="Bu koleksiyonun rotalarını toplu GPX olarak indir"
                          >
                            <Download className="w-4 h-4 text-[#FC4C02]" />
                          </button>

                          {!col.isSystem && (
                            <button
                              onClick={() => handleDeleteCollection(col.id, col.name)}
                              className="p-1.5 rounded-lg text-[#878792] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Koleksiyonu Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Collection Stats Metrics */}
                      <div className="grid grid-cols-3 gap-2 bg-[#F7F7FA] p-2.5 rounded-xl text-center">
                        <div>
                          <span className="text-[9px] text-[#878792] uppercase font-bold block">TOPLAM MESAFE</span>
                          <span className="text-xs font-black text-[#242428] font-mono">
                            {totalDist.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#878792] uppercase font-bold block">TOPLAM TIRMANIŞ</span>
                          <span className="text-xs font-black text-[#FC4C02] font-mono">
                            +{totalClimb} m
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#878792] uppercase font-bold block">PARKUR SAYISI</span>
                          <span className="text-xs font-black text-[#242428] font-mono">
                            {colRoutes.length} Adet
                          </span>
                        </div>
                      </div>

                      {/* Routes inside this collection */}
                      {colRoutes.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#878792] block">
                            KOLEKSİYONDAKİ ROTALAR:
                          </span>
                          <div className="space-y-1">
                            {colRoutes.map((route) => (
                              <div
                                key={route.id}
                                className="p-2 rounded-xl bg-white border border-[#E5E5EB] hover:border-[#FC4C02]/40 flex items-center justify-between text-xs transition"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02]" />
                                  <span className="font-bold text-[#242428] truncate">{route.name}</span>
                                  <span className="text-[10px] text-[#878792] shrink-0 font-mono">
                                    ({route.distanceKm}km • +{route.climbM}m)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {onSelectRouteOnMap && (
                                    <button
                                      onClick={() => {
                                        onSelectRouteOnMap(route);
                                        onClose();
                                      }}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold text-[#FC4C02] hover:bg-[#FFF2ED] transition cursor-pointer"
                                      title="Haritada Odaklan"
                                    >
                                      Harita
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleToggleRoute(col.id, route.id, col.name)}
                                    className="p-1 text-[#878792] hover:text-rose-500 rounded transition cursor-pointer"
                                    title="Koleksiyondan Çıkar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#F7F7FA] text-center text-xs text-[#878792]">
                          Bu koleksiyonda henüz rota yok. Rota kartlarındaki ⭐ simgesine basarak ekleyebilirsiniz.
                        </div>
                      )}

                      {/* Action Bar for Collection */}
                      {onSelectCollectionOnMap && colRoutes.length > 0 && (
                        <div className="pt-2 border-t border-[#F0F0F4] flex items-center justify-end">
                          <button
                            onClick={() => {
                              onSelectCollectionOnMap(col);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF2ED] hover:bg-[#FFE5DC] text-[#FC4C02] text-xs font-black transition cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Tüm Koleksiyonu Haritada Aç</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CREATE NEW COLLECTION FORM (Collapsible / Modal Drawer) */}
          {isCreatingNew && (
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border-2 border-[#FC4C02]/30 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#FC4C02]/20 pb-2">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#FC4C02]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#242428]">
                    YENİ KOLEKSİYON OLUŞTUR
                  </h4>
                </div>
                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="p-1 text-[#878792] hover:text-[#242428] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#242428] block mb-1">
                    Koleksiyon Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Haftasonu Gravel Grubu, Gece Turları, Ege Kampı..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#242428] block mb-1">
                    Açıklama (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Hafta içi antrenmanlarında kullandığımız hızlı etaplar..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-white text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  />
                </div>

                {/* Emoji / Icon Selector */}
                <div>
                  <label className="text-[11px] font-bold text-[#242428] block mb-1">
                    Simge Seçin
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewIcon(emoji)}
                        className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition cursor-pointer ${
                          newIcon === emoji
                            ? 'bg-[#FC4C02] text-white shadow-sm scale-110'
                            : 'bg-white border border-[#E5E5EB] hover:bg-[#F4F4F6]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-[11px] font-bold text-[#242428] block mb-1">
                    Tema Rengi
                  </label>
                  <div className="flex items-center gap-2">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full transition cursor-pointer ${
                          newColor === c ? 'ring-2 ring-offset-2 ring-[#FC4C02] scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Optional: Check routes to include initially */}
                <div>
                  <label className="text-[11px] font-bold text-[#242428] block mb-1">
                    Başlangıç Rotaları Ekle ({selectedRouteIdsForNew.length} seçili)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-[#E5E5EB]">
                    {CYCLING_ROUTES.map((route) => {
                      const isChecked = selectedRouteIdsForNew.includes(route.id);
                      return (
                        <label
                          key={route.id}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#F7F7FA] text-xs cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRouteIdsForNew((prev) => [...prev, route.id]);
                                } else {
                                  setSelectedRouteIdsForNew((prev) =>
                                    prev.filter((id) => id !== route.id)
                                  );
                                }
                              }}
                              className="accent-[#FC4C02]"
                            />
                            <span className="font-semibold text-[#242428] truncate">{route.name}</span>
                          </div>
                          <span className="text-[10px] text-[#878792] shrink-0 font-mono">
                            {route.distanceKm}km
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EB] text-xs font-bold text-[#878792] hover:text-[#242428] transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-xs"
                  >
                    Koleksiyonu Kaydet
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F7F7FA] border-t border-[#E5E5EB] flex items-center justify-between text-xs text-[#878792]">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#FC4C02]" />
            <span>Koleksiyonlar yerel profilinizde güvenle saklanır.</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EAEAEA] border border-[#E5E5EB] font-bold text-[#242428] transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

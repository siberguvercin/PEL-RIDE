import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  Search,
  Filter,
  PlusCircle,
  Tag,
  CheckCircle2,
  MapPin,
  Calendar,
  Layers,
  Sliders,
  DollarSign,
  Phone,
  MessageSquare,
  Share2,
  X,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { BikeListing, BikeCategory, BikeCondition } from '../types/market';
import { marketService } from '../services/marketService';

const CATEGORIES: { id: BikeCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Tüm İlanlar', icon: '🚴' },
  { id: 'road', label: 'Yol / Yarış', icon: '⚡' },
  { id: 'gravel', label: 'Gravel / Macera', icon: '🌲' },
  { id: 'mtb', label: 'Dağ (MTB)', icon: '⛰️' },
  { id: 'wheelsets', label: 'Jant Setleri', icon: '⭕' },
  { id: 'groupsets', label: 'Vites & Aktarma', icon: '⚙️' },
  { id: 'frames', label: 'Kadro & Maşa', icon: '📐' },
  { id: 'apparel_helmets', label: 'Kask & Giyim', icon: '🪖' },
  { id: 'accessories', label: 'GPS & Aksesuar', icon: '🧭' }
];

export const MarketView: React.FC = () => {
  const [listings, setListings] = useState<BikeListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BikeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Modals
  const [selectedListing, setSelectedListing] = useState<BikeListing | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for New Listing
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState<BikeCategory>('road');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState('2023');
  const [formCondition, setFormCondition] = useState<BikeCondition>('very_clean');
  const [formFrameSize, setFormFrameSize] = useState('54 cm (M)');
  const [formFrameMaterial, setFormFrameMaterial] = useState<'Karbon' | 'Alüminyum' | 'Titanyum' | 'Çelik'>('Karbon');
  const [formGroupset, setFormGroupset] = useState('');
  const [formWheelset, setFormWheelset] = useState('');
  const [formCity, setFormCity] = useState('İstanbul');
  const [formDistrict, setFormDistrict] = useState('Kadıköy');
  const [formSellerName, setFormSellerName] = useState('');
  const [formSellerPhone, setFormSellerPhone] = useState('');
  
  // Photo Upload States
  const [formImages, setFormImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Handle Photo Files Selection
  const handlePhotoFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPresetPhoto = (url: string) => {
    setFormImages((prev) => [...prev, url]);
  };

  useEffect(() => {
    const unsub = marketService.subscribe((items) => {
      setListings(items);
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredListings = listings.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && item.city !== selectedCity) return false;
    if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;
    if (onlyVerified && !item.sellerVerified) return false;
    if (item.price > maxPrice) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.groupset && item.groupset.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Handle New Listing Submit
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormValidationError('Lütfen geçerli bir fiyat girin.');
      return;
    }

    const categoryObj = CATEGORIES.find((c) => c.id === formCategory);
    const categoryLabel = categoryObj ? categoryObj.label : 'Bisiklet';

    const conditionMap: Record<BikeCondition, string> = {
      brand_new: 'Sıfır / Kutulu',
      like_new: 'Sıfır Ayarında',
      very_clean: 'Çok Temiz',
      good: 'İyi Durumda',
      project_maintenance: 'Bakım Gerektirir'
    };

    const result = marketService.addListing({
      title: formTitle,
      description: formDescription,
      price: priceNum,
      currency: 'TRY',
      category: formCategory,
      categoryLabel,
      brand: formBrand,
      model: formModel,
      year: parseInt(formYear, 10) || 2023,
      condition: formCondition,
      conditionLabel: conditionMap[formCondition],
      frameSize: formFrameSize,
      frameMaterial: formFrameMaterial,
      groupset: formGroupset,
      wheelset: formWheelset,
      city: formCity,
      district: formDistrict,
      sellerName: formSellerName.trim() || 'Bisiklet Sever',
      sellerPhone: formSellerPhone,
      sellerVerified: true,
      images: formImages.length > 0
        ? formImages
        : ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80']
    });

    if (!result.success) {
      setFormValidationError(result.error || 'İlan eklenemedi.');
      return;
    }

    setFormSuccessMessage('Bisiklet ilanınız başarıyla yayınlandı! 🚲');
    setTimeout(() => {
      setFormSuccessMessage(null);
      setIsCreateModalOpen(false);
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormPrice('');
      setFormBrand('');
      setFormModel('');
      setFormImages([]);
    }, 1500);
  };

  return (
    <div className="flex-1 w-full max-w-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#F4F5F7] text-[#18181B] pb-24">
      {/* Top Banner / Marketplace Header */}
      <div className="bg-white border-b border-[#E2E4E9] px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]">
                Bisiklet & Parça Pazarı
              </span>
              <span className="text-xs text-[#71717A] font-medium">
                · PEL Topluluk İlanları
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
              2. El Bisiklet & Ekipman Pazarı
            </h1>
            <p className="text-xs text-[#878792] mt-0.5">
              Yalnızca yol, gravel, dağ bisikletleri, jantlar ve vites grupları. Bisiklet dışı hiçbir ilan yer almaz.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-md shadow-[#FC4C02]/20 shrink-0 active:scale-98"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Yeni Bisiklet İlanı Ver</span>
          </button>
        </div>

        {/* Quick Category Bar */}
        <div className="max-w-6xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#FC4C02] text-white border-[#FC4C02] shadow-xs'
                  : 'bg-[#F7F7FA] text-[#494950] border-[#E5E5EB] hover:bg-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EB] shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#878792] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Model, marka, vites grubu (ör: Tarmac, Di2, Roval, GRX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F7FA] text-xs sm:text-sm text-[#242428] rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 bg-[#F7F7FA] border border-[#E5E5EB] rounded-xl text-xs font-semibold text-[#242428] outline-none cursor-pointer"
            >
              <option value="all">Tüm Şehirler</option>
              <option value="İstanbul">İstanbul</option>
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
              <option value="Bursa">Bursa</option>
              <option value="Antalya">Antalya</option>
            </select>

            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 bg-[#F7F7FA] border border-[#E5E5EB] rounded-xl text-xs font-semibold text-[#242428] outline-none cursor-pointer"
            >
              <option value="all">Tüm Kondisyonlar</option>
              <option value="brand_new">Sıfır / Kutulu</option>
              <option value="like_new">Sıfır Ayarında</option>
              <option value="very_clean">Çok Temiz</option>
            </select>

            {/* Verified Seller Toggle */}
            <button
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 ${
                onlyVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-[#F7F7FA] text-[#878792] border-[#E5E5EB]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doğrulanmış</span>
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-14 text-center border border-[#E2E4E9] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF4EE] text-[#FC4C02] flex items-center justify-center mx-auto border border-[#FCD5C3]">
              <Bike className="w-7 h-7" />
            </div>

            {listings.length === 0 ? (
              <>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600">
                    PAZAR BOŞ
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#242428]">
                    Henüz Yayınlanan Bisiklet İlanı Yok
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#878792] max-w-md mx-auto leading-relaxed">
                  Şu anda sistemde 2. el bisiklet, kadro veya parça ilanı bulunmuyor. İlk bisiklet ilanını sen vererek peloton topluluğuna katıl!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-[#FC4C02] text-white hover:bg-[#E34402] transition cursor-pointer shadow-md shadow-[#FC4C02]/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>İlk Bisiklet İlanını Ver</span>
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    SONUÇ BULUNAMADI
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#242428]">
                    Arama Kriterlerinize Uygun İlan Yok
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#878792] max-w-md mx-auto leading-relaxed">
                  Seçtiğiniz kategori, şehir veya arama kelimelerine uygun bisiklet ilanı bulunamadı. Filtreleri temizleyebilir ya da yeni bir ilan açabilirsiniz.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedCity('all');
                      setSelectedCondition('all');
                      setSearchQuery('');
                      setMaxPrice(300000);
                      setOnlyVerified(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F7FA] hover:bg-[#EAEAEA] text-[#242428] border border-[#E5E5EB] transition cursor-pointer"
                  >
                    Filtreleri Temizle
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#FC4C02] text-white hover:bg-[#E34402] transition cursor-pointer shadow-sm"
                  >
                    Yeni İlan Ver
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedListing(item)}
                className="bg-white rounded-2xl border border-[#E2E4E9] hover:border-[#FC4C02]/50 transition-all cursor-pointer overflow-hidden flex flex-col group"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-[16/10] bg-[#18181D] overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#242428] shadow-xs">
                      {item.categoryLabel}
                    </span>
                    {item.isSold && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                        SATILDI
                      </span>
                    )}
                  </div>

                  {/* Frame Size Badge */}
                  {item.frameSize && (
                    <div className="absolute top-3 right-3 bg-[#FC4C02] text-white px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shadow-xs">
                      {item.frameSize}
                    </div>
                  )}

                  {/* Price overlay in bottom left */}
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xl font-black font-mono tracking-tight drop-shadow-md">
                      {item.price.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-[#878792] mb-1">
                      <span className="font-bold text-[#FC4C02]">{item.brand}</span>
                      <span>•</span>
                      <span>{item.conditionLabel}</span>
                      {item.year && (
                        <>
                          <span>•</span>
                          <span>{item.year}</span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#242428] line-clamp-2 leading-snug group-hover:text-[#FC4C02] transition-colors">
                      {item.title}
                    </h4>

                    {item.groupset && (
                      <p className="text-[11px] font-mono text-[#494950] mt-1 truncate">
                        ⚙️ {item.groupset}
                      </p>
                    )}
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-3 border-t border-[#F0F0F4] flex items-center justify-between text-xs text-[#878792]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
                      <span className="truncate max-w-[120px]">{item.city}</span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-[#494950]">
                      <span>{item.sellerName}</span>
                      {item.sellerVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-[#E2E4E9] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
            {/* Modal Header & Photos */}
            <div className="relative aspect-[16/9] bg-[#18181D]">
              <img
                src={selectedListing.images[activeDetailImageIndex] || selectedListing.images[0]}
                alt={selectedListing.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer font-bold text-sm z-10"
              >
                ✕
              </button>

              {/* Photo Indicator */}
              {selectedListing.images.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
                  {activeDetailImageIndex + 1} / {selectedListing.images.length}
                </div>
              )}

              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-[#FC4C02] text-white shadow-md">
                  {selectedListing.price.toLocaleString('tr-TR')} ₺
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 text-[#242428] backdrop-blur-md">
                  {selectedListing.conditionLabel}
                </span>
              </div>
            </div>

            {/* Photo Thumbnails Selector */}
            {selectedListing.images.length > 1 && (
              <div className="flex items-center gap-2 px-5 pt-3 overflow-x-auto bg-[#F7F7FA] border-b border-[#E5E5EB] py-2">
                {selectedListing.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveDetailImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                      activeDetailImageIndex === idx
                        ? 'border-[#FC4C02] scale-105 shadow-sm'
                        : 'border-[#E5E5EB] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Details Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#878792] mb-1">
                  <span className="text-[#FC4C02] font-black uppercase">{selectedListing.categoryLabel}</span>
                  <span>•</span>
                  <span>{selectedListing.brand} {selectedListing.model}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#242428] leading-tight">
                  {selectedListing.title}
                </h2>
              </div>

              {/* Technical Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {selectedListing.frameSize && (
                  <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                    <span className="text-[10px] font-bold text-[#878792] block uppercase">KADRO BOYU</span>
                    <span className="text-xs font-black text-[#242428] font-mono">{selectedListing.frameSize}</span>
                  </div>
                )}
                {selectedListing.frameMaterial && (
                  <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                    <span className="text-[10px] font-bold text-[#878792] block uppercase">MATERYAL</span>
                    <span className="text-xs font-black text-[#242428]">{selectedListing.frameMaterial}</span>
                  </div>
                )}
                {selectedListing.weightKg && (
                  <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                    <span className="text-[10px] font-bold text-[#878792] block uppercase">AĞIRLIK</span>
                    <span className="text-xs font-black text-[#FC4C02] font-mono">{selectedListing.weightKg} kg</span>
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                  <span className="text-[10px] font-bold text-[#878792] block uppercase">KONUM</span>
                  <span className="text-xs font-black text-[#242428] truncate block">{selectedListing.city}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#878792] block">
                  İLAN AÇIKLAMASI
                </span>
                <p className="text-xs sm:text-sm text-[#242428] leading-relaxed whitespace-pre-wrap bg-[#F7F7FA] p-4 rounded-2xl border border-[#E5E5EB]">
                  {selectedListing.description}
                </p>
              </div>

              {/* Seller & Safety Info */}
              <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC4C02]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#FC4C02]" />
                    <span className="text-xs font-black uppercase text-[#242428]">
                      GÜVENLİ BİSİKLET ALIŞVERİŞİ
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Doğrulanmış Pelotoni
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Satıcı: <strong>{selectedListing.sellerName}</strong> ({selectedListing.city}{selectedListing.district ? `, ${selectedListing.district}` : ''})
                  <br />
                  * İkinci el bisiklet alırken kadroda kılcal çatlak kontrolü yapılması, seri numarasının kontrol edilmesi ve faturasının istenmesi önerilir.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#F7F7FA] border-t border-[#E5E5EB] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#878792]">
                İlan Tarihi: {selectedListing.date}
              </span>

              <div className="flex items-center gap-2">
                {selectedListing.sellerPhone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${selectedListing.sellerPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Merhaba ${selectedListing.sellerName}, PEL Bisiklet Pazarı'ndaki "${selectedListing.title}" ilanınız için yazıyorum.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp'tan Yaz</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedListing(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#E5E5EB] text-[#242428] hover:bg-[#EAEAEA] transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Bike Listing Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-[#E2E4E9] shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#ECEEF2] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#242428]">
                    Yeni Bisiklet İlanı Ver
                  </h3>
                  <span className="text-[10px] text-[#FC4C02] font-extrabold uppercase">
                    Yalnızca Bisiklet & Bisiklet Parçası
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7FA] text-[#878792] hover:text-[#242428] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-5 space-y-4">
              {formValidationError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {formSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="space-y-2 p-3 bg-white rounded-2xl border border-[#E5E5EB]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-[#878792] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>İlan Fotoğrafları ({formImages.length})</span>
                  </label>
                  <span className="text-[10px] text-[#878792]">PNG, JPG, WebP</span>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFilesSelect}
                  className="hidden"
                />

                {/* Upload Trigger Dropzone */}
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E5EB] hover:border-[#FC4C02] rounded-2xl p-4 text-center cursor-pointer bg-[#F7F7FA] hover:bg-[#FFF7F4] transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center text-[#FC4C02] mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#242428]">
                    Fotoğraf Yüklemek İçin Tıklayın veya Sürükleyin
                  </p>
                  <p className="text-[10px] text-[#878792] mt-0.5">
                    Cihazınızdan bisiklet, kadro veya parça fotoğrafları seçin
                  </p>
                </div>

                {/* Uploaded Photos Preview List */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {formImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5E5EB] group">
                        <img src={imgUrl} alt={`Fotoğraf ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#FC4C02] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                            KAPAK
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Fotoğrafı Kaldır"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-[#FC4C02]/60 hover:border-[#FC4C02] bg-[#FFF2ED]/50 flex flex-col items-center justify-center text-[#FC4C02] text-[10px] font-bold gap-1 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                )}

                {/* Quick Cycling Preset Photos */}
                <div className="pt-1">
                  <span className="text-[10px] text-[#878792] font-semibold block mb-1.5">
                    Veya örnek bisiklet fotoğrafı seçin:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Yol / Yarış', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Gravel', url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Dağ / MTB', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Jant / Parça', url: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80' }
                    ].map((preset, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleAddPresetPhoto(preset.url)}
                        className="p-1 rounded-lg border border-[#E5E5EB] hover:border-[#FC4C02] bg-white text-left transition flex items-center gap-1.5 cursor-pointer overflow-hidden"
                      >
                        <img src={preset.url} alt={preset.label} className="w-6 h-6 rounded object-cover shrink-0" />
                        <span className="text-[9px] font-bold text-[#242428] truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Bisiklet Kategorisi *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BikeCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs font-semibold text-[#242428] outline-none"
                    required
                  >
                    <option value="road">Yol / Yarış Bisikleti</option>
                    <option value="gravel">Gravel / Macera</option>
                    <option value="mtb">Dağ Bisikleti (MTB)</option>
                    <option value="tt">Zamana Karşı / Triatlon (TT)</option>
                    <option value="wheelsets">Jant Seti</option>
                    <option value="groupsets">Vites & Aktarma Grubu</option>
                    <option value="frames">Kadro & Maşa</option>
                    <option value="apparel_helmets">Kask & Giyim</option>
                    <option value="accessories">GPS & Aksesuar</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Marka *
                  </label>
                  <input
                    type="text"
                    placeholder="Ör: Specialized, Canyon, Trek, Shimano"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                  İlan Başlığı * (Bisiklet/Parça adını içermelidir)
                </label>
                <input
                  type="text"
                  placeholder="Ör: Specialized Tarmac SL7 (54 cm) - Ultegra Di2"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs font-bold text-[#242428] outline-none"
                  required
                />
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    placeholder="Ör: 45000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs font-mono font-bold text-[#242428] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Kondisyon Durumu *
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as BikeCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs font-semibold text-[#242428] outline-none"
                  >
                    <option value="brand_new">Sıfır / Kutulu</option>
                    <option value="like_new">Sıfır Ayarında (Kazasız)</option>
                    <option value="very_clean">Çok Temiz</option>
                    <option value="good">İyi Durumda</option>
                    <option value="project_maintenance">Bakım Gerektirir</option>
                  </select>
                </div>
              </div>

              {/* Frame Size & Groupset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Kadro Boyu
                  </label>
                  <input
                    type="text"
                    placeholder="Ör: 54 cm (M) / 52 cm (S)"
                    value={formFrameSize}
                    onChange={(e) => setFormFrameSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Vites Grubu
                  </label>
                  <input
                    type="text"
                    placeholder="Ör: Shimano 105 Di2, SRAM Rival AXS"
                    value={formGroupset}
                    onChange={(e) => setFormGroupset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                  Açıklama & Bisiklet Özellikleri *
                </label>
                <textarea
                  rows={3}
                  placeholder="Kadro materyali, bakım durumu, jant seti ve faturası hakkında bilgi verin..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                  required
                />
              </div>

              {/* City, Seller Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Şehir *
                  </label>
                  <input
                    type="text"
                    placeholder="Ör: İstanbul"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    Satıcı Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    value={formSellerName}
                    onChange={(e) => setFormSellerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#878792] block mb-1">
                    İletişim / WhatsApp *
                  </label>
                  <input
                    type="text"
                    placeholder="+90 532 ..."
                    value={formSellerPhone}
                    onChange={(e) => setFormSellerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs text-[#242428] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F7F7FA] text-[#878792] hover:text-[#242428]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FC4C02] hover:bg-[#E34402] text-white shadow-md cursor-pointer transition"
                >
                  İlanı Kontrol Et & Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

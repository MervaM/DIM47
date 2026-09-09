import React, { useState, useRef } from 'react';
import { X, Upload, Search, Image as ImageIcon, Wand2 } from 'lucide-react';

export default function NewOrderModal({ isOpen, onClose, onSave, stock = [] }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [colorImage, setColorImage] = useState('');
  
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [sole, setSole] = useState('');
  const [color, setColor] = useState('');
  const [lining, setLining] = useState('');
  
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [smartText, setSmartText] = useState('');
  
  const [paymentType, setPaymentType] = useState('Передплата');
  const [advance, setAdvance] = useState('');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isStockImagesOpen, setIsStockImagesOpen] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);

  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);

  let currentStock = Array.isArray(stock) && stock.length > 0 ? [...stock] : [];
  
  if (currentStock.length === 0) {
    try {
      const savedStock = localStorage.getItem('dim47_stock');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) currentStock = parsed;
      }
    } catch (e) {}
  }

  // Жорсткий відбір палітри: ТІЛЬКИ матеріали/кольори (жодного готового взуття на кшталт мюлі, клогів чи черевиків)
  const isColorOrMaterialItem = (item) => {
    if (!item) return false;
    const n = (item.name || '').toLowerCase();
    const folder = (item.folderId || '').toLowerCase();
    
    // Якщо це явно папка з кольорами
    if (folder.includes('color') || folder.includes('palet') || folder.includes('шкір') || folder.includes('замш')) return true;

    // Стоп-слова (якщо це назва готового взуття — точно не палітра)
    const isFinishedProduct = n.includes('мюлі') || n.includes('клоги') || n.includes('оксфорд') || 
                              n.includes('туфлі') || n.includes('чоботи') || n.includes('кросівк') || 
                              n.includes('босоніжк') || n.includes('мокасин');
    if (isFinishedProduct) return false;

    // Критерії кольору/матеріалу
    const hasMaterialKeywords = n.includes('замш') || n.includes('шкір') || n.includes('лак') || 
                                n.includes('нубук') || n.includes('пітона') || n.includes('рептилі');
    const hasColorKeywords = n.includes('червон') || n.includes('чорн') || n.includes('біл') || 
                             n.includes('беж') || n.includes('риж') || n.includes('син') || 
                             n.includes('зелен') || n.includes('жовт') || n.includes('сір') || 
                             n.includes('рожев') || n.includes('коричневих') || n.includes('оливк') ||
                             n.includes('пудр') || n.includes('бордо') || n.includes('молок') || n.includes('део');

    return hasMaterialKeywords || hasColorKeywords || item.isColor || item.type === 'color';
  };

  let paletteStock = currentStock.filter(isColorOrMaterialItem);

  // Додаткова перевірка сховищ кольорів у localStorage
  ['dim47_colors', 'palette', 'colors', 'dim47_palette'].forEach(key => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          paletteStock = [...paletteStock, ...parsed.filter(isColorOrMaterialItem)];
        }
      }
    } catch (e) {}
  });

  // Захист від дублікатів у палітрі
  paletteStock = Array.from(new Set(paletteStock.map(item => item.id || item.name)))
    .map(id => paletteStock.find(item => (item.id || item.name) === id));

  // Якщо палітра все одно порожня, показуємо порожній масив замість всього складу
  const shoesStock = currentStock.filter(item => !paletteStock.includes(item));
  const activeStockList = activeImageType === 'color' ? paletteStock : shoesStock;

  const filteredStockProducts = shoesStock.filter(item => 
    item && item.name && item.name.toLowerCase().includes(name.toLowerCase())
  );

  const handleSmartClientParse = (text) => {
    setSmartText(text);
    if (!text.trim()) return;

    let cleanText = text;

    // 1. Телефон
    const phoneMatch = cleanText.match(/(\+?38)?0\d{9}/);
    if (phoneMatch) {
      setPhone(phoneMatch[0]);
      cleanText = cleanText.replace(phoneMatch[0], ' ');
    }

    // 2. Відділення НП / адреса (шукаємо чітко номери відділень чи поштомати)
    const addressMatch = cleanText.match(/(?:відділення|нп|пошта|№)\s*[\w№\-]*\s*\d+/i) || cleanText.match(/№\s*\d+/i) || cleanText.match(/(?:відділення|нп)\s*№?\s*\d+/i);
    if (addressMatch) {
      setAddress(addressMatch[0].trim());
      cleanText = cleanText.replace(addressMatch[0], ' ');
    }

    // 3. Місто
    const ukraineCities = /Волинськ|Київ|Львів|Харків|Одеса|Дніпр|Житомир|Рівне|Тернопіль|Івано-|Чернівц|Ужгород|Хмельницьк|Вінниц|Черкас|Полтав|Суми|Запоріжжя|Миколаїв|Кропивницьк|Луцьк|Чернігів|Нововолинськ|Ковель|Володимир/i;
    const cityMatch = cleanText.match(/(?:м\.|місто)\s*([А-ЯІЄЇҐ][а-яієїґ]+(?:[- ][А-ЯІЄЇҐ][а-яієїґ]+)?)/i) || cleanText.match(ukraineCities);
    if (cityMatch) {
      const foundCity = cityMatch[1] || cityMatch[0];
      setCity(foundCity.replace(/місто|м\./gi, '').trim());
      cleanText = cleanText.replace(cityMatch[0], ' ');
    }

    // Прибираємо зайві регіональні приставки, області та службові слова
    cleanText = cleanText
      .replace(/область|обл\.|район|району|або|доставка|отримувач|Волинська|Львівська|Київська/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 4. ПІБ клієнта (перші слова, що залишились)
    const words = cleanText.split(/,|\n/).map(p => p.trim()).filter(Boolean);
    if (words.length > 0) {
      const possibleName = words.find(w => w.split(/\s+/).length >= 2) || words[0];
      if (possibleName) {
        setClientName(possibleName.trim());
      }
    }
  };

  const handleSelectProductFromStock = (product) => {
    setName(product.name || '');
    const prodImg = product.image || product.photo || product.img || product.colorImage;
    if (prodImg) setImage(prodImg);
    setIsProductDropdownOpen(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'product') setImage(reader.result);
        else setColorImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImageFromStock = (product) => {
    const imgUrl = product.image || product.photo || product.img || product.colorImage;
    
    if (activeImageType === 'product') {
      if (imgUrl) setImage(imgUrl);
      if (product.name) setName(product.name);
    } else if (activeImageType === 'color') {
      if (imgUrl) setColorImage(imgUrl);
      if (product.name) setColor(product.name);
    }
    
    setIsStockImagesOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newOrder = {
      id: Date.now(),
      name,
      image,
      colorImage,
      size,
      material,
      sole,
      color,
      lining,
      clientName,
      phone,
      city,
      address,
      paymentType,
      advance: Number(advance) || 0,
      discount: Number(discount) || 0,
      comment,
      price: Number(price) || 0,
      status: 'нове',
      createdAt: new Date().toISOString()
    };
    onSave(newOrder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8 space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Нове замовлення</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700">Фото товару</span>
              {image ? (
                <div className="relative w-16 h-16">
                  <img src={image} alt="Товар" className="w-16 h-16 object-cover rounded-lg border shadow-xs" />
                  <button type="button" onClick={() => setImage('')} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"><X size={12}/></button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-200/70 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="flex gap-1.5 w-full justify-center">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'product')} className="hidden" accept="image/*" />
                <button type="button" title="Завантажити з пристрою" onClick={() => fileInputRef.current.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Upload size={16} />
                </button>
                <button type="button" title="Вибрати зі складу" onClick={() => { setActiveImageType('product'); setIsStockImagesOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Search size={16} />
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700">Зразок кольору</span>
              {colorImage ? (
                <div className="relative w-16 h-16">
                  <img src={colorImage} alt="Колір" className="w-16 h-16 object-cover rounded-lg border shadow-xs" />
                  <button type="button" onClick={() => setColorImage('')} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"><X size={12}/></button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-200/70 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="flex gap-1.5 w-full justify-center">
                <input type="file" ref={colorInputRef} onChange={(e) => handleFileUpload(e, 'color')} className="hidden" accept="image/*" />
                <button type="button" title="Завантажити з пристрою" onClick={() => colorInputRef.current.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Upload size={16} />
                </button>
                <button type="button" title="Вибрати з палітри" onClick={() => { setActiveImageType('color'); setIsStockImagesOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative space-y-1">
            <label className="text-xs font-semibold text-slate-600">Назва товару</label>
            <div className="relative">
              <input 
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsProductDropdownOpen(true);
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                placeholder="Назва товару"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
              <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            </div>

            {isProductDropdownOpen && filteredStockProducts.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredStockProducts.map((prod, index) => {
                  const prodImg = prod.image || prod.photo || prod.img || prod.colorImage;
                  return (
                    <div
                      key={prod.id || index}
                      onClick={() => handleSelectProductFromStock(prod)}
                      className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition"
                    >
                      {prodImg ? (
                        <img src={prodImg} alt="" className="w-9 h-9 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Фото</div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Характеристики товару */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
            
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Розмір" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Матеріал" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={sole} onChange={(e) => setSole(e.target.value)} placeholder="Підошва" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Колір" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>

            {/* Байка / Хутро знизу під усіма характеристиками */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Вид утеплювача:</span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setLining('байка')} className={`px-3 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition ${lining === 'байка' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Байка</button>
                <button type="button" onClick={() => setLining('хутро')} className={`px-3 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition ${lining === 'хутро' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Хутро</button>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Wand2 size={14} className="text-amber-600" />
              Розумне введення даних клієнта (скопіюйте текст сюди)
            </label>
            <textarea
              rows="2"
              value={smartText}
              onChange={(e) => handleSmartClientParse(e.target.value)}
              placeholder="Вставте сюди весь текст від клієнта..."
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/70 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="space-y-2">
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ім'я клієнта (ПІБ)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Місто" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Відділення / Адреса" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Вартість товару (грн)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Передплата (грн)</label>
              <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Коментар до замовлення</label>
            <textarea
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Додаткові побажання..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
          </div>
        </form>
      </div>

      {isStockImagesOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {activeImageType === 'color' ? 'Виберіть колір з палітри' : 'Виберіть зображення зі складу'}
              </h3>
              <button onClick={() => setIsStockImagesOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-96">
              {activeStockList.length > 0 ? (
                activeStockList.map((item, index) => {
                  const img = item.image || item.photo || item.img || item.colorImage;
                  return (
                    <div key={item.id || index}>
                      {img ? (
                        <div onClick={() => handleSelectImageFromStock(item)} className="relative group cursor-pointer border rounded-lg overflow-hidden aspect-square bg-slate-50 hover:ring-2 hover:ring-slate-900 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">{item.name || 'Колір'}</div>
                        </div>
                      ) : (
                        <div onClick={() => handleSelectImageFromStock(item)} className="border border-dashed border-slate-200 rounded-lg aspect-square flex items-center justify-center p-1 text-center text-[10px] text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100">
                          {item.name || 'Без фото'}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-xs text-slate-400">
                  {activeImageType === 'color' ? 'Палітра кольорів порожня' : 'Склад порожній'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
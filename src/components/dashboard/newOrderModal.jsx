import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Search, Image as ImageIcon, Wand2, Package } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function NewOrderModal({ isOpen, onClose, onSave, stock = [] }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [colorImage, setColorImage] = useState('');
  
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [sole, setSole] = useState('');
  const [color, setColor] = useState('');
  const [lining, setLining] = useState('');
  
  // Виробник та Джерело пакування
  const [supplier, setSupplier] = useState('Міла');
  const [packagingSource, setPackagingSource] = useState('Міла');

  // Опції пакування (коробка / пильовик)
  const [includeBox, setIncludeBox] = useState(true);
  const [includeDustbag, setIncludeDustbag] = useState(true);

  // Фіксація матеріалу для вибору палітри відповідно до виробника
  const [paletteMaterialTab, setPaletteMaterialTab] = useState('Шкіра');

  const [placeholders, setPlaceholders] = useState({
    size: '',
    material: '',
    sole: '',
    color: ''
  });

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [smartText, setSmartText] = useState('');
  
  const [paymentType, setPaymentType] = useState('Передплата');
  const [advance, setAdvance] = useState('300');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');
  const [selectedStockItemId, setSelectedStockItemId] = useState(null);

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isStockImagesOpen, setIsStockImagesOpen] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  
  const [stockFolderFilter, setStockFolderFilter] = useState('shoes');

  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAdvance('300');
      setSelectedStockItemId(null);
      setStockFolderFilter('shoes');
      setSupplier('Міла');
      setPackagingSource('Міла'); // За замовчуванням склад виробника
      setIncludeBox(true);
      setIncludeDustbag(true);
      setPaletteMaterialTab('Шкіра');
      setPlaceholders({ size: '', material: '', sole: '', color: '' });
    }
  }, [isOpen]);

  // Зміна виробника автоматично оновлює склад списання пакування
  const handleSupplierChange = (newSupplier) => {
    setSupplier(newSupplier);
    setPackagingSource(newSupplier);
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  let currentStock = Array.isArray(stock) && stock.length > 0 ? [...stock] : [];

  const isColorOrMaterialItem = (item) => {
    if (!item) return false;
    const folder = String(item.folderId || '').toLowerCase();
    if (folder.includes('color') || folder.includes('palet') || folder.includes('шкір') || folder.includes('замш')) return true;
    if (item.isColor || item.type === 'color') return true;
    return false;
  };

  // Фільтр палітри за обраним виробником та матеріалом
  let paletteStock = currentStock.filter(isColorOrMaterialItem).filter(item => {
    const matchesSupplier = (item.supplier || 'Міла') === supplier;
    const matchesMaterial = (item.materialType || 'Шкіра') === paletteMaterialTab;
    return matchesSupplier && matchesMaterial;
  });

  const shoesStock = currentStock.filter(item => !isColorOrMaterialItem(item));

  const getFilteredStockList = () => {
    if (activeImageType === 'color') return paletteStock;

    if (stockFolderFilter === 'availability') {
      return shoesStock.filter(item => item.folderId === 'availability');
    }
    return shoesStock.filter(item => item.folderId === 'shoes' || !item.folderId);
  };

  const activeStockList = getFilteredStockList();

  const filteredStockProducts = shoesStock.filter(item => 
    item && item.name && String(item.name).toLowerCase().includes(String(name).toLowerCase())
  );

  const handleSmartClientParse = (eOrText) => {
    const rawText = typeof eOrText === 'string' ? eOrText : (eOrText?.target?.value ?? '');
    setSmartText(rawText);
    if (!rawText.trim()) return;

    let cleanText = rawText;

    const phoneMatch = cleanText.match(/(\+?38)?0\d{9}/);
    if (phoneMatch) {
      setPhone(phoneMatch[0]);
      cleanText = cleanText.replace(phoneMatch[0], ' ');
    }

    const addressMatch = cleanText.match(/(?:відділення|нп|пошта|№)\s*[\w№\-]*\s*\d+/i) || cleanText.match(/№\s*\d+/i) || cleanText.match(/(?:відділення|нп)\s*№?\s*\d+/i);
    if (addressMatch) {
      setAddress(addressMatch[0].trim());
      cleanText = cleanText.replace(addressMatch[0], ' ');
    }

    const ukraineCities = /Волинськ|Київ|Львів|Харків|Одеса|Дніпр|Житомир|Рівне|Тернопіль|Івано-|Чернівц|Ужгород|Хмельницьк|Вінниц|Черкас|Полтав|Суми|Запоріжжя|Миколаїв|Кропивницьк|Луцьк|Чернігів|Нововолинськ|Ковель|Володимир/i;
    const cityMatch = cleanText.match(/(?:м\.|місто)\s*([А-ЯІЄЇҐ][а-яієїґ]+(?:[- ][А-ЯІЄЇҐ][а-яієїґ]+)?)/i) || cleanText.match(ukraineCities);
    if (cityMatch) {
      const foundCity = cityMatch[1] || cityMatch[0];
      setCity(foundCity.replace(/місто|м\./gi, '').trim());
      cleanText = cleanText.replace(cityMatch[0], ' ');
    }

    cleanText = cleanText
      .replace(/область|обл\.|район|району|або|доставка|отримувач|Волинська|Львівська|Київська/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const words = cleanText.split(/,|\n/).map(p => p.trim()).filter(Boolean);
    if (words.length > 0) {
      const possibleName = words.find(w => w.split(/\s+/).length >= 2) || words[0];
      if (possibleName) {
        setClientName(possibleName.trim());
      }
    }
  };

  const handlePriceChange = (e) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    const numPrice = Number(newPrice) || 0;
    
    setAdvance(prev => {
      if (prev === '300' || prev === '' || Number(prev) === Number(price)) {
        return numPrice > 300 ? '300' : String(numPrice);
      }
      return prev;
    });
  };

  const handleFullPayment = () => {
    setAdvance(price);
  };

  const handleSelectProductFromStock = (product) => {
    if (!product) return;
    setName(product.name || '');
    const prodImg = product.image || product.photo || product.img || product.colorImage;
    if (prodImg) setImage(prodImg);
    
    if (product.price !== undefined && product.price !== '') {
      setPrice(product.price);
      const numPrice = Number(product.price) || 0;
      setAdvance(numPrice > 300 ? '300' : String(numPrice));
    }

    let detectedSupplier = 'Міла';
    if (product.defaultSupplier) {
      detectedSupplier = product.defaultSupplier;
    } else if (Array.isArray(product.suppliers) && product.suppliers.length > 0) {
      detectedSupplier = product.suppliers[0];
    } else if (product.supplier) {
      detectedSupplier = product.supplier;
    }

    setSupplier(detectedSupplier);
    setPackagingSource(detectedSupplier);

    const isAvailability = product.folderId === 'availability';

    if (isAvailability) {
      setSize(product.size || '');
      setMaterial(product.material || '');
      setSole(product.sole || '');
      setColor(product.color || '');
      setSelectedStockItemId(product.id);
      setPlaceholders({ size: '', material: '', sole: '', color: '' });
      setPackagingSource('Основний склад');
    } else {
      setSize('');
      setMaterial('');
      setSole('');
      setColor('');
      setSelectedStockItemId(null);
      setPlaceholders({
        size: product.size || 'Розмір',
        material: product.material || 'Матеріал',
        sole: product.sole || 'Підошва',
        color: product.color || 'Колір'
      });
    }

    setIsProductDropdownOpen(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
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
    if (!product) return;
    const imgUrl = product.image || product.photo || product.img || product.colorImage;
    
    if (activeImageType === 'product') {
      if (imgUrl) setImage(imgUrl);
      if (product.name) setName(product.name);
      
      if (product.price !== undefined && product.price !== '') {
        setPrice(product.price);
        const numPrice = Number(product.price) || 0;
        setAdvance(numPrice > 300 ? '300' : String(numPrice));
      }

      let detectedSupplier = 'Міла';
      if (product.defaultSupplier) {
        detectedSupplier = product.defaultSupplier;
      } else if (Array.isArray(product.suppliers) && product.suppliers.length > 0) {
        detectedSupplier = product.suppliers[0];
      }
      setSupplier(detectedSupplier);
      setPackagingSource(detectedSupplier);

      const isAvailability = product.folderId === 'availability';

      if (isAvailability) {
        setSize(product.size || '');
        setMaterial(product.material || '');
        setSole(product.sole || '');
        setColor(product.color || '');
        setSelectedStockItemId(product.id);
        setPlaceholders({ size: '', material: '', sole: '', color: '' });
        setPackagingSource('Основний склад');
      } else {
        setSize('');
        setMaterial('');
        setSole('');
        setColor('');
        setSelectedStockItemId(null);
        setPlaceholders({
          size: product.size || 'Розмір',
          material: product.material || 'Матеріал',
          sole: product.sole || 'Підошва',
          color: product.color || 'Колір'
        });
      }
    } else if (activeImageType === 'color') {
      if (imgUrl) setColorImage(imgUrl);
      if (product.name) setColor(product.name);
    }
    
    setIsStockImagesOpen(false);
  };

  // Списання пакування з урахуванням вибору (коробка/пильовик окремо)
  const deductPackaging = async (source, needBox, needDustbag) => {
    if (!needBox && !needDustbag) return;
    const targetSource = source || 'Міла';

    try {
      const boxItem = stock.find(i => i.folderId === 'boxes');
      const dustbagItem = stock.find(i => i.folderId === 'dustbags');

      if (needBox && boxItem) {
        const boxRef = doc(db, 'stock', String(boxItem.id));
        const boxSnap = await getDoc(boxRef);
        if (boxSnap.exists()) {
          const data = boxSnap.data();
          const currentSuppliers = data.suppliers || { 'Основний склад': data.quantity || 0, 'Міла': 0, 'Валерій': 0 };
          const currentQty = Number(currentSuppliers[targetSource]) || 0;
          
          if (currentQty > 0) {
            currentSuppliers[targetSource] = currentQty - 1;
            const newTotalQty = Object.values(currentSuppliers).reduce((sum, val) => sum + Number(val || 0), 0);
            await updateDoc(boxRef, { suppliers: currentSuppliers, quantity: newTotalQty });
          }
        }
      }

      if (needDustbag && dustbagItem) {
        const dustRef = doc(db, 'stock', String(dustbagItem.id));
        const dustSnap = await getDoc(dustRef);
        if (dustSnap.exists()) {
          const data = dustSnap.data();
          const currentSuppliers = data.suppliers || { 'Основний склад': data.quantity || 0, 'Міла': 0, 'Валерій': 0 };
          const currentQty = Number(currentSuppliers[targetSource]) || 0;
          
          if (currentQty > 0) {
            currentSuppliers[targetSource] = currentQty - 1;
            const newTotalQty = Object.values(currentSuppliers).reduce((sum, val) => sum + Number(val || 0), 0);
            await updateDoc(dustRef, { suppliers: currentSuppliers, quantity: newTotalQty });
          }
        }
      }
    } catch (err) {
      console.error('Помилка списання пакування:', err);
    }
  };

  const handleSubmit = async (e) => {
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
      supplier,
      packagingSource,
      includeBox,
      includeDustbag,
      clientName,
      phone,
      city,
      address,
      paymentType,
      advance: Number(advance) || 0,
      discount: Number(discount) || 0,
      comment,
      price: Number(price) || 0,
      stockItemId: selectedStockItemId,
      status: 'нове',
      createdAt: new Date().toISOString()
    };

    await deductPackaging(packagingSource, includeBox, includeDustbag);

    if (typeof onSave === 'function') {
      onSave(newOrder);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 relative my-auto space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Нове замовлення</h2>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }} 
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
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
                <button type="button" title="Завантажити з пристрою" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
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
                <button type="button" title="Завантажити з пристрою" onClick={() => colorInputRef.current?.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
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
                  if (!prod) return null;
                  const prodImg = prod.image || prod.photo || prod.img || prod.colorImage;
                  return (
                    <div
                      key={prod.id || index}
                      onClick={() => handleSelectProductFromStock(prod)}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition"
                    >
                      <div className="flex items-center gap-3">
                        {prodImg ? (
                          <img src={prodImg} alt="" className="w-9 h-9 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Фото</div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                          {prod.folderId === 'availability' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">В наявності ({prod.size || '—'} розм., {prod.color || ''})</span>
                          )}
                        </div>
                      </div>
                      {prod.price !== undefined && <div className="text-xs font-semibold text-emerald-600">{prod.price} грн</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Виробник та налаштування пакування */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Виробник взуття</label>
                <select
                  value={supplier}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 cursor-pointer focus:outline-none"
                >
                  <option value="Міла">Міла</option>
                  <option value="Валерій">Валерій</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block flex items-center gap-1">
                  <Package size={14} className="text-slate-500" /> Списати з:
                </label>
                <select
                  value={packagingSource}
                  onChange={(e) => setPackagingSource(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 cursor-pointer focus:outline-none"
                >
                  <option value="Основний склад">Мій склад (у мене)</option>
                  <option value="Міла">Міла</option>
                  <option value="Валерій">Валерій</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 border-t border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeBox}
                  onChange={(e) => setIncludeBox(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                Коробка
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeDustbag}
                  onChange={(e) => setIncludeDustbag(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                Пильовик
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                value={size} 
                onChange={(e) => setSize(e.target.value)} 
                placeholder={placeholders.size || "Розмір"} 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400" 
              />
              <input 
                type="text" 
                value={material} 
                onChange={(e) => setMaterial(e.target.value)} 
                placeholder={placeholders.material || "Матеріал"} 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400" 
              />
              <input 
                type="text" 
                value={sole} 
                onChange={(e) => setSole(e.target.value)} 
                placeholder={placeholders.sole || "Підошва"} 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400" 
              />
              <input 
                type="text" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                placeholder={placeholders.color || "Колір"} 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400" 
              />
            </div>

            <div className="flex items-center justify-end pt-1">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setLining('байка')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${lining === 'байка' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Байка</button>
                <button type="button" onClick={() => setLining('хутро')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${lining === 'хутро' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Хутро</button>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Wand2 size={14} className="text-amber-600" />
              Розумне введення даних клієнта
            </label>
            <textarea
              rows="2"
              value={smartText}
              onChange={handleSmartClientParse}
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
              <input type="number" value={price} onChange={handlePriceChange} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500">Передплата (грн)</label>
                <button type="button" onClick={handleFullPayment} className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer">Повна оплата</button>
              </div>
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
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
          </div>
        </form>
      </div>

      {isStockImagesOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4"
          onClick={() => setIsStockImagesOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-150">
              <h3 className="font-bold text-slate-900 text-sm">
                {activeImageType === 'color' 
                  ? `Палітра: ${supplier}` 
                  : 'Виберіть зображення зі складу'}
              </h3>
              <button type="button" onClick={() => setIsStockImagesOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>

            {/* Вкладки для вибору матеріалу (Шкіра / Замша) під час вибору кольору */}
            {activeImageType === 'color' ? (
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPaletteMaterialTab('Шкіра')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition cursor-pointer ${
                    paletteMaterialTab === 'Шкіра' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Шкіра
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteMaterialTab('Замша')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition cursor-pointer ${
                    paletteMaterialTab === 'Замша' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Замша
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setStockFolderFilter('shoes')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition cursor-pointer ${stockFolderFilter === 'shoes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Взуття
                </button>
                <button
                  type="button"
                  onClick={() => setStockFolderFilter('availability')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition cursor-pointer ${stockFolderFilter === 'availability' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Наявність
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-96">
              {activeStockList.length > 0 ? (
                activeStockList.map((item, index) => {
                  if (!item) return null;
                  const img = item.image || item.photo || item.img || item.colorImage;
                  const isAvailability = stockFolderFilter === 'availability';

                  return (
                    <div key={item.id || index}>
                      {img ? (
                        <div onClick={() => handleSelectImageFromStock(item)} className="relative group cursor-pointer border rounded-lg overflow-hidden aspect-square bg-slate-50 hover:ring-2 hover:ring-slate-900 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center flex flex-col justify-center">
                            <span className="truncate font-semibold">{item.name || 'Товар'}</span>
                            {isAvailability && (
                              <span className="text-[8px] text-amber-300 font-bold truncate">
                                {item.size ? `${item.size} розм.` : ''} {item.color || ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => handleSelectImageFromStock(item)} className="border border-dashed border-slate-200 rounded-lg aspect-square flex flex-col items-center justify-center p-1 text-center text-[10px] text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100">
                          <span className="font-bold text-slate-700 truncate w-full">{item.name || 'Без фото'}</span>
                          {isAvailability && (
                            <span className="text-[8px] text-amber-600 font-bold mt-0.5 truncate">
                              {item.size ? `${item.size} розм.` : ''} {item.color || ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-xs text-slate-400">
                  {activeImageType === 'color' 
                    ? `Палітра ${supplier} (${paletteMaterialTab}) порожня` 
                    : 'У цій категорії поки немає товарів'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
  const [lining, setLining] = useState(''); // Наповнення (байка / хутро)
  
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [smartText, setSmartText] = useState(''); // Поле для розумного введення
  
  const [paymentType, setPaymentType] = useState('Передплата');
  const [advance, setAdvance] = useState('');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState(''); // Поле для коментаря
  const [price, setPrice] = useState('');

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isStockImagesOpen, setIsStockImagesOpen] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);

  const fileInputRef = useRef(null);
  const colorFileInputRef = useRef(null);

  // Збираємо товари з пропса або з localStorage (ключ dim47_stock)
  let currentStock = Array.isArray(stock) && stock.length > 0 ? [...stock] : [];
  
  if (currentStock.length === 0) {
    try {
      const savedStock = localStorage.getItem('dim47_stock');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) {
          currentStock = parsed;
        }
      }
    } catch (e) {
      console.error("Помилка читання складу:", e);
    }
  }

  // Фільтруємо товари, залишаючи взуття
  const shoesStock = currentStock.filter(item => item && (item.folderId === 'shoes' || !item.folderId));

  const filteredStockProducts = shoesStock.filter(item => 
    item && item.name && item.name.toLowerCase().includes(name.toLowerCase())
  );

  // Розумне розбирання тексту клієнта
  const handleSmartClientParse = (text) => {
    setSmartText(text);
    if (!text.trim()) return;

    // Шукаємо телефон (формати з +380 або просто 0...)
    const phoneMatch = text.match(/(\+?38)?0\d{9}/);
    if (phoneMatch) {
      setPhone(phoneMatch[0]);
    }

    // Розбиваємо текст за комами або переносів рядків
    const parts = text.split(/,|\n/).map(p => p.trim()).filter(Boolean);
    
    // Пробуємо витягнути ПІБ, місто, відділення
    parts.forEach(part => {
      // Якщо містить цифри і схоже на відділення / пошту
      if (/відділенн|пошт|№|\b\d{1,3}\b/i.test(part) && !part.match(/(\+?38)?0\d{9}/)) {
        setAddress(part);
      } 
      // Якщо це схоже на телефон - пропускаємо, бо вже знайшли
      else if (part.match(/(\+?38)?0\d{9}/)) {
        // вже оброблено
      }
      // Якщо містить букви і довше за 2 символи, вирішуємо чи це ПІБ чи місто
      else if (!clientName && parts.indexOf(part) === 0) {
        setClientName(part);
      } else if (!city && ( /місто|м\.|м /i.test(part) || parts.indexOf(part) === 1 )) {
        setCity(part.replace(/місто|м\./gi, '').trim());
      } else if (!city) {
        setCity(part);
      }
    });

    // Альтернативний простий розклад через кому, якщо вище не заповнилось
    if (parts.length >= 3) {
      if (!clientName) setClientName(parts[0]);
      if (!phone && phoneMatch) setPhone(phoneMatch[0]);
      // Знаходимо частину без телефону та не першу
      const remaining = parts.filter(p => !p.includes(phoneMatch?.[0]) && p !== parts[0]);
      if (remaining.length > 0 && !city) setCity(remaining[0]);
      if (remaining.length > 1 && !address) setAddress(remaining[1]);
    }
  };

  const handleSelectProductFromStock = (product) => {
    setName(product.name || '');
    const prodImg = product.image || product.photo || product.img || product.colorImage;
    if (prodImg) setImage(prodImg);
    if (product.price) setPrice(product.price);
    if (product.size) setSize(product.size);
    if (product.material) setMaterial(product.material);
    if (product.sole) setSole(product.sole);
    if (product.color) setColor(product.color);
    if (product.lining) setLining(product.lining);
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
      if (product.price) setPrice(product.price);
      if (product.size) setSize(product.size);
      if (product.material) setMaterial(product.material);
      if (product.sole) setSole(product.sole);
      if (product.color) setColor(product.color);
      if (product.lining) setLining(product.lining);
    } else if (activeImageType === 'color') {
      if (imgUrl) setColorImage(imgUrl);
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
          
          {/* Фото товару та зразок кольору */}
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
                <input type="file" ref={colorFileInputRef} onChange={(e) => handleFileUpload(e, 'color')} className="hidden" accept="image/*" />
                <button type="button" title="Завантажити з пристрою" onClick={() => colorFileInputRef.current.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Upload size={16} />
                </button>
                <button type="button" title="Вибрати зі складу" onClick={() => { setActiveImageType('color'); setIsStockImagesOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  <Search size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Назва товару */}
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
                placeholder="Назва товару (напр. Мюлі)"
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
                        <div className="text-[11px] text-slate-500">{prod.price ? `${prod.price} грн` : ''} {prod.color ? `• ${prod.color}` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Характеристики товару (включно з байка / хутро) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Розмір (напр. 37)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Матеріал (напр. шкіра)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={sole} onChange={(e) => setSole(e.target.value)} placeholder="Підошва" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Колір" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            {/* Поле наповнення: байка / хутро */}
            <div className="flex gap-2 pt-1">
              <input 
                type="text" 
                value={lining} 
                onChange={(e) => setLining(e.target.value)} 
                placeholder="Наповнення (байка / хутро)" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" 
              />
              <button 
                type="button" 
                onClick={() => setLining('байка')} 
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Байка
              </button>
              <button 
                type="button" 
                onClick={() => setLining('хутро')} 
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Хутро
              </button>
            </div>
          </div>

          {/* Розумне введення даних клієнта */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Wand2 size={14} className="text-amber-600" />
              Розумне введення даних клієнта (скопіюйте текст сюди)
            </label>
            <textarea
              rows="2"
              value={smartText}
              onChange={(e) => handleSmartClientParse(e.target.value)}
              placeholder="Вставте сюди весь текст від клієнта (ПІБ, телефон, місто, відділення)..."
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/70 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Дані клієнта */}
          <div className="space-y-2">
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ім'я клієнта (ПІБ)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон (+380...)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Місто" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Відділення / Адреса" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          </div>

          {/* Ціна та передплата */}
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

          {/* Поле для коментаря */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Коментар до замовлення</label>
            <textarea
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Додаткові побажання або примітки..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
          </div>
        </form>
      </div>

      {/* Модалка вибору фото зі складу */}
      {isStockImagesOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Виберіть зображення зі складу</h3>
              <button onClick={() => setIsStockImagesOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-96">
              {shoesStock.length > 0 ? (
                shoesStock.map((item, index) => {
                  const img = item.image || item.photo || item.img || item.colorImage;
                  return (
                    <div key={item.id || index}>
                      {img ? (
                        <div onClick={() => handleSelectImageFromStock(item)} className="relative group cursor-pointer border rounded-lg overflow-hidden aspect-square bg-slate-50 hover:ring-2 hover:ring-slate-900 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">{item.name || 'Товар'}</div>
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
                  Склад порожній
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
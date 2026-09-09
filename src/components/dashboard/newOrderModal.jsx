import React, { useState, useRef } from 'react';
import { X, Upload, Search, Image as ImageIcon, Wand2 } from 'lucide-react';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Перевірте шлях до вашого firebase.js (якщо файл лежить вище, змініть на "../firebase")

export default function NewOrderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  stock = [],
  formClientName, setFormClientName,
  formClientPhone, setFormClientPhone,
  formCity, setFormCity,
  formWarehouse, setFormWarehouse,
  formAdvance, setFormAdvance,
  formDiscount, setFormDiscount,
  formPaymentType, setFormPaymentType,
  formNote, setFormNote,
  formProductTitle, setFormProductTitle,
  formSize, setFormSize,
  formColorText, setFormColorText,
  formMaterial, setFormMaterial,
  formSole, setFormSole,
  formPrice, setFormPrice,
  formProductImage, setFormProductImage,
  formColorImage, setFormColorImage
}) {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isStockImagesOpen, setIsStockImagesOpen] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  const [rawClientInput, setRawClientInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const colorFileInputRef = useRef(null);

  let currentStock = Array.isArray(stock) && stock.length > 0 ? [...stock] : [];
  if (currentStock.length === 0) {
    try {
      const savedStock = localStorage.getItem('dim47_stock');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) currentStock = parsed;
      }
    } catch (e) {
      console.error("Помилка читання складу:", e);
    }
  }

  const shoesStock = currentStock.filter(item => item && (item.folderId === 'shoes' || !item.folderId));
  const paletteStock = currentStock.filter(item => 
    item && (item.folderId === 'palette' || item.folderId === 'colors' || item.folderId === 'palettes')
  );

  const activeStockList = activeImageType === 'color' ? paletteStock : shoesStock;

  const filteredStockProducts = shoesStock.filter(item => 
    item && item.name && item.name.toLowerCase().includes(formProductTitle.toLowerCase())
  );

  const handleSmartClientParse = (text) => {
    setRawClientInput(text);
    if (!text.trim()) return;

    const phoneMatch = text.match(/(\+38)?0\d{9}/);
    if (phoneMatch) {
      setFormClientPhone(phoneMatch[0]);
    }

    let cleanText = text.replace(/(\+38)?0\d{9}/g, '').trim();
    let parts = cleanText.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
    
    if (parts.length === 0) return;
    if (parts.length === 1) {
      parts = cleanText.split(/\s+/);
    }

    let foundName = [];
    let i = 0;
    while (i < parts.length && i < 2 && /^[А-ЯІЇЄҐ][а-яіїєґ']+$|^[А-ЯІЇЄҐ]\.?$/.test(parts[i])) {
      foundName.push(parts[i]);
      i++;
    }

    if (foundName.length > 0) {
      setFormClientName(foundName.join(' '));
    }

    let remainingParts = parts.slice(i);
    let addressKeywords = ['нп', 'відділення', 'поштомат', '№', 'вул', 'пл', 'пр', 'буд'];

    let cityCandidate = [];
    let addressCandidate = [];
    let isAddressMode = false;

    remainingParts.forEach(part => {
      const lower = part.toLowerCase();
      if (addressKeywords.some(kw => lower.includes(kw))) {
        isAddressMode = true;
      }

      if (isAddressMode) {
        addressCandidate.push(part);
      } else {
        if (/^[А-ЯІЇЄҐ][а-яіїєґ']+$/.test(part)) {
          cityCandidate.push(part);
        } else {
          addressCandidate.push(part);
        }
      }
    });

    if (cityCandidate.length > 0) {
      setFormCity(cityCandidate.join(' '));
    }
    if (addressCandidate.length > 0) {
      setFormWarehouse(addressCandidate.join(' '));
    }
  };

  const handleSelectProductFromStock = (product) => {
    setFormProductTitle(product.name || '');
    const prodImg = product.image || product.photo || product.img || product.colorImage;
    if (prodImg) setFormProductImage(prodImg);
    if (product.price) setFormPrice(product.price);
    setIsProductDropdownOpen(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'product') setFormProductImage(reader.result);
        else setFormColorImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImageFromStock = (product) => {
    const imgUrl = product.image || product.photo || product.img || product.colorImage;
    if (activeImageType === 'product') {
      if (imgUrl) setFormProductImage(imgUrl);
      if (product.name) setFormProductTitle(product.name);
      if (product.price) setFormPrice(product.price);
    } else if (activeImageType === 'color') {
      if (imgUrl) setFormColorImage(imgUrl);
      if (product.name) setFormColorText(product.name);
    }
    setIsStockImagesOpen(false);
  };

  // Функція збереження замовлення у Firebase Firestore
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        clientName: formClientName || '',
        clientPhone: formClientPhone || '',
        city: formCity || '',
        warehouse: formWarehouse || '',
        advance: Number(formAdvance) || 0,
        discount: Number(formDiscount) || 0,
        paymentType: formPaymentType || '',
        note: formNote || '',
        productTitle: formProductTitle || '',
        size: formSize || '',
        colorText: formColorText || '',
        material: formMaterial || '',
        sole: formSole || '',
        price: Number(formPrice) || 0,
        productImage: formProductImage || '',
        colorImage: formColorImage || '',
        createdAt: new Date().toISOString()
      };

      // Запис у колекцію 'orders' у Firebase
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Замовлення успішно збережено у Firestore з ID: ", docRef.id);

      // Викликаємо зовнішній onSubmit, якщо він переданий у пропсах
      if (typeof onSubmit === 'function') {
        onSubmit(e);
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Помилка збереження замовлення у Firebase: ", error);
      alert("Помилка при збереженні замовлення. Перевірте консоль.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Замовлення</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700">Фото товару</span>
              {formProductImage ? (
                <div className="relative w-16 h-16">
                  <img src={formProductImage} alt="Товар" className="w-16 h-16 object-cover rounded-lg border shadow-xs" />
                  <button type="button" onClick={() => setFormProductImage('')} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"><X size={12}/></button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-200/70 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="flex gap-1.5 w-full justify-center">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'product')} className="hidden" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"><Upload size={16} /></button>
                <button type="button" onClick={() => { setActiveImageType('product'); setIsStockImagesOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"><Search size={16} /></button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700">Зразок кольору</span>
              {formColorImage ? (
                <div className="relative w-16 h-16">
                  <img src={formColorImage} alt="Колір" className="w-16 h-16 object-cover rounded-lg border shadow-xs" />
                  <button type="button" onClick={() => setFormColorImage('')} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"><X size={12}/></button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-200/70 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="flex gap-1.5 w-full justify-center">
                <input type="file" ref={colorFileInputRef} onChange={(e) => handleFileUpload(e, 'color')} className="hidden" accept="image/*" />
                <button type="button" onClick={() => colorFileInputRef.current.click()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"><Upload size={16} /></button>
                <button type="button" onClick={() => { setActiveImageType('color'); setIsStockImagesOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"><Search size={16} /></button>
              </div>
            </div>
          </div>

          <div className="relative space-y-1">
            <label className="text-xs font-semibold text-slate-600">Назва товару</label>
            <div className="relative">
              <input 
                type="text"
                value={formProductTitle}
                onChange={(e) => { setFormProductTitle(e.target.value); setIsProductDropdownOpen(true); }}
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
                      {prodImg ? <img src={prodImg} alt="" className="w-9 h-9 object-cover rounded-lg border" /> : <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Фото</div>}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] text-slate-500">{prod.price ? `${prod.price} грн` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formSize} onChange={(e) => setFormSize(e.target.value)} placeholder="Розмір (напр. 37)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={formMaterial} onChange={(e) => setFormMaterial(e.target.value)} placeholder="Матеріал (напр. шкіра)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={formSole} onChange={(e) => setFormSole(e.target.value)} placeholder="Підошва" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={formColorText} onChange={(e) => setFormColorText(e.target.value)} placeholder="Колір" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Wand2 size={13} className="text-indigo-600" /> Розумне введення даних клієнта (скопіюйте сюди текст)
              </label>
              <textarea 
                rows={2}
                value={rawClientInput}
                onChange={(e) => handleSmartClientParse(e.target.value)}
                placeholder="Вставте сюди текст повністю (ПІБ, телефон, місто, відділення)..."
                className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <input type="text" value={formClientName} onChange={(e) => setFormClientName(e.target.value)} placeholder="Ім'я клієнта (ПІБ)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formClientPhone} onChange={(e) => setFormClientPhone(e.target.value)} placeholder="Телефон (+380...)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Місто" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <input type="text" value={formWarehouse} onChange={(e) => setFormWarehouse(e.target.value)} placeholder="Відділення / Адреса" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Вартість товару (грн)</label>
              <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Передплата (грн)</label>
              <input type="number" value={formAdvance} onChange={(e) => setFormAdvance(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>

      {isStockImagesOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4" onClick={() => setIsStockImagesOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {activeImageType === 'color' ? 'Виберіть колір з палітри' : 'Виберіть товар зі складу'}
              </h3>
              <button onClick={() => setIsStockImagesOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-96">
              {activeStockList.length > 0 ? (
                activeStockList.map((item, index) => {
                  const img = item.colorImage || item.image || item.photo || item.img;
                  return (
                    <div key={item.id || index}>
                      {img ? (
                        <div onClick={() => handleSelectImageFromStock(item)} className="relative group cursor-pointer border rounded-lg overflow-hidden aspect-square bg-slate-50 hover:ring-2 hover:ring-slate-900 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">{item.name || 'Елемент'}</div>
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
                  {activeImageType === 'color' ? 'Папка палітри порожня' : 'Склад порожній'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
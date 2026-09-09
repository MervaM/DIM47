import React, { useState, useRef } from 'react';
import { X, Upload, Search, Image as ImageIcon } from 'lucide-react';

export default function NewOrderModal({ isOpen, onClose, onSave, stock = [] }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [colorImage, setColorImage] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [sole, setSole] = useState('');
  const [color, setColor] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState('Передплата');
  const [advance, setAdvance] = useState('');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState('');
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

  const handleSelectProductFromStock = (product) => {
    setName(product.name || '');
    const prodImg = product.image || product.photo || product.img || product.colorImage;
    if (prodImg) setImage(prodImg);
    if (product.price) setPrice(product.price);
    if (product.size) setSize(product.size);
    if (product.material) setMaterial(product.material);
    if (product.sole) setSole(product.sole);
    if (product.color) setColor(product.color);
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
            
            {/* Фото товару */}
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

            {/* Зразок кольору */}
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Розмір (напр. 37)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Матеріал (напр. шкіра)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={sole} onChange={(e) => setSole(e.target.value)} placeholder="Підошва" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Колір" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ім'я клієнта (ПІБ)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон (+380...)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
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

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
          </div>
        </form>
      </div>

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
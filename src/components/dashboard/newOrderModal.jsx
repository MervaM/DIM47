import React, { useState, useEffect } from 'react';

export default function NewOrderModal({ isOpen, onClose, onSave, orderToEdit, stockItems = [] }) {
  const [smartText, setSmartText] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    city: '',
    warehouse: '',
    productTitle: '',
    size: '',
    color: '',
    material: '',
    sole: '',
    lining: '',
    price: '',
    advance: '',
    comment: '',
    image: '',
    status: 'Нове'
  });

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        ...orderToEdit,
        clientName: orderToEdit.client || orderToEdit.clientName || '',
        phone: orderToEdit.phone || orderToEdit.clientPhone || '',
      });
    } else {
      setFormData({
        clientName: '',
        phone: '',
        city: '',
        warehouse: '',
        productTitle: '',
        size: '',
        color: '',
        material: '',
        sole: '',
        lining: '',
        price: '',
        advance: '',
        comment: '',
        image: '',
        status: 'Нове'
      });
    }
    setSmartText('');
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSmartParse = (text) => {
    setSmartText(text);
    if (!text.trim()) return;

    const phoneMatch = text.match(/(\+?38)?0\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    setFormData(prev => ({
      ...prev,
      phone: phone || prev.phone,
      clientName: prev.clientName || text.split(',')[0] || ''
    }));
  };

  // Вибір моделі зі складу через картку/кнопку
  const handleSelectStockItem = (item) => {
    setFormData(prev => ({
      ...prev,
      productTitle: item.title || prev.productTitle,
      color: item.color || prev.color,
      material: item.material || prev.material,
      image: item.image || prev.image,
      price: item.price || prev.price
    }));
  };

  // Завантаження фото з пристрою
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const detailsArr = [
      formData.size ? `${formData.size} розм.` : '',
      formData.color,
      formData.material,
      formData.sole,
      formData.lining
    ].filter(Boolean).join(', ');

    onSave({
      ...formData,
      productDetails: detailsArr,
      price: Number(formData.price) || 0,
      advance: Number(formData.advance) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {orderToEdit ? 'Редагувати замовлення' : 'Нове замовлення'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Розумне введення */}
          {!orderToEdit && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
              <label className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                🪄 Розумне введення даних клієнта (скопіюйте сюди текст)
              </label>
              <textarea 
                rows="2"
                value={smartText}
                onChange={(e) => handleSmartParse(e.target.value)}
                placeholder="Наприклад: Мошовська Марія, 050 986 88 06, Київ, відділення 83"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-xs"
              />
            </div>
          )}

          {/* Клієнт */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Ім'я клієнта (ПІБ)</label>
            <input 
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              placeholder="ПІБ клієнта"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Телефон</label>
              <input 
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0991463916"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Місто</label>
              <input 
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Київ"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Відділення / Адреса доставки</label>
            <input 
              type="text"
              required
              value={formData.warehouse}
              onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
              placeholder="відділення 83"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
            />
          </div>

          <hr className="border-slate-100" />

          {/* ВІЗУАЛЬНИЙ БЛОК ВИБОРУ ТОВАРУ (як на скріншоті) */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm text-center">Вибір моделі зі складу або завантаження</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Картка обраного або поточного товару */}
              <div className="border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-between bg-slate-50/50">
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 mb-2">
                  {formData.image ? (
                    <img src={formData.image} alt="Товар" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xl">🖼️</span>
                  )}
                </div>
                <div className="flex gap-2 w-full justify-center">
                  <label className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs text-xs" title="Завантажити з пристрою">
                    📤
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  
                  {/* Швидкий вибір першого товару зі складу для прикладу або кнопка */}
                  {stockItems.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => handleSelectStockItem(stockItems[0])}
                      className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs text-xs"
                      title="Вибрати зі складу"
                    >
                      🔍
                    </button>
                  )}
                </div>
              </div>

              {/* Якщо є кілька товарів у складі, можна вивести міні-список для вибору */}
              <div className="border border-slate-200 rounded-2xl p-3 flex flex-col justify-center space-y-1.5 bg-slate-50/50 text-[11px]">
                <span className="font-bold text-slate-700">Швидкий вибір зі складу:</span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {stockItems.length > 0 ? (
                    stockItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectStockItem(item)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-amber-50 truncate font-medium"
                      >
                        {item.title} ({item.color || '—'})
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400">Склад порожній</span>
                  )}
                </div>
              </div>
            </div>

            {/* Назва товару */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Назва товару</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={formData.productTitle}
                  onChange={(e) => setFormData({...formData, productTitle: e.target.value})}
                  placeholder="Мюлі"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-semibold pr-10"
                />
                <span className="absolute right-3 top-3 text-slate-400">🔍</span>
              </div>
            </div>

            {/* Характеристики товару в 4 полі (як на скріншоті) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Характеристики товару:</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  placeholder="39"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
                <input 
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  placeholder="шкіра"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
                <input 
                  type="text"
                  value={formData.sole}
                  onChange={(e) => setFormData({...formData, sole: e.target.value})}
                  placeholder="Підошва"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
                <input 
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="чорний"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Ціни */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ціна товару (грн)</label>
              <input 
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="2500"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Передплата (грн)</label>
              <input 
                type="number"
                value={formData.advance}
                onChange={(e) => setFormData({...formData, advance: e.target.value})}
                placeholder="300"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Зберегти замовлення
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
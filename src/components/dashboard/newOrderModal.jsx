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

  // Розумне введення з буфера
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

  // Вибір моделі зі складу
  const handleStockSelect = (e) => {
    const selectedTitle = e.target.value;
    const foundItem = stockItems.find(item => item.title === selectedTitle);
    
    if (foundItem) {
      setFormData(prev => ({
        ...prev,
        productTitle: foundItem.title || '',
        color: foundItem.color || prev.color,
        material: foundItem.material || prev.material,
        image: foundItem.image || prev.image,
        price: foundItem.price || prev.price
      }));
    } else {
      setFormData(prev => ({ ...prev, productTitle: selectedTitle }));
    }
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

          {/* Характеристики товару + вибір зі складу / фото */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm text-center">Характеристики товару</h3>
            
            {/* Вибір зі складу */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Вибрати модель зі складу</label>
              <select 
                onChange={handleStockSelect}
                defaultValue=""
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 bg-white text-xs cursor-pointer font-medium"
              >
                <option value="" disabled>-- Оберіть із каталогу складу --</option>
                {stockItems.map((item, idx) => (
                  <option key={idx} value={item.title}>{item.title} ({item.color || 'колір не вказано'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Назва моделі</label>
              <input 
                type="text"
                required
                value={formData.productTitle}
                onChange={(e) => setFormData({...formData, productTitle: e.target.value})}
                placeholder="Напр. Черевики 01"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Розмір</label>
                <input 
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  placeholder="Напр. 39"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Колір</label>
                <input 
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="Напр. жовтий"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Матеріал</label>
                <input 
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  placeholder="Напр. шкіра"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Підошва</label>
                <input 
                  type="text"
                  value={formData.sole}
                  onChange={(e) => setFormData({...formData, sole: e.target.value})}
                  placeholder="Напр. трактор"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Наповнення (байка / хутро / демі)</label>
              <input 
                type="text"
                value={formData.lining}
                onChange={(e) => setFormData({...formData, lining: e.target.value})}
                placeholder="Напр. байка"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
              />
            </div>

            {/* Завантаження фото з пристрою */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Фото товару</label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl border border-slate-200 transition text-xs">
                  📁 Завантажити з пристрою
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {formData.image && <span className="text-emerald-600 font-medium">✓ Фото завантажено</span>}
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

          {/* Нотатка */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Нотатка до замовлення</label>
            <textarea 
              rows="2"
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              placeholder="Додаткові побажання клієнта..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-xs"
            />
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
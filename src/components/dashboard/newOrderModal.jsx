import React, { useState } from 'react';

export default function NewOrderModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
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
  const [smartInputText, setSmartInputText] = useState('');

  if (!isOpen) return null;

  // Функція розумного розбору вставленого тексту
  const handleSmartParse = (text) => {
    setSmartInputText(text);
    if (!text.trim()) return;

    // 1. Шукаємо телефон (формати +380..., 050..., 097... тощо)
    const phoneRegex = /(?:\+38)?0\d{9}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      setFormClientPhone(phoneMatch[0]);
    }

    // Видаляємо телефон із тексту, щоб не заважав шукати інше
    let cleanText = text.replace(phoneRegex, '').trim();

    // 2. Шукаємо відділення (наприклад: "відділення 83", "нп 47", "№1", "відд. 5")
    const warehouseRegex = /(?:відділення|відд\.?|нп|поштомат|№)\s*[:\-]?\s*(\d+)/i;
    const whMatch = cleanText.match(warehouseRegex);
    if (whMatch) {
      setFormWarehouse(whMatch[0]);
      cleanText = cleanText.replace(whMatch[0], '').trim();
    }

    // Розбиваємо залишок тексту на шматочки за комами або дефісами
    let parts = cleanText.split(/[,–—-]/).map(p => p.trim()).filter(Boolean);

    if (parts.length > 0) {
      // Зазвичай перша частина — це ПІБ
      setFormClientName(parts[0]);
    }

    if (parts.length > 1) {
      // Друга або наступна частина (якщо це не відділення) може бути містом
      // Перевіряємо чи не містить вона вже знайдене відділення
      const possibleCity = parts.find(p => !p.toLowerCase().includes('відділ') && !p.toLowerCase().includes('нп') && p !== parts[0]);
      if (possibleCity) {
        setFormCity(possibleCity);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-xl my-auto relative max-h-[90vh] overflow-y-auto">
        
        {/* Шапка модалки */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-base font-bold text-slate-800">
            {isEditing ? 'Редагувати замовлення' : 'Нове замовлення'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* РОЗУМНЕ ВВЕДЕННЯ ДАНИХ */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="block text-[11px] font-semibold text-indigo-600 mb-1">
              ✨ Розумне введення даних клієнта (скопіюйте сюди текст)
            </label>
            <textarea
              rows="2"
              value={smartInputText}
              onChange={(e) => handleSmartParse(e.target.value)}
              placeholder="Наприклад: Мошовська Марія, 050 986 88 06, Київ, відділення 83"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Основні поля */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Ім'я клієнта (ПІБ)</label>
              <input
                type="text"
                value={formClientName}
                onChange={(e) => setFormClientName(e.target.value)}
                placeholder="ПІБ клієнта"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Телефон</label>
                <input
                  type="text"
                  value={formClientPhone}
                  onChange={(e) => setFormClientPhone(e.target.value)}
                  placeholder="0991463916"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Місто</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Київ"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Відділення / Адреса доставки</label>
              <input
                type="text"
                value={formWarehouse}
                onChange={(e) => setFormWarehouse(e.target.value)}
                placeholder="відділення 83"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Ціна товару (грн)</label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Передплата (грн)</label>
                <input
                  type="number"
                  value={formAdvance}
                  onChange={(e) => setFormAdvance(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

            {/* Кнопки керування */}
          <div className="flex gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-100 text-slate-700 py-2.5 rounded-2xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="w-1/2 bg-slate-900 text-white py-2.5 rounded-2xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-sm"
            >
              Зберегти
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
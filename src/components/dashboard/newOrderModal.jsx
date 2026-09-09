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
  formFilling, setFormFilling, // Додано пропс для наповнення (байка/хутро)
  formPrice, setFormPrice,
  formProductImage, setFormProductImage,
  formColorImage, setFormColorImage
}) {
  const [smartInputText, setSmartInputText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Розумний розбір тексту
  const handleSmartParse = (text) => {
    setSmartInputText(text);
    if (!text.trim()) return;

    const phoneRegex = /(?:\+38)?0\d{9}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      setFormClientPhone(phoneMatch[0]);
    }

    let cleanText = text.replace(phoneRegex, '').trim();

    const warehouseRegex = /(?:відділення|відд\.?|нп|поштомат|№)\s*[:\-]?\s*(\d+)/i;
    const whMatch = cleanText.match(warehouseRegex);
    if (whMatch) {
      setFormWarehouse(whMatch[0]);
      cleanText = cleanText.replace(whMatch[0], '').trim();
    }

    let parts = cleanText.split(/[,–—-]/).map(p => p.trim()).filter(Boolean);

    if (parts.length > 0) {
      setFormClientName(parts[0]);
    }

    if (parts.length > 1) {
      const possibleCity = parts.find(p => !p.toLowerCase().includes('відділ') && !p.toLowerCase().includes('нп') && p !== parts[0]);
      if (possibleCity) {
        setFormCity(possibleCity);
      }
    }
  };

  // Копіювання всіх даних клієнта однією кнопкою
  const handleCopyClientData = () => {
    const textToCopy = `Клієнт: ${formClientName || '—'}\nТелефон: ${formClientPhone || '—'}\nМісто: ${formCity || '—'}\nВідділення: ${formWarehouse || '—'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            type="button"
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

          {/* Дані клієнта */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-medium text-slate-600">Ім'я клієнта (ПІБ)</label>
              <button
                type="button"
                onClick={handleCopyClientData}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg transition font-medium cursor-pointer flex items-center gap-1"
              >
                📋 {copied ? 'Скопійовано!' : 'Скопіювати дані клієнта'}
              </button>
            </div>
            
            <input
              type="text"
              value={formClientName}
              onChange={(e) => setFormClientName(e.target.value)}
              placeholder="ПІБ клієнта"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />

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
          </div>

          {/* ХАРАКТЕРИСТИКИ ВЗУТТЯ */}
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-800">Характеристики товару</p>
            
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Назва моделі</label>
              <input
                type="text"
                value={formProductTitle}
                onChange={(e) => setFormProductTitle(e.target.value)}
                placeholder="Напр. Черевики 01"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Розмір</label>
                <input
                  type="text"
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  placeholder="Напр. 39"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Колір</label>
                <input
                  type="text"
                  value={formColorText}
                  onChange={(e) => setFormColorText(e.target.value)}
                  placeholder="Напр. жовтий"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Матеріал</label>
                <input
                  type="text"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  placeholder="Напр. шкіра"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Підошва</label>
                <input
                  type="text"
                  value={formSole}
                  onChange={(e) => setFormSole(e.target.value)}
                  placeholder="Напр. трактор"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* НОВЕ ПОЛЕ ДЛЯ НАПОВНЕННЯ */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Наповнення (байка / хутро / демі)</label>
              <input
                type="text"
                value={formFilling}
                onChange={(e) => setFormFilling(e.target.value)}
                placeholder="Напр. байка"
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

            {/* НОТАТКА */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">💬 Нотатка до замовлення</label>
              <textarea
                rows="2"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Додаткові побажання клієнта..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
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
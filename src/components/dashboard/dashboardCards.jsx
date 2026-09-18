import React, { useState } from 'react';
import { Edit2, Trash2, Check, Copy, Package } from 'lucide-react';

export default function DashboardCards({ orders = [], onEditModal, onInlineSave, onDelete, onStatusChange }) {
  const [editingTtnId, setEditingTtnId] = useState(null);
  const [ttnValues, setTtnValues] = useState({});
  const [copiedTtnId, setCopiedTtnId] = useState(null);
  const [copiedClientId, setCopiedClientId] = useState(null);

  // Налаштування списання пакування під час введення ТТН
  const [packagingSettings, setPackagingSettings] = useState({});

  const statusOptions = ['Нове', 'В роботі', 'З наявності', 'Доставка', 'Успішно', 'Відмова'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Нове':
        return 'bg-amber-100/80 text-amber-900 border-amber-300';
      case 'В роботі':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'З наявності':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Доставка':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Успішно':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Відмова':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleStartEditingTtn = (order) => {
    setTtnValues(prev => ({ ...prev, [order.id]: order.ttn || '' }));
    
    // Точна ініціалізація складу: якщо замовлення вже мало збережене джерело — беремо його, інакше чітко 'Основний склад'
    const defaultSource = order.packagingSource || 'Основний склад';

    setPackagingSettings(prev => ({
      ...prev,
      [order.id]: {
        source: defaultSource,
        includeBox: order.includeBox ?? true,
        includeDustbag: order.includeDustbag ?? true
      }
    }));

    setEditingTtnId(order.id);
  };

  const updatePackaging = (orderId, field, value) => {
    setPackagingSettings(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleTtnSave = (order) => {
    const newTtn = ttnValues[order.id] !== undefined ? ttnValues[order.id] : (order.ttn || '');
    const packInfo = packagingSettings[order.id] || {};

    if (typeof onInlineSave === 'function') {
      onInlineSave({ 
        ...order, 
        ttn: newTtn,
        packagingSource: packInfo.source || 'Основний склад',
        includeBox: packInfo.includeBox ?? true,
        includeDustbag: packInfo.includeDustbag ?? true
      });
    }
    setEditingTtnId(null);
  };

  const handleCopyTtn = (orderId, ttnText) => {
    if (!ttnText) return;
    navigator.clipboard.writeText(ttnText);
    setCopiedTtnId(orderId);
    setTimeout(() => {
      setCopiedTtnId(null);
    }, 1500);
  };

  const handleCopyClientInfo = (order) => {
    const clientName = order.client || order.clientName || 'Клієнт';
    const clientPhone = order.phone || '—';
    const city = order.city || '';
    const address = order.warehouse || order.address || '';
    const fullAddress = [city, address].filter(Boolean).join(', ');

    const textToCopy = `${clientName}\n${clientPhone}\n${fullAddress}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedClientId(order.id);
    setTimeout(() => {
      setCopiedClientId(null);
    }, 1500);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
        Замовлень не знайдено
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const remainingPayment = (Number(order.price) || 0) - (Number(order.advance) || 0);
        const isEditingTtn = editingTtnId === order.id;
        
        const currentPack = packagingSettings[order.id] || {
          source: order.packagingSource || 'Основний склад',
          includeBox: order.includeBox ?? true,
          includeDustbag: order.includeDustbag ?? true
        };

        let colorsArr = [];
        if (Array.isArray(order.colorImages) && order.colorImages.length > 0) {
          colorsArr = order.colorImages;
        } else if (order.colorImage) {
          colorsArr = [order.colorImage];
        }

        const orderComment = order.comment || order.note || order.description;

        return (
          <div 
            key={order.id}
            className="production-card bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 space-y-3.5 relative"
            style={{ minHeight: '85vh' }}
          >
            <div className="space-y-3.5">
              {/* Верхній блок: Статус, Виробник та Дії */}
              <div className="flex items-center justify-between gap-2">
                <select
                  value={order.status || 'Нове'}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition ${getStatusColor(order.status)}`}
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st} className="bg-white text-slate-900 font-normal">
                      {st}
                    </option>
                  ))}
                </select>

                {order.supplier && (
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold rounded-xl shadow-2xs">
                    Виробник: {order.supplier}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditModal(order)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Редагувати"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(order.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Видалити"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Фото товару */}
              {order.image && (
                <div className="w-full h-64 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  <img src={order.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Зразки кольорів */}
              {colorsArr.length > 0 && (
                <div className={`w-full h-24 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 grid ${
                  colorsArr.length === 1 ? 'grid-cols-1' : 
                  colorsArr.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                } gap-0.5 bg-slate-200`}>
                  {colorsArr.map((imgSrc, cIdx) => (
                    <div key={cIdx} className="w-full h-full overflow-hidden bg-white">
                      <img src={imgSrc} alt="Колір" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Назва та характеристики */}
              <div className="text-center space-y-1 py-1">
                <h4 className="font-bold text-slate-900 text-base">{order.productTitle || order.name || 'Взуття'}</h4>
                <p className="text-sm font-extrabold text-slate-900">
                  {[
                    order.size ? `${order.size} розм.` : '',
                    order.color || order.colorText,
                    order.material,
                    order.sole,
                    order.lining
                  ].filter(Boolean).join(', ')}
                </p>

                {orderComment && (
                  <div className="mt-2 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded-xl px-3 py-2 italic">
                    <span className="font-semibold not-italic text-slate-700">Коментар:</span> {orderComment}
                  </div>
                )}
              </div>

              {/* Дані клієнта */}
              <div className="bg-slate-50/60 rounded-2xl p-3.5 text-center relative border border-slate-100 space-y-1">
                <button 
                  type="button" 
                  onClick={() => handleCopyClientInfo(order)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 border rounded-lg bg-white cursor-pointer transition active:scale-95"
                  title="Скопіювати дані покупця"
                >
                  <Copy size={13} />
                </button>

                {copiedClientId === order.id && (
                  <div className="absolute top-1 left-0 right-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-0.5 rounded-t-2xl animate-pulse">
                    Дані покупця скопійовано!
                  </div>
                )}

                <div className="font-bold text-slate-900 text-base">{order.client || order.clientName || 'Клієнт'}</div>
                <div className="text-xs font-semibold text-slate-600">{order.phone || '—'}</div>
                <div className="text-xs text-slate-500">
                  {order.city || ''}{order.city && order.warehouse ? ', ' : ''}{order.warehouse || order.address || ''}
                </div>
              </div>

              {/* Блок ТТН та Списання Пакування */}
              <div className="border border-dashed border-slate-200 rounded-xl p-2.5 space-y-2 bg-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">TTH:</span>
                  
                  {order.ttn && !isEditingTtn ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyTtn(order.id, order.ttn)}
                        className="font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        title="Скопіювати ТТН"
                      >
                        {order.ttn}
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditingTtn(order)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      >
                        змінити
                      </button>
                    </div>
                  ) : !isEditingTtn ? (
                    <button
                      type="button"
                      onClick={() => handleStartEditingTtn(order)}
                      className="font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      + Додати ТТН
                    </button>
                  ) : null}
                </div>

                {/* Відображення деталей списання, якщо ТТН уже є */}
                {order.ttn && !isEditingTtn && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Списано з: <strong className="text-slate-800">{order.packagingSource || 'Основний склад'}</strong></span>
                    <span>
                      {[order.includeBox && 'Коробка', order.includeDustbag && 'Пильовик'].filter(Boolean).join(' + ') || 'Без упаковки'}
                    </span>
                  </div>
                )}

                {copiedTtnId === order.id && (
                  <div className="text-[10px] font-bold text-emerald-600 text-center animate-pulse">
                    ТТН скопійовано в буфер обміну!
                  </div>
                )}

                {/* Редагування ТТН + Списання матеріалів */}
                {isEditingTtn && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={ttnValues[order.id] !== undefined ? ttnValues[order.id] : (order.ttn || '')}
                      onChange={(e) => setTtnValues({ ...ttnValues, [order.id]: e.target.value })}
                      placeholder="Введіть номер ТТН"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-900"
                      autoFocus
                    />

                    {/* Блок вибору складу та упаковки */}
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1 mb-1">
                          <Package size={13} className="text-amber-700" /> Списати пакування з:
                        </label>
                        <select
                          value={currentPack.source}
                          onChange={(e) => updatePackaging(order.id, 'source', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                        >
                          <option value="Основний склад">Мій склад (у мене)</option>
                          <option value="Міла">Склад виробника (Міла)</option>
                          <option value="Валерій">Склад виробника (Валерій)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={currentPack.includeBox}
                            onChange={(e) => updatePackaging(order.id, 'includeBox', e.target.checked)}
                            className="rounded text-slate-900 focus:ring-slate-900 w-3.5 h-3.5 cursor-pointer"
                          />
                          Коробка
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={currentPack.includeDustbag}
                            onChange={(e) => updatePackaging(order.id, 'includeDustbag', e.target.checked)}
                            className="rounded text-slate-900 focus:ring-slate-900 w-3.5 h-3.5 cursor-pointer"
                          />
                          Пильовик
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTtnId(null)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Скасувати
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTtnSave(order)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} /> Зберегти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Блок цін */}
            <div className="bg-slate-50/70 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between items-center font-bold pb-1.5 border-b border-slate-200/60">
                <span className="text-emerald-600">Залишок до сплати:</span>
                <span className="text-emerald-600 text-sm">{remainingPayment > 0 ? remainingPayment : 0} грн</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pt-0.5">
                <span>Передплата:</span>
                <span className="font-medium text-slate-700">{order.advance || 0} грн</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="font-semibold text-slate-900">Ціна товару:</span>
                <span className="font-bold text-slate-900 text-sm">{order.price || 0} грн</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
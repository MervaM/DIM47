import React, { useState } from 'react';
import { Edit2, Trash2, Check, Copy } from 'lucide-react';

export default function DashboardCards({ orders = [], onEditModal, onInlineSave, onDelete, onStatusChange }) {
  const [editingTtnId, setEditingTtnId] = useState(null);
  const [ttnValues, setTtnValues] = useState({});
  const [boxType, setBoxType] = useState('Коробки (Великі)');
  const [dustbagType, setDustbagType] = useState('Пильовик (Великі)');

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

  const handleTtnSave = (order) => {
    const newTtn = ttnValues[order.id] !== undefined ? ttnValues[order.id] : (order.ttn || '');
    if (typeof onInlineSave === 'function') {
      onInlineSave({ 
        ...order, 
        ttn: newTtn,
        selectedBox: boxType,
        selectedDustbag: dustbagType
      });
    }
    setEditingTtnId(null);
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
        
        // Визначаємо виробника для виводу
        const currentSupplier = order.supplier || order.manufacturer || order.packagingSource || 'Міла';

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

                {/* Бейдж виробника зверху картки (тепер точно відображається) */}
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold rounded-xl shadow-2xs">
                  Виробник: {currentSupplier}
                </span>

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

              {/* Зразок кольору / матеріалу */}
              {order.colorImage && (
                <div className="w-full h-24 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  <img src={order.colorImage} alt="Колір" className="w-full h-full object-cover" />
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
              </div>

              {/* Дані клієнта */}
              <div className="bg-slate-50/60 rounded-2xl p-3.5 text-center relative border border-slate-100 space-y-1">
                <button 
                  type="button" 
                  onClick={() => onEditModal(order)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 border rounded-lg bg-white"
                  title="Редагувати дані клієнта"
                >
                  <Copy size={13} />
                </button>

                <div className="font-bold text-slate-900 text-base">{order.client || order.clientName || 'Клієнт'}</div>
                <div className="text-xs font-semibold text-slate-600">{order.phone || '—'}</div>
                <div className="text-xs text-slate-500">
                  {order.city || ''}{order.city && order.warehouse ? ', ' : ''}{order.warehouse || order.address || ''}
                </div>
              </div>

              {/* Блок ТТН з вибором коробки та пильовика */}
              <div className="border border-dashed border-slate-200 rounded-xl p-2.5 space-y-2 bg-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">TTH:</span>
                  {!isEditingTtn && (
                    <button
                      type="button"
                      onClick={() => {
                        setTtnValues({ ...ttnValues, [order.id]: order.ttn || '' });
                        setEditingTtnId(order.id);
                      }}
                      className="font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {order.ttn ? order.ttn : '+ Додати ТТН'}
                    </button>
                  )}
                </div>

                {isEditingTtn && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    <input
                      type="text"
                      value={ttnValues[order.id] !== undefined ? ttnValues[order.id] : (order.ttn || '')}
                      onChange={(e) => setTtnValues({ ...ttnValues, [order.id]: e.target.value })}
                      placeholder="Введіть номер ТТН"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-900"
                      autoFocus
                    />

                    {/* Швидкий вибір пакування */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="text-slate-500 font-medium block mb-1">Коробка:</label>
                        <select 
                          value={boxType} 
                          onChange={e => setBoxType(e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium cursor-pointer"
                        >
                          <option value="Коробки (Великі)">Велика коробка</option>
                          <option value="Коробки (Малі)">Мала коробка</option>
                          <option value="Без коробки">Без коробки</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium block mb-1">Пильовик:</label>
                        <select 
                          value={dustbagType} 
                          onChange={e => setDustbagType(e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium cursor-pointer"
                        >
                          <option value="Пильовик (Великі)">Великий пильовик</option>
                          <option value="Пильовик (Малі)">Малий пильовик</option>
                          <option value="Без пильовика">Без пильовика</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTtnSave(order)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Check size={14} /> Зберегти та списати пакування
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Блок цін */}
            <div className="bg-slate-50/70 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Ціна товару:</span>
                <span className="font-bold text-slate-900 text-sm">{order.price || 0} грн</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Передплата:</span>
                <span className="font-medium text-slate-700">{order.advance || 0} грн</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 font-bold">
                <span className="text-emerald-600">Залишок до сплати:</span>
                <span className="text-emerald-600 text-sm">{remainingPayment > 0 ? remainingPayment : 0} грн</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
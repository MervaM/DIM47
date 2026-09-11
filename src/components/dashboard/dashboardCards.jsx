import React, { useState } from 'react';
import { Edit2, Trash2, Check } from 'lucide-react';

export default function DashboardCards({ orders = [], onEditModal, onInlineSave, onDelete, onStatusChange }) {
  const [editingTtnId, setEditingTtnId] = useState(null);
  const [ttnValues, setTtnValues] = useState({});

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
      onInlineSave({ ...order, ttn: newTtn });
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

        return (
          <div 
            key={order.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3 relative overflow-hidden"
          >
            {/* Верхній блок: Статус та Дії */}
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
            {order.image ? (
              <div className="w-full h-52 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                <img src={order.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : null}

            {/* Назва та характеристики ПО СЕРЕДИНІ */}
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">{order.productTitle || 'Товар'}</h4>
              <p className="text-sm font-extrabold text-slate-900">
                {order.productDetails || `${order.size || '—'} розм., ${order.colorText || ''}, ${order.material || ''}`}
              </p>
            </div>

            {/* Блок даних клієнта з можливістю додати ТТН */}
            <div className="border border-slate-900/80 rounded-2xl p-3 text-xs space-y-1.5 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Клієнт:</span>
                <span className="font-bold text-slate-900 text-right">{order.client || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Телефон:</span>
                <span className="font-bold text-slate-900 text-right">{order.phone || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Доставка:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                  {order.city} {order.warehouse}
                </span>
              </div>

              {/* Поле додавання ТТН */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-slate-400 font-medium">ТТН:</span>
                {isEditingTtn ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={ttnValues[order.id] !== undefined ? ttnValues[order.id] : (order.ttn || '')}
                      onChange={(e) => setTtnValues({ ...ttnValues, [order.id]: e.target.value })}
                      placeholder="Введіть ТТН"
                      className="px-2 py-0.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-900 w-36"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleTtnSave(order)}
                      className="p-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => {
                      setTtnValues({ ...ttnValues, [order.id]: order.ttn || '' });
                      setEditingTtnId(order.id);
                    }}
                    className="font-bold text-slate-900 text-right cursor-pointer hover:underline text-xs"
                    title="Натисніть, щоб змінити ТТН"
                  >
                    {order.ttn ? order.ttn : '+ Додати ТТН'}
                  </span>
                )}
              </div>
            </div>

            {/* Колонки цін: Вартість, Передоплата, Залишок до оплати */}
            <div className="grid grid-cols-3 gap-1 text-center bg-slate-50/70 p-2.5 rounded-2xl text-xs border border-slate-100">
              <div>
                <div className="text-[11px] text-slate-400 font-medium mb-0.5">Сума</div>
                <div className="font-bold text-slate-900">{order.price || 0} грн</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium mb-0.5">Передплата</div>
                <div className="font-bold text-amber-600">{order.advance || 0} грн</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium mb-0.5">Залишок</div>
                <div className="font-bold text-emerald-600">{remainingPayment > 0 ? remainingPayment : 0} грн</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
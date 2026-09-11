import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function DashboardCards({ orders = [], onEditModal, onDelete, onStatusChange }) {
  const statusOptions = ['Нове', 'В роботі', 'З наявності', 'Доставка', 'Успішно', 'Відмова'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Нове':
        return 'bg-amber-100 text-amber-800 border-amber-300';
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
        Замовлень не знайдено
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const remainingPayment = (Number(order.price) || 0) - (Number(order.advance) || 0);

        return (
          <div 
            key={order.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3 relative overflow-hidden"
          >
            {/* Верхній блок: Селект статусу та кнопки дій */}
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
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(order.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Видалити"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Фото товару */}
            {order.image ? (
              <div className="w-full h-48 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                <img src={order.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : null}

            {/* Інформація про товар */}
            <div className="text-center space-y-0.5">
              <h4 className="font-bold text-slate-900 text-sm">{order.productTitle || 'Товар'}</h4>
              <p className="text-xs font-extrabold text-slate-900">
                {order.productDetails || `${order.size || '—'} розм., ${order.colorText || ''}, ${order.material || ''}`}
              </p>
            </div>

            {/* Дані клієнта */}
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1 border border-slate-150">
              <div className="flex justify-between">
                <span className="text-slate-500">Клієнт:</span>
                <span className="font-semibold text-slate-900">{order.client || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Телефон:</span>
                <span className="font-semibold text-slate-900">{order.phone || '—'}</span>
              </div>
              {(order.city || order.warehouse) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Доставка:</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                    {order.city} {order.warehouse}
                  </span>
                </div>
              )}
            </div>

            {/* Ціни та розрахунки */}
            <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Сума</div>
                <div className="font-bold text-slate-900">{order.price || 0} грн</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Передплата</div>
                <div className="font-bold text-amber-700">{order.advance || 0} грн</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Залишок</div>
                <div className="font-bold text-emerald-700">{remainingPayment > 0 ? remainingPayment : 0} грн</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
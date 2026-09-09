import React, { useState } from 'react';

export default function DashboardCards({ orders, onEdit, onDelete, onStatusChange }) {
  const [copiedId, setCopiedId] = useState(null);

  // Функція копіювання даних клієнта з конкретної картки
  const handleCopyClient = (order, e) => {
    e.stopPropagation();
    const textToCopy = `ПІБ: ${order.client || '—'}\nТелефон: ${order.phone || '—'}\nМісто: ${order.city || '—'}\nВідділення: ${order.warehouse || '—'}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-3xl border border-slate-100 shadow-sm">
        Немає замовлень у цій категорії
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const price = Number(order.price) || 0;
        const advance = Number(order.advance) || 0;
        const remaining = price - advance;

        return (
          <div 
            key={order.id} 
            className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all p-3.5 space-y-3 relative"
          >
            {/* Верхня панель: статус, кнопка копіювання, редагування та видалення */}
            <div className="flex justify-between items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition ${
                  order.status === 'Нове' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  order.status === 'В роботі' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  order.status === 'Доставка' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                  order.status === 'Відмова' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="Нове">Нове</option>
                <option value="В роботі">В роботі</option>
                <option value="Доставка">Доставка</option>
                <option value="Відмова">Відмова</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                  title="Редагувати"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(order.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                  title="Видалити"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Зображення товару */}
            {order.image && (
              <div className="w-full h-36 bg-slate-100 rounded-2xl overflow-hidden relative">
                <img 
                  src={order.image} 
                  alt={order.productTitle} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Назва та характеристики */}
            <div className="text-center pt-0.5">
              <h3 className="text-xs font-bold text-slate-800">{order.productTitle || 'Черевики'}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {[
                  order.size ? `${order.size} розм.` : '',
                  order.colorText,
                  order.material,
                  order.filling || order.sole
                ].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Блок даних покупця з кнопкою швидкого копіювання */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5 relative">
              <div className="flex justify-between items-start">
                <div className="w-full text-center">
                  <p className="text-xs font-bold text-slate-900">{order.client || 'Без імені'}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{order.phone || '—'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {[order.city, order.warehouse].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Кнопка копіювання даних */}
                <button
                  type="button"
                  onClick={(e) => handleCopyClient(order, e)}
                  className={`absolute right-2.5 top-2.5 p-1.5 rounded-xl text-xs transition cursor-pointer ${
                    copiedId === order.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs'
                  }`}
                  title="Скопіювати дані клієнта"
                >
                  {copiedId === order.id ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Нотатка до замовлення (якщо є) */}
            {order.note && (
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-[11px] text-amber-900 flex items-start gap-1.5">
                <span>💬</span>
                <span className="leading-tight">{order.note}</span>
              </div>
            )}

            {/* Розрахунок ціни */}
            <div className="border-t border-slate-100 pt-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Ціна товару:</span>
                <span className="font-semibold text-slate-800">{price} грн</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Передплата:</span>
                <span className="font-semibold text-slate-800">{advance} грн</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-dashed border-slate-200">
                <span>Залишок до сплати:</span>
                <span className="text-indigo-600">{remaining} грн</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
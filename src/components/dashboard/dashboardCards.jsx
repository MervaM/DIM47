import React, { useState } from 'react';

export default function DashboardCards({ orders = [], onEdit, onDelete, onStatusChange }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyClient = (order, e) => {
    e.stopPropagation();
    const clientName = order.client || order.clientName || '—';
    const clientPhone = order.phone || order.clientPhone || '—';
    const city = order.city || '';
    const warehouse = order.warehouse || '';
    const address = [city, warehouse].filter(Boolean).join(', ') || '—';

    const textToCopy = `${clientName}\n${clientPhone}\n${address}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs">
        Ще немає жодного замовлення
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const priceNum = Number(order.price) || 0;
        const advanceNum = Number(order.advance) || 0;
        const remaining = priceNum - advanceNum;
        const isCopied = copiedId === order.id;

        return (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-2.5">
            
            {/* Статус зліва, Редагування/Видалення справа */}
            <div className="flex justify-between items-center">
              <select 
                value={order.status || 'Нове'}
                onChange={(e) => onStatusChange && onStatusChange(order.id, e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border outline-none bg-amber-50 text-amber-800 border-amber-200 cursor-pointer"
              >
                <option value="Нове">Нове</option>
                <option value="В роботі">В роботі</option>
                <option value="Доставка">Доставка</option>
                <option value="Відмова">Відмова</option>
              </select>

              <div className="flex gap-1">
                <button 
                  type="button"
                  onClick={() => onEdit && onEdit(order)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  ✏️
                </button>
                <button 
                  type="button"
                  onClick={() => onDelete && onDelete(order.id)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  title="Видалити"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Фото взуття */}
            {order.image || order.productImage ? (
              <div className="w-full h-44 bg-slate-100 rounded-xl overflow-hidden">
                <img 
                  src={order.image || order.productImage} 
                  alt="Товар" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : null}

            {/* Назва та характеристики */}
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">{order.productTitle}</h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{order.productDetails}</p>
            </div>

            {/* ДАНІ ПОКУПЦЯ (по центру + кнопка копіювання праворуч) */}
            <div 
              onClick={(e) => handleCopyClient(order, e)}
              className={`pt-2.5 pb-2.5 px-3 border rounded-xl transition cursor-pointer relative flex items-center justify-between ${
                isCopied 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
              }`}
              title="Натисніть, щоб скопіювати дані покупця"
            >
              {/* Порожній блок для симетрії, щоб текст був чітко по центру */}
              <div className="w-8"></div>

              {/* Текст по центру */}
              <div className="text-center space-y-0.5">
                <div className="text-sm font-bold text-slate-900">{order.client || order.clientName}</div>
                <div className="text-xs text-slate-900">{order.phone || order.clientPhone}</div>
                <div className="text-xs text-slate-900">
                  {order.city}{order.warehouse ? `, ${order.warehouse}` : ''}
                </div>
              </div>

              {/* Кнопка копіювання праворуч */}
              <div className={`p-2 rounded-xl text-xs transition ${
                isCopied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 shadow-2xs'
              }`}>
                {isCopied ? '✓' : '📋'}
              </div>
            </div>

            {/* Ціна товару, передплата та залишок до сплати */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50 p-2 rounded-xl text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Ціна товару:</span>
                <span>{priceNum} грн</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Передплата:</span>
                <span>{advanceNum} грн</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700 border-t border-slate-200/60 pt-1">
                <span>Залишок до сплати:</span>
                <span>{remaining} грн</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
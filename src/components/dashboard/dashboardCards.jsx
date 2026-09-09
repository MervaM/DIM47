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

            {/* Назва та характеристики (чорним жирним шрифтом) */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">{order.productTitle}</h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{order.productDetails}</p>
            </div>

            {/* Дані покупця з кнопкою копіювання */}
            <div className="pt-1 border-t border-slate-100 relative flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-900">{order.client || order.clientName}</div>
                <div className="text-xs text-slate-900">{order.phone || order.clientPhone}</div>
                <div className="text-xs text-slate-900">
                  {order.city}{order.warehouse ? `, ${order.warehouse}` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleCopyClient(order, e)}
                className={`p-2 rounded-xl text-xs transition cursor-pointer border ${
                  copiedId === order.id 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Скопіювати дані покупця"
              >
                {copiedId === order.id ? '✓' : '📋'}
              </button>
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
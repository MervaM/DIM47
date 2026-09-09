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
    <div className="space-y-4 pb-10">
      {orders.map((order) => {
        const priceNum = Number(order.price) || 0;
        const advanceNum = Number(order.advance) || 0;
        const remaining = priceNum - advanceNum;
        const isCopied = copiedId === order.id;

        const productImage = order.image || order.productImage;
        const colorImg = order.colorImage;

        const rawSize = order.size;
        const rawColor = order.colorText || order.color;
        const rawMaterial = order.material;
        const rawExtra = order.filling || order.sole || order.lining;

        const cleanDetails = [
          rawSize ? `${rawSize} розм.` : null,
          rawColor && rawColor !== '—' ? rawColor : null,
          rawMaterial && rawMaterial !== '—' ? rawMaterial : null,
          rawExtra && rawExtra !== '—' ? rawExtra : null,
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-3 space-y-2.5">
            
            {/* Статус зліва, Редагування/Видалення справа */}
            <div className="flex justify-between items-center px-0.5">
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

            {/* ВЕЛИКЕ ФОТО (h-72) + ЗБІЛЬШЕНА СМУЖКА КОЛЬОРУ (h-20) */}
            {productImage ? (
              <div className="space-y-1.5 -mx-3">
                <div className="w-full h-72 bg-slate-50 border-y border-slate-100 overflow-hidden flex items-center justify-center">
                  <img 
                    src={productImage} 
                    alt="Товар" 
                    className="w-full h-full object-contain" 
                  />
                </div>

                {colorImg && (
                  <div className="w-full h-20 overflow-hidden border-b border-slate-100 px-3">
                    <img 
                      src={colorImg} 
                      alt="Колір" 
                      className="w-full h-full object-cover rounded-xl shadow-xs border border-slate-200/60" 
                    />
                  </div>
                )}
              </div>
            ) : null}

            {/* Назва та характеристики */}
            <div className="text-center pt-1">
              <h3 className="text-xs font-bold text-slate-700">{order.productTitle}</h3>
              {cleanDetails && (
                <p className="text-sm font-bold text-slate-900 mt-0.5">{cleanDetails}</p>
              )}
            </div>

            {/* ДАНІ ПОКУПЦЯ (ПІБ МАКСИМАЛЬНО ВЕЛИКЕ ТА ЖИРНЕ) */}
            <div 
              onClick={(e) => handleCopyClient(order, e)}
              className={`py-2 px-3 border rounded-xl transition cursor-pointer relative flex items-center justify-between ${
                isCopied 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
              }`}
              title="Натисніть, щоб скопіювати дані покупця"
            >
              <div className="w-8"></div>

              <div className="text-center space-y-0.5">
                <div className="text-base font-extrabold text-slate-950 tracking-tight">{order.client || order.clientName}</div>
                <div className="text-xs font-semibold text-slate-700">{order.phone || order.clientPhone}</div>
                <div className="text-xs text-slate-600">
                  {order.city}{order.warehouse ? `, ${order.warehouse}` : ''}
                </div>
              </div>

              <div className={`p-1.5 rounded-lg text-xs transition ${
                isCopied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 shadow-2xs'
              }`}>
                {isCopied ? '✓' : '📋'}
              </div>
            </div>

            {/* Ціна товару, передплата та залишок до сплати */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Ціна товару:</span>
                <span>{priceNum} грн</span>
              </div>
              <div className="flex justify-between text-slate-700 text-xs">
                <span>Передплата:</span>
                <span>{advanceNum} грн</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700 border-t border-slate-200/60 pt-1 text-xs">
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
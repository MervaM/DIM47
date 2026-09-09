import React from 'react';

export default function DashboardCards({ orders = [], onEdit, onDelete, onStatusChange }) {
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
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-2">
            
            {/* Статус зліва, Іконки Редагування/Видалення справа */}
            <div className="flex justify-between items-center">
              <select 
                value={order.status || 'Нове'}
                onChange={(e) => onStatusChange && onStatusChange(order.id, e.target.value)}
                className="text-xs font-bold px-2 py-1 rounded-md border outline-none bg-slate-50 text-slate-900 border-slate-300 cursor-pointer"
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
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  title="Редагувати"
                >
                  ✏️
                </button>
                <button 
                  type="button"
                  onClick={() => onDelete && onDelete(order.id)}
                  className="p-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  title="Видалити"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Фото взуття */}
            {order.image || order.productImage ? (
              <div className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden">
                <img 
                  src={order.image || order.productImage} 
                  alt="Товар" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : null}

            {/* Назва та характеристики (більшим чорним жирним шрифтом) */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">{order.productTitle}</h3>
              <p className="text-xs font-bold text-black mt-0.5">{order.productDetails}</p>
            </div>

            {/* Дані покупця: ПІБ великим жирним, далі телефон, адреса і пошта у стовпчик чорним меншим шрифтом */}
            <div className="space-y-0.5 pt-1 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-900">{order.client || order.clientName}</div>
              <div className="text-xs text-black font-normal">{order.phone || order.clientPhone}</div>
              <div className="text-xs text-black font-normal">
                {order.city}{order.warehouse ? `, ${order.warehouse}` : ''}
              </div>
              {order.email && (
                <div className="text-xs text-black font-normal">{order.email}</div>
              )}
            </div>

            {/* Ціна товару, передплата та залишок внизу */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50 p-2 rounded-xl text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Ціна товару:</span>
                <span>{priceNum} грн</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Передплата:</span>
                <span>{advanceNum} грн</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1">
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
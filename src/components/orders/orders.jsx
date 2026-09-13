import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('Всі');
  const [loading, setLoading] = useState(true);

  const statuses = ['Всі', 'Нове', 'В роботі', 'З наявності', 'Доставка', 'Успішно', 'Відмова'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "orders"));
      const items = [];
      
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        items.push({
          id: docSnap.id,
          status: item.status || 'Нове',
          clientName: item.clientName || item.client || 'Клієнт',
          price: Number(item.price) || 0,
          image: item.productImage || item.image || '',
          productTitle: item.productTitle || item.name || 'Взуття',
          size: item.size || '',
          color: item.colorText || item.color || ''
        });
      });

      setOrders(items);
    } catch (error) {
      console.error('Помилка завантаження замовлень:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Нове':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'В роботі':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'З наявності':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'Доставка':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      case 'Успішно':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Відмова':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/60';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'Всі') return true;
    return String(order.status).toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Панель фільтрів як на Дашборді */}
      <div className="flex justify-end mb-2 overflow-x-auto pb-2">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs min-w-max">
          {statuses.map((tab) => {
            const count = tab === 'Всі' ? orders.length : orders.filter(o => o.status === tab).length;
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
            Завантаження замовлень...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs px-4 py-3.5 flex items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {order.image ? (
                  <img src={order.image} alt="" className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] text-slate-400 shrink-0 font-medium border border-slate-200/60">Фото</div>
                )}

                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{order.clientName}</div>
                  <div className="text-xs text-slate-500 truncate">{order.productTitle} {order.size ? `(${order.size} розм.)` : ''}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-sm font-bold text-slate-950">
                  {order.price} грн
                </div>

                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
            Замовлень у цій категорії немає
          </div>
        )}
      </div>
    </div>
  );
}
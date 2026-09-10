import React, { useState, useEffect } from 'react';

export default function Orders({ orders = [] }) {
  const [filter, setFilter] = useState('Всі');
  const [currentOrders, setCurrentOrders] = useState(orders);

  useEffect(() => {
    if (orders && orders.length > 0) {
      setCurrentOrders(orders);
    } else {
      try {
        const saved = localStorage.getItem('dim47_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCurrentOrders(parsed);
          }
        }
      } catch (e) {}
    }
  }, [orders]);

  const filteredOrders = currentOrders.filter(order => {
    if (!order) return false;
    if (filter === 'Всі') return true;
    const status = String(order.status || order.state || 'В роботі').trim();
    return status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-end mb-2">
        <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs">
          {['Всі', 'Нові', 'В роботі', 'Відправлено', 'Виконано'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filter === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => {
            // Витягуємо ПІБ клієнта (підтримуємо як рядок, так і вкладений об'єкт)
            let clientName = 'Клієнт';
            const rawClient = order.clientName || order.client || order.fullName || order.name || order.customer;
            if (typeof rawClient === 'string') {
              clientName = rawClient;
            } else if (rawClient && typeof rawClient === 'object') {
              clientName = rawClient.name || rawClient.fullName || rawClient.pib || 'Клієнт';
            }

            const price = Number(order.price || order.amount || order.total || order.cost || 0);
            const image = order.image || order.photo || order.imageUrl || order.img || '';
            const status = order.status || order.state || 'В роботі';

            return (
              <div 
                key={order.id || index} 
                className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs px-4 py-3.5 flex items-center justify-between gap-4 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {image ? (
                    <img src={image} alt="" className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] text-slate-400 shrink-0 font-medium border border-slate-200/60">Фото</div>
                  )}

                  <div className="text-sm font-bold text-slate-900 truncate">
                    {clientName}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm font-bold text-slate-950">
                    {price} грн
                  </div>

                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    String(status).includes('Нов') ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                    String(status).includes('робот') ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                    String(status).includes('Відправ') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">Замовлень немає</div>
        )}
      </div>
    </div>
  );
}
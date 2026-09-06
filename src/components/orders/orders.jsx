import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Search, Filter, Phone, MapPin, CheckCircle, Clock, Truck, PackageCheck } from 'lucide-react';

export default function Orders({ orders, setOrders, stock, setStock, finances, setFinances }) {
  const [filterStatus, setFilterStatus] = useState('Усі');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);

  const handleStatusChange = (orderId, newStatus) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setOrders(updated);
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Ви впевнені, що хочете видалити це замовлення?')) {
      setOrders(orders.filter(ord => ord.id !== orderId));
      if (selectedOrderForDetails?.id === orderId) {
        setSelectedOrderForDetails(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Нове':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 flex items-center gap-1 w-fit"><Clock size={12} /> Нове</span>;
      case 'В роботі':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 flex items-center gap-1 w-fit"><PackageCheck size={12} /> В роботі</span>;
      case 'Відправлено':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 flex items-center gap-1 w-fit"><Truck size={12} /> Відправлено</span>;
      case 'Виконано':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Виконано</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const filteredOrders = orders.filter(ord => {
    const matchesStatus = filterStatus === 'Усі' || (ord.status || 'Нове') === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (ord.clientName && ord.clientName.toLowerCase().includes(query)) ||
      (ord.clientPhone && ord.clientPhone.toLowerCase().includes(query)) ||
      (ord.city && ord.city.toLowerCase().includes(query)) ||
      String(ord.id).includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Замовлення</h1>
          <p className="text-slate-500 text-sm">Облік продажів, статусів відправки та даних клієнтів</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Пошук за клієнтом, телефоном..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Усі', 'Нове', 'В роботі', 'Відправлено', 'Виконано'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${filterStatus === status ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm">Замовлень не знайдено</p>
            <p className="text-slate-400 text-xs mt-1">Змініть фільтри або створіть нове замовлення через дашборд.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3">ID / Дата</th>
                  <th className="pb-3">Клієнт</th>
                  <th className="pb-3">Місто / Доставка</th>
                  <th className="pb-3">Товари</th>
                  <th className="pb-3">Сума</th>
                  <th className="pb-3">Статус</th>
                  <th className="pb-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 text-slate-500 text-xs">
                      <span className="font-semibold text-slate-900">#{ord.id.toString().slice(-4)}</span>
                      <div className="text-slate-400 mt-0.5">{new Date(ord.timestamp || ord.id).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-medium text-slate-900">{ord.clientName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {ord.clientPhone || 'Не вказано'}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 text-xs">
                      <div className="font-medium text-slate-800">{ord.city || '—'}</div>
                      <div className="text-slate-400 truncate max-w-[150px]">{ord.warehouse || ord.deliveryService || 'Нова Пошта'}</div>
                    </td>
                    <td className="py-3.5 text-slate-600 text-xs max-w-[200px]">
                      {Array.isArray(ord.items) ? (
                        ord.items.map((i, idx) => (
                          <div key={idx} className="truncate">
                            • {i.name} {i.size ? `(${i.size})` : ''} — <span className="font-medium">{i.price} грн</span>
                          </div>
                        ))
                      ) : '—'}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-900">
                      {ord.totalPrice} грн
                      {ord.advance > 0 && <div className="text-[10px] text-emerald-600 font-normal">Передплата: {ord.advance} грн</div>}
                    </td>
                    <td className="py-3.5">
                      <select 
                        value={ord.status || 'Нове'} 
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="bg-slate-105 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer shadow-sm"
                      >
                        <option value="Нове">Нове</option>
                        <option value="В роботі">В роботі</option>
                        <option value="Відправлено">Відправлено</option>
                        <option value="Виконано">Виконано</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button 
                        onClick={() => setSelectedOrderForDetails(ord)}
                        className="text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        Деталі
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 transition"
                        title="Видалити"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrderForDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Деталі замовлення #{selectedOrderForDetails.id.toString().slice(-4)}</h3>
              <button 
                onClick={() => setSelectedOrderForDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-900 text-base">{selectedOrderForDetails.clientName}</div>
                <div className="text-slate-600 flex items-center gap-1.5"><Phone size={14} /> {selectedOrderForDetails.clientPhone || 'Не вказано'}</div>
                <div className="text-slate-600 flex items-center gap-1.5"><MapPin size={14} /> {selectedOrderForDetails.city || 'Місто не вказано'}, {selectedOrderForDetails.warehouse || 'Відділення не вказано'}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Товари</div>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-50">
                  {Array.isArray(selectedOrderForDetails.items) && selectedOrderForDetails.items.map((i, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-slate-900">{i.name}</span>
                        {i.size && <span className="text-slate-400 ml-1">({i.size})</span>}
                      </div>
                      <div className="font-semibold text-slate-900">{i.price} грн</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Загальна сума:</span>
                  <span className="font-bold text-slate-900">{selectedOrderForDetails.totalPrice} грн</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Передплата:</span>
                  <span className="font-semibold text-emerald-600">{selectedOrderForDetails.advance || 0} грн</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Знижка:</span>
                  <span className="font-semibold text-slate-700">{selectedOrderForDetails.discount || 0} грн</span>
                </div>
              </div>

              {selectedOrderForDetails.note && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Примітки</div>
                  <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-xl italic">"{selectedOrderForDetails.note}"</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setSelectedOrderForDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
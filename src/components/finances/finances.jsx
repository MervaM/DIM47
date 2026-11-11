import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Clock, Calendar, BarChart2 } from 'lucide-react';

// Допоміжні функції виносимо за межі компонента
const getWeekString = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getDaysInWork = (createdAtString) => {
  if (!createdAtString) return 0;
  const createdDate = new Date(createdAtString);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Нове': return 'bg-amber-50 text-amber-700 border-amber-200/60';
    case 'В роботі': return 'bg-blue-50 text-blue-700 border-blue-200/60';
    case 'З наявності': return 'bg-purple-50 text-purple-700 border-purple-200/60';
    case 'Доставка': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
    case 'Успішно': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    case 'Відмова': return 'bg-rose-50 text-rose-700 border-rose-200/60';
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60';
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('Всі');
  const [supplierFilter, setSupplierFilter] = useState('Всі виробники');
  
  const [periodType, setPeriodType] = useState('all'); // 'all', 'month', 'week'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekString(new Date()));

  const [loading, setLoading] = useState(true);

  const statuses = ['Всі', 'Нове', 'В роботі', 'З наявності', 'Доставка', 'Успішно', 'Відмова'];
  const suppliers = ['Всі виробники', 'Міла', 'Валерій'];

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
          color: item.colorText || item.color || '',
          supplier: item.supplier || 'Міла',
          createdAt: item.createdAt || new Date().toISOString()
        });
      });

      setOrders(items);
    } catch (error) {
      console.error('Помилка завантаження замовлень:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фільтрація замовлень (статус + виробник + період)
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'Всі' || String(order.status).toLowerCase() === filter.toLowerCase();
    const matchesSupplier = supplierFilter === 'Всі виробники' || order.supplier === supplierFilter;
    
    let matchesPeriod = true;
    if (order.createdAt) {
      const orderDate = new Date(order.createdAt);
      if (!isNaN(orderDate.getTime())) {
        if (periodType === 'month') {
          const orderMonth = orderDate.toISOString().slice(0, 7);
          matchesPeriod = orderMonth === selectedMonth;
        } else if (periodType === 'week') {
          const orderWeek = getWeekString(orderDate);
          matchesPeriod = orderWeek === selectedWeek;
        }
      }
    }

    return matchesStatus && matchesSupplier && matchesPeriod;
  });

  // Статистика проданих пар за поточним вибором періоду та виробника
  const totalPairs = filteredOrders.length;
  const supplierStats = suppliers.filter(s => s !== 'Всі виробники').reduce((acc, sup) => {
    acc[sup] = filteredOrders.filter(o => o.supplier === sup).length;
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      
      {/* ПАНЕЛЬ ПЕРІОДІВ ТА СТАТИСТИКИ ПАР */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={14} /> Період:
          </span>
          <button
            onClick={() => setPeriodType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Всі за весь час
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodType === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Місяць
          </button>
          <button
            onClick={() => setPeriodType('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodType === 'week' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Тиждень
          </button>

          {/* Вибір конкретного місяця */}
          {periodType === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
            />
          )}

          {/* Вибір конкретного тижня */}
          {periodType === 'week' && (
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
            />
          )}
        </div>

        {/* Блок лічильника пар (загалом + по виробниках) */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <BarChart2 size={16} className="text-indigo-600" />
            <span>Всього пар: {totalPairs}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-300"></div>
          <div className="flex items-center gap-3 text-slate-600">
            {Object.entries(supplierStats).map(([sup, count]) => (
              <span key={sup}>
                <b>{sup}:</b> {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Панель фільтрів (Статуси + Виробники) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        {/* Фільтр по виробниках */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs">
          {suppliers.map((sup) => (
            <button
              key={sup}
              onClick={() => setSupplierFilter(sup)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                supplierFilter === sup ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sup}
            </button>
          ))}
        </div>

        {/* Фільтр по статусах */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs overflow-x-auto max-w-full pb-1">
          {statuses.map((tab) => {
            const count = tab === 'Всі' ? orders.length : orders.filter(o => o.status === tab).length;
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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

      {/* Список замовлень */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
            Завантаження замовлень...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const daysCount = getDaysInWork(order.createdAt);
            const isStuck = (order.status === 'Нове' || order.status === 'В роботі') && daysCount >= 5;

            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-2xl border shadow-2xs px-4 py-3.5 flex items-center justify-between gap-4 transition ${
                  isStuck ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/85 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {order.image ? (
                    <img src={order.image} alt="" className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] text-slate-400 shrink-0 font-medium border border-slate-200/60">Фото</div>
                  )}

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{order.clientName}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                        {order.supplier}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 truncate">
                      <span>{order.productTitle} {order.size ? `(${order.size} розм.)` : ''}</span>
                      
                      <span className={`flex items-center gap-1 font-semibold ${isStuck ? 'text-rose-600' : 'text-slate-400'}`}>
                        <Clock size={12} />
                        {daysCount === 0 ? 'Сьогодні' : `${daysCount} дн. у роботі`}
                      </span>
                    </div>
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
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
            Замовлень у цій категорії немає
          </div>
        )}
      </div>
    </div>
  );
}
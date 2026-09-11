import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Calendar, X, Search, BarChart2 } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Finances({ finances = [], setFinances = () => {} }) {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Пошук та фільтри
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('всі');
  const [selectedCategoryAnalytics, setSelectedCategoryAnalytics] = useState(null);

  // Стейт форми
  const [type, setType] = useState('Витрата');
  const [category, setCategory] = useState('Реклама');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchFirestoreData();
  }, []);

  const fetchFirestoreData = async () => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(ordersList);

      const stockSnap = await getDocs(collection(db, 'stock'));
      const stockList = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStock(stockList);

      const txSnap = await getDocs(collection(db, 'transactions'));
      const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (txList.length > 0) setFinances(txList);
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    }
  };

  const getUsedPackagingCount = (packName) => {
    return orders.reduce((acc, o) => {
      let count = 0;
      if (o.usedBox === packName) count += 1;
      if (o.usedDustbag === packName) count += 1;
      return acc + count;
    }, 0);
  };

  // 1. Формування транзакцій із замовлень
  // Витрата на пошиття рахується для ВСІХ нових замовлень, ОКРІМ тих, що взяті з "Наявності"
  const orderTailoringCostTx = orders
    .filter(o => o.status !== 'З наявності' && !o.stockItemId)
    .map(o => ({
      id: `ord-cost-${o.id}`,
      date: o.date || 'Замовлення',
      type: 'Витрата',
      category: 'Пошиття взуття',
      comment: `Собівартість пошиття: ${o.productTitle || o.name || 'Взуття'} (${o.size || '—'} розм.)`,
      amount: Number(o.cost) || Number(o.price) || 0,
      isAuto: true
    }));

  // Дохід від успішно закритих замовлень
  const successfulOrdersTx = orders
    .filter(o => (o.status || '').toLowerCase() === 'успішно')
    .map(o => ({
      id: `ord-rev-${o.id}`,
      date: o.date || 'Замовлення',
      type: 'Дохід',
      category: 'Успішно',
      comment: `Оплата замовлення: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
      amount: Number(o.price) || 0,
      isAuto: true
    }));

  // Передплати за замовлення із відмовою
  const cancelledOrdersTx = orders
    .filter(o => (o.status || '').toLowerCase() === 'відмова' && (Number(o.advance) || Number(o.prepayment)))
    .map(o => ({
      id: `ord-adv-${o.id}`,
      date: o.date || 'Відмова',
      type: 'Дохід',
      category: 'Передплата',
      comment: `Передплата (відмова): ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
      amount: Number(o.advance) || Number(o.prepayment) || 0,
      isAuto: true
    }));

  // Пакування зі складу
  const stockTx = stock
    .filter(item => {
      const name = (item.name || '').toLowerCase();
      return name.includes('коробк') || name.includes('пильовик');
    })
    .map(item => {
      const name = (item.name || '').toLowerCase();
      const currentQty = Number(item.quantity) || 0;
      const usedQty = getUsedPackagingCount(item.name);
      const totalInitialQty = currentQty + usedQty;
      const unitCost = Number(item.cost) || Number(item.price) || 0;
      const catName = name.includes('коробк') ? 'Коробки' : 'Пильовики';

      return {
        id: `stock-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Склад',
        type: 'Витрата',
        category: catName,
        comment: `${item.name} (${totalInitialQty} шт × ${unitCost} грн)`,
        amount: Number((totalInitialQty * unitCost).toFixed(2)),
        unitCost,
        totalQty: totalInitialQty,
        isAuto: true
      };
    });

  const allTransactions = [
    ...orderTailoringCostTx, 
    ...successfulOrdersTx, 
    ...cancelledOrdersTx, 
    ...stockTx, 
    ...finances
  ];

  // Фільтрація операцій
  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = !searchQuery.trim() || 
      (tx.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const cat = (tx.category || '').toLowerCase();
    let matchesFilter = true;

    if (selectedFilter === 'взуття') matchesFilter = cat.includes('пошиття') || cat === 'взуття';
    else if (selectedFilter === 'коробки') matchesFilter = cat === 'коробки';
    else if (selectedFilter === 'пильовики') matchesFilter = cat === 'пильовики';
    else if (selectedFilter === 'реклама') matchesFilter = cat.includes('реклама');
    else if (selectedFilter === 'успішно') matchesFilter = cat === 'успішно';
    else if (selectedFilter === 'передплата') matchesFilter = cat === 'передплата';
    else if (selectedFilter === 'інше') matchesFilter = !['пошиття', 'взуття', 'коробки', 'пильовики', 'реклама', 'успішно', 'передплата'].some(k => cat.includes(k));

    return matchesSearch && matchesFilter;
  });

  // Підрахунки для малих карток
  const calculateCategoryStats = (catKey) => {
    const list = allTransactions.filter(t => (t.category || '').toLowerCase().includes(catKey.toLowerCase()));
    const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const avg = list.length > 0 ? (total / list.length).toFixed(0) : 0;
    return { total, count: list.length, avg };
  };

  const shoesStats = calculateCategoryStats('пошиття');
  const boxesStats = calculateCategoryStats('коробки');
  const dustbagsStats = calculateCategoryStats('пильовики');
  const adsStats = calculateCategoryStats('реклама');

  // Підсумки
  const totalIncome = allTransactions.filter(t => t.type === 'Дохід').reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTransactions.filter(t => t.type === 'Витрата').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const newTx = {
      date,
      type,
      category: category || 'Реклама',
      amount: Number(amount),
      comment,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setFinances([{ id: docRef.id, ...newTx }, ...finances]);
      setShowAddModal(false);
      setAmount('');
      setComment('');
    } catch (error) {
      console.error('Помилка збереження:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Видалити цю транзакцію?')) {
      try {
        if (!String(id).startsWith('stock-') && !String(id).startsWith('ord-')) {
          await deleteDoc(doc(db, 'transactions', id));
        }
        setFinances(finances.filter(tx => tx.id !== id));
      } catch (error) {
        console.error('Помилка видалення:', error);
      }
    }
  };

  const getCategoryMonthlyChart = (catKey) => {
    const list = allTransactions.filter(t => (t.category || '').toLowerCase().includes(catKey.toLowerCase()));
    const monthsMap = {};

    list.forEach(t => {
      const month = (t.date || '').substring(0, 7) || '2026-09';
      monthsMap[month] = (monthsMap[month] || 0) + Number(t.amount || 0);
    });

    const maxVal = Math.max(...Object.values(monthsMap), 1);
    return { list, monthsMap, maxVal };
  };

  const activeAnalytics = selectedCategoryAnalytics ? getCategoryMonthlyChart(selectedCategoryAnalytics) : null;

  return (
    <div className="space-y-4 p-3 sm:p-4 max-w-4xl mx-auto">
      {/* Кнопка додавання */}
      <div className="flex justify-end">
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>

      {/* Основні великі картки фінансів */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальний дохід</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">{totalIncome.toLocaleString('uk-UA')} грн</div>
          <p className="text-[10px] text-slate-400">Успішні оплати + передплати відмов</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальні витрати</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">{totalExpense.toLocaleString('uk-UA')} грн</div>
          <p className="text-[10px] text-slate-400">Пошиття + коробки + пильовики + реклама</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Чистий прибуток</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></span>
          </div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString('uk-UA')} грн
          </div>
          <p className="text-[10px] text-slate-400">Різниця між доходами та витратами</p>
        </div>
      </div>

      {/* Зменшені 4 компактні картки аналітики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: 'коробки', title: 'Коробки', stats: boxesStats, color: 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60' },
          { key: 'пильовики', title: 'Пильовики', stats: dustbagsStats, color: 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60' },
          { key: 'пошиття', title: 'Пошиття взуття', stats: shoesStats, color: 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/60' },
          { key: 'реклама', title: 'Реклама / Таргет', stats: adsStats, color: 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60' }
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setSelectedCategoryAnalytics(item.key)}
            className={`p-2.5 rounded-xl border ${item.color} cursor-pointer transition space-y-0.5 group`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{item.title}</span>
              <BarChart2 size={12} className="text-slate-400 group-hover:text-slate-900 transition" />
            </div>
            <div className="text-xs font-black text-slate-900">{item.stats.total.toLocaleString('uk-UA')} грн</div>
            <div className="text-[9px] text-slate-500 font-medium truncate">
              ~{item.stats.avg} грн ({item.stats.count} завед.)
            </div>
          </div>
        ))}
      </div>

      {/* Пошук та Кнопкові фільтри */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Пошук операції..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 scrollbar-none">
            {[
              { id: 'всі', name: 'Усі' },
              { id: 'взуття', name: 'Пошиття' },
              { id: 'коробки', name: 'Коробки' },
              { id: 'пильовики', name: 'Пильовики' },
              { id: 'реклама', name: 'Реклама' },
              { id: 'успішно', name: 'Повна оплата' },
              { id: 'передплата', name: 'Передплата' },
              { id: 'інше', name: 'Інше' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap cursor-pointer transition ${
                  selectedFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Таблиця історія фінансових операцій */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="pb-2">Дата</th>
                <th className="pb-2">Тип</th>
                <th className="pb-2">Категорія</th>
                <th className="pb-2">Опис / Назва</th>
                <th className="pb-2">Сума</th>
                <th className="pb-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">
                    Операцій за заданими фільтрами не знайдено
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 text-slate-500 text-[10px]">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {tx.date}</span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2 font-semibold text-slate-900">{tx.category}</td>
                    <td className="py-2 text-slate-600 text-[11px]">{tx.comment || '—'}</td>
                    <td className={`py-2 font-bold text-xs ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Дохід' ? '+' : '-'}{tx.amount} грн
                    </td>
                    <td className="py-2 text-right">
                      {!tx.isAuto && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО АНАЛІТИКИ ТА ГРАФІКУ */}
      {selectedCategoryAnalytics && activeAnalytics && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCategoryAnalytics(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm capitalize">
                Графік та деталі: {selectedCategoryAnalytics}
              </h3>
              <button 
                type="button" 
                onClick={() => setSelectedCategoryAnalytics(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Графік по місяцях */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-600">Динаміка витрат за місяцями:</span>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                {Object.keys(activeAnalytics.monthsMap).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Немає даних для графіку</p>
                ) : (
                  Object.entries(activeAnalytics.monthsMap).map(([m, sum]) => (
                    <div key={m} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium text-slate-700 text-[11px]">
                        <span>{m}</span>
                        <span className="font-bold text-slate-900">{sum.toLocaleString('uk-UA')} грн</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-900 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(sum / activeAnalytics.maxVal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Список витрат цієї категорії */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">Всі операції категорії:</span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {activeAnalytics.list.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{t.comment}</div>
                      <div className="text-[10px] text-slate-400">{t.date}</div>
                    </div>
                    <div className="font-bold text-slate-900">{t.amount} грн</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно створення ручної транзакції */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Додати транзакцію</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Тип операції</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="Витрата">Витрата</option>
                  <option value="Дохід">Дохід</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Сума (грн)</label>
                  <input 
                    type="number" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none text-emerald-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Дата</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Категорія</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  <option value="Реклама">Реклама / Таргет</option>
                  <option value="Аксесуари">Аксесуари</option>
                  <option value="Оренда">Оренда / Послуги</option>
                  <option value="Зарплата">Зарплата</option>
                  <option value="Інше">Інша витрата</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Коментар / Опис</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  rows="2"
                  placeholder="Опис витрати..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Додати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
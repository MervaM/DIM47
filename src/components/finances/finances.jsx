import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  Search, 
  BarChart2, 
  Edit2, 
  Check, 
  Briefcase,
  PieChart
} from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Finances({ finances = [], setFinances = () => {} }) {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Пошук та фільтри
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('всі');
  const [selectedCategoryAnalytics, setSelectedCategoryAnalytics] = useState(null);
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);

  // Стейт швидкого редагування суми
  const [editingTxId, setEditingTxId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  // Стейт форми додавання
  const [type, setType] = useState('Витрата'); // Витрата, Дохід, Інвестиція, Повернення інвестиції
  const [category, setCategory] = useState('Реклама');
  const [amount, setAmount] = useState('');
  const [investorName, setInvestorName] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
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
  const orderTailoringCostTx = orders
    .filter(o => o.status !== 'З наявності' && !o.stockItemId)
    .map(o => ({
      id: `ord-cost-${o.id}`,
      date: o.date || 'Замовлення',
      type: 'Витрата',
      category: 'Пошиття взуття',
      comment: o.productTitle || o.name || 'Взуття',
      amount: Number(o.cost) || 0,
      isAuto: true
    }));

  const successfulOrdersTx = orders
    .filter(o => (o.status || '').toLowerCase() === 'успішно')
    .map(o => {
      const fullPrice = Number(o.price) || 0;
      const adv = Number(o.advance) || Number(o.prepayment) || 0;
      const finalPayment = fullPrice > adv ? fullPrice - adv : fullPrice;

      return {
        id: `ord-rev-${o.id}`,
        date: o.date || 'Замовлення',
        type: 'Дохід',
        category: 'Успішно',
        comment: `Залишок після передплати: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
        amount: finalPayment,
        isAuto: true
      };
    });

  const ordersAdvanceTx = orders
    .filter(o => Number(o.advance) > 0 || Number(o.prepayment) > 0)
    .map(o => ({
      id: `ord-adv-${o.id}`,
      date: o.date || 'Замовлення',
      type: 'Дохід',
      category: 'Передплата',
      comment: `Передплата: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
      amount: Number(o.advance) || Number(o.prepayment) || 0,
      isAuto: true
    }));

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
    ...ordersAdvanceTx, 
    ...stockTx, 
    ...finances
  ];

  // Розрахунок аналітики інвестицій
  const investmentTxList = finances.filter(t => t.type === 'Інвестиція');
  const investmentReturnTxList = finances.filter(t => t.type === 'Повернення інвестиції');

  const totalInvestmentAmount = investmentTxList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalTargetReturnAmount = investmentTxList.reduce((acc, t) => acc + (Number(t.returnAmount) || Number(t.amount) || 0), 0);
  const totalReturnedAmount = investmentReturnTxList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  
  const totalExpensesSum = allTransactions.filter(t => t.type === 'Витрата').reduce((s, t) => s + t.amount, 0);
  const remainingInvestmentFunds = totalInvestmentAmount > totalExpensesSum ? totalInvestmentAmount - totalExpensesSum : 0;
  const remainingReturnDebt = totalTargetReturnAmount - totalReturnedAmount;

  // Фільтрація операцій
  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = !searchQuery.trim() || 
      (tx.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.investorName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const cat = (tx.category || '').toLowerCase();
    const txType = (tx.type || '').toLowerCase();
    let matchesFilter = true;

    if (selectedFilter === 'взуття') matchesFilter = cat.includes('пошиття') || cat === 'взуття';
    else if (selectedFilter === 'коробки') matchesFilter = cat === 'коробки';
    else if (selectedFilter === 'пильовики') matchesFilter = cat === 'пильовики';
    else if (selectedFilter === 'реклама') matchesFilter = cat.includes('реклама');
    else if (selectedFilter === 'успішно') matchesFilter = cat === 'успішно';
    else if (selectedFilter === 'передплата') matchesFilter = cat === 'передплата';
    else if (selectedFilter === 'інвестиція') matchesFilter = txType.includes('інвестиція');
    else if (selectedFilter === 'інше') matchesFilter = !['пошиття', 'взуття', 'коробки', 'пильовики', 'реклама', 'успішно', 'передплата'].some(k => cat.includes(k)) && !txType.includes('інвестиція');

    return matchesSearch && matchesFilter;
  });

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

  const totalIncome = allTransactions.filter(t => t.type === 'Дохід').reduce((s, t) => s + t.amount, 0);
  const totalExpense = totalExpensesSum;
  const netProfit = totalIncome - totalExpense;

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const newTx = {
      date,
      type,
      category: type === 'Інвестиція' ? 'Інвестиції' : (category || 'Реклама'),
      amount: Number(amount),
      investorName: type === 'Інвестиція' || type === 'Повернення інвестиції' ? investorName : '',
      returnAmount: type === 'Інвестиція' ? Number(returnAmount || amount) : 0,
      comment: type === 'Інвестиція' ? `Інвестор: ${investorName || 'Без імені'}. ${comment}` : comment,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setFinances([{ id: docRef.id, ...newTx }, ...finances]);
      setShowAddModal(false);
      setAmount('');
      setInvestorName('');
      setReturnAmount('');
      setComment('');
    } catch (error) {
      console.error('Помилка збереження:', error);
    }
  };

  const handleSaveEditedAmount = async (tx) => {
    try {
      const newAmount = Number(editingAmount);
      if (isNaN(newAmount)) return;

      if (String(tx.id).startsWith('ord-cost-')) {
        const orderId = tx.id.replace('ord-cost-', '');
        await updateDoc(doc(db, 'orders', orderId), { cost: newAmount });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, cost: newAmount } : o));
      } else if (String(tx.id).startsWith('ord-rev-')) {
        const orderId = tx.id.replace('ord-rev-', '');
        await updateDoc(doc(db, 'orders', orderId), { price: newAmount });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, price: newAmount } : o));
      } else if (String(tx.id).startsWith('ord-adv-')) {
        const orderId = tx.id.replace('ord-adv-', '');
        await updateDoc(doc(db, 'orders', orderId), { advance: newAmount });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, advance: newAmount } : o));
      } else if (!tx.isAuto) {
        await updateDoc(doc(db, 'transactions', tx.id), { amount: newAmount });
        setFinances(prev => prev.map(t => t.id === tx.id ? { ...t, amount: newAmount } : t));
      }
      
      setEditingTxId(null);
    } catch (error) {
      console.error('Помилка оновлення суми:', error);
      alert('Не вдалося оновити суму');
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

      {/* Основні картки фінансів + Картка Інвестиції */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальний дохід</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">{totalIncome.toLocaleString('uk-UA')} грн</div>
          <p className="text-[10px] text-slate-400">Успішні оплати + передплати</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальні витрати</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">{totalExpense.toLocaleString('uk-UA')} грн</div>
          <p className="text-[10px] text-slate-400">Пошиття + коробки + реклама</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Чистий прибуток</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></span>
          </div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString('uk-UA')} грн
          </div>
          <p className="text-[10px] text-slate-400">Різниця доходів і витрат</p>
        </div>

        {/* Окрема картка "Інвестиції" */}
        <div 
          onClick={() => setShowInvestmentsModal(true)}
          className="bg-amber-500/10 hover:bg-amber-500/20 p-4 rounded-2xl border border-amber-300/80 shadow-xs space-y-1 cursor-pointer transition group"
        >
          <div className="flex justify-between items-center text-amber-900 text-xs font-bold">
            <span>Інвестиції</span>
            <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs group-hover:scale-105 transition">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="text-xl font-black text-amber-950">{totalInvestmentAmount.toLocaleString('uk-UA')} грн</div>
          <p className="text-[10px] font-semibold text-amber-800">Клацніть для деталей і залишків →</p>
        </div>
      </div>

      {/* 4 компактні картки аналітики */}
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

      {/* Пошук та Фільтри */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Пошук операції або інвестора..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 scrollbar-none">
            {[
              { id: 'всі', name: 'Усі' },
              { id: 'інвестиція', name: 'Інвестиції' },
              { id: 'взуття', name: 'Пошиття' },
              { id: 'коробки', name: 'Коробки' },
              { id: 'пильовики', name: 'Пильовики' },
              { id: 'реклама', name: 'Реклама' },
              { id: 'успішно', name: 'Оплата' },
              { id: 'передплата', name: 'Передплата' }
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

        {/* Таблиця операцій */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="pb-2">Дата</th>
                <th className="pb-2">Тип</th>
                <th className="pb-2">Категорія</th>
                <th className="pb-2">Опис / Інвестор</th>
                <th className="pb-2">Сума</th>
                <th className="pb-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">
                    Операцій не знайдено
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition group">
                    <td className="py-2 text-slate-500 text-[10px]">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {tx.date}</span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        tx.type === 'Інвестиція' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : tx.type === 'Дохід' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2 font-semibold text-slate-900">{tx.category}</td>
                    <td className="py-2 text-slate-600 text-[11px]">{tx.comment || '—'}</td>
                    
                    <td className={`py-2 font-bold text-xs ${
                      tx.type === 'Інвестиція' ? 'text-amber-700' : tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {editingTxId === tx.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            className="w-16 px-1.5 py-1 border border-slate-300 rounded text-slate-900 font-normal focus:outline-none bg-white text-[11px]"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSaveEditedAmount(tx)}
                            className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                          <button 
                            onClick={() => setEditingTxId(null)}
                            className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/edit">
                          <span>{tx.type === 'Витрата' ? '-' : '+'}{tx.amount} грн</span>
                          {!String(tx.id).startsWith('stock-') && (
                            <button 
                              onClick={() => { setEditingTxId(tx.id); setEditingAmount(tx.amount || ''); }}
                              className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                              title="Редагувати суму"
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="py-2 text-right">
                      {!tx.isAuto && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer transition"
                          title="Видалити"
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

      {/* МОДАЛЬНЕ ВІКНО ДЕТАЛЕЙ ІНВЕСТИЦІЙ */}
      {showInvestmentsModal && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowInvestmentsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-600" /> Фінансовий аналіз інвестицій
              </h3>
              <button 
                type="button" 
                onClick={() => setShowInvestmentsModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Каркас підсумків інвестицій */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-1">
                <span className="text-slate-500 font-medium block">Загалом інвестовано:</span>
                <span className="text-base font-black text-slate-900">{totalInvestmentAmount.toLocaleString('uk-UA')} грн</span>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200/60 space-y-1">
                <span className="text-slate-500 font-medium block">Вже потрачені кошти:</span>
                <span className="text-base font-black text-rose-700">{totalExpensesSum.toLocaleString('uk-UA')} грн</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 space-y-1">
                <span className="text-slate-500 font-medium block">Залишок інвест-коштів:</span>
                <span className="text-base font-black text-emerald-700">{remainingInvestmentFunds.toLocaleString('uk-UA')} грн</span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/60 space-y-1">
                <span className="text-slate-500 font-medium block">Залишок до повернення:</span>
                <span className="text-base font-black text-purple-900">{remainingReturnDebt.toLocaleString('uk-UA')} грн</span>
              </div>
            </div>

            {/* Список інвесторів та їх внесків */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700">Список інвестицій та інвесторів:</span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {investmentTxList.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 text-xs">Жодної інвестиції ще не додано</p>
                ) : (
                  investmentTxList.map(tx => (
                    <div key={tx.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Інвестор: {tx.investorName || 'Не вказано'}</span>
                        <span className="text-amber-700 font-extrabold">+{tx.amount} грн</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Треба повернути: {tx.returnAmount || tx.amount} грн</span>
                        <span>Дата: {tx.date}</span>
                      </div>
                      {tx.comment && <div className="text-[10px] text-slate-400 pt-0.5">{tx.comment}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО АНАЛІТИКИ КАТЕГОРІЙ */}
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
                  <option value="Інвестиція">Інвестиція</option>
                  <option value="Повернення інвестиції">Повернення інвестиції</option>
                </select>
              </div>

              {type === 'Інвестиція' && (
                <div className="space-y-2 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                  <div>
                    <label className="block font-medium text-amber-900 mb-1">Ім'я інвестора</label>
                    <input 
                      type="text" 
                      required
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="Наприклад: Олег"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-amber-900 mb-1">Сума до повернення (грн)</label>
                    <input 
                      type="number" 
                      value={returnAmount}
                      onChange={(e) => setReturnAmount(e.target.value)}
                      placeholder="Сума боргу/повернення"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Сума (грн)</label>
                  <input 
                    type="number" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none text-slate-900"
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

              {type !== 'Інвестиція' && (
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
              )}

              <div>
                <label className="block font-medium text-slate-600 mb-1">Коментар / Опис</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  rows="2"
                  placeholder="Додаткові деталі..."
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
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
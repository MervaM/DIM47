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
  UserCheck,
  Users,
  PieChart,
  Table as TableIcon
} from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Finances({ finances = [], setFinances = () => {} }) {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [viewMode, setViewMode] = useState('table');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState('');

  const [usdRate, setUsdRate] = useState(41.5);
  const [isEditingUsd, setIsEditingUsd] = useState(false);
  const [usdInput, setUsdInput] = useState('41.5');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('всі');
  const [selectedCategoryAnalytics, setSelectedCategoryAnalytics] = useState(null);
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);

  const [editingTxId, setEditingTxId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const [milaAdvance, setMilaAdvance] = useState(59000);
  const [isEditingMila, setIsEditingMila] = useState(false);
  const [milaAdvanceInput, setMilaAdvanceInput] = useState('59000');

  const [milaExtraCost, setMilaExtraCost] = useState(0);
  const [isEditingMilaExtra, setIsEditingMilaExtra] = useState(false);
  const [milaExtraInput, setMilaExtraInput] = useState('0');

  const [valeriyManualOverride, setValeriyManualOverride] = useState(null);
  const [isEditingValeriy, setIsEditingValeriy] = useState(false);
  const [valeriyInput, setValeriyInput] = useState('0');

  const [type, setType] = useState('Витрата');
  const [category, setCategory] = useState('Реклама');
  const [amount, setAmount] = useState('');
  const [currencyMode, setCurrencyMode] = useState('UAH');
  const [investorName, setInvestorName] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchFirestoreData();
    fetchNbuUsdRate();
  }, []);

  const fetchNbuUsdRate = async () => {
    try {
      const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json');
      const data = await response.json();
      if (data && data[0] && data[0].rate) {
        const liveRate = Number(data[0].rate);
        setUsdRate(liveRate);
        setUsdInput(String(liveRate));
        try {
          await setDoc(doc(db, 'settings', 'usd_rate'), { value: liveRate }, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }
    } catch (error) {
      console.error('Не вдалося завантажити курс НБУ:', error);
    }
  };

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

      const settingsSnap = await getDocs(collection(db, 'settings'));
      settingsSnap.forEach(d => {
        if (d.id === 'mila_advance' && d.data().value !== undefined) {
          setMilaAdvance(Number(d.data().value) || 0);
          setMilaAdvanceInput(String(d.data().value));
        }
        if (d.id === 'mila_extra_cost' && d.data().value !== undefined) {
          setMilaExtraCost(Number(d.data().value) || 0);
          setMilaExtraInput(String(d.data().value));
        }
        if (d.id === 'valeriy_manual_override' && d.data().value !== undefined) {
          setValeriyManualOverride(Number(d.data().value));
          setValeriyInput(String(d.data().value));
        }
        if (d.id === 'usd_rate' && d.data().value !== undefined) {
          const savedRate = Number(d.data().value);
          if (!isNaN(savedRate) && savedRate > 0) {
            setUsdRate(savedRate);
            setUsdInput(String(savedRate));
          }
        }
      });
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    }
  };

  const handleSaveUsdRate = async () => {
    const val = parseFloat(usdInput);
    if (!isNaN(val) && val > 0) {
      setUsdRate(val);
      try {
        await setDoc(doc(db, 'settings', 'usd_rate'), { value: val });
      } catch (err) {
        console.error(err);
      }
    }
    setIsEditingUsd(false);
  };

  const handleSaveMilaAdvance = async () => {
    const val = parseFloat(milaAdvanceInput);
    if (!isNaN(val)) {
      setMilaAdvance(val);
      try {
        await setDoc(doc(db, 'settings', 'mila_advance'), { value: val });
      } catch (err) { console.error(err); }
    }
    setIsEditingMila(false);
  };

  const handleSaveMilaExtra = async () => {
    const val = parseFloat(milaExtraInput);
    if (!isNaN(val)) {
      setMilaExtraCost(val);
      try {
        await setDoc(doc(db, 'settings', 'mila_extra_cost'), { value: val });
      } catch (err) { console.error(err); }
    }
    setIsEditingMilaExtra(false);
  };

  const handleSaveValeriy = async () => {
    const val = parseFloat(valeriyInput);
    if (!isNaN(val)) {
      setValeriyManualOverride(val);
      try {
        await setDoc(doc(db, 'settings', 'valeriy_manual_override'), { value: val });
      } catch (err) { console.error(err); }
    }
    setIsEditingValeriy(false);
  };

  const milaOrdersCost = orders
    .filter(o => (o.supplier || 'Міла') === 'Міла' && Number(o.cost) > 0)
    .reduce((sum, o) => {
      const costVal = o.currency === 'USD' ? Number(o.cost) * usdRate : Number(o.cost);
      return sum + costVal;
    }, 0);

  const totalMilaUsed = milaOrdersCost + milaExtraCost;
  const milaRemainingBalance = milaAdvance - totalMilaUsed;

  const autoValeriyCost = orders
    .filter(o => (o.supplier || '').toLowerCase().includes('валєр') && Number(o.cost) > 0)
    .reduce((sum, o) => {
      const costVal = o.currency === 'USD' ? Number(o.cost) * usdRate : Number(o.cost);
      return sum + costVal;
    }, 0);

  const valeriyTotalToPay = valeriyManualOverride !== null ? valeriyManualOverride : autoValeriyCost;

  const getUsedPackagingCount = (packName) => {
    return orders.reduce((acc, o) => {
      let count = 0;
      if (o.usedBox === packName) count += 1;
      if (o.usedDustbag === packName) count += 1;
      return acc + count;
    }, 0);
  };

  const orderTailoringCostTx = orders
    .map(o => {
      const costVal = Number(o.cost) || 0;
      if (costVal <= 0) return null;
      const finalCostUah = o.currency === 'USD' ? costVal * usdRate : costVal;
      const costUsd = (finalCostUah / usdRate).toFixed(2);
      return {
        id: `ord-cost-${o.id}`,
        date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
        createdAt: o.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: 'Пошиття взуття',
        comment: `${o.productTitle || o.name || 'Взуття'} [Виробник: ${o.supplier || 'Міла'}]`,
        amount: Number(finalCostUah.toFixed(2)),
        amountUsd: Number(costUsd),
        isAuto: true
      };
    })
    .filter(Boolean);

  const availabilityShoesCostTx = stock
    .filter(item => item.folderId === 'availability' && Number(item.cost) > 0)
    .map(item => {
      const costVal = Number(item.cost) || 0;
      const finalCostUah = item.currency === 'USD' ? costVal * usdRate : costVal;
      const costUsd = (finalCostUah / usdRate).toFixed(2);
      return {
        id: `avail-cost-${item.id}`,
        date: item.date || item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Наявність',
        createdAt: item.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: 'Пошиття взуття',
        comment: `${item.name || 'Взуття'} (Наявність${item.size ? `, ${item.size} р.` : ''})`,
        amount: Number(finalCostUah.toFixed(2)),
        amountUsd: Number(costUsd),
        isAuto: true
      };
    });

  const successfulOrdersTx = orders
    .filter(o => (o.status || '').toLowerCase() === 'успішно')
    .map(o => {
      const fullPrice = Number(o.price) || 0;
      const adv = Number(o.advance) || Number(o.prepayment) || 0;
      let finalPayment = fullPrice > adv ? fullPrice - adv : fullPrice;

      let novapayFee = 0;
      const isCod = o.paymentType === 'afterpay' || o.isCashOnDelivery || (finalPayment > 0 && adv === 0); 
      if (isCod && finalPayment > 0) {
        novapayFee = 20 + (finalPayment * 0.02);
        finalPayment = finalPayment - novapayFee;
      }

      const usdVal = (finalPayment / usdRate).toFixed(2);

      return {
        id: `ord-rev-${o.id}`,
        date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
        createdAt: o.createdAt || new Date().toISOString(),
        type: 'Дохід',
        category: 'Успішно',
        comment: `Оплата: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})${novapayFee > 0 ? ` [Комісія NovaPay: -${novapayFee.toFixed(2)} грн]` : ''}`,
        amount: Number(finalPayment.toFixed(2)),
        amountUsd: Number(usdVal),
        isAuto: true
      };
    });

  const ordersAdvanceTx = orders
    .filter(o => Number(o.advance) > 0 || Number(o.prepayment) > 0)
    .map(o => {
      const advVal = Number(o.advance || o.prepayment);
      const usdVal = (advVal / usdRate).toFixed(2);
      return {
        id: `ord-adv-${o.id}`,
        date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
        createdAt: o.createdAt || new Date().toISOString(),
        type: 'Дохід',
        category: 'Передплата',
        comment: `Передплата: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
        amount: Number(advVal.toFixed(2)),
        amountUsd: Number(usdVal),
        isAuto: true
      };
    });

  const stockTx = stock
    .filter(item => {
      const name = (item.name || '').toLowerCase();
      return item.folderId !== 'availability' && (name.includes('коробк') || name.includes('пильовик'));
    })
    .map(item => {
      const name = (item.name || '').toLowerCase();
      const currentQty = Number(item.quantity) || 0;
      const usedQty = getUsedPackagingCount(item.name);
      const totalInitialQty = currentQty + usedQty;
      const unitCost = Number(item.cost) || Number(item.price) || 0;
      const totalUah = totalInitialQty * unitCost;
      const usdVal = (totalUah / usdRate).toFixed(2);
      const catName = name.includes('коробк') ? 'Коробки' : 'Пильовики';

      return {
        id: `stock-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Склад',
        createdAt: item.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: catName,
        comment: `${item.name} (${totalInitialQty} шт × ${unitCost} грн)`,
        amount: Number(totalUah.toFixed(2)),
        amountUsd: Number(usdVal),
        isAuto: true
      };
    });

  const manualFinances = finances.map(tx => {
    const uah = Number(tx.amount) || 0;
    const usd = (uah / usdRate).toFixed(2);
    return {
      ...tx,
      amount: uah,
      amountUsd: Number(usd),
      createdAt: tx.createdAt || new Date().toISOString()
    };
  });

  const allTransactions = [
    ...orderTailoringCostTx, 
    ...availabilityShoesCostTx,
    ...successfulOrdersTx, 
    ...ordersAdvanceTx, 
    ...stockTx, 
    ...manualFinances
  ];

  allTransactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const filteredByPeriodTransactions = allTransactions.filter(tx => {
    if (periodFilter === 'all') return true;
    if (!tx.date || tx.date === 'Замовлення' || tx.date === 'Наявність' || tx.date === 'Склад') return true;

    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return true;

    if (periodFilter === 'month') {
      const txMonth = txDate.toISOString().slice(0, 7);
      return txMonth === selectedMonth;
    } else if (periodFilter === 'week') {
      if (!selectedWeek) return true;
      const year = txDate.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (txDate - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const txWeekStr = `${year}-W${String(weekNum).padStart(2, '0')}`;
      return txWeekStr === selectedWeek;
    }
    return true;
  });

  const getInvestorsAnalytics = () => {
    const investorMap = {};
    finances.forEach(tx => {
      if (tx.type === 'Інвестиція' || tx.type === 'Повернення інвестиції') {
        const name = (tx.investorName || tx.comment || 'Інвестор').trim();
        if (!investorMap[name]) {
          investorMap[name] = { name, totalInvested: 0, targetReturn: 0, returned: 0, transactions: [] };
        }
        investorMap[name].transactions.push(tx);
        if (tx.type === 'Інвестиція') {
          investorMap[name].totalInvested += Number(tx.amount) || 0;
          investorMap[name].targetReturn += Number(tx.returnAmount || tx.amount) || 0;
        } else if (tx.type === 'Повернення інвестиції') {
          investorMap[name].returned += Number(tx.amount) || 0;
        }
      }
    });
    return Object.values(investorMap).map(inv => ({ ...inv, debtRemaining: inv.targetReturn - inv.returned }));
  };

  const investorsData = getInvestorsAnalytics();
  const grandTotalInvested = investorsData.reduce((s, i) => s + i.totalInvested, 0);

  const filteredTransactions = filteredByPeriodTransactions.filter(tx => {
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
    else if (selectedFilter === 'податки') matchesFilter = cat.includes('податк');
    else if (selectedFilter === 'бухгалтер') matchesFilter = cat.includes('бухгалтер');
    else if (selectedFilter === 'зарплата') matchesFilter = cat.includes('зарплат');
    else if (selectedFilter === 'успішно') matchesFilter = cat === 'успішно';
    else if (selectedFilter === 'передплата') matchesFilter = cat === 'передплата';
    else if (selectedFilter === 'інвестиція') matchesFilter = txType.includes('інвестиція');
    else if (selectedFilter === 'інше') matchesFilter = !['пошиття', 'взуття', 'коробки', 'пильовики', 'реклама', 'податк', 'бухгалтер', 'зарплат', 'успішно', 'передплата'].some(k => cat.includes(k)) && !txType.includes('інвестиція');

    return matchesSearch && matchesFilter;
  });

  const calculateCategoryStats = (catKey) => {
    const list = filteredByPeriodTransactions.filter(t => (t.category || '').toLowerCase().includes(catKey.toLowerCase()));
    const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const avg = list.length > 0 ? (total / list.length).toFixed(0) : 0;
    return { total, count: list.length, avg };
  };

  const shoesStats = calculateCategoryStats('пошиття');
  const boxesStats = calculateCategoryStats('коробки');
  const dustbagsStats = calculateCategoryStats('пильовики');
  const adsStats = calculateCategoryStats('реклама');
  const taxesStats = calculateCategoryStats('податк');
  const accountantStats = calculateCategoryStats('бухгалтер');
  const salaryStats = calculateCategoryStats('зарплат');

  const totalIncome = filteredByPeriodTransactions.filter(t => t.type === 'Дохід').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredByPeriodTransactions.filter(t => t.type === 'Витрата').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    let finalAmount = Number(amount);
    let commentText = comment;

    if (currencyMode === 'USD') {
      finalAmount = Number((Number(amount) * usdRate).toFixed(2));
      commentText = `[ У валюті: $${amount} за курсом ${usdRate} ] ${comment}`;
    }

    const newTx = {
      date,
      type,
      category: type === 'Інвестиція' ? 'Інвестиції' : (category || 'Реклама'),
      amount: finalAmount,
      investorName: type === 'Інвестиція' || type === 'Повернення інвестиції' ? investorName : '',
      returnAmount: type === 'Інвестиція' ? Number(returnAmount || finalAmount) : 0,
      comment: type === 'Інвестиція' ? `Інвестор: ${investorName || 'Без імені'}. ${commentText}` : commentText,
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
      setCurrencyMode('UAH');
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
      } else if (String(tx.id).startsWith('avail-cost-')) {
        const itemId = tx.id.replace('avail-cost-', '');
        await updateDoc(doc(db, 'stock', itemId), { cost: newAmount });
        setStock(prev => prev.map(s => s.id === itemId ? { ...s, cost: newAmount } : s));
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
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Видалити цю транзакцію?')) {
      try {
        if (!String(id).startsWith('stock-') && !String(id).startsWith('ord-') && !String(id).startsWith('avail-')) {
          await deleteDoc(doc(db, 'transactions', id));
        }
        setFinances(finances.filter(tx => tx.id !== id));
      } catch (error) {
        console.error('Помилка видалення:', error);
      }
    }
  };

  const categoryDetailsList = selectedCategoryAnalytics 
    ? filteredByPeriodTransactions.filter(t => (t.category || '').toLowerCase().includes(selectedCategoryAnalytics.toLowerCase()))
    : [];

  return (
    <div className="space-y-4 p-3 sm:p-4 max-w-5xl mx-auto">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-900">Курс USD (НБУ):</span>
          {!isEditingUsd ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950">{usdRate} грн/$</span>
              <button 
                type="button"
                onClick={() => { setIsEditingUsd(true); setUsdInput(String(usdRate)); }}
                className="text-[10px] text-emerald-700 underline cursor-pointer"
              >
                змінити вручну
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                step="any"
                value={usdInput}
                onChange={e => setUsdInput(e.target.value)}
                className="w-16 px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-xs"
                autoFocus
              />
              <button type="button" onClick={handleSaveUsdRate} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
              <button type="button" onClick={() => setIsEditingUsd(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> Період:
          </span>
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Увесь час
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodFilter === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Місяць
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('week')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              periodFilter === 'week' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Тиждень
          </button>

          {periodFilter === 'month' && (
            <input 
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          )}

          {periodFilter === 'week' && (
            <input 
              type="week"
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon size={14} /> Таблиця
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieChart size={14} /> Графік
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальний дохід</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {totalIncome.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(totalIncome / usdRate).toFixed(2)})</span>
          </div>
          <p className="text-[10px] text-slate-400">Успішні оплати + передплати</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальні витрати</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {totalExpense.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(totalExpense / usdRate).toFixed(2)})</span>
          </div>
          <p className="text-[10px] text-slate-400">Авто-пошиття (пар) + податки тощо</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Чистий прибуток</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></span>
          </div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(netProfit / usdRate).toFixed(2)})</span>
          </div>
          <p className="text-[10px] text-slate-400">Різниця доходів і витрат</p>
        </div>

        <div 
          onClick={() => setShowInvestmentsModal(true)}
          className="bg-amber-500/10 hover:bg-amber-500/20 p-4 rounded-2xl border border-amber-300/80 shadow-xs space-y-1 cursor-pointer transition group"
        >
          <div className="flex justify-between items-center text-amber-900 text-xs font-bold">
            <span>Інвестори</span>
            <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs group-hover:scale-105 transition">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="text-xl font-black text-amber-950">
            {grandTotalInvested.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-500">(${(grandTotalInvested / usdRate).toFixed(2)})</span>
          </div>
          <p className="text-[10px] font-semibold text-amber-800">Картки по інвесторах →</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
              <Users size={16} className="text-indigo-600" /> Виробник: Міла (Аванс)
            </span>
            {!isEditingMila ? (
              <button 
                type="button"
                onClick={() => { setIsEditingMila(true); setMilaAdvanceInput(String(milaAdvance)); }}
                className="text-[10px] text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Змінити аванс
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  step="any"
                  value={milaAdvanceInput}
                  onChange={e => setMilaAdvanceInput(e.target.value)}
                  className="w-20 px-1.5 py-0.5 bg-white border border-indigo-300 rounded text-xs"
                  autoFocus
                />
                <button type="button" onClick={handleSaveMilaAdvance} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
                <button type="button" onClick={() => setIsEditingMila(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block">Внесений аванс:</span>
              <span className="font-bold text-slate-900">
                {milaAdvance.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
                <span className="text-[9px] text-slate-400">(${(milaAdvance / usdRate).toFixed(2)})</span>
              </span>
            </div>
            
            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-semibold">Використано:</span>
                {!isEditingMilaExtra && (
                  <button 
                    type="button"
                    onClick={() => { setIsEditingMilaExtra(true); setMilaExtraInput(String(milaExtraCost)); }}
                    className="text-[9px] text-indigo-600 underline cursor-pointer"
                  >
                    змінити
                  </button>
                )}
              </div>
              {!isEditingMilaExtra ? (
                <span className="font-bold text-rose-600 block">
                  -{totalMilaUsed.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
                  <span className="text-[9px] text-slate-400">(${(totalMilaUsed / usdRate).toFixed(2)})</span>
                </span>
              ) : (
                <div className="flex items-center gap-1 pt-1">
                  <input 
                    type="number"
                    step="any"
                    value={milaExtraInput}
                    onChange={e => setMilaExtraInput(e.target.value)}
                    className="w-16 px-1 py-0.5 border rounded text-xs"
                    autoFocus
                  />
                  <button type="button" onClick={handleSaveMilaExtra} className="text-emerald-600"><Check size={12} /></button>
                  <button type="button" onClick={() => setIsEditingMilaExtra(false)} className="text-slate-400"><X size={12} /></button>
                </div>
              )}
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block">Залишок у Міли:</span>
              <span className={`font-bold text-sm ${milaRemainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {milaRemainingBalance.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
                <span className="text-[9px] text-slate-400">(${(milaRemainingBalance / usdRate).toFixed(2)})</span>
              </span>
            </div>
          </div>
          <p className="text-[10px] text-indigo-900/70 font-medium">Автоматично мінусується пошиття за курсом НБУ + витрати на розробку.</p>
        </div>

        <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-purple-950 text-sm flex items-center gap-1.5">
              <Users size={16} className="text-purple-600" /> Виробник: Валерій (Тижнева оплата)
            </span>
            {!isEditingValeriy ? (
              <button 
                type="button"
                onClick={() => { setIsEditingValeriy(true); setValeriyInput(String(valeriyTotalToPay)); }}
                className="text-[10px] text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Змінити суму
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  step="any"
                  value={valeriyInput}
                  onChange={e => setValeriyInput(e.target.value)}
                  className="w-20 px-1.5 py-0.5 bg-white border border-purple-300 rounded text-xs"
                  autoFocus
                />
                <button type="button" onClick={handleSaveValeriy} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
                <button type="button" onClick={() => setIsEditingValeriy(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
              </div>
            )}
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-purple-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-semibold">Сума до виплати за тиждень:</span>
              {valeriyManualOverride !== null && (
                <button 
                  type="button"
                  onClick={() => { setValeriyManualOverride(null); try { setDoc(doc(db, 'settings', 'valeriy_manual_override'), { value: null }); } catch(e){} }}
                  className="text-[9px] text-purple-600 underline cursor-pointer"
                >
                  скинути до авто
                </button>
              )}
            </div>
            <div className="text-xl font-black text-purple-900">
              {valeriyTotalToPay.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
              <span className="text-xs font-normal text-slate-400">(${(valeriyTotalToPay / usdRate).toFixed(2)})</span>
            </div>
          </div>
          <p className="text-[10px] text-purple-900/70 font-medium">Розраховується автоматично по пошитих замовленнях або редагується вручну.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: 'коробки', title: 'Коробки', stats: boxesStats, color: 'border-amber-200 bg-amber-50/30' },
          { key: 'пильовики', title: 'Пильовики', stats: dustbagsStats, color: 'border-blue-200 bg-blue-50/30' },
          { key: 'пошиття', title: 'Пошиття взуття', stats: shoesStats, color: 'border-purple-200 bg-purple-50/30' },
          { key: 'реклама', title: 'Реклама / Таргет', stats: adsStats, color: 'border-emerald-200 bg-emerald-50/30' },
          { key: 'податк', title: 'Податки', stats: taxesStats, color: 'border-rose-200 bg-rose-50/30' },
          { key: 'бухгалтер', title: 'Бухгалтер', stats: accountantStats, color: 'border-indigo-200 bg-indigo-50/30' },
          { key: 'зарплат', title: 'Зарплатня', stats: salaryStats, color: 'border-teal-200 bg-teal-50/30' }
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setSelectedCategoryAnalytics(item.key)}
            className={`p-2.5 rounded-xl border ${item.color} cursor-pointer transition space-y-0.5 hover:shadow-xs group`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{item.title}</span>
              <BarChart2 size={12} className="text-slate-400 group-hover:text-slate-900 transition" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {item.stats.total.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
              <span className="text-[10px] font-normal text-slate-400">(${(item.stats.total / usdRate).toFixed(2)})</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium truncate">
              ~{item.stats.avg} грн ({item.stats.count} завед.)
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'table' ? (
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
                { id: 'податки', name: 'Податки' },
                { id: 'бухгалтер', name: 'Бухгалтер' },
                { id: 'зарплата', name: 'Зарплата' },
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
                      Операцій за обраний період не знайдено
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const amountUsd = tx.amountUsd !== undefined ? tx.amountUsd : (tx.amount / usdRate).toFixed(2);
                    return (
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
                                step="any"
                                value={editingAmount}
                                onChange={(e) => setEditingAmount(e.target.value)}
                                className="w-20 px-1.5 py-1 border border-slate-300 rounded text-slate-900 font-normal focus:outline-none bg-white text-[11px]"
                                autoFocus
                              />
                              <button type="button" onClick={() => handleSaveEditedAmount(tx)} className="p-1 bg-emerald-100 text-emerald-700 rounded"><Check size={12} /></button>
                              <button type="button" onClick={() => setEditingTxId(null)} className="p-1 bg-slate-100 text-slate-600 rounded"><X size={12} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/edit">
                              <span>
                                {tx.type === 'Витрата' ? '-' : '+'}{Number(tx.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
                                <span className="text-[10px] font-normal text-slate-400">(${amountUsd})</span>
                              </span>
                              {!String(tx.id).startsWith('stock-') && (
                                <button 
                                  type="button"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Візуальний аналіз фінансів за обраний період</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs font-semibold text-emerald-800">Доходи</span>
              <div className="text-xl font-black text-emerald-950">
                {totalIncome.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн{' '}
                <span className="text-xs font-normal text-slate-500">(${(totalIncome / usdRate).toFixed(2)})</span>
              </div>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-1">
              <span className="text-xs font-semibold text-rose-800">Витрати</span>
              <div className="text-xl font-black text-rose-950">
                {totalExpense.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн{' '}
                <span className="text-xs font-normal text-slate-500">(${(totalExpense / usdRate).toFixed(2)})</span>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-1">
              <span className="text-xs font-semibold text-indigo-800">Чистий прибуток</span>
              <div className="text-xl font-black text-indigo-950">
                {netProfit.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн{' '}
                <span className="text-xs font-normal text-slate-500">(${(netProfit / usdRate).toFixed(2)})</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <Briefcase size={18} className="text-amber-600" /> Облік залучених інвестицій
              </h3>
              <button type="button" onClick={() => setShowInvestmentsModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {investorsData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Жодного інвестора ще не заведено.
                </div>
              ) : (
                investorsData.map(inv => (
                  <div key={inv.name} className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-4 space-y-2.5">
                    <div className="flex justify-between items-center pb-1 border-b border-amber-200/50">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck size={16} className="text-amber-700" /> {inv.name}
                      </span>
                      <span className="text-xs font-black text-amber-900 bg-amber-200/50 px-2.5 py-0.5 rounded-full">
                        Внесено: {inv.totalInvested.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold block">Повернуто інвестору:</span>
                        <span className="text-sm font-bold text-emerald-600">{inv.returned.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн</span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold block">Залишок до повернення:</span>
                        <span className={`text-sm font-bold ${inv.debtRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {inv.debtRemaining.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCategoryAnalytics && (
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
                Операції категорії: {selectedCategoryAnalytics}
              </h3>
              <button type="button" onClick={() => setSelectedCategoryAnalytics(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {categoryDetailsList.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">Немає збережених операцій</p>
              ) : (
                categoryDetailsList.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{t.comment}</div>
                      <div className="text-[10px] text-slate-400">{t.date}</div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {Number(t.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн{' '}
                      <span className="text-slate-400 font-normal">(${(t.amount / usdRate).toFixed(2)})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

              {(type === 'Інвестиція' || type === 'Повернення інвестиції') && (
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
                  {type === 'Інвестиція' && (
                    <div>
                      <label className="block font-medium text-amber-900 mb-1">Сума до повернення (грн)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={returnAmount}
                        onChange={(e) => setReturnAmount(e.target.value)}
                        placeholder="Сума боргу"
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-semibold focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-medium text-slate-600">Сума</label>
                    <div className="flex gap-1 text-[10px]">
                      <button 
                        type="button" 
                        onClick={() => setCurrencyMode('UAH')}
                        className={`px-1.5 py-0.5 rounded ${currencyMode === 'UAH' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        грн
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setCurrencyMode('USD')}
                        className={`px-1.5 py-0.5 rounded ${currencyMode === 'USD' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        $
                      </button>
                    </div>
                  </div>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none text-slate-900"
                    placeholder={currencyMode === 'USD' ? '0 $' : '0 грн'}
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

              {type !== 'Інвестиція' && type !== 'Повернення інвестиції' && (
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Категорія</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                  >
                    <option value="Податки">Податки</option>
                    <option value="Бухгалтер">Бухгалтер / Послуги</option>
                    <option value="Зарплата">Зарплатня</option>
                    <option value="Реклама">Реклама / Таргет</option>
                    <option value="Коробки">Коробки</option>
                    <option value="Пильовики">Пильовики</option>
                    <option value="Оренда">Оренда / Приміщення</option>
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
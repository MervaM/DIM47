import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

import FinancesHeader from './FinancesHeader';
import FinancesStats from './FinancesStats';
import FinancesTable from './FinancesTable';
import AddTransactionModal from './AddTransactionModal';

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
      } catch (err) { console.error(err); }
    }
    setIsEditingUsd(false);
  };

  const handleSaveMilaAdvance = async () => {
    const val = parseFloat(milaAdvanceInput);
    if (!isNaN(val)) {
      setMilaAdvance(val);
      try { await setDoc(doc(db, 'settings', 'mila_advance'), { value: val }); } catch (err) { console.error(err); }
    }
    setIsEditingMila(false);
  };

  const handleSaveMilaExtra = async () => {
    const val = parseFloat(milaExtraInput);
    if (!isNaN(val)) {
      setMilaExtraCost(val);
      try { await setDoc(doc(db, 'settings', 'mila_extra_cost'), { value: val }); } catch (err) { console.error(err); }
    }
    setIsEditingMilaExtra(false);
  };

  const handleSaveValeriy = async () => {
    const val = parseFloat(valeriyInput);
    if (!isNaN(val)) {
      setValeriyManualOverride(val);
      try { await setDoc(doc(db, 'settings', 'valeriy_manual_override'), { value: val }); } catch (err) { console.error(err); }
    }
    setIsEditingValeriy(false);
  };

  // Витрати Міли
  const milaOrdersCost = orders
    .filter(o => {
      const sup = (o.supplier || 'міла').toLowerCase();
      return sup.includes('міл') && Number(o.cost) > 0;
    })
    .reduce((sum, o) => {
      const costVal = Number(o.cost) || 0;
      const finalCostUah = o.currency === 'USD' ? costVal * usdRate : costVal;
      return sum + finalCostUah;
    }, 0);

  const totalMilaUsed = milaOrdersCost + milaExtraCost;
  const milaRemainingBalance = milaAdvance - totalMilaUsed;

  // Витрати Валерія
  const autoValeriyCost = orders
    .filter(o => {
      const sup = (o.supplier || '').toLowerCase();
      return sup.includes('валєр') && Number(o.cost) > 0;
    })
    .reduce((sum, o) => {
      const costVal = Number(o.cost) || 0;
      const finalCostUah = o.currency === 'USD' ? costVal * usdRate : costVal;
      return sum + finalCostUah;
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
      return {
        id: `ord-cost-${o.id}`,
        date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
        createdAt: o.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: 'Пошиття взуття',
        comment: `${o.productTitle || o.name || 'Взуття'} [Виробник: ${o.supplier || 'Міла'}]`,
        amount: Number(finalCostUah.toFixed(2)),
        isAuto: true
      };
    })
    .filter(Boolean);

  const availabilityShoesCostTx = stock
    .filter(item => item.folderId === 'availability' && Number(item.cost) > 0)
    .map(item => {
      const costVal = Number(item.cost) || 0;
      const finalCostUah = item.currency === 'USD' ? costVal * usdRate : costVal;
      return {
        id: `avail-cost-${item.id}`,
        date: item.date || item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Наявність',
        createdAt: item.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: 'Пошиття взуття',
        comment: `${item.name || 'Взуття'} (Наявність${item.size ? `, ${item.size} р.` : ''})`,
        amount: Number(finalCostUah.toFixed(2)),
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
      if ((o.paymentType === 'afterpay' || o.isCashOnDelivery || (finalPayment > 0 && adv === 0)) && finalPayment > 0) {
        novapayFee = 20 + (finalPayment * 0.02);
        finalPayment = finalPayment - novapayFee;
      }
      return {
        id: `ord-rev-${o.id}`,
        date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
        createdAt: o.createdAt || new Date().toISOString(),
        type: 'Дохід',
        category: 'Успішно',
        comment: `Оплата: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})${novapayFee > 0 ? ` [Комісія NovaPay: -${novapayFee.toFixed(2)} грн]` : ''}`,
        amount: Number(finalPayment.toFixed(2)),
        isAuto: true
      };
    });

  const ordersAdvanceTx = orders
    .filter(o => Number(o.advance) > 0 || Number(o.prepayment) > 0)
    .map(o => ({
      id: `ord-adv-${o.id}`,
      date: o.date || o.createdAt ? new Date(o.createdAt || Date.now()).toISOString().split('T')[0] : 'Замовлення',
      createdAt: o.createdAt || new Date().toISOString(),
      type: 'Дохід',
      category: 'Передплата',
      comment: `Передплата: ${o.productTitle || o.name || 'Взуття'} (${o.client || 'Клієнт'})`,
      amount: Number(Number(o.advance || o.prepayment).toFixed(2)),
      isAuto: true
    }));

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
      return {
        id: `stock-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Склад',
        createdAt: item.createdAt || new Date().toISOString(),
        type: 'Витрата',
        category: name.includes('коробк') ? 'Коробки' : 'Пильовики',
        comment: `${item.name} (${totalInitialQty} шт × ${unitCost} грн)`,
        amount: Number((totalInitialQty * unitCost).toFixed(2)),
        isAuto: true
      };
    });

  const manualFinances = finances.map(tx => ({ ...tx, amount: Number(tx.amount) || 0, createdAt: tx.createdAt || new Date().toISOString() }));

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

    if (periodFilter === 'month') return txDate.toISOString().slice(0, 7) === selectedMonth;
    if (periodFilter === 'week' && selectedWeek) {
      const year = txDate.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (txDate - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${String(weekNum).padStart(2, '0')}` === selectedWeek;
    }
    return true;
  });

  const getInvestorsAnalytics = () => {
    const investorMap = {};
    finances.forEach(tx => {
      if (tx.type === 'Інвестиція' || tx.type === 'Повернення інвестиції') {
        const name = (tx.investorName || tx.comment || 'Інвестор').trim();
        if (!investorMap[name]) investorMap[name] = { name, totalInvested: 0, targetReturn: 0, returned: 0, transactions: [] };
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
      date, type, category: type === 'Інвестиція' ? 'Інвестиції' : (category || 'Реклама'),
      amount: finalAmount, investorName: type.includes('Інвестиція') ? investorName : '',
      returnAmount: type === 'Інвестиція' ? Number(returnAmount || finalAmount) : 0,
      comment: type === 'Інвестиція' ? `Інвестор: ${investorName || 'Без імені'}. ${commentText}` : commentText,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setFinances([{ id: docRef.id, ...newTx }, ...finances]);
      setShowAddModal(false);
      setAmount(''); setInvestorName(''); setReturnAmount(''); setComment(''); setCurrencyMode('UAH');
    } catch (error) { console.error(error); }
  };

  const handleSaveEditedAmount = async (tx) => {
    try {
      const newAmount = Number(editingAmount);
      if (isNaN(newAmount)) return;

      if (String(tx.id).startsWith('ord-cost-')) {
        const orderId = tx.id.replace('ord-cost-', '');
        await updateDoc(doc(db, 'orders', orderId), { cost: newAmount, currency: 'UAH' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, cost: newAmount, currency: 'UAH' } : o));
      } else if (String(tx.id).startsWith('avail-cost-')) {
        const itemId = tx.id.replace('avail-cost-', '');
        await updateDoc(doc(db, 'stock', itemId), { cost: newAmount, currency: 'UAH' });
        setStock(prev => prev.map(s => s.id === itemId ? { ...s, cost: newAmount, currency: 'UAH' } : s));
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
    } catch (error) { console.error(error); }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Видалити цю транзакцію?')) {
      try {
        if (!String(id).startsWith('stock-') && !String(id).startsWith('ord-') && !String(id).startsWith('avail-')) {
          await deleteDoc(doc(db, 'transactions', id));
        }
        setFinances(finances.filter(tx => tx.id !== id));
      } catch (error) { console.error(error); }
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-4 max-w-5xl mx-auto">
      <FinancesHeader
        usdRate={usdRate} isEditingUsd={isEditingUsd} setIsEditingUsd={setIsEditingUsd}
        usdInput={usdInput} setUsdInput={setUsdInput} handleSaveUsdRate={handleSaveUsdRate}
        periodFilter={periodFilter} setPeriodFilter={setPeriodFilter}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
        viewMode={viewMode} setViewMode={setViewMode} setShowAddModal={setShowAddModal}
      />

      <FinancesStats
        totalIncome={totalIncome} totalExpense={totalExpense} netProfit={netProfit}
        grandTotalInvested={grandTotalInvested} usdRate={usdRate}
        setShowInvestmentsModal={setShowInvestmentsModal}
        milaAdvance={milaAdvance} isEditingMila={isEditingMila} setIsEditingMila={setIsEditingMila}
        milaAdvanceInput={milaAdvanceInput} setMilaAdvanceInput={setMilaAdvanceInput} handleSaveMilaAdvance={handleSaveMilaAdvance}
        totalMilaUsed={totalMilaUsed} isEditingMilaExtra={isEditingMilaExtra} setIsEditingMilaExtra={setIsEditingMilaExtra}
        milaExtraInput={milaExtraInput} setMilaExtraInput={setMilaExtraInput} handleSaveMilaExtra={handleSaveMilaExtra}
        milaRemainingBalance={milaRemainingBalance}
        valeriyTotalToPay={valeriyTotalToPay} isEditingValeriy={isEditingValeriy} setIsEditingValeriy={setIsEditingValeriy}
        valeriyInput={valeriyInput} setValeriyInput={setValeriyInput} handleSaveValeriy={handleSaveValeriy}
        valeriyManualOverride={valeriyManualOverride} setValeriyManualOverride={setValeriyManualOverride} db={db}
      />

      {viewMode === 'table' ? (
        <FinancesTable
          filteredTransactions={filteredTransactions} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter}
          editingTxId={editingTxId} setEditingTxId={setEditingTxId}
          editingAmount={editingAmount} setEditingAmount={setEditingAmount}
          handleSaveEditedAmount={handleSaveEditedAmount} handleDeleteTransaction={handleDeleteTransaction}
          setSelectedCategoryAnalytics={setSelectedCategoryAnalytics}
          boxesStats={boxesStats} dustbagsStats={dustbagsStats} shoesStats={shoesStats}
          adsStats={adsStats} taxesStats={taxesStats} accountantStats={accountantStats} salaryStats={salaryStats}
          usdRate={usdRate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/85 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Візуальний аналіз фінансів за обраний період</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs font-semibold text-emerald-800">Доходи</span>
              <div className="text-xl font-black text-emerald-955">${(totalIncome / usdRate).toFixed(2)} <span className="text-xs font-normal text-slate-500">({totalIncome.toLocaleString('uk-UA')} грн)</span></div>
            </div>
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-1">
              <span className="text-xs font-semibold text-rose-800">Витрати</span>
              <div className="text-xl font-black text-rose-955">${(totalExpense / usdRate).toFixed(2)} <span className="text-xs font-normal text-slate-500">({totalExpense.toLocaleString('uk-UA')} грн)</span></div>
            </div>
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-1">
              <span className="text-xs font-semibold text-indigo-800">Чистий прибуток</span>
              <div className="text-xl font-black text-indigo-955">${(netProfit / usdRate).toFixed(2)} <span className="text-xs font-normal text-slate-500">({netProfit.toLocaleString('uk-UA')} грн)</span></div>
            </div>
          </div>
        </div>
      )}

      <AddTransactionModal
        showAddModal={showAddModal} setShowAddModal={setShowAddModal}
        handleAddTransaction={handleAddTransaction} type={type} setType={setType}
        investorName={investorName} setInvestorName={setInvestorName}
        returnAmount={returnAmount} setReturnAmount={setReturnAmount}
        amount={amount} setAmount={setAmount} currencyMode={currencyMode} setCurrencyMode={setCurrencyMode}
        date={date} setDate={setDate} category={category} setCategory={setCategory}
        comment={comment} setComment={setComment}
      />
    </div>
  );
}
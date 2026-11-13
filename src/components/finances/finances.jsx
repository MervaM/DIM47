import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar, Plus, Check, X } from 'lucide-react';

export default function finances({ finances = [], setFinances = () => {} }) {
  const [usdRate, setUsdRate] = useState(46.36);
  const [isEditingUsd, setIsEditingUsd] = useState(false);
  const [usdInput, setUsdInput] = useState('46.36');
  const [isManualRate, setIsManualRate] = useState(false);

  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);

  const [type, setType] = useState('Витрата');
  const [category, setCategory] = useState('Реклама');
  const [amount, setAmount] = useState('');
  const [currencyMode, setCurrencyMode] = useState('UAH');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    let savedRate = null;
    try {
      const txSnap = await getDocs(collection(db, 'transactions'));
      const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (txList.length > 0) setFinances(txList);

      const settingsSnap = await getDocs(collection(db, 'settings'));
      settingsSnap.forEach(d => {
        if (d.id === 'usd_sell_rate' && d.data().value) {
          savedRate = Number(d.data().value);
          setUsdRate(savedRate);
          setUsdInput(String(savedRate));
          setIsManualRate(Boolean(d.data().isManual));
        }
      });
    } catch (e) {
      console.error('Помилка завантаження:', e);
    }

    // Якщо курс не зафіксовано вручну — підтягуємо актуальний курс продажу з ПриватБанку
    if (!savedRate) {
      fetchRealSellRate();
    }
  };

  // Отримання реального готівкового курсу продажу (sale) з ПриватБанку
  const fetchRealSellRate = async () => {
    try {
      const response = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
      const data = await response.json();
      const usdObj = data.find(item => item.ccy === 'USD');
      if (usdObj && usdObj.sale) {
        const sellRate = Number(parseFloat(usdObj.sale).toFixed(2));
        setUsdRate(sellRate);
        setUsdInput(String(sellRate));
      }
    } catch (error) {
      console.error('Не вдалося отримати курс продажу ПриватБанку:', error);
    }
  };

  const handleSaveUsdRate = async () => {
    const val = parseFloat(usdInput);
    if (!isNaN(val) && val > 0) {
      setUsdRate(val);
      setIsManualRate(true);
      try {
        await setDoc(doc(db, 'settings', 'usd_sell_rate'), { value: val, isManual: true });
      } catch (e) {
        console.error(e);
      }
    }
    setIsEditingUsd(false);
  };

  const manualTransactions = finances.map(tx => ({
    ...tx,
    amount: Number(tx.amount) || 0
  }));

  manualTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const filteredTransactions = manualTransactions.filter(tx => {
    if (!tx.date) return true;
    const txDate = new Date(tx.date);

    if (periodFilter === 'day') return tx.date === selectedDay;
    if (periodFilter === 'month') return tx.date.startsWith(selectedMonth);
    if (periodFilter === 'week' && selectedWeek) {
      const year = txDate.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDays = (txDate - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${String(weekNum).padStart(2, '0')}` === selectedWeek;
    }
    if (periodFilter === 'custom' && startDate && endDate) {
      return tx.date >= startDate && tx.date <= endDate;
    }
    return true;
  });

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    let finalAmount = Number(amount);
    let commentText = comment;

    if (currencyMode === 'USD') {
      finalAmount = Number((Number(amount) * usdRate).toFixed(2));
      commentText = `[ USD: $${amount} за курсом продажу ${usdRate} ] ${comment}`;
    }

    const newTx = {
      date,
      type,
      category,
      amount: finalAmount,
      rateUsed: usdRate,
      comment: commentText,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setFinances([{ id: docRef.id, ...newTx }, ...finances]);
      setShowAddModal(false);
      setAmount('');
      setComment('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto">
      {/* Верхня панель: курс продажу та фільтри */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-900">Курс продажу USD:</span>
          {!isEditingUsd ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950 text-sm">{usdRate} грн/$</span>
              <button onClick={() => setIsEditingUsd(true)} className="text-[10px] text-emerald-700 underline cursor-pointer">змінити</button>
              {isManualRate && (
                <button
                  onClick={fetchRealSellRate}
                  title="Підтягнути курс продажу банку"
                  className="text-[10px] text-slate-500 underline cursor-pointer ml-1"
                >
                  курс банку
                </button>
              )}
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
              <button onClick={handleSaveUsdRate} className="p-1 bg-emerald-600 text-white rounded cursor-pointer"><Check size={12} /></button>
              <button onClick={() => setIsEditingUsd(false)} className="p-1 bg-slate-200 rounded cursor-pointer"><X size={12} /></button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1"><Calendar size={14} /> Період:</span>
          {[
            { id: 'all', name: 'Увесь час' },
            { id: 'day', name: 'День' },
            { id: 'week', name: 'Тиждень' },
            { id: 'month', name: 'Місяць' },
            { id: 'custom', name: 'Свій діапазон' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPeriodFilter(f.id)}
              className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
                periodFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.name}
            </button>
          ))}

          {periodFilter === 'day' && (
            <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs" />
          )}
          {periodFilter === 'week' && (
            <input type="week" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs" />
          )}
          {periodFilter === 'month' && (
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs" />
          )}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <span>—</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>

      {/* Таблиця */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Список операцій ({filteredTransactions.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                <th className="pb-2">Дата</th>
                <th className="pb-2">Тип</th>
                <th className="pb-2">Категорія</th>
                <th className="pb-2">Опис</th>
                <th className="pb-2">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-6 text-slate-400">Немає транзакцій за цей період</td></tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 text-slate-500">{tx.date}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800">{tx.category}</td>
                    <td className="py-2.5 text-slate-600">{tx.comment || '—'}</td>
                    <td className={`py-2.5 font-bold ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Витрата' ? '-' : '+'}{Number(tx.amount).toLocaleString('uk-UA')} грн 
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(${(tx.amount / (tx.rateUsed || usdRate)).toFixed(2)})</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Додати транзакцію</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Тип</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option value="Витрата">Витрата</option>
                  <option value="Дохід">Дохід</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-medium text-slate-600">Сума</label>
                    <div className="flex gap-1 text-[10px]">
                      <button type="button" onClick={() => setCurrencyMode('UAH')} className={`px-1.5 py-0.5 rounded ${currencyMode === 'UAH' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>грн</button>
                      <button type="button" onClick={() => setCurrencyMode('USD')} className={`px-1.5 py-0.5 rounded ${currencyMode === 'USD' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>$</button>
                    </div>
                  </div>
                  <input type="number" step="any" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Дата</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Категорія</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option value="Податки">Податки</option>
                  <option value="Бухгалтер">Бухгалтер</option>
                  <option value="Зарплата">Зарплата</option>
                  <option value="Реклама">Реклама</option>
                  <option value="Коробки">Коробки</option>
                  <option value="Пильовики">Пильовики</option>
                  <option value="Інше">Інше</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Коментар</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Скасувати</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
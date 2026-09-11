import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Calendar, X } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Finances({ finances = [], setFinances = () => {} }) {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Форма створення ручної транзакції
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
      // Завантаження замовлень
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(ordersList);

      // Завантаження складу (коробки, пильовики тощо)
      const stockSnap = await getDocs(collection(db, 'stock'));
      const stockList = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStock(stockList);

      // Завантаження збережених ручних транзакцій з Firebase
      const txSnap = await getDocs(collection(db, 'transactions'));
      const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (txList.length > 0) {
        setFinances(txList);
      }
    } catch (error) {
      console.error('Помилка завантаження даних для фінансів:', error);
    }
  };

  // 1. ЗАГАЛЬНИЙ ДОХІД = Сума "Успішно" + Передплати "Відмова"
  const successfulOrdersRevenue = orders
    .filter(o => o.status === 'Успішно')
    .reduce((acc, o) => acc + (Number(o.price) || 0), 0);

  const cancelledOrdersAdvance = orders
    .filter(o => o.status === 'Відмова')
    .reduce((acc, o) => acc + (Number(o.advance) || 0), 0);

  const manualIncome = finances
    .filter(tx => tx.type === 'Дохід')
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const totalIncome = successfulOrdersRevenue + cancelledOrdersAdvance + manualIncome;

  // 2. ЗАГАЛЬНІ ВИУРАТИ = Закупка взуття + Пакування зі складу + Ручні витрати
  const shoesCost = orders
    .filter(o => o.status === 'Успішно')
    .reduce((acc, o) => acc + (Number(o.cost) || 0), 0);

  // Автоматичні витрати на пакування зі складу (Кількість * Собівартість)
  const packagingStockCost = stock
    .filter(item => {
      const name = (item.name || '').toLowerCase();
      return name.includes('коробк') || name.includes('пильовик');
    })
    .reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(item.cost) || Number(item.price) || 0;
      return acc + (qty * unitCost);
    }, 0);

  const manualExpenses = finances
    .filter(tx => tx.type === 'Витрата')
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const totalExpense = shoesCost + packagingStockCost + manualExpenses;

  // 3. ЧИСТИЙ ПРИБУТОК
  const netProfit = totalIncome - totalExpense;

  // Додавання ручної транзакції
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const newTx = {
      date,
      type,
      category: category || (type === 'Дохід' ? 'Інший дохід' : 'Реклама'),
      amount: Number(amount),
      comment,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setFinances([{ id: docRef.id, ...newTx }, ...finances]);
      setCategory('Реклама');
      setAmount('');
      setComment('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Помилка збереження транзакції:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Видалити цю транзакцію?')) {
      try {
        if (!String(id).startsWith('stock-')) {
          await deleteDoc(doc(db, 'transactions', id));
        }
        setFinances(finances.filter(tx => tx.id !== id));
      } catch (error) {
        console.error('Помилка видалення транзакції:', error);
      }
    }
  };

  // Спеціальні авто-транзакції з закупків пакування для списку
  const stockTransactions = stock
    .filter(item => {
      const name = (item.name || '').toLowerCase();
      return name.includes('коробк') || name.includes('пильовик');
    })
    .map(item => {
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(item.cost) || Number(item.price) || 0;
      return {
        id: `stock-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Склад',
        type: 'Витрата',
        category: 'Пакування складу',
        comment: `${item.name} (${qty} шт × ${unitCost} грн)`,
        amount: qty * unitCost,
        isAuto: true
      };
    });

  const allTransactions = [...stockTransactions, ...finances];

  return (
    <div className="space-y-6">
      {/* Верхня панель з кнопкою */}
      <div className="flex justify-end items-center">
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-xs transition cursor-pointer text-xs"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>

      {/* Картки показників */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Загальний дохід</span>
            <span className="bg-emerald-50 text-emerald-600 p-2 rounded-xl"><TrendingUp size={18} /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalIncome.toLocaleString()} грн</div>
          <p className="text-[10px] text-slate-400">Успішні замовлення + передплати відмов</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Загальні витрати</span>
            <span className="bg-rose-50 text-rose-600 p-2 rounded-xl"><TrendingDown size={18} /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalExpense.toLocaleString()} грн</div>
          <p className="text-[10px] text-slate-400">Закупка взуття + пакування + реклама</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Чистий прибуток</span>
            <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl"><DollarSign size={18} /></span>
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString()} грн
          </div>
          <p className="text-[10px] text-slate-400">Різниця між доходами та витратами</p>
        </div>
      </div>

      {/* Список транзакцій */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 text-center">Історія фінансових операцій</h3>
        {allTransactions.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium text-xs">Немає жодної транзакції</p>
            <p className="text-slate-400 text-[11px] mt-1">Доходи від замовлень або ручні витрати з'являться тут.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3">Дата</th>
                  <th className="pb-3">Тип</th>
                  <th className="pb-3">Категорія</th>
                  <th className="pb-3">Опис / Коментар</th>
                  <th className="pb-3">Сума</th>
                  <th className="pb-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {tx.date}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-900">{tx.category}</td>
                    <td className="py-3 text-slate-600 text-[11px]">{tx.comment || '—'}</td>
                    <td className={`py-3 font-bold text-xs ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Дохід' ? '+' : '-'}{tx.amount} грн
                    </td>
                    <td className="py-3 text-right">
                      {!tx.isAuto && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-rose-400 hover:text-rose-600 p-1 transition cursor-pointer"
                          title="Видалити"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальне вікно створення транзакції */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 relative">
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
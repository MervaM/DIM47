import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Calendar } from 'lucide-react';

export default function Finances({ finances = [], setFinances = () => {} }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState('Витрата');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Безпечно рахуємо доходи, витрати та прибуток прямо тут
  const totalIncome = finances
    .filter(tx => tx.type === 'Дохід')
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const totalExpense = finances
    .filter(tx => tx.type === 'Витрата')
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const netProfit = totalIncome - totalExpense;

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    const newTx = {
      id: Date.now(),
      date,
      type,
      category: category || (type === 'Дохід' ? 'Інший дохід' : 'Інша витрата'),
      amount: Number(amount),
      comment
    };

    setFinances([newTx, ...finances]);
    setCategory('');
    setAmount('');
    setComment('');
    setShowAddModal(false);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Видалити цю транзакцію?')) {
      setFinances(finances.filter(tx => tx.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Фінанси</h1>
          <p className="text-slate-500 text-sm">Облік доходів, витрат та розрахунок чистого прибутку</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={18} /> Додати транзакцію
        </button>
      </div>

      {/* Картки показників */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Загальний дохід</span>
            <span className="bg-emerald-50 text-emerald-600 p-2 rounded-xl"><TrendingUp size={18} /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalIncome.toLocaleString()} грн</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Загальні витрати</span>
            <span className="bg-rose-50 text-rose-600 p-2 rounded-xl"><TrendingDown size={18} /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalExpense.toLocaleString()} грн</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Чистий прибуток</span>
            <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl"><DollarSign size={18} /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{netProfit.toLocaleString()} грн</div>
        </div>
      </div>

      {/* Список транзакцій */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Історія фінансових операцій</h3>
        {finances.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm">Немає жодної транзакції</p>
            <p className="text-slate-400 text-xs mt-1">Доходи від замовлень або ручні витрати з'являться тут.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3">Дата</th>
                  <th className="pb-3">Тип</th>
                  <th className="pb-3">Категорія</th>
                  <th className="pb-3">Коментар</th>
                  <th className="pb-3">Сума</th>
                  <th className="pb-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finances.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 text-slate-500 text-xs flex items-center gap-1.5 pt-4">
                      <Calendar size={13} /> {tx.date}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-medium text-slate-900">{tx.category}</td>
                    <td className="py-3.5 text-slate-600 text-xs">{tx.comment || '—'}</td>
                    <td className={`py-3.5 font-bold ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Дохід' ? '+' : '-'}{tx.amount} грн
                    </td>
                    <td className="py-3.5 text-right">
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 transition"
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

      {/* Модальне вікно створення транзакції */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Додати транзакцію</h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Тип операції</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                >
                  <option value="Витрата">Витрата</option>
                  <option value="Дохід">Дохід</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Сума (грн)</label>
                  <input 
                    type="number" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Дата</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Категорія</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  placeholder="Напр. Матеріали, Реклама, Упаковка..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Коментар</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  rows="2"
                  placeholder="Додаткові деталі..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800"
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
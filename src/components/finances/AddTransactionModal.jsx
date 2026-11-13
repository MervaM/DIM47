import React from 'react';
import { X } from 'lucide-react';

export default function AddTransactionModal({
  showAddModal,
  setShowAddModal,
  handleAddTransaction,
  type,
  setType,
  amount,
  setAmount,
  currencyMode,
  setCurrencyMode,
  date,
  setDate,
  category,
  setCategory,
  comment,
  setComment
}) {
  if (!showAddModal) return null;

  return (
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
  );
}
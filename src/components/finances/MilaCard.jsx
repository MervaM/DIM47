import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Plus, X, Edit3, Trash2, Check, Calendar, Package } from 'lucide-react';

export default function MilaCard({ orders = [], usdRate = 46.36 }) {
  const [advances, setAdvances] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Поля для нового внеску
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');

  // Поля для редагування існуючого внеску
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editDate, setEditDate] = useState('');
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      const snap = await getDocs(collection(db, 'mila_advances'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Сортуємо за датою (від найновішого до найстарішого)
      list.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
      setAdvances(list);
    } catch (e) {
      console.error('Помилка завантаження авансів Міли:', e);
    }
  };

  // Усі замовлення Міли з дашборду
  const milaOrders = orders.filter(o => {
    const sup = (o.supplier || '').toLowerCase();
    return sup.includes('міл') || sup.includes('mila') || (!sup && Number(o.cost) > 0);
  });

  // Загальна кількість пар Міли, заведених у дашборді
  const totalPairsCount = milaOrders.reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);

  // Останній внесений аванс
  const lastAdvance = advances.length > 0 ? advances[0] : null;
  const lastAdvanceUah = lastAdvance
    ? (lastAdvance.currency === 'USD' ? Number(lastAdvance.amount) * usdRate : Number(lastAdvance.amount))
    : 0;
  const lastAdvanceUsd = lastAdvance
    ? (lastAdvance.currency === 'USD' ? Number(lastAdvance.amount) : Number(lastAdvance.amount) / usdRate)
    : 0;

  // Витрати на пошиття замовлень Міли, які припадають на період від дати останнього внеску (або всі, якщо внесків ще не було)
  const ordersSinceLastAdvance = lastAdvance
    ? milaOrders.filter(o => (o.date || '') >= lastAdvance.date)
    : milaOrders;

  const spentSinceLastUah = ordersSinceLastAdvance.reduce((sum, o) => {
    const cost = Number(o.cost) || 0;
    const isUsd = o.currency === 'USD' || o.currency === undefined; // взуття рахується в USD
    return sum + (isUsd ? cost * usdRate : cost);
  }, 0);

  // Залишок від останнього внеску (може бути від'ємним, якщо пішло в борг)
  const remainingUah = lastAdvanceUah - spentSinceLastUah;
  const remainingUsd = remainingUah / usdRate;

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newRecord = {
      amount: val,
      currency,
      date,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'mila_advances'), newRecord);
      const updated = [{ id: docRef.id, ...newRecord }, ...advances];
      updated.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
      setAdvances(updated);
      setAmount('');
      setComment('');
    } catch (e) {
      console.error('Помилка додавання авансу:', e);
    }
  };

  const startEdit = (adv, e) => {
    e.stopPropagation();
    setEditingId(adv.id);
    setEditAmount(String(adv.amount));
    setEditCurrency(adv.currency || 'USD');
    setEditDate(adv.date);
    setEditComment(adv.comment || '');
  };

  const handleSaveEdit = async (id) => {
    const val = parseFloat(editAmount);
    if (isNaN(val) || val <= 0 || !editDate) return;

    const updatedFields = {
      amount: val,
      currency: editCurrency,
      date: editDate,
      comment: editComment.trim()
    };

    try {
      await updateDoc(doc(db, 'mila_advances', id), updatedFields);
      const updatedList = advances.map(a => (a.id === id ? { ...a, ...updatedFields } : a));
      updatedList.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
      setAdvances(updatedList);
      setEditingId(null);
    } catch (e) {
      console.error('Помилка редагування авансу:', e);
    }
  };

  const handleDeleteAdvance = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'mila_advances', id));
      setAdvances(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Помилка видалення авансу:', e);
    }
  };

  return (
    <>
      {/* Картка Міли на головному екрані */}
      <div
        onClick={() => setShowModal(true)}
        className="bg-indigo-50/60 hover:bg-indigo-100/70 transition p-4 rounded-2xl border border-indigo-200 cursor-pointer flex flex-col justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
            <Users size={16} className="text-indigo-700" /> Міла
          </span>
          <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
            Пар: {totalPairsCount} шт
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 text-xs">
          <div>
            <div className="text-[11px] text-slate-500">Останній аванс:</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {lastAdvance ? (
                <>
                  ${lastAdvanceUsd.toFixed(0)}{' '}
                  <span className="text-[11px] font-normal text-slate-500">
                    ({Math.round(lastAdvanceUah).toLocaleString('uk-UA')} грн)
                  </span>
                </>
              ) : (
                '0 грн'
              )}
            </div>
            {lastAdvance && (
              <div className="text-[10px] text-slate-400">від {lastAdvance.date}</div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-500">
              {remainingUah < 0 ? 'Борг:' : 'Залишок:'}
            </div>
            <div className={`font-black text-sm mt-0.5 ${remainingUah < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {remainingUah < 0 ? '-' : ''}${Math.abs(remainingUsd).toFixed(2)}
            </div>
            <div className={`text-[10px] font-semibold ${remainingUah < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
              {remainingUah < 0 ? '-' : ''}{Math.abs(Math.round(remainingUah)).toLocaleString('uk-UA')} грн
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно історії внесків та деталей по Мілі */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] flex flex-col"
          >
            {/* Шапка модалки */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Виробник: Міла
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                    <Package size={12} /> {totalPairsCount} пар у дашборді
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Система авансів • Курс розрахунку: {usdRate} грн/$
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Зведення по останньому авансу */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Останній внесок</span>
                <span className="font-bold text-slate-900">${lastAdvanceUsd.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block">{Math.round(lastAdvanceUah)} грн</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Пошито з цієї дати</span>
                <span className="font-bold text-slate-900">${(spentSinceLastUah / usdRate).toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block">{Math.round(spentSinceLastUah)} грн</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">{remainingUah < 0 ? 'Борг' : 'Залишок'}</span>
                <span className={`font-black ${remainingUah < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {remainingUah < 0 ? '-' : ''}${Math.abs(remainingUsd).toFixed(2)}
                </span>
                <span className={`text-[10px] block ${remainingUah < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {remainingUah < 0 ? '-' : ''}{Math.abs(Math.round(remainingUah))} грн
                </span>
              </div>
            </div>

            {/* Форма додавання нового внеску (можна заднім числом) */}
            <form onSubmit={handleAddAdvance} className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-2.5 text-xs">
              <div className="font-bold text-indigo-950 text-[11px]">Додати аванс (внесок)</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-slate-600">Сума</label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${currency === 'USD' ? 'bg-slate-900 text-white' : 'bg-white border'}`}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('UAH')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${currency === 'UAH' ? 'bg-slate-900 text-white' : 'bg-white border'}`}
                      >
                        грн
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Дата внеску</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Примітка (напр. переказ на карту)..."
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Додати
                </button>
              </div>
            </form>

            {/* Список всіх транзакцій (внесків) з можливістю редагування дати та суми */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-xs font-bold text-slate-700">Історія внесків ({advances.length})</div>
              {advances.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Ще не внесено жодного авансу.</p>
              ) : (
                advances.map((adv, index) => {
                  const isEditing = editingId === adv.id;
                  const advUsd = adv.currency === 'USD' ? Number(adv.amount) : Number(adv.amount) / usdRate;
                  const advUah = adv.currency === 'USD' ? Number(adv.amount) * usdRate : Number(adv.amount);

                  return (
                    <div
                      key={adv.id}
                      className={`p-3 rounded-xl border text-xs ${
                        index === 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-100'
                      }`}
                    >
                      {!isEditing ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" /> {adv.date}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  Останній
                                </span>
                              )}
                            </div>
                            {adv.comment && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{adv.comment}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-black text-emerald-700">
                                +${advUsd.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {Math.round(advUah).toLocaleString('uk-UA')} грн
                              </div>
                            </div>
                            <button
                              onClick={e => startEdit(adv, e)}
                              title="Змінити дату або суму"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={e => handleDeleteAdvance(adv.id, e)}
                              title="Видалити"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="px-2 py-1 border rounded-lg text-xs"
                            />
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="any"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className="w-full px-2 py-1 border rounded-lg font-bold text-xs"
                              />
                              <select
                                value={editCurrency}
                                onChange={e => setEditCurrency(e.target.value)}
                                className="px-1.5 py-1 border rounded-lg text-xs bg-slate-50"
                              >
                                <option value="USD">$</option>
                                <option value="UAH">грн</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editComment}
                              onChange={e => setEditComment(e.target.value)}
                              placeholder="Примітка"
                              className="flex-1 px-2 py-1 border rounded-lg text-xs"
                            />
                            <button
                              onClick={() => handleSaveEdit(adv.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={12} /> Зберегти
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
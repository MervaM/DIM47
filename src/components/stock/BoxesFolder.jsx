import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, ImageIcon, ShoppingBag, Send, Clock } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function BoxesFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    sizeBox: 'Великі',
    cost: '',
    image: '',
    myStockQty: '',
    milaQty: '',
    valeriyQty: ''
  });

  // Модалка нової закупки (поповнення)
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Модалка відправки виробнику (Мілі / Валерію)
  const [sendItem, setSendItem] = useState(null);
  const [sendTarget, setSendTarget] = useState('Міла');
  const [sendQty, setSendQty] = useState('');
  const [sendDateTime, setSendDateTime] = useState(() => new Date().toISOString().slice(0, 16));

  const boxesList = stock.filter(item => item.folderId === 'boxes');

  const parsedMyStock = Number(formData.myStockQty) || 0;
  const parsedMila = Number(formData.milaQty) || 0;
  const parsedValeriy = Number(formData.valeriyQty) || 0;
  const calculatedTotal = parsedMyStock + parsedMila + parsedValeriy;

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      const mila = item.suppliers?.['Міла'] || 0;
      const valeriy = item.suppliers?.['Валерій'] || 0;
      const total = item.quantity || 0;
      const myStock = item.suppliers?.['Основний склад'] !== undefined 
        ? item.suppliers['Основний склад'] 
        : Math.max(0, total - mila - valeriy);

      setFormData({
        sizeBox: item.sizeBox || 'Великі',
        cost: item.cost || '',
        image: item.image || '',
        myStockQty: myStock,
        milaQty: mila,
        valeriyQty: valeriy
      });
    } else {
      setEditingItem(null);
      setFormData({
        sizeBox: 'Великі',
        cost: '',
        image: '',
        myStockQty: '',
        milaQty: '',
        valeriyQty: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Збереження при створенні або редагуванні
  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemId = editingItem ? editingItem.id : Date.now().toString();
    const unitCost = Number(formData.cost) || 0;

    const initialHistory = editingItem?.purchasesHistory || (
      calculatedTotal > 0 
        ? [{
            id: Date.now(),
            qty: calculatedTotal,
            pricePerUnit: unitCost,
            totalSum: +(calculatedTotal * unitCost).toFixed(2),
            date: new Date().toISOString().split('T')[0],
            note: 'Початкова закупка'
          }]
        : []
    );

    const newItem = {
      id: itemId,
      folderId: 'boxes',
      name: `Коробки (${formData.sizeBox})`,
      sizeBox: formData.sizeBox,
      quantity: calculatedTotal,
      cost: unitCost,
      image: formData.image,
      suppliers: {
        'Основний склад': parsedMyStock,
        'Міла': parsedMila,
        'Валерій': parsedValeriy
      },
      purchasesHistory: initialHistory,
      shipmentsHistory: editingItem?.shipmentsHistory || []
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      onAddItem(newItem);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Помилка збереження коробок:', err);
    }
  };

  // Додавання нової закупки
  const handleAddPurchase = async (e) => {
    e.preventDefault();
    const qty = Number(purchaseQty);
    const price = Number(purchasePricePerUnit);
    if (!purchaseItem || isNaN(qty) || qty <= 0) return;

    const currentSuppliers = purchaseItem.suppliers || {
      'Основний склад': purchaseItem.quantity || 0,
      'Міла': 0,
      'Валерій': 0
    };

    const newMyStock = (currentSuppliers['Основний склад'] || 0) + qty;
    const newTotal = (purchaseItem.quantity || 0) + qty;

    const newPurchaseRecord = {
      id: Date.now(),
      qty,
      pricePerUnit: price || purchaseItem.cost || 0,
      totalSum: +(qty * (price || purchaseItem.cost || 0)).toFixed(2),
      date: purchaseDate,
      note: 'Дозакупка'
    };

    const updatedItem = {
      ...purchaseItem,
      quantity: newTotal,
      cost: price > 0 ? price : purchaseItem.cost,
      suppliers: {
        ...currentSuppliers,
        'Основний склад': newMyStock
      },
      purchasesHistory: [newPurchaseRecord, ...(purchaseItem.purchasesHistory || [])]
    };

    try {
      const docRef = doc(db, 'stock', String(purchaseItem.id));
      await setDoc(docRef, updatedItem, { merge: true });
      onAddItem(updatedItem);
      setPurchaseItem(null);
      setPurchaseQty('');
      setPurchasePricePerUnit('');
    } catch (err) {
      console.error('Помилка додавання закупки:', err);
    }
  };

  // Відправка виробнику (Мілі / Валерію)
  const handleSendToManufacturer = async (e) => {
    e.preventDefault();
    const qty = Number(sendQty);
    if (!sendItem || isNaN(qty) || qty <= 0) return;

    const currentSuppliers = sendItem.suppliers || {
      'Основний склад': sendItem.quantity || 0,
      'Міла': 0,
      'Валерій': 0
    };

    const myStockVal = currentSuppliers['Основний склад'] || 0;
    if (qty > myStockVal) {
      alert(`На твоєму складі лише ${myStockVal} шт, неможливо відправити більше!`);
      return;
    }

    const newShipmentRecord = {
      id: Date.now(),
      target: sendTarget,
      qty,
      date: sendDateTime ? sendDateTime.replace('T', ' ') : new Date().toLocaleString()
    };

    const updatedItem = {
      ...sendItem,
      suppliers: {
        ...currentSuppliers,
        'Основний склад': myStockVal - qty,
        [sendTarget]: (currentSuppliers[sendTarget] || 0) + qty
      },
      shipmentsHistory: [newShipmentRecord, ...(sendItem.shipmentsHistory || [])]
    };

    try {
      const docRef = doc(db, 'stock', String(sendItem.id));
      await setDoc(docRef, updatedItem, { merge: true });
      onAddItem(updatedItem);
      setSendItem(null);
      setSendQty('');
    } catch (err) {
      console.error('Помилка відправки виробнику:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-6 py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus size={16} /> Додати коробки
        </button>
      </div>

      <div className="space-y-4">
        {boxesList.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">Ще немає доданих коробок</p>
        ) : (
          boxesList.map(item => {
            const total = item.quantity || 0;
            const mila = item.suppliers?.['Міла'] || 0;
            const valeriy = item.suppliers?.['Валерій'] || 0;
            const myStock = item.suppliers?.['Основний склад'] !== undefined 
              ? item.suppliers['Основний склад'] 
              : Math.max(0, total - mila - valeriy);
            const purchases = item.purchasesHistory || [];
            const shipments = item.shipmentsHistory || [];

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:border-slate-200 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm">
                    Коробки ({item.sizeBox})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPurchaseItem(item);
                        setPurchaseQty('');
                        setPurchasePricePerUnit(item.cost || '');
                        setPurchaseDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ShoppingBag size={13} /> + Закупка
                    </button>
                    <button
                      onClick={() => {
                        setSendItem(item);
                        setSendTarget('Міла');
                        setSendQty('');
                        setSendDateTime(new Date().toISOString().slice(0, 16));
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Send size={13} /> Відправити
                    </button>
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] text-slate-400 flex-shrink-0">
                      Фото
                    </div>
                  )}
                  <div className="flex flex-col text-xs space-y-1.5">
                    <div className="text-slate-600">
                      Загальна кількість: <span className="font-extrabold text-slate-900">{total} шт</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                        Мій склад: {myStock} шт
                      </span>
                      <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                        Міла: {mila} шт
                      </span>
                      <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-100">
                        Валерій: {valeriy} шт
                      </span>
                    </div>

                    {item.cost > 0 && (
                      <div className="text-slate-500 text-[10px]">
                        Поточна собівартість: <span className="font-semibold text-slate-800">{item.cost} грн/шт</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Історія відправок виробникам */}
                {shipments.length > 0 && (
                  <div className="mt-1 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-950">Відправки виробникам:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {shipments.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-indigo-50/50 px-2.5 py-1.5 rounded-lg text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700">→ {s.target}</span>
                            <span className="font-extrabold text-slate-900">{s.qty} шт</span>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} /> {s.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Історія закупок цієї коробки */}
                {purchases.length > 0 && (
                  <div className="mt-1 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600">Історія закупок:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {purchases.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700">+{p.qty} шт</span>
                            <span className="text-slate-500">по {p.pricePerUnit} грн</span>
                            {p.note && <span className="text-[10px] text-slate-400">({p.note})</span>}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-semibold text-slate-700">{p.totalSum} грн</span>
                            <span className="text-[10px] flex items-center gap-0.5"><Clock size={10} /> {p.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Модалка створення / редагування */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-bold text-slate-900 text-center">
              {editingItem ? 'Редагувати коробку' : 'Початкова закупка коробок'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Розмір коробки</label>
                <select
                  value={formData.sizeBox}
                  onChange={(e) => setFormData(prev => ({ ...prev, sizeBox: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Великі">Великі</option>
                  <option value="Середні">Середні</option>
                  <option value="Малі">Малі</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-950 block text-center">
                  {editingItem ? 'Розподіл за складами (шт):' : 'Кількість куплених штук (початково):'}
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 text-center">Мій склад</label>
                    <input
                      type="number"
                      value={formData.myStockQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, myStockQty: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Міла</label>
                    <input
                      type="number"
                      value={formData.milaQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, milaQty: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Валерій</label>
                    <input
                      type="number"
                      value={formData.valeriyQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, valeriyQty: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100 flex justify-between items-center px-1 text-[11px]">
                  <span className="text-slate-600 font-bold">Разом на всіх складах:</span>
                  <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {calculatedTotal} шт
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Собівартість 1 шт (грн)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Напр. 115.56"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Фото коробки</label>
                <div className="flex items-center gap-3">
                  {formData.image && (
                    <img src={formData.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer transition">
                    <ImageIcon size={16} /> Обрати фото
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка нової закупки (поповнення) */}
      {purchaseItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Нова закупка: Коробки ({purchaseItem.sizeBox})</h3>
              <button onClick={() => setPurchaseItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPurchase} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кількість куплених коробок (шт):</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={purchaseQty} 
                  onChange={e => setPurchaseQty(e.target.value)}
                  placeholder="Наприклад: 100" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Ціна за 1 шт (грн):</label>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  required
                  value={purchasePricePerUnit} 
                  onChange={e => setPurchasePricePerUnit(e.target.value)}
                  placeholder="Наприклад: 115.56" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Дата закупки:</label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              {purchaseQty > 0 && purchasePricePerUnit > 0 && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Загальна сума партії:</span>
                  <span className="font-black text-emerald-900">{(Number(purchaseQty) * Number(purchasePricePerUnit)).toFixed(2)} грн</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setPurchaseItem(null)} 
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-emerald-700"
                >
                  Додати на склад
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка відправки виробнику */}
      {sendItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Відправити виробнику: Коробки ({sendItem.sizeBox})</h3>
              <button onClick={() => setSendItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendToManufacturer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кому відправляємо:</label>
                <select 
                  value={sendTarget} 
                  onChange={e => setSendTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Міла">Міла</option>
                  <option value="Валерій">Валерій</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кількість (шт):</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={sendQty} 
                  onChange={e => setSendQty(e.target.value)}
                  placeholder="Наприклад: 25" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Дата і час відправки:</label>
                <input 
                  type="datetime-local" 
                  value={sendDateTime} 
                  onChange={e => setSendDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setSendItem(null)} 
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Відправити
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
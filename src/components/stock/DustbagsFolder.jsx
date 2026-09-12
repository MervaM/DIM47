import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DustbagsFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {} }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formSizeBox, setFormSizeBox] = useState('Великі');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState('');
  
  // Кількісні поля
  const [totalQty, setTotalQty] = useState('');
  const [milaQty, setMilaQty] = useState('');
  const [valeriyQty, setValeriyQty] = useState('');

  // Обчислюємо скільки залишається на вашому складі в реальному часі
  const parsedTotal = Number(totalQty) || 0;
  const parsedMila = Number(milaQty) || 0;
  const parsedValeriy = Number(valeriyQty) || 0;
  const myStockQty = Math.max(0, parsedTotal - parsedMila - parsedValeriy);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormSizeBox('Великі');
    setFormPrice('');
    setFormImage('');
    setTotalQty('');
    setMilaQty('');
    setValeriyQty('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormSizeBox(item.sizeBox || 'Великі');
    setFormPrice(item.price !== '' && item.price !== undefined ? item.price : '');
    setFormImage(item.image || '');
    
    const total = item.quantity || 0;
    const mila = item.suppliers?.['Міла'] || 0;
    const valeriy = item.suppliers?.['Валерій'] || 0;

    setTotalQty(total);
    setMilaQty(mila);
    setValeriyQty(valeriy);
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'dustbags',
      name: `Пильовик (${formSizeBox})`,
      sizeBox: formSizeBox,
      price: formPrice !== '' ? Number(formPrice) : '',
      quantity: parsedTotal, // Загальна кількість
      image: formImage,
      suppliers: {
        'Основний склад': myStockQty,
        'Міла': parsedMila,
        'Валерій': parsedValeriy
      }
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      onAddItem(newItem);
      setShowModal(false);
    } catch (err) {
      console.error('Помилка збереження пильовиків:', err);
    }
  };

  const dustbagsList = stock.filter(item => item.folderId === 'dustbags');

  return (
    <div className="space-y-4">
      <button 
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
      >
        <Plus size={16} /> Додати пильовики
      </button>

      {/* Список картка пильовиків */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dustbagsList.map(item => {
          const total = item.quantity || 0;
          const mila = item.suppliers?.['Міла'] || 0;
          const valeriy = item.suppliers?.['Валерій'] || 0;
          const myStock = item.suppliers?.['Основний склад'] !== undefined 
            ? item.suppliers['Основний склад'] 
            : Math.max(0, total - mila - valeriy);

          return (
            <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5 relative">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-slate-900 text-sm">Пильовик ({item.sizeBox || 'Великі'})</strong>
                <div className="flex items-center gap-0.5">
                  <button onClick={(e) => handleOpenEditModal(item, e)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"><Edit3 size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                {item.image ? (
                  <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500 flex-shrink-0">Фото</div>
                )}
                <div className="flex-1 flex flex-col text-xs gap-1">
                  <span className="text-slate-600">Загальна кількість: <span className="font-extrabold text-slate-900">{total} шт</span></span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      Мій склад: {myStock} шт
                    </span>
                    <span className="bg-indigo-50 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                      Міла: {mila} шт
                    </span>
                    <span className="bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-100">
                      Валерій: {valeriy} шт
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Модальне вікно редагування */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Редагувати пильовики' : 'Додати пильовики'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Розмір</label>
                <select value={formSizeBox} onChange={e => setFormSizeBox(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 focus:outline-none">
                  <option value="Великі">Великі</option>
                  <option value="Малі">Малі</option>
                </select>
              </div>

              {/* Поле: Загальна кількість */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-center">Загальна кількість (шт)</label>
                <input
                  type="number"
                  required
                  value={totalQty}
                  onChange={(e) => setTotalQty(e.target.value)}
                  placeholder="Введіть загальну кількість"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 text-center text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Блок з виробниками та відніманням */}
              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-950 block text-center">Кількість у виробників (шт):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Міла</label>
                    <input
                      type="number"
                      value={milaQty}
                      onChange={(e) => setMilaQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Валерій</label>
                    <input
                      type="number"
                      value={valeriyQty}
                      onChange={(e) => setValeriyQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Автоматичний залишок на вашому складі */}
                <div className="pt-2 border-t border-indigo-100 flex justify-between items-center px-1 text-[11px]">
                  <span className="text-slate-600 font-medium">Залишок на моєму складі:</span>
                  <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {myStockQty} шт
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Вартість 1 шт (грн)</label>
                <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-center" placeholder="0" />
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1 text-center">Фото</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs w-full" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-slate-600 cursor-pointer">Скасувати</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer hover:bg-slate-800">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
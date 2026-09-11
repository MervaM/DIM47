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
  const [milaQty, setMilaQty] = useState('');
  const [valeriyQty, setValeriyQty] = useState('');

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormSizeBox('Великі');
    setFormPrice('');
    setFormImage('');
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
    setMilaQty(item.suppliers?.['Міла'] !== undefined ? item.suppliers['Міла'] : (item.quantity || 0));
    setValeriyQty(item.suppliers?.['Валерій'] !== undefined ? item.suppliers['Валерій'] : 0);
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
    const mQty = Number(milaQty) || 0;
    const vQty = Number(valeriyQty) || 0;
    const totalQty = mQty + vQty;

    const newItem = {
      id: itemId,
      folderId: 'dustbags',
      name: `Пильовик (${formSizeBox})`,
      sizeBox: formSizeBox,
      price: formPrice !== '' ? Number(formPrice) : '',
      quantity: totalQty,
      image: formImage,
      suppliers: {
        'Міла': mQty,
        'Валерій': vQty
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

      {dustbagsList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Немає пильовиків.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dustbagsList.map(item => {
            const displayName = `Пильовик (${item.sizeBox || 'Великі'})`;
            const mQty = item.suppliers?.['Міла'] ?? item.quantity ?? 0;
            const vQty = item.suppliers?.['Валерій'] ?? 0;
            const totalQty = (Number(mQty) || 0) + (Number(vQty) || 0);

            return (
              <div 
                key={item.id} 
                className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col gap-2.5 transition relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayName}
                  </strong>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button 
                      onClick={(e) => handleOpenEditModal(item, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                      title="Редагувати"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Видалити"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500 flex-shrink-0">Фото</div>
                  )}
                  <div className="flex-1 flex flex-col text-xs gap-1 min-w-0">
                    <span className="text-slate-600">Загальна кількість: <span className="font-bold text-slate-900">{totalQty} шт</span></span>
                    
                    <div className="flex gap-1.5 text-[10px]">
                      <span className="bg-indigo-50 text-indigo-800 font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                        Міла: {mQty} шт
                      </span>
                      <span className="bg-purple-50 text-purple-800 font-semibold px-1.5 py-0.5 rounded border border-purple-100">
                        Валерій: {vQty} шт
                      </span>
                    </div>

                    {item.price !== undefined && item.price !== '' && (
                      <span className="text-slate-500 text-[10px]">Собівартість: <span className="font-medium text-slate-900">{item.price} грн</span></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <label className="block font-medium text-slate-500 mb-1">Розмір</label>
                <select value={formSizeBox} onChange={e => setFormSizeBox(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white">
                  <option value="Великі">Великі</option>
                  <option value="Малі">Малі</option>
                </select>
              </div>

              <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-900 block">Кількість у виробників (шт):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Міла</label>
                    <input
                      type="number"
                      value={milaQty}
                      onChange={(e) => setMilaQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Валерій</label>
                    <input
                      type="number"
                      value={valeriyQty}
                      onChange={(e) => setValeriyQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1">Вартість 1 шт (грн)</label>
                <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl" placeholder="0" />
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1">Фото</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-semibold text-slate-600 cursor-pointer">Скасувати</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
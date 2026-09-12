import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, ImageIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function BoxesFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    sizeBox: 'Великі',
    cost: '',
    image: '',
    totalQty: '',
    milaQty: '',
    valeriyQty: ''
  });

  const boxesList = stock.filter(item => item.folderId === 'boxes');

  // Обчислюємо скільки залишається на вашому складі в реальному часі
  const parsedTotal = Number(formData.totalQty) || 0;
  const parsedMila = Number(formData.milaQty) || 0;
  const parsedValeriy = Number(formData.valeriyQty) || 0;
  const myStockQty = Math.max(0, parsedTotal - parsedMila - parsedValeriy);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      const total = item.quantity || 0;
      const mila = item.suppliers?.['Міла'] || 0;
      const valeriy = item.suppliers?.['Валерій'] || 0;

      setFormData({
        sizeBox: item.sizeBox || 'Великі',
        cost: item.cost || '',
        image: item.image || '',
        totalQty: total,
        milaQty: mila,
        valeriyQty: valeriy
      });
    } else {
      setEditingItem(null);
      setFormData({
        sizeBox: 'Великі',
        cost: '',
        image: '',
        totalQty: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemId = editingItem ? editingItem.id : Date.now().toString();

    const newItem = {
      id: itemId,
      folderId: 'boxes',
      name: `Коробки (${formData.sizeBox})`,
      sizeBox: formData.sizeBox,
      quantity: parsedTotal, // Загальна кількість
      cost: Number(formData.cost) || 0,
      image: formData.image,
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
      setIsModalOpen(false);
    } catch (err) {
      console.error('Помилка збереження коробок:', err);
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

      <div className="space-y-3">
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

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:border-slate-200 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    Коробки ({item.sizeBox})
                  </div>
                  <div className="flex items-center gap-0.5">
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
                    
                    {/* Розподіл залишків */}
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
                        Собівартість: <span className="font-semibold text-slate-800">{item.cost} грн</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальне вікно редагування / створення */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-bold text-slate-900">
              {editingItem ? 'Редагувати коробку' : 'Додати коробку'}
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

              {/* Поле: Загальна кількість */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-center">Загальна кількість (шт)</label>
                <input
                  type="number"
                  required
                  value={formData.totalQty}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalQty: e.target.value }))}
                  placeholder="Введіть загальну кількість"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 text-center text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Блок виробників та розрахунку залишку */}
              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-950 block text-center">Кількість у виробників (шт):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Міла</label>
                    <input
                      type="number"
                      value={formData.milaQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, milaQty: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-center">Валерій</label>
                    <input
                      type="number"
                      value={formData.valeriyQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, valeriyQty: e.target.value }))}
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
                <label className="block font-medium text-slate-500 mb-1 text-center">Собівартість (грн)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Введіть собівартість"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 text-center"
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
    </div>
  );
}
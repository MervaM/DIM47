import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function BoxesFolder({ stock, onAddItem, onDeleteItem }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sizeBox: 'Великі',
    quantity: '',
    cost: '',
    image: ''
  });

  const boxesList = stock.filter(item => item.folderId === 'boxes');

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        sizeBox: item.sizeBox || 'Великі',
        quantity: item.quantity || '',
        cost: item.cost || '',
        image: item.image || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        sizeBox: 'Великі',
        quantity: '',
        cost: '',
        image: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      folderId: 'boxes',
      name: `Коробки (${formData.sizeBox})`,
      sizeBox: formData.sizeBox,
      quantity: Number(formData.quantity) || 0,
      cost: Number(formData.cost) || 0,
      image: formData.image
    };
    onAddItem(newItem);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Кнопка додавання на всю ширину, по центру */}
      <div className="flex justify-center">
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-6 py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus size={16} /> Додати коробки
        </button>
      </div>

      {/* Список карток коробок */}
      <div className="space-y-3">
        {boxesList.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">Ще немає доданих коробок</p>
        ) : (
          boxesList.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:border-slate-200 transition"
            >
              {/* Верхній рядок: назва зліва, іконки справа в один рядок із мінімальним відступом */}
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

              {/* Основний блок: фото зліва, дані праворуч */}
              <div className="flex items-center gap-4">
                {item.image ? (
                  <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-100 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] text-slate-400 flex-shrink-0">
                    Фото
                  </div>
                )}
                <div className="flex flex-col text-xs space-y-1">
                  <div className="text-slate-600">
                    Кількість: <span className="font-semibold text-slate-900">{item.quantity} шт</span>
                  </div>
                  {item.cost > 0 && (
                    <div className="text-slate-600">
                      Собівартість: <span className="font-semibold text-slate-900">{item.cost} грн</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальне вікно додавання / редагування */}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Розмір коробки</label>
                <select
                  value={formData.sizeBox}
                  onChange={(e) => setFormData(prev => ({ ...prev, sizeBox: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  <option value="Великі">Великі</option>
                  <option value="Середні">Середні</option>
                  <option value="Малі">Малі</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Кількість (шт)</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Введіть кількість"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Собівартість (грн)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Введіть собівартість"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Фото коробки</label>
                <div className="flex items-center gap-3">
                  {formData.image && (
                    <img src={formData.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer transition">
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
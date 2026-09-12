import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ShoesFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {}, onSelectDetails }) {
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  
  // Виробники у вигляді масиву (чекбокси)
  const [formSuppliers, setFormSuppliers] = useState(['Міла']);
  const [formImage, setFormImage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('усі');

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setFormCost('');
    setFormSuppliers(['Міла']);
    setFormImage('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name || '');
    setFormPrice(item.price !== undefined ? item.price : '');
    setFormCost(item.cost !== undefined ? item.cost : '');
    
    // Підтримка як старого поля supplier, так і нового масиву suppliers
    let initialSuppliers = ['Міла'];
    if (Array.isArray(item.suppliers)) {
      initialSuppliers = item.suppliers;
    } else if (item.supplier) {
      initialSuppliers = [item.supplier];
    }
    setFormSuppliers(initialSuppliers);
    setFormImage(item.image || '');
    setShowModal(true);
  };

  const handleSupplierToggle = (supplierName) => {
    setFormSuppliers(prev => {
      if (prev.includes(supplierName)) {
        // Залишаємо хоча б одного виробника, щоб не було пустого масиву
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== supplierName);
      } else {
        return [...prev, supplierName];
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          setFormImage(canvas.toDataURL('image/jpeg', 0.75));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Введіть назву моделі!");
      return;
    }

    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'shoes',
      name: formName,
      price: formPrice !== '' ? Number(formPrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      suppliers: formSuppliers,
      supplier: formSuppliers[0] || 'Міла', // Для зворотної сумісності
      image: formImage
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      onAddItem(newItem);
      setShowModal(false);
    } catch (error) {
      console.error("Помилка збереження моделі:", error);
      alert("Помилка збереження: " + error.message);
    }
  };

  const shoesList = stock.filter(item => item.folderId === 'shoes' || (!item.folderId && !item.isColor));

  const filteredShoes = shoesList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let itemSuppliers = ['Міла'];
    if (Array.isArray(item.suppliers)) {
      itemSuppliers = item.suppliers;
    } else if (item.supplier) {
      itemSuppliers = [item.supplier];
    }

    const matchesSupplier = selectedSupplierFilter === 'усі' || itemSuppliers.includes(selectedSupplierFilter);
    return matchesSearch && matchesSupplier;
  });

  return (
    <div className="space-y-4 touch-manipulation">
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
      >
        <Plus size={16} /> Додати модель взуття
      </button>

      {/* Панель пошуку та фільтрації */}
      <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук моделі..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Виробник:</span>
          {['усі', 'Міла', 'Валерій'].map((sup) => (
            <button
              key={sup}
              type="button"
              onClick={() => setSelectedSupplierFilter(sup)}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedSupplierFilter === sup 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sup === 'усі' ? 'Усі' : sup}
            </button>
          ))}
        </div>
      </div>

      {/* Список моделей взуття */}
      {filteredShoes.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Моделей не знайдено.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredShoes.map(item => {
            const itemSuppliers = Array.isArray(item.suppliers) ? item.suppliers : [item.supplier || 'Міла'];

            return (
              <div 
                key={item.id} 
                onClick={() => onSelectDetails && onSelectDetails(item)}
                className="p-3 bg-white hover:bg-slate-50 cursor-pointer rounded-2xl border border-slate-100 flex items-center justify-between gap-3 transition shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">
                      Фото
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <strong className="text-slate-900 text-xs truncate">{item.name}</strong>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {item.price !== '' && <span className="text-xs font-bold text-emerald-700 mr-1">{item.price} грн</span>}
                      {itemSuppliers.map(sup => (
                        <span key={sup} className="bg-indigo-50 text-indigo-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                          {sup}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => handleOpenEditModal(item, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модалка додання/редагування */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Редагувати модель' : 'Додати нову модель'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Назва моделі</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-slate-900" 
                  placeholder="Напр. Лофери Класік" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Ціна продажу (грн)</label>
                  <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl" placeholder="0" />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Закупка (грн)</label>
                  <input type="number" value={formCost} onChange={e => setFormCost(e.target.value)} className="w-full px-3 py-2 border rounded-xl" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1.5">Виробник (можуть шити):</label>
                <div className="flex gap-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {['Міла', 'Валерій'].map(sup => (
                    <label key={sup} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input 
                        type="checkbox"
                        checked={formSuppliers.includes(sup)}
                        onChange={() => handleSupplierToggle(sup)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                      {sup}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Фото моделі</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="w-full text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl text-slate-600 bg-slate-50">Скасувати</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, Search, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AvailabilityFolder({ stock, onAddItem, onDeleteItem, onSelectDetails }) {
  const imageInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formName, setFormName] = useState('');
  const [formSeason, setFormSeason] = useState('Демісезон');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formLining, setFormLining] = useState('');
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStatus, setFormStatus] = useState('зразок');
  const [formImage, setFormImage] = useState('');

  const seasonsList = ['Осінь', 'Зима', 'Демісезон', 'Літо'];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSeason('Демісезон');
    setFormSize('');
    setFormColor('');
    setFormMaterial('');
    setFormLining('');
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormCost('');
    setFormStatus('зразок');
    setFormImage('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name || '');
    setFormSeason(item.season || 'Демісезон');
    setFormSize(item.size || '');
    setFormColor(item.color || '');
    setFormMaterial(item.material || '');
    setFormLining(item.lining || '');
    setFormSole(item.sole || '');
    setFormPrice(item.price !== undefined ? item.price : '');
    setFormSalePrice(item.salePrice !== undefined ? item.salePrice : '');
    setFormCost(item.cost !== undefined ? item.cost : '');
    setFormStatus(item.status || 'зразок');
    setFormImage(item.image || '');
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
    if (!formName.trim()) {
      alert("Введіть назву моделі!");
      return;
    }

    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'availability', // Суворе віднесення до папки Наявність
      name: formName,
      season: formSeason,
      size: formSize,
      color: formColor,
      material: formMaterial,
      lining: formLining,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      status: formStatus,
      image: formImage
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });

      onAddItem(newItem);
      setShowModal(false);
    } catch (error) {
      console.error("Помилка збереження у Firebase:", error);
      alert("Помилка збереження: " + error.message);
    }
  };

  // Фільтруємо ЛИШЕ товари папки 'availability'
  const availabilityList = stock.filter(item => {
    if (item.folderId !== 'availability') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (item.name || '').toLowerCase().includes(q) ||
             (item.color || '').toLowerCase().includes(q) ||
             (item.size || '').toLowerCase().includes(q) ||
             (item.material || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 touch-manipulation">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Товари в наявності</h3>
        <button 
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus size={16} /> Додати в наявність
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Пошук по назві, кольору, розміру..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
        />
      </div>

      {availabilityList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">У цій категорії поки немає товарів.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availabilityList.map(item => (
            <div 
              key={item.id} 
              onClick={() => onSelectDetails && onSelectDetails(item)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 flex flex-col gap-2 transition relative"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </strong>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => handleOpenEditModal(item, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                    title="Редагувати"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    type="button"
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
                  <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500 flex-shrink-0">Фото</div>
                )}
                
                <div className="flex-1 flex flex-col text-xs gap-0.5 min-w-0">
                  {item.size && <span className="text-slate-600">Розмір: <span className="font-semibold text-slate-900">{item.size}</span></span>}
                  {item.color && <span className="text-slate-600">Колір: <span className="font-semibold text-slate-900">{item.color}</span></span>}
                  {item.material && <span className="text-slate-600">Матеріал: <span className="font-semibold text-slate-900">{item.material}</span></span>}
                  {item.price !== undefined && item.price !== '' && (
                    <span className="text-slate-600">Ціна: <span className="font-bold text-emerald-700">{item.price} грн</span></span>
                  )}
                  {item.status && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase w-max mt-1 ${
                      item.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО ДОДАВАННЯ/РЕДАГУВАННЯ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[92vh] overflow-y-auto flex flex-col gap-4 my-auto relative"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? 'Редагувати товар у наявності' : 'Додати в наявність'}
              </h2>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Назва моделі</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-slate-900" 
                  placeholder="Напр. Черевики 01" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сезон</label>
                <select
                  value={formSeason}
                  onChange={e => setFormSeason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white cursor-pointer"
                >
                  {seasonsList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Розмір</label>
                  <input type="text" value={formSize} onChange={e => setFormSize(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. 39" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Колір</label>
                  <input type="text" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. чорний" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Матеріал</label>
                <input type="text" value={formMaterial} onChange={e => setFormMaterial(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. шкіра" />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Вид утеплювача</label>
                  <div className="flex gap-2">
                    {['Байка', 'Хутро'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormLining(formLining === type ? '' : type)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                          formLining === type 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Підошва</label>
                  <input type="text" value={formSole} onChange={e => setFormSole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" placeholder="Напр. трактор" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Статус товару</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white cursor-pointer">
                  <option value="зразок">Зразок</option>
                  <option value="відмова">Відмова</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ціна продажу (грн)</label>
                  <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-emerald-700" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Акційна ціна (грн)</label>
                  <input type="number" value={formSalePrice} onChange={e => setFormSalePrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Закупка (грн)</label>
                <input type="number" value={formCost} onChange={e => setFormCost(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800" placeholder="0" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Фото товару</label>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="text-xs w-full" />
                {formImage && <p className="text-[10px] text-emerald-600 mt-1">✓ Зображення завантажено</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-800"
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
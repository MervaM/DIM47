import React, { useState } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';

export default function AvailabilityFolder({ stock, onAddItem, onDeleteItem, onSelectDetails }) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formName, setFormName] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStatus, setFormStatus] = useState('відмова');
  const [formImage, setFormImage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onAddItem({
      id: Date.now(),
      folderId: 'availability',
      name: formName || 'Товар у наявності',
      size: formSize,
      color: formColor,
      material: formMaterial,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      status: formStatus,
      image: formImage
    });
    setShowModal(false);
    setFormName(''); setFormSize(''); setFormColor(''); setFormMaterial(''); setFormSole(''); setFormPrice(''); setFormSalePrice(''); setFormCost(''); setFormImage('');
  };

  const availabilityList = stock.filter(item => {
    if (item.folderId !== 'shoes' && item.folderId !== 'availability') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (item.name || '').toLowerCase().includes(q) ||
             (item.color || '').toLowerCase().includes(q) ||
             (item.size || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Товари в наявності</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
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
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none"
        />
      </div>

      {availabilityList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Тут поки нічого немає.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availabilityList.map(item => (
            <div 
              key={item.id} 
              onClick={() => onSelectDetails(item)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 flex gap-3 items-center transition"
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border" />
              ) : (
                <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">Фото</div>
              )}
              <div className="flex-1 flex flex-col text-xs gap-0.5">
                <strong className="text-slate-900 text-sm">{item.name}</strong>
                {item.size && <span className="text-slate-600">Розмір: {item.size}</span>}
                {item.color && <span className="text-slate-600">Колір: {item.color}</span>}
                {item.status && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-max mt-1 ${
                    item.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Додати в наявність</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Назва моделі</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. Черевики 01" />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Матеріал</label>
                  <input type="text" value={formMaterial} onChange={e => setFormMaterial(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. шкіра" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Підошва</label>
                  <input type="text" value={formSole} onChange={e => setFormSole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. трактор" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Статус</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                  <option value="відмова">Відмова</option>
                  <option value="зразок">Зразок</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ціна продажу (грн)</label>
                  <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Акційна ціна (грн)</label>
                  <input type="number" value={formSalePrice} onChange={e => setFormSalePrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Закупка (грн)</label>
                <input type="number" value={formCost} onChange={e => setFormCost(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Фото товару</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600">Скасувати</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
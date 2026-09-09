import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';

export default function ShoesFolder({ stock, onAddItem, onDeleteItem, onSelectDetails }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formName, setFormName] = useState('');
  const [formSeason, setFormSeason] = useState('Демісезон');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formLining, setFormLining] = useState('байка'); // Поле для наповнення (підкладки)
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formImage, setFormImage] = useState('');

  // Пошук та фільтри
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('усі');

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSeason('Демісезон');
    setFormSize('');
    setFormColor('');
    setFormMaterial('');
    setFormLining('байка');
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormCost('');
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
    setFormLining(item.lining || 'байка');
    setFormSole(item.sole || '');
    setFormPrice(item.price !== '' ? item.price : '');
    setFormSalePrice(item.salePrice !== '' ? item.salePrice : '');
    setFormCost(item.cost !== '' ? item.cost : '');
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

  const handleSave = (e) => {
    e.preventDefault();
    onAddItem({
      id: editingItem ? editingItem.id : Date.now(),
      folderId: 'shoes',
      name: formName || 'Модель взуття',
      season: formSeason,
      size: formSize,
      color: formColor,
      material: formMaterial,
      lining: formLining,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      image: formImage,
      status: 'зразок'
    });
    setShowModal(false);
  };

  const shoesList = stock.filter(item => item.folderId === 'shoes');

  // Фільтрація взуття
  const filteredShoes = shoesList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.color?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeason === 'усі' || item.season === selectedSeason;
    return matchesSearch && matchesSeason;
  });

  return (
    <div className="space-y-4">
      {/* Кнопка додавання на всю ширину */}
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
      >
        <Plus size={16} /> Додати взуття
      </button>

      {/* Пошук та фільтри сезонів */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук за назвою або кольором..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['усі', 'Демісезон', 'Зима', 'Літо'].map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => setSelectedSeason(season)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                selectedSeason === season 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {season === 'усі' ? 'Усі сезони' : season}
            </button>
          ))}
        </div>
      </div>

      {filteredShoes.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Нічого не знайдено.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredShoes.map(item => (
            <div 
              key={item.id} 
              onClick={() => onSelectDetails(item)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 flex flex-col gap-2.5 transition relative"
            >
              {/* Верхній рядок: Назва + Кнопки редагування/видалення у правому куті */}
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

              {/* Основний блок з фото та характеристиками */}
              <div className="flex gap-3 items-center">
                {item.image ? (
                  <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500 flex-shrink-0">Фото</div>
                )}
                <div className="flex-1 flex flex-col text-xs gap-0.5 min-w-0">
                  {item.size && <span className="text-slate-600">Розмір: <span className="font-medium text-slate-900">{item.size}</span></span>}
                  {item.color && <span className="text-slate-600">Колір: <span className="font-medium text-slate-900">{item.color}</span></span>}
                  {item.material && <span className="text-slate-600">Матеріал: <span className="font-medium text-slate-900">{item.material}</span></span>}
                  {item.lining && <span className="text-slate-600">Наповнення: <span className="font-medium text-slate-900">{item.lining}</span></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Редагувати зразок взуття' : 'Додати зразок взуття'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Назва моделі</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. Черевики 01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сезон</label>
                <select
                  value={formSeason}
                  onChange={e => setFormSeason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="Демісезон">Демісезон</option>
                  <option value="Зима">Зима</option>
                  <option value="Літо">Літо</option>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Матеріал</label>
                  <input type="text" value={formMaterial} onChange={e => setFormMaterial(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. шкіра" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Наповнення (підкладка)</label>
                  <select
                    value={formLining}
                    onChange={e => setFormLining(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="байка">Байка</option>
                    <option value="хутро">Хутро</option>
                    <option value="шкірпідклад">Шкірпідклад</option>
                    <option value="без підкладки">Без підкладки</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Підошва</label>
                <input type="text" value={formSole} onChange={e => setFormSole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. трактор" />
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
                <label className="block text-xs font-medium text-slate-500 mb-1">Фото моделі</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 cursor-pointer">Скасувати</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
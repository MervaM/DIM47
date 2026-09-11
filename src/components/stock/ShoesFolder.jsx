import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ShoesFolder({ stock, onAddItem, onDeleteItem }) {
  const imageInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activePreviewItem, setActivePreviewItem] = useState(null);

  const [formName, setFormName] = useState('');
  const [formSeasons, setFormSeasons] = useState(['Демісезон']);
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSuppliers, setFormSuppliers] = useState(['Міла']);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState('усі');

  const seasonsList = ['Осінь', 'Зима', 'Демісезон', 'Літо'];
  const availableSuppliersList = ['Міла', 'Валерій'];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSeasons(['Демісезон']);
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormCost('');
    setFormImage('');
    setFormSuppliers(['Міла']);
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name || '');
    
    if (item.season) {
      const parsedSeasons = item.season.split(' - ').map(s => s.trim());
      setFormSeasons(parsedSeasons);
    } else {
      setFormSeasons(['Демісезон']);
    }

    setFormSole(item.sole || '');
    setFormPrice(item.price !== undefined ? item.price : '');
    setFormSalePrice(item.salePrice !== undefined ? item.salePrice : '');
    setFormCost(item.cost !== undefined ? item.cost : '');
    setFormImage(item.image || '');
    setFormSuppliers(Array.isArray(item.suppliers) ? item.suppliers : [item.supplier || 'Міла']);
    setShowModal(true);
  };

  const toggleSeason = (season) => {
    if (formSeasons.includes(season)) {
      if (formSeasons.length === 1) return;
      setFormSeasons(formSeasons.filter(s => s !== season));
    } else {
      if (formSeasons.length >= 2) {
        setFormSeasons([formSeasons[1], season]);
      } else {
        setFormSeasons([...formSeasons, season]);
      }
    }
  };

  const toggleSupplier = (supplier) => {
    if (formSuppliers.includes(supplier)) {
      if (formSuppliers.length === 1) return;
      setFormSuppliers(formSuppliers.filter(s => s !== supplier));
    } else {
      setFormSuppliers([...formSuppliers, supplier]);
    }
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

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          setFormImage(compressedDataUrl);
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
    const formattedSeason = formSeasons.join(' - ');

    const newItem = {
      id: itemId,
      folderId: 'shoes',
      name: formName,
      season: formattedSeason,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      image: formImage,
      suppliers: formSuppliers,
      defaultSupplier: formSuppliers[0] || 'Міла',
      status: 'зразок'
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

  const shoesList = stock.filter(item => item.folderId === 'shoes' || !item.folderId || item.folderId === 'Взуття');

  const filteredShoes = shoesList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeasonFilter === 'усі' || (item.season && item.season.includes(selectedSeasonFilter));
    return matchesSearch && matchesSeason;
  });

  return (
    <div className="space-y-4 touch-manipulation">
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
      >
        <Plus size={16} /> Додати зразок взуття
      </button>

      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук за назвою моделі..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['усі', ...seasonsList].map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => setSelectedSeasonFilter(season)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                selectedSeasonFilter === season 
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
          {filteredShoes.map(item => {
            const suppliersText = Array.isArray(item.suppliers) ? item.suppliers.join(', ') : (item.supplier || 'Міла');

            return (
              <div 
                key={item.id} 
                onClick={() => setActivePreviewItem(item)}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 flex flex-col gap-2.5 transition relative"
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
                  
                  <div className="flex-1 flex flex-col text-xs gap-1 min-w-0">
                    {item.season && (
                      <span className="text-slate-600">
                        Сезон: <span className="font-semibold text-slate-900">{item.season}</span>
                      </span>
                    )}
                    {item.price !== undefined && item.price !== '' && (
                      <span className="text-slate-600">
                        Ціна: <span className="font-bold text-emerald-700">{item.price} грн</span>
                      </span>
                    )}
                    <span className="text-slate-500 text-[11px]">
                      Виробник: <span className="font-semibold text-indigo-700">{suppliersText}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Перегляд при кліку */}
      {activePreviewItem && (
        <div 
          onClick={() => setActivePreviewItem(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all"
        >
          <div 
            onClick={() => setActivePreviewItem(null)}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-center cursor-pointer transform scale-100 transition-all border border-slate-100"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-base">{activePreviewItem.name}</h3>
              <button type="button" className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            {activePreviewItem.image ? (
              <img src={activePreviewItem.image} alt="" className="w-full h-56 object-contain rounded-xl bg-slate-50 border border-slate-100" />
            ) : (
              <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">Немає фото</div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Сезон:</span>
                <span className="font-bold text-slate-900">{activePreviewItem.season || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Виробник:</span>
                <span className="font-bold text-indigo-700">
                  {Array.isArray(activePreviewItem.suppliers) ? activePreviewItem.suppliers.join(', ') : (activePreviewItem.supplier || 'Міла')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Ціна продажу:</span>
                <span className="font-bold text-emerald-600">{activePreviewItem.price ? `${activePreviewItem.price} грн` : '—'}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 border-slate-200">
                <span className="text-slate-500 font-medium">Закупка (собівартість):</span>
                <span className="font-extrabold text-slate-900">{activePreviewItem.cost ? `${activePreviewItem.cost} грн` : 'Не вказано'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">Натисніть у будь-якому місці, щоб закрити</p>
          </div>
        </div>
      )}

      {/* Модальне вікно редагування / додавання */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[92vh] overflow-y-auto flex flex-col gap-4 my-auto relative"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? 'Редагувати зразок взуття' : 'Додати зразок взуття'}
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
                  placeholder="Напр. Клоги 100" 
                />
              </div>

              {/* Виробник цієї моделі */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Виробник (можна обрати кількох)
                </label>
                <div className="flex gap-2">
                  {availableSuppliersList.map(sup => {
                    const isSelected = formSuppliers.includes(sup);
                    return (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => toggleSupplier(sup)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-900 text-white border-indigo-900' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sup} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Вибір сезонів */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сезон (можна обрати 1 або 2)</label>
                <div className="flex gap-1.5 flex-wrap">
                  {seasonsList.map(s => {
                    const isSelected = formSeasons.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSeason(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Підошва (опціонально)</label>
                <input 
                  type="text" 
                  value={formSole} 
                  onChange={e => setFormSole(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-slate-900" 
                  placeholder="Напр. резинова / трактор" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ціна продажу (грн)</label>
                  <input 
                    type="number" 
                    value={formPrice} 
                    onChange={e => setFormPrice(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:border-slate-900" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Закупка (грн)</label>
                  <input 
                    type="number" 
                    value={formCost} 
                    onChange={e => setFormCost(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Фото моделі</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={imageInputRef} 
                  onChange={handleImageUpload} 
                  className="text-xs w-full" 
                />
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
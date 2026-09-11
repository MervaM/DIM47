import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, Search, X, Upload, Image as ImageIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AvailabilityFolder({ stock = [], onAddItem, onDeleteItem, onSelectDetails }) {
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState('усі');

  // Поля форми
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
  const [formStatus, setFormStatus] = useState('відмова');
  const [formImage, setFormImage] = useState('');

  // Стейт для модалки вибору фото зі складу
  const [isStockImagesOpen, setIsStockImagesOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

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
    setFormStatus('відмова');
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
    setFormStatus(item.status || 'відмова');
    setFormImage(item.image || '');
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectProductFromStock = (product) => {
    if (!product) return;
    if (product.name) setFormName(product.name);
    const img = product.image || product.photo || product.img;
    if (img) setFormImage(img);
    if (product.season) setFormSeason(product.season);
    if (product.size) setFormSize(product.size);
    if (product.color) setFormColor(product.color);
    if (product.material) setFormMaterial(product.material);
    if (product.sole) setFormSole(product.sole);
    if (product.price !== undefined) setFormPrice(product.price);
    if (product.cost !== undefined) setFormCost(product.cost);

    setIsProductDropdownOpen(false);
    setIsStockImagesOpen(false);
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
      folderId: 'availability',
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

  // Фільтруємо товари за пошуком і сезоном
  const availabilityList = stock.filter(item => {
    if (item.folderId !== 'availability') return false;
    
    const matchesSearch = !searchQuery.trim() || (
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.color || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.size || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.material || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesSeason = selectedSeasonFilter === 'усі' || 
      (item.season && item.season.toLowerCase().includes(selectedSeasonFilter.toLowerCase()));

    return matchesSearch && matchesSeason;
  });

  const filteredStockProducts = stock.filter(item => 
    item && item.name && item.name.toLowerCase().includes(formName.toLowerCase())
  );

  return (
    <div className="space-y-4 touch-manipulation">
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
      >
        <Plus size={16} /> Додати в наявність
      </button>

      {/* Пошук та кнопкові фільтри сезонів */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Пошук за назвою моделі, кольором або розміром..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  {item.season && <span className="text-slate-600">Сезон: <span className="font-semibold text-slate-900">{item.season}</span></span>}
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
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 relative my-auto space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Редагувати в наявності' : 'Додати в наявність'}
              </h2>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Блок завантаження та вибору фото */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-700">Фото товару</span>
                {formImage ? (
                  <div className="relative w-20 h-20">
                    <img src={formImage} alt="Товар" className="w-20 h-20 object-cover rounded-lg border shadow-xs" />
                    <button type="button" onClick={() => setFormImage('')} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"><X size={12}/></button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-200/70 rounded-lg flex items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                  </div>
                )}
                <div className="flex gap-2 w-full justify-center">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  <button type="button" title="Завантажити з пристрою" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5">
                    <Upload size={15} /> З пристрою
                  </button>
                  <button type="button" title="Вибрати зі складу" onClick={() => setIsStockImagesOpen(true)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5">
                    <Search size={15} /> Зі складу
                  </button>
                </div>
              </div>

              {/* Назва моделі */}
              <div className="relative space-y-1">
                <label className="text-xs font-semibold text-slate-600">Назва товару</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    placeholder="Напр. Черевики 01"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                  <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                </div>

                {isProductDropdownOpen && filteredStockProducts.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredStockProducts.map((prod, index) => {
                      if (!prod) return null;
                      const prodImg = prod.image || prod.photo || prod.img;
                      return (
                        <div
                          key={prod.id || index}
                          onClick={() => handleSelectProductFromStock(prod)}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition"
                        >
                          <div className="flex items-center gap-3">
                            {prodImg ? (
                              <img src={prodImg} alt="" className="w-9 h-9 object-cover rounded-lg border" />
                            ) : (
                              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Фото</div>
                            )}
                            <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                          </div>
                          {prod.price !== undefined && <div className="text-xs font-semibold text-emerald-600">{prod.price} грн</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Сезон */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Сезон</label>
                <select
                  value={formSeason}
                  onChange={e => setFormSeason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {seasonsList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Характеристики */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Характеристики товару:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={formSize} onChange={(e) => setFormSize(e.target.value)} placeholder="Розмір (напр. 39)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  <input type="text" value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="Колір (напр. чорний)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  <input type="text" value={formMaterial} onChange={(e) => setFormMaterial(e.target.value)} placeholder="Матеріал (напр. шкіра)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  <input type="text" value={formSole} onChange={(e) => setFormSole(e.target.value)} placeholder="Підошва (напр. трактор)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div className="flex items-center justify-end pt-1">
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setFormLining(formLining === 'байка' ? '' : 'байка')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${formLining === 'байка' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Байка</button>
                    <button type="button" onClick={() => setFormLining(formLining === 'хутро' ? '' : 'хутро')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${formLining === 'хутро' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Хутро</button>
                  </div>
                </div>
              </div>

              {/* Статус */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Статус товару</label>
                <select 
                  value={formStatus} 
                  onChange={e => setFormStatus(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  <option value="відмова">Відмова</option>
                  <option value="зразок">Зразок</option>
                </select>
              </div>

              {/* Ціни */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Ціна продажу (грн)</label>
                  <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Акційна ціна (грн)</label>
                  <input type="number" value={formSalePrice} onChange={e => setFormSalePrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Закупка / Собівартість (грн)</label>
                <input type="number" value={formCost} onChange={e => setFormCost(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800" />
              </div>

              {/* Кнопки збереження/скасування */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Скасувати</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка вибору фото зі складу */}
      {isStockImagesOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4"
          onClick={() => setIsStockImagesOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-150">
              <h3 className="font-bold text-slate-900 text-sm">Виберіть зображення зі складу</h3>
              <button type="button" onClick={() => setIsStockImagesOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-96">
              {stock.length > 0 ? (
                stock.map((item, index) => {
                  if (!item) return null;
                  const img = item.image || item.photo || item.img;
                  return (
                    <div key={item.id || index}>
                      {img ? (
                        <div onClick={() => handleSelectProductFromStock(item)} className="relative group cursor-pointer border rounded-lg overflow-hidden aspect-square bg-slate-50 hover:ring-2 hover:ring-slate-900 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">
                            {item.name || 'Товар'}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-xs text-slate-400">Склад порожній</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
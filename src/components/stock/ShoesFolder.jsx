import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../js/firebase'; // Виправлено шлях до твого firebase відповідно до App.jsx

export default function ShoesFolder({ stock, onAddItem, onDeleteItem, onSelectDetails }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
  const [formImage, setFormImage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('усі');

  const isColdSeason = ['Зима', 'Осінь', 'Демісезон'].includes(formSeason);

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

  const handleSave = async () => {
    if (!formName.trim()) {
      alert("Введіть назву моделі!");
      return;
    }

    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'shoes',
      name: formName,
      season: formSeason,
      size: formSize,
      color: formColor,
      material: formMaterial,
      lining: isColdSeason ? formLining : '',
      sole: isColdSeason ? formSole : '',
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      image: formImage,
      status: 'зразок'
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      console.log("Успішно збережено у Firebase Firestore під ID:", itemId);

      onAddItem(newItem);
      setShowModal(false);
    } catch (error) {
      console.error("Помилка збереження у Firebase:", error);
      alert("Помилка збереження в базу даних. Перевірте консоль.");
    }
  };

  // Виправлено фільтрацію: тепер показує елементи, де folderId це 'shoes' або якщо поле взагалі не задане (щоб старі записи теж з'явилися)
  const shoesList = stock.filter(item => item.folderId === 'shoes' || !item.folderId);

  const filteredShoes = shoesList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.color?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeason === 'усі' || item.season === selectedSeason;
    return matchesSearch && matchesSeason;
  });

  return (
    <div className="space-y-4">
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
      >
        <Plus size={16} /> Додати взуття
      </button>

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
          {['усі', 'Осінь', 'Зима', 'Демісезон', 'Літо'].map((season) => (
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
                  <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500 flex-shrink-0">Фото</div>
                )}
                <div className="flex-1 flex flex-col text-xs gap-0.5 min-w-0">
                  {item.season && <span className="text-slate-600">Сезон: <span className="font-medium text-slate-900">{item.season}</span></span>}
                  {item.size && <span className="text-slate-600">Розмір: <span className="font-medium text-slate-900">{item.size}</span></span>}
                  {item.color && <span className="text-slate-600">Колір: <span className="font-medium text-slate-900">{item.color}</span></span>}
                  {item.material && <span className="text-slate-600">Матеріал: <span className="font-medium text-slate-900">{item.material}</span></span>}
                  {item.lining && <span className="text-slate-600">Утеплювач: <span className="font-medium text-slate-900">{item.lining}</span></span>}
                  {item.sole && <span className="text-slate-600">Підошва: <span className="font-medium text-slate-900">{item.sole}</span></span>}
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
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Назва моделі</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-xl text-xs" 
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
                  <option value="Осінь">Осінь</option>
                  <option value="Зима">Зима</option>
                  <option value="Демісезон">Демісезон</option>
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
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Матеріал</label>
                <input type="text" value={formMaterial} onChange={e => setFormMaterial(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. шкіра" />
              </div>

              {isColdSeason && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
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
              )}

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
                {formImage && <p className="text-[10px] text-emerald-600 mt-1">✓ Зображення успішно завантажено та стиснуто</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="button" 
                  onClick={handleSave} 
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Зберегти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function PalettesFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {}, onBack = () => {} }) {
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formName, setFormName] = useState('');
  const [formMaterial, setFormMaterial] = useState('Шкіра'); // 'Шкіра' або 'Замша'
  const [formSupplier, setFormSupplier] = useState('Міла'); // 'Міла' або 'Валерій'
  const [formImage, setFormImage] = useState('');

  // Активні вкладки (без "усі")
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSupplier, setActiveSupplier] = useState('Міла');
  const [activeMaterial, setActiveMaterial] = useState('Шкіра');

  // Обробка жестів свайпу для мобільних
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    // Свайп вправо більше ніж на 60px при мінімальному вертикальному відхиленні
    if (deltaX > 60 && deltaY < 50) {
      // Якщо в материнському компоненті стан опрацьовується через setActiveFolder(null), 
      // цей виклик дозволить закрити палітру свайпом.
      const backBtn = document.querySelector('button[aria-label="Назад"], .stock-back-btn');
      if (backBtn) {
        backBtn.click();
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormMaterial(activeMaterial);
    setFormSupplier(activeSupplier);
    setFormImage('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name || '');
    setFormMaterial(item.materialType || 'Шкіра');
    setFormSupplier(item.supplier || 'Міла');
    setFormImage(item.image || item.colorImage || '');
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
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
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

          setFormImage(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Введіть назву або індекс кольору!");
      return;
    }

    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'palettes',
      isColor: true,
      name: formName,
      materialType: formMaterial,
      supplier: formSupplier,
      image: formImage,
      colorImage: formImage
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      onAddItem(newItem);
      setShowModal(false);
    } catch (error) {
      console.error("Помилка збереження кольору:", error);
      alert("Помилка збереження: " + error.message);
    }
  };

  // Фільтрація списку палітри за вибраним виробником та матеріалом
  const paletteList = stock.filter(item => 
    item.folderId === 'palettes' || item.isColor || item.type === 'color'
  );

  const filteredPalette = paletteList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = (item.supplier || 'Міла') === activeSupplier;
    const matchesMaterial = (item.materialType || 'Шкіра') === activeMaterial;
    
    return matchesSearch && matchesSupplier && matchesMaterial;
  });

  return (
    <div 
      className="space-y-4 touch-manipulation select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
      >
        <Plus size={16} /> Додати колір ({activeSupplier} - {activeMaterial})
      </button>

      {/* Панель перемикання виробника та матеріалу */}
      <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        
        {/* Перемикач виробника (Міла / Валерій) */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
          {['Міла', 'Валерій'].map((supplier) => (
            <button
              key={supplier}
              type="button"
              onClick={() => setActiveSupplier(supplier)}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSupplier === supplier
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Палітра: {supplier}
            </button>
          ))}
        </div>

        {/* Перемикач матеріалу (Шкіра / Замша) */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
          {['Шкіра', 'Замша'].map((material) => (
            <button
              key={material}
              type="button"
              onClick={() => setActiveMaterial(material)}
              className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeMaterial === material
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {material}
            </button>
          ))}
        </div>

        {/* Пошук */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук кольору чи індексу..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Список кольорів */}
      {filteredPalette.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">
          Палітра порожня ({activeSupplier} — {activeMaterial}).
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPalette.map(item => {
            const imgSrc = item.image || item.colorImage;

            return (
              <div 
                key={item.id} 
                className="p-3 bg-white hover:bg-slate-50 cursor-pointer rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {imgSrc ? (
                    <img src={imgSrc} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">
                      Фото
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <strong className="text-slate-900 text-xs truncate">
                      {item.name}
                    </strong>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                      <span className="bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200">
                        {item.materialType || 'Шкіра'}
                      </span>
                      <span className="bg-indigo-50 text-indigo-800 font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                        {item.supplier || 'Міла'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => handleOpenEditModal(item, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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
            );
          })}
        </div>
      )}

      {/* Модальне вікно редагування / додавання кольору */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Редагувати колір / індекс' : 'Додати колір'}
              </h2>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Назва кольору / Індекс</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-slate-900" 
                  placeholder="Напр. Лео замша #104" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Виробник</label>
                  <select 
                    value={formSupplier} 
                    onChange={e => setFormSupplier(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Міла">Міла</option>
                    <option value="Валерій">Валерій</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Матеріал</label>
                  <select 
                    value={formMaterial} 
                    onChange={e => setFormMaterial(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Шкіра">Шкіра</option>
                    <option value="Замша">Замша</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Фото матеріалу</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="w-full text-xs" 
                />
                {formImage && <p className="text-[10px] text-emerald-600 mt-1">✓ Фото завантажено</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
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
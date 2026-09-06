import React, { useState } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';

export default function Stock({ stock, setStock }) {
  const [activeFolder, setActiveFolder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showShoesModal, setShowShoesModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Форма для додавання/редагування товару
  const [formName, setFormName] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formColorImage, setFormColorImage] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formSizeBox, setFormSizeBox] = useState('Великі');
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('відмова');

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFolderClick = (folderId) => {
    if (folderId === 'shoes') {
      setShowShoesModal(true);
      return;
    }
    setActiveFolder(folderId);
  };

  const handleOpenModal = (folderId) => {
    setActiveFolder(folderId);
    setFormName('');
    setFormSize('');
    setFormColor('');
    setFormColorImage('');
    setFormMaterial('');
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormCost('');
    setFormQty('');
    setFormSizeBox('Великі');
    setFormImage('');
    // Якщо відкриваємо з папки "Наявність", ставимо статус за замовчуванням 'відмова' або 'зразок'
    setFormStatus('відмова');
    setShowModal(true);
  };

  // Окрема кнопка для завантаження зразка взуття прямо з модального вікна асортименту
  const handleOpenAddShoeSample = () => {
    setShowShoesModal(false);
    setActiveFolder('availability');
    setFormName('');
    setFormSize('');
    setFormColor('');
    setFormColorImage('');
    setFormMaterial('');
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormCost('');
    setFormQty('');
    setFormImage('');
    setFormStatus('зразок'); // Зразок взуття для папки Наявність
    setShowModal(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();

    // Якщо це додавання з модалки зразків взуття, примусово ставимо folderId = 'availability'
    const targetFolder = activeFolder === 'shoes' ? 'availability' : activeFolder;

    const newItem = {
      id: Date.now(),
      folderId: targetFolder,
      name: formName || (targetFolder === 'palettes' ? 'Зразок кольору' : 'Товар'),
      size: formSize,
      color: formColor,
      colorImage: formColorImage,
      material: formMaterial,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      cost: formCost !== '' ? Number(formCost) : '',
      quantity: formQty !== '' ? Number(formQty) : 1,
      sizeBox: formSizeBox,
      image: formImage,
      status: formStatus
    };

    setStock(prev => [newItem, ...prev]);
    setShowModal(false);
  };

  const handleDeleteItem = (id) => {
    setStock(prev => prev.filter(item => item.id !== id));
    setSelectedItemDetails(null);
  };

  // Фільтрація елементів на складі
  const filteredStock = stock.filter(item => {
    if (activeFolder) {
      if (activeFolder === 'availability') {
        if (item.folderId !== 'shoes' && item.folderId !== 'availability') return false;
      } else {
        if (item.folderId !== activeFolder) return false;
      }
    }
    if (searchQuery.trim() && activeFolder === 'availability') {
      const q = searchQuery.toLowerCase();
      const nameMatch = (item.name || '').toLowerCase().includes(q);
      const colorMatch = (item.color || '').toLowerCase().includes(q);
      const sizeMatch = (item.size || '').toLowerCase().includes(q);
      return nameMatch || colorMatch || sizeMatch;
    }
    return true;
  });

  const defaultFolders = [
    { id: 'shoes', name: 'Взуття', icon: '🥿' },
    { id: 'boxes', name: 'Коробки', icon: '📦' },
    { id: 'palettes', name: 'Палітра', icon: '🎨' },
    { id: 'dustbags', name: 'Пильовики', icon: '🛍️' },
    { id: 'availability', name: 'Наявність', icon: '🔄' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Склад</h1>
      </div>

      {!activeFolder ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {defaultFolders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => handleFolderClick(folder.id)}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex items-center gap-2 overflow-hidden"
              >
                <span className="text-xl shrink-0">{folder.icon}</span>
                <div className="truncate">
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{folder.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Товари на складі</h3>
            
            <div className="space-y-4">
              <div>
                {stock.filter(i => i.folderId === 'boxes').length === 0 ? (
                  <p className="text-slate-400 text-xs">Немає коробок.</p>
                ) : (
                  <div className="space-y-2">
                    {stock.filter(i => i.folderId === 'boxes').map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                        <span className="font-medium text-slate-900">Коробка ({item.sizeBox})</span>
                        <span className="text-slate-600">Кількість: {item.quantity} шт</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {stock.filter(i => i.folderId === 'dustbags').length === 0 ? (
                  <p className="text-slate-400 text-xs">Немає пильовиків.</p>
                ) : (
                  <div className="space-y-2">
                    {stock.filter(i => i.folderId === 'dustbags').map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                        <span className="font-medium text-slate-900">Пильовик ({item.sizeBox})</span>
                        <span className="text-slate-600">Кількість: {item.quantity} шт</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
            <button 
              onClick={() => { setActiveFolder(null); setSearchQuery(''); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
            >
              ← Назад до папок
            </button>

            <button 
              onClick={() => handleOpenModal(activeFolder)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus size={16} /> Додати елемент
            </button>
          </div>

          {activeFolder === 'availability' && (
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Пошук по назві, кольору, розміру..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Елементи в розділі
            </h3>

            {filteredStock.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Тут поки нічого немає.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredStock.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItemDetails(item)}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 flex gap-3 items-center transition"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border" />
                    ) : item.colorImage ? (
                      <img src={item.colorImage} alt="" className="w-14 h-14 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">Фото</div>
                    )}

                    <div className="flex-1 flex flex-col text-xs gap-0.5">
                      <strong className="text-slate-900 text-sm">{item.name}</strong>
                      {item.size && <span className="text-slate-600">Розмір: {item.size}</span>}
                      {item.color && <span className="text-slate-600">Колір: {item.color}</span>}
                      {item.material && <span className="text-slate-600">Матеріал: {item.material}</span>}
                      {item.status && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-max mt-1 ${
                          item.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальне вікно для перегляду асортименту взуття (тільки зразки, кнопка завантаження зразка додана сюди) */}
      {showShoesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 relative">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold text-slate-900">Асортимент взуття (Зразки)</h2>
              <button onClick={() => setShowShoesModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-3">
              {stock.filter(item => item.folderId === 'shoes' || (item.folderId === 'availability' && item.status === 'зразок')).length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">У каталозі взуття поки немає зразків.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stock.filter(item => item.folderId === 'shoes' || (item.folderId === 'availability' && item.status === 'зразок')).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItemDetails(item)}
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
                        {item.material && <span className="text-slate-600">Матеріал: {item.material}</span>}
                        {item.status && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-max mt-1 ${
                            item.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-3">
              <button 
                onClick={handleOpenAddShoeSample} 
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus size={16} /> Додати зразок взуття
              </button>

              <button 
                onClick={() => setShowShoesModal(false)} 
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно деталей конкретного товару */}
      {selectedItemDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setSelectedItemDetails(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={20}/>
            </button>

            <div className="flex items-center gap-4">
              {selectedItemDetails.image ? (
                <img src={selectedItemDetails.image} alt="" className="w-20 h-20 object-cover rounded-xl border" />
              ) : (
                <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">Фото</div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedItemDetails.name}</h2>
                {selectedItemDetails.status && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                    selectedItemDetails.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedItemDetails.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Розмір:</span>
                <span className="font-medium text-slate-900">{selectedItemDetails.size || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Колір:</span>
                <span className="font-medium text-slate-900">{selectedItemDetails.color || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Матеріал:</span>
                <span className="font-medium text-slate-900">{selectedItemDetails.material || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Підошва:</span>
                <span className="font-medium text-slate-900">{selectedItemDetails.sole || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ціна продажу:</span>
                <span className="font-bold text-emerald-700">{selectedItemDetails.price !== '' ? `${selectedItemDetails.price} грн` : '-'}</span>
              </div>
              {selectedItemDetails.salePrice > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Акційна ціна:</span>
                  <span className="font-bold text-amber-600">{selectedItemDetails.salePrice} грн</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Закупка:</span>
                <span className="font-medium text-slate-700">{selectedItemDetails.cost !== '' ? `${selectedItemDetails.cost} грн` : '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedItemDetails(null)} 
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно додавання (для інших папок або зразків взуття) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {formStatus === 'зразок' ? 'Додати зразок взуття' : 'Додати елемент'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>

            <form onSubmit={handleSaveItem} className="flex flex-col gap-3">
              {(activeFolder === 'availability' || activeFolder === 'shoes') && (
                <>
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
                      <label className="block text-xs font-medium text-slate-500 mb-1">Підошва (при потр.)</label>
                      <input type="text" value={formSole} onChange={e => setFormSole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. трактор" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Статус (категорія в наявності)</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                      <option value="зразок">Зразок взуття</option>
                      <option value="відмова">Відмова (повернулось через відмову)</option>
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
                    <label className="block text-xs font-medium text-slate-500 mb-1">Фото моделі</label>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFormImage)} className="text-xs" />
                  </div>
                </>
              )}

              {(activeFolder === 'boxes' || activeFolder === 'dustbags') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Розмір</label>
                    <select value={formSizeBox} onChange={e => setFormSizeBox(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                      <option value="Великі">Великі</option>
                      <option value="Малі">Малі</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Вартість 1 шт (грн)</label>
                    <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Кількість</label>
                    <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="1" />
                  </div>
                </>
              )}

              {activeFolder === 'palettes' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Назва кольору</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. Пудра" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer p-0" />
                    <span className="text-xs text-slate-600">Або завантажте фото зразка кольору:</span>
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFormColorImage)} className="text-xs" />
                  </div>
                </>
              )}

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
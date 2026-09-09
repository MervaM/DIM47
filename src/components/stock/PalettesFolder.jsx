import React, { useState } from 'react';
import { Plus, Trash2, X, Search } from 'lucide-react';

export default function PalettesFolder({ stock, onAddItem, onDeleteItem }) {
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColorImage, setFormColorImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Функція для стиснення зображення перед збереженням в localStorage
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
          
          // Стискаємо у формат JPEG з якістю 0.7
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormColorImage(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onAddItem({
      id: Date.now(),
      folderId: 'palettes',
      name: formName || 'Зразок кольору',
      colorImage: formColorImage
    });
    setShowModal(false);
    setFormName(''); 
    setFormColorImage('');
  };

  // Фільтруємо палітру за папкою та пошуковим запитом
  const palettesList = stock.filter(item => {
    if (item.folderId !== 'palettes') return false;
    if (!searchQuery.trim()) return true;
    return item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus size={16} /> Додати колір
        </button>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук кольору..."
            className="w-full px-3 py-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        </div>
      </div>

      {palettesList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          {searchQuery ? 'Нічого не знайдено за вашим запитом.' : 'У папці Палітра поки немає зразків.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {palettesList.map(item => {
            const img = item.colorImage || item.image || item.photo || item.img;
            return (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                  {img ? (
                    <img src={img} alt="" className="w-12 h-12 object-cover rounded-lg border" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-lg border flex items-center justify-center text-[10px] text-slate-400">Фото</div>
                  )}
                  <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                </div>
                <button onClick={() => onDeleteItem(item.id)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Додати колір</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Назва кольору</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-xs" placeholder="Напр. Помаранчевий" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Фото зразка кольору</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} required className="text-xs w-full border rounded-xl p-2 bg-slate-50" />
              </div>
              {formColorImage && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-600 font-medium">✓ Фото успішно завантажено та оптимізовано</span>
                </div>
              )}
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
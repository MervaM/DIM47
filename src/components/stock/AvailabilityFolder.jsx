import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit3, X, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AvailabilityFolder({ stock = [], onAddItem = () => {}, onDeleteItem = () => {}, onSelectDetails }) {
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formName, setFormName] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStatus, setFormStatus] = useState('наявність');
  const [formImage, setFormImage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSize('');
    setFormColor('');
    setFormMaterial('');
    setFormSole('');
    setFormPrice('');
    setFormSalePrice('');
    setFormStatus('наявність');
    setFormImage('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name || '');
    setFormSize(item.size || '');
    setFormColor(item.color || '');
    setFormMaterial(item.material || '');
    setFormSole(item.sole || '');
    setFormPrice(item.price !== undefined ? item.price : '');
    setFormSalePrice(item.salePrice !== undefined ? item.salePrice : '');
    setFormStatus(item.status || 'наявність');
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

          setFormImage(canvas.toDataURL('image/jpeg', 0.75));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Введіть назву!");
      return;
    }

    const itemId = editingItem ? String(editingItem.id) : String(Date.now());

    const newItem = {
      id: itemId,
      folderId: 'availability',
      name: formName,
      size: formSize,
      color: formColor,
      material: formMaterial,
      sole: formSole,
      price: formPrice !== '' ? Number(formPrice) : '',
      salePrice: formSalePrice !== '' ? Number(formSalePrice) : '',
      status: formStatus,
      image: formImage
    };

    try {
      const docRef = doc(db, 'stock', itemId);
      await setDoc(docRef, newItem, { merge: true });
      onAddItem(newItem);
      setShowModal(false);
    } catch (error) {
      console.error("Помилка збереження наявності:", error);
    }
  };

  const availabilityList = stock.filter(item => item.folderId === 'availability');

  const filteredList = availabilityList.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.size).includes(searchQuery)
  );

  return (
    <div className="space-y-4 touch-manipulation">
      <button 
        type="button"
        onClick={handleOpenAddModal}
        className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
      >
        <Plus size={16} /> Додати в наявність
      </button>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Пошук за назвою, розміром чи кольором..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
        />
      </div>

      {filteredList.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">В наявності нічого немає.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredList.map(item => (
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
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 text-xs truncate">{item.name}</strong>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      item.status === 'відмова' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status || 'наявність'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.size ? `${item.size} розм.` : ''} {item.color ? `• ${item.color}` : ''}
                  </div>

                  {item.price !== '' && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700">{item.price} грн</span>
                      {item.salePrice > 0 && <span className="text-[10px] line-through text-slate-400">{item.salePrice} грн</span>}
                    </div>
                  )}
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
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-3 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Редагувати наявність' : 'Додати в наявність'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-2 text-xs">
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Назва товару" className="w-full px-3 py-2 border rounded-xl" />
              
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={formSize} onChange={e => setFormSize(e.target.value)} placeholder="Розмір" className="px-3 py-2 border rounded-xl" />
                <input type="text" value={formColor} onChange={e => setFormColor(e.target.value)} placeholder="Колір" className="px-3 py-2 border rounded-xl" />
                <input type="text" value={formMaterial} onChange={e => setFormMaterial(e.target.value)} placeholder="Матеріал" className="px-3 py-2 border rounded-xl" />
                <input type="text" value={formSole} onChange={e => setFormSole(e.target.value)} placeholder="Підошва" className="px-3 py-2 border rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="Ціна (грн)" className="px-3 py-2 border rounded-xl" />
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="px-3 py-2 border rounded-xl bg-white">
                  <option value="наявність">Наявність</option>
                  <option value="відмова">Відмова</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Фото</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="w-full text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Скасувати</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
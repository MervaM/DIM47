import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import ShoesFolder from './ShoesFolder';
import BoxesFolder from './BoxesFolder';
import PalettesFolder from './PalettesFolder';
import DustbagsFolder from './DustbagsFolder';
import AvailabilityFolder from './AvailabilityFolder';

export default function Stock({ stock = [], setStock, onAddItem, onDeleteItem }) {
  const [activeFolder, setActiveFolder] = useState(() => {
    return localStorage.getItem('activeFolder') || null;
  });
  
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  useEffect(() => {
    if (activeFolder) {
      localStorage.setItem('activeFolder', activeFolder);
    } else {
      localStorage.removeItem('activeFolder');
    }
  }, [activeFolder]);

  const folders = [
    { id: 'shoes', name: 'Взуття' },
    { id: 'boxes', name: 'Коробки' },
    { id: 'palettes', name: 'Палітра' },
    { id: 'dustbags', name: 'Пильовики' },
    { id: 'availability', name: 'Наявність' },
  ];

  const handleAddItemWrapper = (newItem) => {
    if (onAddItem) {
      onAddItem(newItem);
    } else {
      setStock(prev => {
        const exists = prev.some(item => item.id === newItem.id);
        if (exists) {
          return prev.map(item => item.id === newItem.id ? newItem : item);
        }
        return [newItem, ...prev];
      });
    }
  };

  const handleDeleteItemWrapper = (id) => {
    if (onDeleteItem) {
      onDeleteItem(id);
    } else {
      setStock(prev => prev.filter(item => item.id !== id));
    }
    setSelectedItemDetails(null);
  };

  const boxesList = stock.filter(item => item.folderId === 'boxes');
  const dustbagsList = stock.filter(item => item.folderId === 'dustbags');

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchEndX.current - touchStartX.current > 70 && activeFolder) {
      setActiveFolder(null);
    }
  };

  return (
    <div 
      className="space-y-6 max-w-4xl mx-auto p-4 sm:p-0 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!activeFolder ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => setActiveFolder(folder.id)}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex items-center justify-center text-center"
              >
                <span className="font-semibold text-slate-900 text-xs sm:text-sm">{folder.name}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 text-center sm:text-left">Загальний перегляд складу</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boxesList.map(item => {
                const total = item.quantity || 0;
                const mila = item.suppliers?.['Міла'] || 0;
                const valeriy = item.suppliers?.['Валерій'] || 0;
                const myStock = item.suppliers?.['Основний склад'] !== undefined 
                  ? item.suppliers['Основний склад'] 
                  : Math.max(0, total - mila - valeriy);

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveFolder('boxes')}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0">Фото</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">Коробки ({item.sizeBox || 'Великі'})</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Загальна кількість: <span className="font-bold text-slate-900">{total} шт</span>
                      </div>
                      
                      {/* Розподіл по Мілі, Валерію та вашому складу */}
                      <div className="flex flex-wrap gap-1 text-[10px] mt-1.5">
                        <span className="bg-slate-200/70 text-slate-800 font-bold px-1.5 py-0.5 rounded-md border border-slate-300/50">
                          Мій склад: {myStock} шт
                        </span>
                        <span className="bg-indigo-50 text-indigo-800 font-bold px-1.5 py-0.5 rounded-md border border-indigo-100">
                          Міла: {mila} шт
                        </span>
                        <span className="bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded-md border border-purple-100">
                          Валерій: {valeriy} шт
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dustbagsList.map(item => {
                const displayName = (!item.name || item.name === 'Товар') 
                  ? `Пильовик (${item.sizeBox || 'Великі'})` 
                  : item.name;

                const total = item.quantity || 0;
                const mila = item.suppliers?.['Міла'] || 0;
                const valeriy = item.suppliers?.['Валерій'] || 0;
                const myStock = item.suppliers?.['Основний склад'] !== undefined 
                  ? item.suppliers['Основний склад'] 
                  : Math.max(0, total - mila - valeriy);

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveFolder('dustbags')}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🛍️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{displayName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Загальна кількість: <span className="font-bold text-slate-900">{total} шт</span>
                      </div>

                      {/* Розподіл по Мілі, Валерію та вашому складу */}
                      <div className="flex flex-wrap gap-1 text-[10px] mt-1.5">
                        <span className="bg-slate-200/70 text-slate-800 font-bold px-1.5 py-0.5 rounded-md border border-slate-300/50">
                          Мій склад: {myStock} шт
                        </span>
                        <span className="bg-indigo-50 text-indigo-800 font-bold px-1.5 py-0.5 rounded-md border border-indigo-100">
                          Міла: {mila} шт
                        </span>
                        <span className="bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded-md border border-purple-100">
                          Валерій: {valeriy} шт
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {boxesList.length === 0 && dustbagsList.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Немає доданих коробок чи пильовиків.</p>
            )}

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveFolder(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              ← Назад 
            </button>
            <span className="font-bold text-slate-900 capitalize">
              {folders.find(f => f.id === activeFolder)?.name}
            </span>
          </div>

          {activeFolder === 'shoes' && <ShoesFolder stock={stock} onAddItem={handleAddItemWrapper} onDeleteItem={handleDeleteItemWrapper} onSelectDetails={setSelectedItemDetails} />}
          {activeFolder === 'boxes' && <BoxesFolder stock={stock} onAddItem={handleAddItemWrapper} onDeleteItem={handleDeleteItemWrapper} />}
          {activeFolder === 'palettes' && <PalettesFolder stock={stock} onAddItem={handleAddItemWrapper} onDeleteItem={handleDeleteItemWrapper} />}
          {activeFolder === 'dustbags' && <DustbagsFolder stock={stock} onAddItem={handleAddItemWrapper} onDeleteItem={handleDeleteItemWrapper} />}
          {activeFolder === 'availability' && <AvailabilityFolder stock={stock} onAddItem={handleAddItemWrapper} onDeleteItem={handleDeleteItemWrapper} onSelectDetails={setSelectedItemDetails} />}
        </div>
      )}

      {selectedItemDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setSelectedItemDetails(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20}/>
            </button>

            <div className="flex items-center gap-4">
              {selectedItemDetails.image ? (
                <img src={selectedItemDetails.image} alt="" className="w-20 h-20 object-cover rounded-xl border" />
              ) : selectedItemDetails.colorImage ? (
                <img src={selectedItemDetails.colorImage} alt="" className="w-20 h-20 object-cover rounded-xl border" />
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
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
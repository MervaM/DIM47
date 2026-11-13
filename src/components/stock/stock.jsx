import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash2, Edit3, Check, MinusCircle } from 'lucide-react';
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
  
  // Стани для редагування кількості (тепер включає і загальну кількість)
  const [editingSupplierItemId, setEditingSupplierItemId] = useState(null);
  const [tempSuppliers, setTempSuppliers] = useState({});
  const [tempTotal, setTempTotal] = useState('');
  
  // Стани для списання та історії списань
  const [writeOffModalItem, setWriteOffModalItem] = useState(null);
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [writeOffTarget, setWriteOffTarget] = useState('Основний склад');
  const [writeOffReason, setWriteOffReason] = useState('Пошкоджені коробки');
  const [writeOffsHistory, setWriteOffsHistory] = useState([]);

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

  const handleSaveSuppliers = (item) => {
    const myStockVal = Number(tempSuppliers['Основний склад'] ?? (item.suppliers?.['Основний склад'] || 0));
    const milaVal = Number(tempSuppliers['Міла'] ?? (item.suppliers?.['Міла'] || 0));
    const valeriyVal = Number(tempSuppliers['Валерій'] ?? (item.suppliers?.['Валерій'] || 0));

    const updatedSuppliers = {
      ...(item.suppliers || {}),
      'Основний склад': myStockVal,
      'Міла': milaVal,
      'Валерій': valeriyVal,
    };

    // Якщо загальна кількість була змінена вручну — беремо її, інакше рахуємо суму
    const finalTotal = tempTotal !== '' ? Number(tempTotal) : (myStockVal + milaVal + valeriyVal);

    const updatedItem = {
      ...item,
      quantity: finalTotal,
      suppliers: updatedSuppliers
    };

    handleAddItemWrapper(updatedItem);
    setEditingSupplierItemId(null);
  };

  const handleConfirmWriteOff = (e) => {
    e.preventDefault();
    const qty = parseInt(writeOffAmount);
    if (!writeOffModalItem || isNaN(qty) || qty <= 0) return;

    const currentSuppliers = writeOffModalItem.suppliers || {
      'Основний склад': writeOffModalItem.quantity || 0,
      'Міла': 0,
      'Валерій': 0
    };

    const currentTargetVal = currentSuppliers[writeOffTarget] || 0;
    if (qty > currentTargetVal) {
      alert('Неможливо списати більше, ніж є у наявності у цього власника/виробника!');
      return;
    }

    const updatedSuppliers = {
      ...currentSuppliers,
      [writeOffTarget]: currentTargetVal - qty
    };

    const newTotal = Math.max(0, (writeOffModalItem.quantity || 0) - qty);

    const updatedItem = {
      ...writeOffModalItem,
      quantity: newTotal,
      suppliers: updatedSuppliers
    };

    handleAddItemWrapper(updatedItem);

    const itemName = writeOffModalItem.folderId === 'boxes' 
      ? `Коробки (${writeOffModalItem.sizeBox || 'Великі'})` 
      : (writeOffModalItem.name || 'Пильовик');

    const newRecord = {
      id: Date.now(),
      itemName,
      target: writeOffTarget,
      quantity: qty,
      reason: writeOffReason || 'Пошкоджено',
      date: new Date().toISOString().split('T')[0]
    };

    setWriteOffsHistory(prev => [newRecord, ...prev]);
    setWriteOffModalItem(null);
    setWriteOffAmount('');
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

  const renderCard = (item, isBox = true) => {
    const displayName = isBox 
      ? `Коробки (${item.sizeBox || 'Великі'})` 
      : ((!item.name || item.name === 'Товар') ? `Пильовик (${item.sizeBox || 'Великі'})` : item.name);

    const total = item.quantity || 0;
    const mila = item.suppliers?.['Міла'] || 0;
    const valeriy = item.suppliers?.['Валерій'] || 0;
    const myStock = item.suppliers?.['Основний склад'] !== undefined 
      ? item.suppliers['Основний склад'] 
      : Math.max(0, total - mila - valeriy);

    const isEditing = editingSupplierItemId === item.id;

    return (
      <div key={item.id} className="flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-start gap-3">
          {item.image ? (
            <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
              {isBox ? 'Фото' : '🛍️'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <div className="font-bold text-slate-900 text-sm truncate">{displayName}</div>
              <button 
                onClick={() => {
                  setWriteOffModalItem(item);
                  setWriteOffAmount('');
                }}
                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
              >
                <MinusCircle size={14} /> Списати
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Загальна кількість: <span className="font-extrabold text-slate-900">{total} шт</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs">
          {!isEditing ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-700">
                <span>Мій склад:</span>
                <span className="font-bold text-slate-900">{myStock} шт</span>
              </div>
              <div className="flex justify-between items-center text-indigo-900">
                <span>Міла:</span>
                <span className="font-bold">{mila} шт</span>
              </div>
              <div className="flex justify-between items-center text-purple-900">
                <span>Валерій:</span>
                <span className="font-bold">{valeriy} шт</span>
              </div>
              <div className="flex justify-end pt-1">
                <button 
                  onClick={() => {
                    setEditingSupplierItemId(item.id);
                    setTempTotal(total);
                    setTempSuppliers({
                      'Основний склад': myStock,
                      'Міла': mila,
                      'Валерій': valeriy
                    });
                  }}
                  className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 size={12} /> Змінити кількість вручну
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-white p-2.5 rounded-xl border border-indigo-100">
              <div className="text-[11px] font-bold text-slate-700 mb-1">Редагування кількості:</div>
              
              {/* Поле для редагування загальної кількості */}
              <div className="flex justify-between items-center gap-2 pb-1.5 border-b border-slate-100">
                <span className="text-slate-900 font-bold text-[11px]">Загальна кількість:</span>
                <input 
                  type="number"
                  value={tempTotal}
                  onChange={e => setTempTotal(e.target.value)}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-black text-xs bg-slate-50"
                />
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 text-[11px]">Мій склад:</span>
                <input 
                  type="number"
                  value={tempSuppliers['Основний склад'] ?? myStock}
                  onChange={e => setTempSuppliers(prev => ({ ...prev, 'Основний склад': e.target.value }))}
                  className="w-20 px-2 py-1 border rounded text-right font-bold text-xs"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-indigo-900 text-[11px]">Міла:</span>
                <input 
                  type="number"
                  value={tempSuppliers['Міла'] ?? mila}
                  onChange={e => setTempSuppliers(prev => ({ ...prev, 'Міла': e.target.value }))}
                  className="w-20 px-2 py-1 border rounded text-right font-bold text-xs"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-purple-900 text-[11px]">Валерій:</span>
                <input 
                  type="number"
                  value={tempSuppliers['Валерій'] ?? valeriy}
                  onChange={e => setTempSuppliers(prev => ({ ...prev, 'Валерій': e.target.value }))}
                  className="w-20 px-2 py-1 border rounded text-right font-bold text-xs"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button 
                  onClick={() => setEditingSupplierItemId(null)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  onClick={() => handleSaveSuppliers(item)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Check size={12} /> Зберегти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boxesList.map(item => renderCard(item, true))}
              {dustbagsList.map(item => renderCard(item, false))}
            </div>

            {boxesList.length === 0 && dustbagsList.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Немає доданих коробок чи пильовиків.</p>
            )}

            {/* Блок історії списань */}
            <div className="border-t border-slate-100 pt-6 space-y-3 mt-6">
              <h3 className="text-md font-bold text-slate-900">Історія списань матеріалів</h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                {writeOffsHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Ще не було списань.</p>
                ) : (
                  <div className="space-y-2">
                    {writeOffsHistory.map(record => (
                      <div key={record.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{record.itemName}</span>
                          <span className="text-slate-500 ml-2">({record.target})</span>
                          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Причина: {record.reason}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-rose-700">-{record.quantity} шт</span>
                          <div className="text-[10px] text-slate-400">{record.date}</div>
                        </div>
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

      {/* Модалка списання */}
      {writeOffModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Списання позиції</h3>
              <button onClick={() => setWriteOffModalItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmWriteOff} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Звідки списати:</label>
                <select 
                  value={writeOffTarget} 
                  onChange={e => setWriteOffTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Основний склад">Мій склад</option>
                  <option value="Міла">Міла</option>
                  <option value="Валерій">Валерій</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кількість для списання (шт):</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={writeOffAmount} 
                  onChange={e => setWriteOffAmount(e.target.value)}
                  placeholder="Наприклад: 25" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Причина списання:</label>
                <input 
                  type="text" 
                  value={writeOffReason} 
                  onChange={e => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setWriteOffModalItem(null)} 
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-rose-700"
                >
                  Списати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка деталей товару */}
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
                <span className="font-medium text-slate-700">
                  {selectedItemDetails.costDisplay || (selectedItemDetails.cost !== '' ? `${selectedItemDetails.cost} ${selectedItemDetails.currency === 'USD' ? '$' : 'грн'}` : '-')}
                </span>
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
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash2, Edit3, Check, MinusCircle, Send, Clock } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../../firebase';
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
  
  // Стани для редагування кількості
  const [editingSupplierItemId, setEditingSupplierItemId] = useState(null);
  const [tempSuppliers, setTempSuppliers] = useState({});
  const [tempTotal, setTempTotal] = useState('');
  
  // Модалка списання пошкоджених
  const [writeOffModalItem, setWriteOffModalItem] = useState(null);
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [writeOffTarget, setWriteOffTarget] = useState('Основний склад');
  const [writeOffReason, setWriteOffReason] = useState('Пошкоджені коробки/пильовики');

  // Модалка: Відправка виробнику (Мілі / Валерію)
  const [sendModalItem, setSendModalItem] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTarget, setSendTarget] = useState('Міла');
  const [sendDateTime, setSendDateTime] = useState(() => new Date().toISOString().slice(0, 16));

  // Єдина історія транзакцій (списання + відправки + авто-списання по замовленнях)
  const [historyLog, setHistoryLog] = useState(() => {
    const saved = localStorage.getItem('stock_history_log');
    return saved ? JSON.parse(saved) : [];
  });

  // Завантаження замовлень з Firestore для автоматичного списання/повернень
  useEffect(() => {
    const fetchOrdersForStock = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetchedOrders = [];
        querySnapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() });
        });

        const processedOrderIds = JSON.parse(localStorage.getItem('processed_order_ids') || '[]');
        const newSuccessfulOrders = fetchedOrders.filter(o => o.status === 'Успішно' && !processedOrderIds.includes(o.id));
        const returnedOrders = fetchedOrders.filter(o => o.status === 'Відмова' && !processedOrderIds.includes(o.id + '_return'));

        if (newSuccessfulOrders.length > 0 || returnedOrders.length > 0) {
          let updatedStock = [...stock];
          let newLogEntries = [];
          let newlyProcessedIds = [...processedOrderIds];

          // 1. Успішні замовлення -> списуємо з "Основного складу"
          newSuccessfulOrders.forEach(order => {
            const boxIndex = updatedStock.findIndex(item => item.folderId === 'boxes');
            if (boxIndex !== -1) {
              const currentBox = updatedStock[boxIndex];
              const currentSuppliers = currentBox.suppliers || { 'Основний склад': currentBox.quantity || 0, 'Міла': 0, 'Валерій': 0 };
              const myStock = currentSuppliers['Основний склад'] || 0;
              
              if (myStock > 0) {
                currentSuppliers['Основний склад'] = Math.max(0, myStock - 1);
                currentBox.quantity = Math.max(0, (currentBox.quantity || 0) - 1);
                currentBox.suppliers = currentSuppliers;
                
                newLogEntries.push({
                  id: Date.now() + Math.random(),
                  type: 'auto_write_off',
                  itemName: `Коробка (успішне замовлення #${order.clientName || order.id.slice(0,5)})`,
                  target: 'Основний склад',
                  quantity: 1,
                  reason: 'Автосписання по виконаному замовленню',
                  date: new Date().toLocaleString()
                });
              }
            }

            const dustbagIndex = updatedStock.findIndex(item => item.folderId === 'dustbags');
            if (dustbagIndex !== -1) {
              const currentDb = updatedStock[dustbagIndex];
              const currentSuppliers = currentDb.suppliers || { 'Основний склад': currentDb.quantity || 0, 'Міла': 0, 'Валерій': 0 };
              const myStock = currentSuppliers['Основний склад'] || 0;
              
              if (myStock > 0) {
                currentSuppliers['Основний склад'] = Math.max(0, myStock - 1);
                currentDb.quantity = Math.max(0, (currentDb.quantity || 0) - 1);
                currentDb.suppliers = currentSuppliers;
                
                newLogEntries.push({
                  id: Date.now() + Math.random(),
                  type: 'auto_write_off',
                  itemName: `Пильовик (успішне замовлення #${order.clientName || order.id.slice(0,5)})`,
                  target: 'Основний склад',
                  quantity: 1,
                  reason: 'Автосписання по виконаному замовленню',
                  date: new Date().toLocaleString()
                });
              }
            }

            newlyProcessedIds.push(order.id);
          });

          // 2. Відмови (повернення) -> плюсуємо назад на "Основний склад"
          returnedOrders.forEach(order => {
            const boxIndex = updatedStock.findIndex(item => item.folderId === 'boxes');
            if (boxIndex !== -1) {
              const currentBox = updatedStock[boxIndex];
              const currentSuppliers = currentBox.suppliers || { 'Основний склад': currentBox.quantity || 0, 'Міла': 0, 'Валерій': 0 };
              currentSuppliers['Основний склад'] = (currentSuppliers['Основний склад'] || 0) + 1;
              currentBox.quantity = (currentBox.quantity || 0) + 1;
              currentBox.suppliers = currentSuppliers;

              newLogEntries.push({
                id: Date.now() + Math.random(),
                type: 'return',
                itemName: `Коробка (повернення від клієнта)`,
                target: 'Основний склад',
                quantity: 1,
                reason: 'Повернення (плюс на склад)',
                date: new Date().toLocaleString()
              });
            }

            const dustbagIndex = updatedStock.findIndex(item => item.folderId === 'dustbags');
            if (dustbagIndex !== -1) {
              const currentDb = updatedStock[dustbagIndex];
              const currentSuppliers = currentDb.suppliers || { 'Основний склад': currentDb.quantity || 0, 'Міла': 0, 'Валерій': 0 };
              currentSuppliers['Основний склад'] = (currentSuppliers['Основний склад'] || 0) + 1;
              currentDb.quantity = (currentDb.quantity || 0) + 1;
              currentDb.suppliers = currentSuppliers;

              newLogEntries.push({
                id: Date.now() + Math.random(),
                type: 'return',
                itemName: `Пильовик (повернення від клієнта)`,
                target: 'Основний склад',
                quantity: 1,
                reason: 'Повернення (плюс на склад)',
                date: new Date().toLocaleString()
              });
            }

            newlyProcessedIds.push(order.id + '_return');
          });

          if (newLogEntries.length > 0) {
            setHistoryLog(prev => [...newLogEntries, ...prev]);
            localStorage.setItem('processed_order_ids', JSON.stringify(newlyProcessedIds));
          }
        }
      } catch (err) {
        console.error("Помилка синхронізації замовлень зі складом:", err);
      }
    };

    fetchOrdersForStock();
  }, [stock]);

  useEffect(() => {
    if (activeFolder) {
      localStorage.setItem('activeFolder', activeFolder);
    } else {
      localStorage.removeItem('activeFolder');
    }
  }, [activeFolder]);

  useEffect(() => {
    localStorage.setItem('stock_history_log', JSON.stringify(historyLog));
  }, [historyLog]);

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

    const finalTotal = tempTotal !== '' ? Number(tempTotal) : (myStockVal + milaVal + valeriyVal);

    const updatedItem = {
      ...item,
      quantity: finalTotal,
      suppliers: updatedSuppliers
    };

    handleAddItemWrapper(updatedItem);
    setEditingSupplierItemId(null);
  };

  // Ручне списання пошкоджених
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
      type: 'write_off',
      itemName,
      target: writeOffTarget,
      quantity: qty,
      reason: writeOffReason || 'Пошкоджено',
      date: new Date().toLocaleString()
    };

    setHistoryLog(prev => [newRecord, ...prev]);
    setWriteOffModalItem(null);
    setWriteOffAmount('');
  };

  // Відправка виробникам із фіксацією часу та кількості
  const handleConfirmSendToManufacturer = (e) => {
    e.preventDefault();
    const qty = parseInt(sendAmount);
    if (!sendModalItem || isNaN(qty) || qty <= 0) return;

    const currentSuppliers = sendModalItem.suppliers || {
      'Основний склад': sendModalItem.quantity || 0,
      'Міла': 0,
      'Валерій': 0
    };

    const myStockVal = currentSuppliers['Основний склад'] || 0;
    if (qty > myStockVal) {
      alert('На твоєму основному складі недостатньо штук для відправки!');
      return;
    }

    const targetVal = currentSuppliers[sendTarget] || 0;

    const updatedSuppliers = {
      ...currentSuppliers,
      'Основний склад': myStockVal - qty,
      [sendTarget]: targetVal + qty
    };

    const updatedItem = {
      ...sendModalItem,
      suppliers: updatedSuppliers
    };

    handleAddItemWrapper(updatedItem);

    const itemName = sendModalItem.folderId === 'boxes' 
      ? `Коробки (${sendModalItem.sizeBox || 'Великі'})` 
      : (sendModalItem.name || 'Пильовик');

    const newRecord = {
      id: Date.now(),
      type: 'send',
      itemName,
      target: sendTarget,
      quantity: qty,
      date: sendDateTime ? sendDateTime.replace('T', ' ') : new Date().toLocaleString(),
      reason: `Відправлено виробнику (${sendTarget})`
    };

    setHistoryLog(prev => [newRecord, ...prev]);
    setSendModalItem(null);
    setSendAmount('');
  };

  const boxesList = stock.filter(item => item.folderId === 'boxes');
  const dustbagsList = stock.filter(item => item.folderId === 'dustbags');

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
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setSendModalItem(item);
                    setSendAmount('');
                    setSendDateTime(new Date().toISOString().slice(0, 16));
                  }}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                  title="Відправити виробнику"
                >
                  <Send size={13} /> Віддати
                </button>
                <button 
                  onClick={() => {
                    setWriteOffModalItem(item);
                    setWriteOffAmount('');
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                  title="Списати пошкоджені"
                >
                  <MinusCircle size={14} /> Списати
                </button>
              </div>
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
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-0 select-none">
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

            {/* Блок єдиної історії (рухи, відправки, автосписання по замовленнях та повернення) */}
            <div className="border-t border-slate-100 pt-6 space-y-3 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-900">Історія рухів та списань матеріалів</h3>
                {historyLog.length > 0 && (
                  <button 
                    onClick={() => {
                      setHistoryLog([]);
                      localStorage.removeItem('stock_history_log');
                      localStorage.removeItem('processed_order_ids');
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  >
                    Очистити історію
                  </button>
                )}
              </div>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                {historyLog.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Ще не було жодних операцій чи списань.</p>
                ) : (
                  <div className="space-y-2">
                    {historyLog.map(record => {
                      const isWriteOff = record.type === 'write_off' || record.type === 'auto_write_off';
                      const isReturn = record.type === 'return';
                      return (
                        <div key={record.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{record.itemName}</span>
                            <span className="text-slate-500 ml-2">({record.target})</span>
                            <div className={`text-[11px] font-medium mt-0.5 ${isWriteOff ? 'text-rose-600' : isReturn ? 'text-emerald-600' : 'text-indigo-600'}`}>
                              {record.reason}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-black ${isWriteOff ? 'text-rose-700' : isReturn ? 'text-emerald-700' : 'text-indigo-700'}`}>
                              {isWriteOff ? `-${record.quantity} шт` : `+${record.quantity} шт`}
                            </span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> {record.date}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Модалка відправки виробнику (з часом та кількістю) */}
      {sendModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Відправити виробнику</h3>
              <button onClick={() => setSendModalItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmSendToManufacturer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кому відправляємо:</label>
                <select 
                  value={sendTarget} 
                  onChange={e => setSendTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Міла">Міла</option>
                  <option value="Валерій">Валерій</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Кількість (шт):</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={sendAmount} 
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="Наприклад: 30" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Дата і час відправки:</label>
                <input 
                  type="datetime-local" 
                  value={sendDateTime} 
                  onChange={e => setSendDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setSendModalItem(null)} 
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Зберегти в історію
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка списання */}
      {writeOffModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Списання пошкоджених</h3>
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
                  placeholder="Наприклад: 5" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Причина / Примітка:</label>
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
              ) : (
                <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">Фото</div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedItemDetails.name}</h2>
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
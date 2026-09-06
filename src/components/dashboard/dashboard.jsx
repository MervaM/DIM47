import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Edit3, Trash2, Upload, Copy, Check } from 'lucide-react';

export default function DashboardLayout({ 
  orders, 
  sortedOrdersOldestFirst, 
  setOrders, 
  stock, 
  setStock,
  setFinances 
}) {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Всі');
  const [expandedCards, setExpandedCards] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formItems, setFormItems] = useState([{ name: '', size: '', color: '', colorImage: '', material: '', sole: '', price: '', cost: '', image: '' }]);
  const [formAdvance, setFormAdvance] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('Передоплата');
  const [formStatus, setFormStatus] = useState('Нові');

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddItemRow = () => {
    setFormItems([...formItems, { name: '', size: '', color: '', colorImage: '', material: '', sole: '', price: '', cost: '', image: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formItems];
    updated[index][field] = value;
    
    if (field === 'stockSelect' && value) {
      updated[index]['name'] = value;
    }

    setFormItems(updated);
  };

  const handleImageUpload = (index, field, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleItemChange(index, field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveItemRow = (index) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormClientName('');
    setFormClientPhone('');
    setFormCity('');
    setFormWarehouse('');
    setFormItems([{ name: '', size: '', color: '#000000', colorImage: '', material: '', sole: '', price: '', cost: '', image: '' }]);
    setFormAdvance('');
    setFormDiscount('');
    setFormNote('');
    setFormPaymentType('Передоплата');
    setFormStatus('Нові');
    setShowNewOrderModal(true);
  };

  const openEditModal = (ord) => {
    setEditingOrder(ord);
    setFormClientName(ord.clientName || '');
    setFormClientPhone(ord.clientPhone || '');
    setFormCity(ord.city || '');
    setFormWarehouse(ord.warehouse || '');
    setFormItems(ord.items && ord.items.length > 0 ? ord.items.map(i => ({ ...i, sole: i.sole || '', color: i.color || '#000000', colorImage: i.colorImage || '' })) : [{ name: '', size: '', color: '#000000', colorImage: '', material: '', sole: '', price: '', cost: '', image: '' }]);
    setFormAdvance(ord.advance ?? '');
    setFormDiscount(ord.discount ?? '');
    setFormNote(ord.note || '');
    setFormPaymentType(ord.paymentType || 'Передоплата');
    setFormStatus(ord.status || 'Нові');
    setShowNewOrderModal(true);
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();

    const calculatedTotal = formItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    const discountAmount = Number(formDiscount) || 0;
    const finalPrice = Math.max(0, calculatedTotal - discountAmount);
    const advanceAmount = Number(formAdvance) || 0;
    const remainingAmount = Math.max(0, finalPrice - advanceAmount);

    const formattedItems = formItems.map(i => ({
      name: i.name,
      size: i.size,
      color: i.color,
      colorImage: i.colorImage,
      material: i.material,
      sole: i.sole,
      price: Number(i.price) || 0,
      cost: Number(i.cost) || 0,
      image: i.image || ''
    }));

    if (editingOrder) {
      setOrders(orders.map(o => o.id === editingOrder.id ? {
        ...o,
        clientName: formClientName,
        clientPhone: formClientPhone,
        city: formCity,
        warehouse: formWarehouse,
        items: formattedItems,
        totalPrice: finalPrice,
        discount: discountAmount,
        advance: advanceAmount,
        remaining: remainingAmount,
        note: formNote,
        paymentType: formPaymentType,
        status: formStatus
      } : o));
    } else {
      const newOrderObj = {
        id: Date.now(),
        timestamp: Date.now(),
        clientName: formClientName,
        clientPhone: formClientPhone,
        city: formCity,
        warehouse: formWarehouse,
        items: formattedItems,
        totalPrice: finalPrice,
        discount: discountAmount,
        advance: advanceAmount,
        remaining: remainingAmount,
        note: formNote,
        paymentType: formPaymentType,
        status: formStatus
      };

      setOrders([newOrderObj, ...orders]);

      if (advanceAmount > 0) {
        const newIncomeTx = {
          id: Date.now() + 1,
          date: new Date().toISOString().split('T')[0],
          type: 'Дохід',
          category: 'Передплата за замовлення',
          amount: advanceAmount,
          comment: `Передплата від ${formClientName} (Замовлення #${newOrderObj.id})`
        };
        setFinances(prev => [newIncomeTx, ...prev]);
      }
    }

    setShowNewOrderModal(false);
    setSelectedStatusFilter('Всі'); 
  };

  const handleInlineFieldChange = (orderId, field, value) => {
    setOrders(orders.map(o => {
      if (o.id !== orderId) return o;
      const updated = { ...o, [field]: value };
      
      if (field === 'advance' || field === 'totalPrice') {
        const adv = field === 'advance' ? Number(value) || 0 : Number(o.advance) || 0;
        const tot = field === 'totalPrice' ? Number(value) || 0 : Number(o.totalPrice) || 0;
        updated.remaining = Math.max(0, tot - adv);
      }

      // Якщо статус змінюється на "Відмова" і раніше це не була відмова
      if (field === 'status' && value === 'Відмова' && o.status !== 'Відмова' && setStock && stock) {
        if (Array.isArray(o.items)) {
          const restoredStockItems = o.items.map(item => ({
            id: Date.now() + Math.random(),
            name: item.name || 'Товар із повернення',
            size: item.size || '',
            color: item.color || '',
            material: item.material || '',
            sole: item.sole || '',
            price: item.price || 0,
            cost: item.cost || 0,
            image: item.image || '',
            quantity: 1
          }));
          setStock(prevStock => [...restoredStockItems, ...prevStock]);
        }
      }

      return updated;
    }));
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Видалити це замовлення?')) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  const handleCopyClientInfo = (ord) => {
    const textToCopy = `${ord.clientName || ''}\n${ord.clientPhone || ''}\n${ord.city || ''}, ${ord.warehouse || ''}`.trim();
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(ord.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const counts = {
    'Всі': orders.filter(o => {
      const st = o.status || 'Нові';
      return st !== 'Доставлено' && st !== 'Відмова';
    }).length,
    'Нові': orders.filter(o => (o.status || 'Нові') === 'Нові').length,
    'В роботі': orders.filter(o => o.status === 'В роботі').length,
    'Доставлено': orders.filter(o => o.status === 'Доставлено').length,
    'Відмова': orders.filter(o => o.status === 'Відмова').length,
  };

  // Фільтрація: у вкладці "Всі" ховаємо "Доставлено" та "Відмова", у спеціальних вкладках показуємо тільки їх
  const filteredOrders = sortedOrdersOldestFirst.filter(o => {
    const st = o.status || 'Нові';
    if (selectedStatusFilter === 'Всі') {
      return st !== 'Доставлено' && st !== 'Відмова';
    }
    return st === selectedStatusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-3 sm:p-8 max-w-3xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
            <button 
              onClick={openCreateModal}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition w-full sm:w-auto"
            >
              <Plus size={18} /> Створити замовлення
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: 'Всі', key: 'Всі' },
              { label: 'Нові', key: 'Нові' },
              { label: 'В роботі', key: 'В роботі' },
              { label: 'Доставлено', key: 'Доставлено' },
              { label: 'Відмова', key: 'Відмова' },
            ].map(status => {
              const isActive = selectedStatusFilter === status.key;
              return (
                <button
                  key={status.key}
                  onClick={() => setSelectedStatusFilter(status.key)}
                  className={`px-4 py-2.5 rounded-xl border text-center transition shadow-sm flex items-center gap-2 flex-shrink-0 ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <span className={`text-xs font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {status.label}
                  </span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/10">
                    {counts[status.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 px-1">
              {selectedStatusFilter}
            </h3>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                Немає замовлень із таким статусом.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filteredOrders.map(ord => {
                  const isExpanded = expandedCards[ord.id];
                  const advance = Number(ord.advance) || 0;
                  const totalPrice = Number(ord.totalPrice) || 0;
                  const remaining = Math.max(0, totalPrice - advance);

                  return (
                    <div 
                      key={ord.id} 
                      className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition w-full flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select 
                            value={ord.paymentType || 'Передоплата'}
                            onChange={(e) => handleInlineFieldChange(ord.id, 'paymentType', e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer ${
                              ord.paymentType === 'Повна оплата' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <option value="Передоплата">Передоплата</option>
                            <option value="Повна оплата">Повна оплата</option>
                          </select>
                          <span className="text-[11px] text-slate-400 font-semibold">#{ord.id}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <select 
                            value={ord.status || 'Нові'}
                            onChange={(e) => handleInlineFieldChange(ord.id, 'status', e.target.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer ${
                              ord.status === 'Доставлено' ? 'bg-emerald-50 text-emerald-700' :
                              ord.status === 'Відмова' ? 'bg-rose-50 text-rose-700' :
                              ord.status === 'В роботі' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <option value="Нові">Нові</option>
                            <option value="В роботі">В роботі</option>
                            <option value="Доставлено">Доставлено</option>
                            <option value="Відмова">Відмова</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openEditModal(ord)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition"
                              title="Редагувати повністю"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                              title="Видалити"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {Array.isArray(ord.items) && ord.items.map((item, idx) => {
                          const rawParamsList = [
                            item.size,
                            item.color,
                            item.material,
                            item.sole
                          ].filter(Boolean);

                          const cleanParamsString = rawParamsList.join(', ');

                          return (
                            <div key={idx} className="flex flex-col gap-2.5">
                              {item.image ? (
                                <div className="w-full h-auto max-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                                  <img 
                                    src={item.image} 
                                    alt="Взуття" 
                                    className="w-full h-auto max-h-[340px] object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-44 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                                  Фото відсутнє
                                </div>
                              )}

                              {(item.color || item.colorImage) && (
                                <div className="flex flex-col gap-1">
                                  {item.colorImage ? (
                                    <div className="h-16 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                      <img src={item.colorImage} alt="Колір" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div 
                                      className="h-16 w-full rounded-2xl border border-slate-200 shadow-sm" 
                                      style={{ backgroundColor: item.color }}
                                      title={item.color}
                                    />
                                  )}
                                </div>
                              )}

                              <div className="bg-slate-50/80 border border-slate-100 px-3.5 py-2.5 rounded-xl flex flex-col gap-1.5">
                                {item.name && <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>}
                                
                                <div className="text-xs font-semibold text-slate-800">
                                  {cleanParamsString || 'Параметри не вказані'}
                                </div>

                                <div className="flex flex-wrap justify-between items-center pt-1.5 border-t border-slate-200/60 text-xs gap-2">
                                  <span className="text-slate-500 font-medium">Ціна за пару:</span>
                                  <strong className="text-slate-900 font-bold">{item.price || 0} грн</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleCopyClientInfo(ord)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                              copiedId === ord.id 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                            }`}
                            title="Скопіювати всю інформацію одним кліком"
                          >
                            {copiedId === ord.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === ord.id ? 'Скопійовано' : 'Скопіювати'}
                          </button>
                        </div>

                        <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-sm">
                          <span className="font-bold text-base text-slate-900">
                            {ord.clientName || 'ПІБ не вказано'}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {ord.clientPhone || 'Телефон не вказано'}
                          </span>
                          <span className="text-xs text-slate-600">
                            {`${ord.city || ''}, ${ord.warehouse || ''}`.trim() !== ',' ? `${ord.city || ''}, ${ord.warehouse || ''}` : 'Адреса не вказана'}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-col gap-3 bg-slate-50/60 p-3 rounded-xl text-xs text-slate-700">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 block">Коментар:</span>
                            <textarea 
                              value={ord.note || ''}
                              onChange={(e) => handleInlineFieldChange(ord.id, 'note', e.target.value)}
                              className="w-full bg-white p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                              rows="2"
                              placeholder="Залишити коментар..."
                            />
                          </div>

                          <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-200/60 font-medium gap-2">
                            <div className="flex items-center gap-1">
                              <span>Завдаток:</span>
                              <input 
                                type="number"
                                value={ord.advance ?? ''}
                                onChange={(e) => handleInlineFieldChange(ord.id, 'advance', e.target.value)}
                                className="w-24 font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-right focus:outline-none focus:border-indigo-500"
                                placeholder="0"
                              />
                              <span>грн</span>
                            </div>
                            <div>Залишок до сплати: <strong className="text-indigo-600 text-sm">{remaining} грн</strong></div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center mt-2 gap-2">
                        <span className="text-xs text-slate-500">Всього: <strong className="text-slate-900 text-sm">{totalPrice} грн</strong></span>
                        <button 
                          onClick={() => toggleExpand(ord.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition"
                        >
                          {isExpanded ? 'Сховати' : 'Більше'} 
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingOrder ? 'Редагувати замовлення' : 'Нове замовлення'}
            </h2>
            <form onSubmit={handleSaveOrder} className="flex flex-col gap-4">
              
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Товари та характеристики</label>
                  <button 
                    type="button" 
                    onClick={handleAddItemRow}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    + Додати товар
                  </button>
                </div>

                {formItems.map((item, index) => (
                  <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-sm">
                    <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                      <div className="flex-1 flex gap-2 w-full sm:w-auto">
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              handleItemChange(index, 'name', val);
                            }
                          }}
                          className="w-1/3 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 cursor-pointer text-slate-600"
                        >
                          <option value="">Обрати зі складу...</option>
                          {stock && stock.map((st, idxSt) => (
                            <option key={idxSt} value={st.name || st.material}>
                              {st.name || st.material} {st.color ? `(${st.color})` : ''}
                            </option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          placeholder="Назва взуття (необов'язково)"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-medium"
                        />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Ціна (грн)"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-full sm:w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                      />
                      {formItems.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItemRow(index)}
                          className="text-rose-500 font-bold px-2 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input 
                        type="text" 
                        placeholder="Розмір (напр. 39)"
                        value={item.size}
                        onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Колір (напр. чорна)"
                        value={item.color}
                        onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Матеріал (напр. шкіра)"
                        value={item.material}
                        onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Підошва (при потребі)"
                        value={item.sole}
                        onChange={(e) => handleItemChange(index, 'sole', e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Палітра:</span>
                        <input 
                          type="color" 
                          value={item.color?.startsWith('#') ? item.color : '#000000'}
                          onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                          className="w-8 h-7 rounded border border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                      </div>

                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition">
                        <Upload size={14} />
                        {item.colorImage ? 'Змінити фото кольору' : 'Завантажити колір з пристрою'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(index, 'colorImage', e)} 
                          className="hidden" 
                        />
                      </label>
                      {item.colorImage && (
                        <div className="flex items-center gap-1">
                          <img src={item.colorImage} alt="Color preview" className="w-6 h-6 object-cover rounded border" />
                          <button type="button" onClick={() => handleItemChange(index, 'colorImage', '')} className="text-rose-500">✕</button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                      <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition">
                        <Upload size={14} />
                        {item.image ? 'Змінити фото взуття' : 'Завантажити фото взуття з пристрою'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(index, 'image', e)} 
                          className="hidden" 
                        />
                      </label>
                      {item.image && (
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt="Preview" className="w-8 h-8 object-cover rounded border" />
                          <span className="text-[11px] text-emerald-600 font-medium">Фото завантажено</span>
                          <button 
                            type="button" 
                            onClick={() => handleItemChange(index, 'image', '')}
                            className="text-xs text-rose-500 hover:underline"
                          >
                            Видалити
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ПІБ клієнта</label>
                  <input 
                    type="text" 
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                    placeholder="Прізвище Ім'я"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Телефон</label>
                  <input 
                    type="text" 
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                    placeholder="+380..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Місто</label>
                  <input 
                    type="text" 
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="Місто"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Відділення / Адреса</label>
                  <input 
                    type="text" 
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="№ відділення або адреса"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Тип оплати</label>
                  <select 
                    value={formPaymentType}
                    onChange={(e) => setFormPaymentType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Передоплата">Передоплата</option>
                    <option value="Повна оплата">Повна оплата</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Завдаток (грн)</label>
                  <input 
                    type="number" 
                    value={formAdvance}
                    onChange={(e) => setFormAdvance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Знижка (грн)</label>
                  <input 
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Коментар</label>
                <textarea 
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  rows="2"
                  placeholder="Додаткові побажання..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Скасувати
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                >
                  {editingOrder ? 'Зберегти зміни' : 'Створити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';

export default function DashboardCards({ orders = [], onEdit, onDelete, onStatusChange }) {
  const [copiedId, setCopiedId] = useState(null);
  const [copiedTtnId, setCopiedTtnId] = useState(null);
  
  // Стан для редагування конкретної картки за її ID
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleCopyClient = (order, e) => {
    e.stopPropagation();
    const clientName = order.client || order.clientName || '—';
    const clientPhone = order.phone || order.clientPhone || '—';
    const city = order.city || '';
    const warehouse = order.warehouse || '';
    const address = [city, warehouse].filter(Boolean).join(', ') || '—';

    const textToCopy = `${clientName}\n${clientPhone}\n${address}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyTtn = (ttn, id, e) => {
    e.stopPropagation();
    if (!ttn) return;
    navigator.clipboard.writeText(ttn);
    setCopiedTtnId(id);
    setTimeout(() => setCopiedTtnId(null), 2000);
  };

  const startInlineEdit = (order, e) => {
    e.stopPropagation();
    setEditingCardId(order.id);
    setEditForm({
      client: order.client || order.clientName || '',
      phone: order.phone || order.clientPhone || '',
      city: order.city || '',
      warehouse: order.warehouse || '',
      ttn: order.ttn || '',
      price: order.price || '',
      advance: order.advance || ''
    });
  };

  const handleSaveInlineEdit = (orderId) => {
    if (onEdit) {
      onEdit({
        ...orders.find(o => o.id === orderId),
        client: editForm.client,
        clientName: editForm.client,
        phone: editForm.phone,
        clientPhone: editForm.phone,
        city: editForm.city,
        warehouse: editForm.warehouse,
        ttn: editForm.ttn,
        price: editForm.price,
        advance: editForm.advance
      });
    }
    setEditingCardId(null);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs">
        Ще немає жодного замовлення
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {orders.map((order) => {
        const isEditing = editingCardId === order.id;
        const priceNum = Number(isEditing ? editForm.price : order.price) || 0;
        const advanceNum = Number(isEditing ? editForm.advance : order.advance) || 0;
        const remaining = priceNum - advanceNum;
        const isCopied = copiedId === order.id;
        const isTtnCopied = copiedTtnId === order.id;

        const productImage = order.image || order.productImage;
        const colorImg = order.colorImage;

        const rawSize = order.size;
        const rawColor = order.colorText || order.color;
        const rawMaterial = order.material;
        const rawExtra = order.filling || order.sole || order.lining;

        const cleanDetails = [
          rawSize ? `${rawSize} розм.` : null,
          rawColor && rawColor !== '—' ? rawColor : null,
          rawMaterial && rawMaterial !== '—' ? rawMaterial : null,
          rawExtra && rawExtra !== '—' ? rawExtra : null,
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-3 space-y-2.5">
            
            {/* Статус зліва, Редагування/Видалення справа */}
            <div className="flex justify-between items-center px-0.5">
              <select 
                value={order.status || 'Нове'}
                onChange={(e) => onStatusChange && onStatusChange(order.id, e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border outline-none bg-amber-50 text-amber-800 border-amber-200 cursor-pointer"
              >
                <option value="Нове">Нове</option>
                <option value="В роботі">В роботі</option>
                <option value="Доставка">Доставка</option>
                <option value="Успішно">Успішно</option>
                <option value="Відмова">Відмова</option>
              </select>

              <div className="flex gap-1">
                {isEditing ? (
                  <button 
                    type="button"
                    onClick={() => handleSaveInlineEdit(order.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                  >
                    ✓ Зберегти
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => startInlineEdit(order, e)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    title="Редагувати картку"
                  >
                    ✏️
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => onDelete && onDelete(order.id)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  title="Видалити"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* ВЕЛИКЕ ФОТО (h-72) + ЗБІЛЬШЕНА СМУЖКА КОЛЬОРУ (h-20) */}
            {productImage ? (
              <div className="space-y-1.5 -mx-3">
                <div className="w-full h-72 bg-slate-50 border-y border-slate-100 overflow-hidden flex items-center justify-center">
                  <img 
                    src={productImage} 
                    alt="Товар" 
                    className="w-full h-full object-contain" 
                  />
                </div>

                {colorImg && (
                  <div className="w-full h-20 overflow-hidden border-b border-slate-100 px-3">
                    <img 
                      src={colorImg} 
                      alt="Колір" 
                      className="w-full h-full object-cover rounded-xl shadow-xs border border-slate-200/60" 
                    />
                  </div>
                )}
              </div>
            ) : null}

            {/* Назва та характеристики */}
            <div className="text-center pt-1 px-1 space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">{order.productTitle}</h3>
              {cleanDetails && (
                <p className="text-base font-extrabold text-slate-950 tracking-tight">{cleanDetails}</p>
              )}
            </div>

            {/* ДАНІ ПОКУПЦЯ (Зі статусом редагування) */}
            {isEditing ? (
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">ПІБ Клієнта</label>
                  <input 
                    type="text"
                    value={editForm.client}
                    onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Телефон</label>
                  <input 
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Місто</label>
                    <input 
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Відділення</label>
                    <input 
                      type="text"
                      value={editForm.warehouse}
                      onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={(e) => handleCopyClient(order, e)}
                className={`py-2 px-3 border rounded-xl transition cursor-pointer relative flex items-center justify-between ${
                  isCopied 
                    ? 'bg-emerald-50 border-emerald-300' 
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
                }`}
                title="Натисніть, щоб скопіювати дані покупця"
              >
                <div className="w-8"></div>

                <div className="text-center space-y-0.5">
                  <div className="text-base font-extrabold text-slate-950 tracking-tight">{order.client || order.clientName || '—'}</div>
                  <div className="text-xs font-semibold text-slate-700">{order.phone || order.clientPhone || '—'}</div>
                  <div className="text-xs text-slate-600">
                    {order.city}{order.warehouse ? `, ${order.warehouse}` : ''}
                  </div>
                </div>

                <div className={`p-1.5 rounded-lg text-xs transition ${
                  isCopied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 shadow-2xs'
                }`}>
                  {isCopied ? '✓' : '📋'}
                </div>
              </div>
            )}

            {/* ПОЛЕ ДЛЯ ТТН НОВОЇ ПОШТИ */}
            <div className="pt-1">
              {isEditing ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">ТТН Нової Пошти</label>
                  <input 
                    type="text"
                    placeholder="20450000000000"
                    value={editForm.ttn}
                    onChange={(e) => setEditForm({ ...editForm, ttn: e.target.value })}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg outline-none text-slate-900 font-mono text-xs font-bold"
                  />
                </div>
              ) : (
                <div 
                  onClick={(e) => handleCopyTtn(order.ttn, order.id, e)}
                  className={`py-1.5 px-3 border rounded-xl flex items-center justify-between transition ${
                    order.ttn 
                      ? 'bg-amber-50/60 border-amber-200/80 cursor-pointer hover:bg-amber-100/50' 
                      : 'bg-slate-50 border-dashed border-slate-200'
                  }`}
                  title={order.ttn ? "Натисніть, щоб скопіювати ТТН" : "ТТН не додано"}
                >
                  <span className="text-xs font-bold text-slate-500">ТТН:</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {order.ttn || '—'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                    isTtnCopied ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}>
                    {isTtnCopied ? '✓' : (order.ttn ? '📋' : '')}
                  </span>
                </div>
              )}
            </div>

            {/* Ціна товару, передплата та залишок до сплати */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Ціна товару:</span>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editForm.price} 
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-20 p-0.5 border rounded text-right bg-white"
                  />
                ) : (
                  <span>{priceNum} грн</span>
                )}
              </div>
              <div className="flex justify-between text-slate-700 text-xs">
                <span>Передплата:</span>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editForm.advance} 
                    onChange={(e) => setEditForm({ ...editForm, advance: e.target.value })}
                    className="w-20 p-0.5 border rounded text-right bg-white"
                  />
                ) : (
                  <span>{advanceNum} грн</span>
                )}
              </div>
              <div className="flex justify-between font-semibold text-emerald-700 border-t border-slate-200/60 pt-1 text-xs">
                <span>Залишок до сплати:</span>
                <span>{remaining} грн</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
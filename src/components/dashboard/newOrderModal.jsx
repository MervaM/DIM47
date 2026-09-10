import React, { useState, useEffect } from 'react';

export default function NewOrderModal({ isOpen, onClose, onSave, stock = [], orderToEdit }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [colorImage, setColorImage] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [sole, setSole] = useState('');
  const [color, setColor] = useState('');
  const [lining, setLining] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [smartText, setSmartText] = useState('');
  const [paymentType, setPaymentType] = useState('Передплата');
  const [advance, setAdvance] = useState('300');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');

  // Заповнення або очищення полів при відкритті модалки
  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setName(orderToEdit.productTitle || orderToEdit.name || '');
        setImage(orderToEdit.image || '');
        setColorImage(orderToEdit.colorImage || '');
        setSize(orderToEdit.size || '');
        setMaterial(orderToEdit.material || '');
        setSole(orderToEdit.sole || '');
        setColor(orderToEdit.colorText || orderToEdit.color || '');
        setLining(orderToEdit.filling || orderToEdit.lining || '');
        setClientName(orderToEdit.client || orderToEdit.clientName || '');
        setPhone(orderToEdit.phone || orderToEdit.clientPhone || '');
        setCity(orderToEdit.city || '');
        setAddress(orderToEdit.warehouse || orderToEdit.address || '');
        setPaymentType(orderToEdit.payment || orderToEdit.paymentType || 'Передплата');
        setAdvance(orderToEdit.advance !== undefined ? String(orderToEdit.advance) : '0');
        setDiscount(orderToEdit.discount !== undefined ? String(orderToEdit.discount) : '0');
        setComment(orderToEdit.note || orderToEdit.comment || '');
        setPrice(orderToEdit.price !== undefined ? String(orderToEdit.price) : '');
      } else {
        setName('');
        setImage('');
        setColorImage('');
        setSize('');
        setMaterial('');
        setSole('');
        setColor('');
        setLining('');
        setClientName('');
        setPhone('');
        setCity('');
        setAddress('');
        setSmartText('');
        setPaymentType('Передплата');
        setAdvance('300');
        setDiscount('0');
        setComment('');
        setPrice('');
      }
    }
  }, [isOpen, orderToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      image,
      colorImage,
      size,
      material,
      sole,
      color,
      lining,
      clientName,
      phone,
      city,
      address,
      paymentType,
      advance,
      discount,
      comment,
      price
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            {orderToEdit ? 'Редагувати замовлення' : 'Нове замовлення'}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Назва товару</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              placeholder="Введіть назву"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Розмір</label>
              <input 
                type="text" 
                value={size} 
                onChange={(e) => setSize(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="Напр. 38"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ціна (грн)</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Колір</label>
              <input 
                type="text" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="Колір"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Матеріал</label>
              <input 
                type="text" 
                value={material} 
                onChange={(e) => setMaterial(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="Шкіра/замша"
              />
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ім'я клієнта</label>
            <input 
              type="text" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              placeholder="ПІБ клієнта"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Телефон</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              placeholder="+380..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Місто</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="Місто"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Відділення / Адреса</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                placeholder="№ відділення"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Передплата</label>
              <input 
                type="number" 
                value={advance} 
                onChange={(e) => setAdvance(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Знижка</label>
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Коментар</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900 resize-none h-16"
              placeholder="Додаткові побажання..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="w-1/2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              Скасувати
            </button>
            <button 
              type="submit" 
              className="w-1/2 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
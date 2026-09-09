import React, { useState } from 'react';
import NewOrderModal from '../dashboard/newOrderModal';

export default function Dashboard() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  // Поля форми нового замовлення
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formAdvance, setFormAdvance] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('Передоплата');
  const [formNote, setFormNote] = useState('');

  // Початкові дані (старіші зверху: 05.09, потім 06.09, потім 07.09)
  const [orders, setOrders] = useState([
    { id: 1, date: '05.09.2026', client: 'Олена Коваль', phone: '+380671112233', city: 'Київ', warehouse: 'Відділення №5', status: 'В обробці', amount: '1,450 грн', payment: 'Передоплата' },
    { id: 2, date: '06.09.2026', client: 'Іван Петренко', phone: '+380502223344', city: 'Львів', warehouse: 'Відділення №12', status: 'Відправлено', amount: '2,300 грн', payment: 'Повна оплата' },
    { id: 3, date: '07.09.2026', client: 'Марія Шевченко', phone: '+380933334455', city: 'Одеса', warehouse: 'Поштомат №45', status: 'Виконано', amount: '890 грн', payment: 'Передоплата' },
  ]);

  const handleSaveOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleDateString('uk-UA'),
      client: formClientName || 'Без імені',
      phone: formClientPhone || '—',
      city: formCity || '—',
      warehouse: formWarehouse || '—',
      status: 'В обробці',
      amount: `${formAdvance || 0} грн`,
      payment: formPaymentType
    };
    
    // Додаємо нове замовлення в КІНЕЦЬ списку, щоб старі залишалися зверху
    setOrders([...orders, newOrder]);
    setShowNewOrderModal(false);
    
    // Очищення форми
    setFormClientName('');
    setFormClientPhone('');
    setFormCity('');
    setFormWarehouse('');
    setFormAdvance('');
    setFormDiscount('');
    setFormNote('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Кнопка додавання зверху на всю ширину для мобілки */}
      <div className="mb-6">
        <button 
          onClick={() => setShowNewOrderModal(true)}
          className="w-full sm:w-auto bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
        >
          <span>+ Додати замовлення</span>
        </button>
      </div>

      {/* Список замовлень у вигляді карток (старіші зверху завдяки порядку в масиві) */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-slate-200 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs text-slate-400 font-medium">{order.date}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{order.client}</h3>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                order.status === 'В обробці' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                order.status === 'Відправлено' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
              <div>📞 {order.phone}</div>
              <div>📍 {order.city} {order.warehouse && `(${order.warehouse})`}</div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-sm">
              <span className="text-slate-500">{order.payment}</span>
              <span className="font-bold text-slate-900">{order.amount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Модальне вікно */}
      <NewOrderModal 
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSubmit={handleSaveOrder}
        formClientName={formClientName} setFormClientName={setFormClientName}
        formClientPhone={formClientPhone} setFormClientPhone={setFormClientPhone}
        formCity={formCity} setFormCity={setFormCity}
        formWarehouse={formWarehouse} setFormWarehouse={setFormWarehouse}
        formAdvance={formAdvance} setFormAdvance={setFormAdvance}
        formDiscount={formDiscount} setFormDiscount={setFormDiscount}
        formPaymentType={formPaymentType} setFormPaymentType={setFormPaymentType}
        formNote={formNote} setFormNote={setFormNote}
      />
    </div>
  );
}
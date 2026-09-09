import React, { useState, useEffect } from 'react';
import NewOrderModal from './newOrderModal';
import DashboardCards from './dashboardCards';
import { db } from "../../firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";

export default function Dashboard() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formAdvance, setFormAdvance] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('Передоплата');
  const [formNote, setFormNote] = useState('');
  
  const [formProductTitle, setFormProductTitle] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColorText, setFormColorText] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formSole, setFormSole] = useState('');
  const [formPrice, setFormPrice] = useState('2500');
  const [formProductImage, setFormProductImage] = useState('');
  const [formColorImage, setFormColorImage] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Всі');
  const [loading, setLoading] = useState(true);

  const statuses = ['Всі', 'Нове', 'В роботі', 'Доставка', 'Відмова'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const loadedOrders = [];
      querySnapshot.forEach((document) => {
        const item = document.data();
        loadedOrders.push({
          id: document.id,
          date: item.date || new Date().toLocaleDateString('uk-UA'),
          status: item.status || 'Нове',
          client: item.clientName || item.client || '',
          phone: item.clientPhone || item.phone || '',
          city: item.city || '',
          warehouse: item.warehouse || '',
          email: item.email || '',
          advance: item.advance !== undefined ? item.advance : 0,
          discount: item.discount || '',
          payment: item.paymentType || item.payment || '',
          note: item.note || '',
          productTitle: item.productTitle || item.product_title || '',
          size: item.size || '',
          colorText: item.colorText || item.color_text || '',
          material: item.material || '',
          sole: item.sole || '',
          price: item.price !== undefined ? item.price : 0,
          image: item.productImage || item.image || '',
          colorImage: item.colorImage || item.color_image || '',
          productDetails: item.productDetails || `${item.size || '—'} розм., ${item.colorText || item.color_text || '—'}, ${item.material || '—'}, ${item.sole || '—'}`
        });
      });

      setOrders(loadedOrders);
    } catch (error) {
      console.error('Помилка завантаження замовлень:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormClientName('');
    setFormClientPhone('');
    setFormCity('');
    setFormWarehouse('');
    setFormAdvance('300');
    setFormDiscount('');
    setFormPaymentType('Передоплата');
    setFormNote('');
    setFormProductTitle('');
    setFormSize('');
    setFormColorText('');
    setFormMaterial('');
    setFormSole('');
    setFormPrice('2500');
    setFormProductImage('');
    setFormColorImage('');
    setShowNewOrderModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingId(order.id);
    setFormClientName(order.client || '');
    setFormClientPhone(order.phone || '');
    setFormCity(order.city || '');
    setFormWarehouse(order.warehouse || '');
    setFormAdvance(order.advance || '');
    setFormDiscount(order.discount || '');
    setFormPaymentType(order.payment || 'Передоплата');
    setFormNote(order.note || '');
    setFormProductTitle(order.productTitle || '');
    setFormSize(order.size || '');
    setFormColorText(order.colorText || '');
    setFormMaterial(order.material || '');
    setFormSole(order.sole || '');
    setFormPrice(order.price || '2500');
    setFormProductImage(order.image || '');
    setFormColorImage(order.colorImage || '');
    setShowNewOrderModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    
    const dbPayload = {
      clientName: formClientName || 'Без імені',
      clientPhone: formClientPhone || '—',
      city: formCity || '—',
      warehouse: formWarehouse || '—',
      advance: Number(formAdvance) || 0,
      discount: Number(formDiscount) || 0,
      paymentType: formPaymentType,
      note: formNote,
      productTitle: formProductTitle || 'Черевики',
      size: formSize,
      colorText: formColorText,
      material: formMaterial,
      sole: formSole,
      price: Number(formPrice) || 0,
      productImage: formProductImage || '',
      colorImage: formColorImage || '',
      productDetails: `${formSize || '—'} розм., ${formColorText || '—'}, ${formMaterial || '—'}, ${formSole || '—'}`
    };

    try {
      if (editingId) {
        const orderRef = doc(db, "orders", editingId);
        await updateDoc(orderRef, dbPayload);
      } else {
        const newDbPayload = {
          ...dbPayload,
          date: new Date().toLocaleDateString('uk-UA'),
          status: 'Нове',
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, "orders"), newDbPayload);
      }

      await fetchOrders();
      setShowNewOrderModal(false);
      setEditingId(null);
    } catch (error) {
      console.error('Помилка збереження:', error);
      alert('Не вдалося зберегти замовлення');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це замовлення?')) return;

    try {
      await deleteDoc(doc(db, "orders", id));
      setOrders(orders.filter(o => o.id !== id));
    } catch (error) {
      console.error('Помилка видалення:', error);
      alert('Не вдалося видалити замовлення');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Помилка зміни статусу:', error);
    }
  };

  const filteredOrders = activeFilter === 'Всі' 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  return (
    <div className="p-3 sm:p-4 max-w-md mx-auto pt-4">
      <div className="mb-3">
        <button 
          type="button"
          onClick={handleOpenCreateModal}
          className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+ Додати замовлення</span>
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {statuses.map((status) => {
          const count = status === 'Всі' ? orders.length : orders.filter(o => o.status === status).length;
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{status}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Завантаження замовлень...
        </div>
      ) : (
        <DashboardCards 
          orders={filteredOrders} 
          onEdit={handleEditOrder} 
          onDelete={handleDeleteOrder} 
          onStatusChange={handleStatusChange} 
        />
      )}

      <NewOrderModal 
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSubmit={handleSaveOrder}
        isEditing={!!editingId}
        formClientName={formClientName} setFormClientName={setFormClientName}
        formClientPhone={formClientPhone} setFormClientPhone={setFormClientPhone}
        formCity={formCity} setFormCity={setFormCity}
        formWarehouse={formWarehouse} setFormWarehouse={setFormWarehouse}
        formAdvance={formAdvance} setFormAdvance={setFormAdvance}
        formDiscount={formDiscount} setFormDiscount={setFormDiscount}
        formPaymentType={formPaymentType} setFormPaymentType={setFormPaymentType}
        formNote={formNote} setFormNote={setFormNote}
        formProductTitle={formProductTitle} setFormProductTitle={setFormProductTitle}
        formSize={formSize} setFormSize={setFormSize}
        formColorText={formColorText} setFormColorText={setFormColorText}
        formMaterial={formMaterial} setFormMaterial={setFormMaterial}
        formSole={formSole} setFormSole={setFormSole}
        formPrice={formPrice} setFormPrice={setFormPrice}
        formProductImage={formProductImage} setFormProductImage={setFormProductImage}
        formColorImage={formColorImage} setFormColorImage={setFormColorImage}
      />
    </div>
  );
}
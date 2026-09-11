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
  doc 
} from "firebase/firestore";

export default function Dashboard() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Всі');
  const [loading, setLoading] = useState(true);

  // Класичні статуси без додаткової вкладки Повернення
  const statuses = ['Всі', 'Нове', 'В роботі', 'Доставка', 'Успішно', 'Відмова'];

  useEffect(() => {
    fetchOrders();
    fetchStockProducts();
  }, []);

  const fetchStockProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "stock"));
      const items = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({ 
          id: docSnap.id, 
          ...data,
          price: data.price !== undefined ? data.price : data.cost
        });
      });
      setStockProducts(items);
    } catch (error) {
      console.error('Помилка завантаження складу з хмари:', error);
    }
  };

  const sortOrdersList = (ordersArray) => {
    const isCompleted = (status) => status === 'Доставка' || status === 'Успішно' || status === 'Відмова';

    return [...ordersArray].sort((a, b) => {
      const compA = isCompleted(a.status);
      const compB = isCompleted(b.status);

      if (compA !== compB) {
        return compA ? 1 : -1;
      }

      const dateA = a.createdAt || '2025-01-01T00:00:00.000Z';
      const dateB = b.createdAt || '2025-01-01T00:00:00.000Z';

      if (!compA) {
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return a.id.localeCompare(b.id);
      } else {
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        return b.id.localeCompare(a.id);
      }
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "orders"));
      
      const loadedOrdersMap = new Map();
      
      querySnapshot.forEach((document) => {
        const item = document.data();
        const id = document.id;

        loadedOrdersMap.set(id, {
          id: id,
          date: item.date || new Date().toLocaleDateString('uk-UA'),
          status: item.status || 'Нове',
          client: item.clientName || item.client || '',
          phone: item.clientPhone || item.phone || '',
          city: item.city || '',
          warehouse: item.warehouse || '',
          ttn: item.ttn || '',
          advance: item.advance !== undefined ? item.advance : 0,
          discount: item.discount || '',
          payment: item.paymentType || item.payment || '',
          note: item.note || '',
          productTitle: item.productTitle || item.name || '',
          size: item.size || '',
          colorText: item.colorText || item.color || '',
          material: item.material || '',
          sole: item.sole || '',
          filling: item.filling || item.lining || '',
          price: item.price !== undefined ? item.price : 0,
          image: item.productImage || item.image || '',
          colorImage: item.colorImage || '',
          createdAt: item.createdAt || '',
          stockItemId: item.stockItemId || '',
          productDetails: item.productDetails || `${item.size || '—'} розм., ${item.colorText || item.color || ''}, ${item.material || ''}, ${item.filling || item.sole || ''}`
        });
      });

      const loadedOrders = Array.from(loadedOrdersMap.values());
      setOrders(sortOrdersList(loadedOrders));
    } catch (error) {
      console.error('Помилка завантаження замовлень:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setShowNewOrderModal(true);
  };

  const handleEditOrderModal = (order) => {
    setEditingId(order.id);
    setShowNewOrderModal(true);
  };

  const handleInlineSaveOrder = async (updatedOrder) => {
    try {
      const orderRef = doc(db, "orders", updatedOrder.id);
      
      const updateData = {
        clientName: updatedOrder.client || updatedOrder.clientName || '',
        clientPhone: updatedOrder.phone || updatedOrder.clientPhone || '',
        city: updatedOrder.city || '',
        warehouse: updatedOrder.warehouse || '',
        ttn: updatedOrder.ttn || '',
        price: Number(updatedOrder.price) || 0,
        advance: Number(updatedOrder.advance) || 0,
      };

      await updateDoc(orderRef, updateData);

      setOrders(prevOrders => {
        const updatedList = prevOrders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder, ...updateData } : o);
        return sortOrdersList(updatedList);
      });
    } catch (error) {
      console.error('Помилка оновлення картки:', error);
      alert('Не вдалося зберегти зміни');
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      const dbPayload = {
        clientName: orderData.clientName || 'Без імені',
        clientPhone: orderData.phone || '—',
        city: orderData.city || '—',
        warehouse: orderData.address || '—',
        ttn: orderData.ttn || '',
        advance: Number(orderData.advance) || 0,
        discount: Number(orderData.discount) || 0,
        paymentType: orderData.paymentType || 'Передплата',
        note: orderData.comment || '',
        productTitle: orderData.name || 'Черевики',
        size: orderData.size || '',
        colorText: orderData.color || '',
        material: orderData.material || '',
        sole: orderData.sole || '',
        filling: orderData.lining || '',
        price: Number(orderData.price) || 0,
        productImage: orderData.image || '',
        colorImage: orderData.colorImage || '',
        stockItemId: orderData.stockItemId || '',
        productDetails: `${orderData.size || '—'} розм., ${orderData.color || '—'}, ${orderData.material || '—'}, ${orderData.lining || orderData.sole || '—'}`
      };

      // Якщо замовлення створюється з товару з папки Наявність (availability) — видаляємо його зі складу
      if (orderData.stockItemId) {
        await deleteDoc(doc(db, "stock", orderData.stockItemId));
        await fetchStockProducts();
      }

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

  // Зміна статусу: при статусі "Відмова" створюємо товар у папці "Наявність"
  const handleStatusChange = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      const targetOrder = orders.find(o => o.id === id);

      await updateDoc(orderRef, { status: newStatus });

      if (newStatus === 'Відмова' && targetOrder) {
        await addDoc(collection(db, "stock"), {
          folderId: 'availability',
          name: targetOrder.productTitle || targetOrder.name || 'Товар з відмови',
          size: targetOrder.size || '',
          color: targetOrder.colorText || targetOrder.color || '',
          material: targetOrder.material || '',
          sole: targetOrder.sole || '',
          price: Number(targetOrder.price) || 0,
          status: 'відмова',
          image: targetOrder.image || '',
          createdAt: new Date().toISOString()
        });

        await fetchStockProducts();
      }
      
      setOrders(prevOrders => {
        const updated = prevOrders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        return sortOrdersList(updated);
      });
    } catch (error) {
      console.error('Помилка зміни статусу:', error);
    }
  };

  const filteredOrders = activeFilter === 'Всі' 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  return (
    <div className="p-3 sm:p-4 max-w-md mx-auto pt-4 w-full">
      <div className="mb-3">
        <button 
          type="button"
          onClick={handleOpenCreateModal}
          className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+ Додати замовлення</span>
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto flex-nowrap pb-2 mb-3 max-w-full touch-pan-x scrollbar-none">
        {statuses.map((status) => {
          const count = status === 'Всі' ? orders.length : orders.filter(o => o.status === status).length;
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{status}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
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
          onEditModal={handleEditOrderModal}
          onInlineSave={handleInlineSaveOrder}
          onDelete={handleDeleteOrder} 
          onStatusChange={handleStatusChange} 
        />
      )}

      <NewOrderModal 
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSave={handleSaveOrder}
        stock={stockProducts}
      />
    </div>
  );
}
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
  increment 
} from "firebase/firestore";

export default function Dashboard() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Всі');
  const [loading, setLoading] = useState(true);

  const statuses = ['Всі', 'Нове', 'В роботі', 'З наявності', 'Доставка', 'Успішно', 'Відмова'];

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
          salePrice: item.salePrice || '',
          cost: item.cost || '',
          image: item.productImage || item.image || '',
          colorImage: item.colorImage || '',
          createdAt: item.createdAt || '',
          stockItemId: item.stockItemId || '',
          usedBox: item.usedBox || '',
          usedDustbag: item.usedDustbag || '',
          packagingSource: item.packagingSource || '',
          supplier: item.supplier || 'Міла',
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
        usedBox: updatedOrder.selectedBox || updatedOrder.usedBox || '',
        usedDustbag: updatedOrder.selectedDustbag || updatedOrder.usedDustbag || '',
        supplier: updatedOrder.supplier || 'Міла'
      };

      await updateDoc(orderRef, updateData);

      if (updatedOrder.selectedBox && updatedOrder.selectedBox !== 'Без коробки') {
        const stockSnap = await getDocs(collection(db, "stock"));
        stockSnap.forEach(async (docSnap) => {
          if (docSnap.data().name === updatedOrder.selectedBox) {
            await updateDoc(doc(db, "stock", docSnap.id), { quantity: increment(-1) });
          }
        });
      }

      if (updatedOrder.selectedDustbag && updatedOrder.selectedDustbag !== 'Без пильовика') {
        const stockSnap = await getDocs(collection(db, "stock"));
        stockSnap.forEach(async (docSnap) => {
          if (docSnap.data().name === updatedOrder.selectedDustbag) {
            await updateDoc(doc(db, "stock", docSnap.id), { quantity: increment(-1) });
          }
        });
      }

      await fetchOrders();
      await fetchStockProducts();
    } catch (error) {
      console.error('Помилка оновлення картки та списування:', error);
      alert('Не вдалося зберегти зміни');
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      const initialStatus = orderData.stockItemId ? 'З наявності' : 'Нове';

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
        supplier: orderData.supplier || 'Міла',
        packagingSource: orderData.packagingSource || 'Міла',
        productDetails: `${orderData.size || '—'} розм., ${orderData.color || '—'}, ${orderData.material || '—'}, ${orderData.lining || orderData.sole || '—'}`
      };

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
          status: initialStatus,
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
      const orderToDelete = orders.find(o => o.id === id);

      if (orderToDelete) {
        // 1. Повертаємо пакування назад на склад (розподіляємо по джерелах списання)
        const packagingSource = orderToDelete.packagingSource || orderToDelete.supplier || 'Міла';
        const usedBox = orderToDelete.usedBox;
        const usedDustbag = orderToDelete.usedDustbag;

        const stockSnap = await getDocs(collection(db, "stock"));
        
        for (const docSnap of stockSnap.docs) {
          const itemData = docSnap.data();
          const stockRef = doc(db, "stock", docSnap.id);

          // Повертаємо коробку
          if (usedBox && usedBox !== 'Без коробки' && itemData.name === usedBox) {
            const currentSuppliers = itemData.suppliers || { 'Основний склад': itemData.quantity || 0, 'Міла': 0, 'Валерій': 0 };
            const currentQty = Number(currentSuppliers[packagingSource]) || 0;
            
            currentSuppliers[packagingSource] = currentQty + 1;
            const newTotalQty = Object.values(currentSuppliers).reduce((sum, val) => sum + Number(val || 0), 0);
            
            await updateDoc(stockRef, { suppliers: currentSuppliers, quantity: newTotalQty });
          }

          // Повертаємо пильовик
          if (usedDustbag && usedDustbag !== 'Без пильовика' && itemData.name === usedDustbag) {
            const currentSuppliers = itemData.suppliers || { 'Основний склад': itemData.quantity || 0, 'Міла': 0, 'Валерій': 0 };
            const currentQty = Number(currentSuppliers[packagingSource]) || 0;
            
            currentSuppliers[packagingSource] = currentQty + 1;
            const newTotalQty = Object.values(currentSuppliers).reduce((sum, val) => sum + Number(val || 0), 0);
            
            await updateDoc(stockRef, { suppliers: currentSuppliers, quantity: newTotalQty });
          }
        }

        // 2. Якщо замовлення було з наявності — повертаємо пару назад у наявність
        if (orderToDelete.status === 'З наявності' || orderToDelete.stockItemId) {
          await addDoc(collection(db, "stock"), {
            folderId: 'availability',
            name: orderToDelete.productTitle || orderToDelete.name || 'Товар з наявності',
            size: orderToDelete.size || '',
            color: orderToDelete.colorText || orderToDelete.color || '',
            material: orderToDelete.material || '',
            sole: orderToDelete.sole || '',
            lining: orderToDelete.filling || orderToDelete.lining || '',
            price: Number(orderToDelete.price) || 0,
            status: 'відмова',
            image: orderToDelete.image || orderToDelete.productImage || '',
            createdAt: new Date().toISOString()
          });
        }

        // 3. Видаляємо саме замовлення з бази
        await deleteDoc(doc(db, "orders", id));
        setOrders(prevOrders => prevOrders.filter(o => o.id !== id));
        await fetchStockProducts();
      }
    } catch (error) {
      console.error('Помилка видалення замовлення:', error);
      alert('Не вдалося видалити замовлення');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      const targetOrder = orders.find(o => o.id === id);

      await updateDoc(orderRef, { status: newStatus });

      if (newStatus === 'Відмова' && targetOrder) {
        await addDoc(collection(db, "stock"), {
          folderId: 'availability',
          name: targetOrder.productTitle || targetOrder.name || 'Товар з відмови',
          season: targetOrder.season || 'Демісезон',
          size: targetOrder.size || '',
          color: targetOrder.colorText || targetOrder.color || '',
          material: targetOrder.material || '',
          sole: targetOrder.sole || '',
          lining: targetOrder.filling || targetOrder.lining || '',
          price: Number(targetOrder.price) || 0,
          salePrice: Number(targetOrder.salePrice) || '',
          cost: Number(targetOrder.cost) || '',
          status: 'відмова',
          image: targetOrder.image || targetOrder.productImage || '',
          createdAt: new Date().toISOString()
        });

        const stockSnap = await getDocs(collection(db, "stock"));
        stockSnap.forEach(async (docSnap) => {
          const itemData = docSnap.data();
          if (targetOrder.usedBox && itemData.name === targetOrder.usedBox) {
            await updateDoc(doc(db, "stock", docSnap.id), { quantity: increment(1) });
          }
          if (targetOrder.usedDustbag && itemData.name === targetOrder.usedDustbag) {
            await updateDoc(doc(db, "stock", docSnap.id), { quantity: increment(1) });
          }
        });

        await fetchStockProducts();
      }
      
      setOrders(prevOrders => {
        const updated = prevOrders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        return sortOrdersList(updated);
      });
    } catch (error) {
      console.error('Помилка зміни статусу:', error);
      alert('Не вдалося оновити статус замовлення');
    }
  };

  const filteredOrders = activeFilter === 'Всі' 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  return (
    <div className="p-3 sm:p-4 max-w-md mx-auto pt-4 w-full overflow-hidden">
      <div className="mb-3">
        <button 
          type="button"
          onClick={handleOpenCreateModal}
          className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+ Додати замовлення</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-2 mb-3">
        <div className="flex gap-1.5 flex-nowrap min-w-max">
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
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
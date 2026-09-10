import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './js/firebase'; // Перевірте, чи шлях точно збігається з розташуванням вашого файлу
import Header from './components/header/header';
import Dashboard from './components/dashboard/dashboard';
import Orders from './components/orders/orders';
import Stock from './components/stock/stock';
import Finances from './components/finances/finances';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stock, setStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [finances, setFinances] = useState([]);

  const [folders, setFolders] = useState([
    { id: 'shoes', name: 'Взуття', type: 'root', icon: '🥿' },
    { id: 'boxes', name: 'Коробки', type: 'root', icon: '📦' },
    { id: 'palettes', name: 'Палітра', type: 'root', icon: '🎨' },
    { 
      id: 'fabrics', 
      name: 'Зразки тканин', 
      type: 'root', 
      icon: '🧵',
      subfolders: [
        { id: 'suede', name: 'Зразки замша' },
        { id: 'leather', name: 'Зразки шкіра' }
      ]
    },
    { id: 'dustbags', name: 'Пильовики', type: 'root', icon: '🛍️' },
  ]);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [finReportPeriod, setFinReportPeriod] = useState('month');

  // Підписка на оновлення з Firebase в реальному часі для складу та замовлень
  useEffect(() => {
    const unsubscribeStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
      const items = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setStock(items);
    }, (error) => {
      console.error("Помилка завантаження складу:", error);
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setOrders(items);
    }, (error) => {
      console.error("Помилка завантаження замовлень:", error);
    });

    return () => {
      unsubscribeStock();
      unsubscribeOrders();
    };
  }, []);

  // Універсальна функція додавання/редагування товару в Firestore
  const handleAddItem = async (newItem) => {
    try {
      const itemId = String(newItem.id || Date.now());
      
      const itemToSave = {
        ...newItem,
        id: itemId,
        folderId: newItem.folderId || currentFolderId || 'shoes',
        createdAt: newItem.createdAt || Date.now()
      };

      await setDoc(doc(db, 'stock', itemId), itemToSave, { merge: true });
      console.log("Товар успішно збережено у Firebase!");
    } catch (error) {
      console.error("Помилка збереження товару:", error);
      alert("Помилка збереження: " + error.message);
    }
  };

  // Функція видалення товару з Firestore
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'stock', String(itemId)));
      console.log("Товар успішно видалено з Firebase!");
    } catch (error) {
      console.error("Помилка видалення товару:", error);
      alert("Помилка видалення: " + error.message);
    }
  };

  const totalIncome = finances.filter(f => f.type === 'Дохід').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'Витрата').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const sortedOrdersOldestFirst = [...orders].sort((a, b) => (a.timestamp || a.id) - (b.timestamp || b.id));

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-slate-800 font-sans overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-10">
        {activeTab === 'dashboard' && (
          <Dashboard 
            orders={orders} 
            sortedOrdersOldestFirst={sortedOrdersOldestFirst}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netProfit={netProfit}
            setOrders={setOrders}
          />
        )}

        {activeTab === 'orders' && (
          <Orders 
            orders={orders}
            setOrders={setOrders}
            sortedOrdersOldestFirst={sortedOrdersOldestFirst}
            stock={stock}
            setStock={setStock}
            finances={finances}
            setFinances={setFinances}
          />
        )}

        {activeTab === 'stock' && (
          <Stock 
            stock={stock}
            setStock={setStock}
            folders={folders}
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'finances' && (
          <Finances 
            finances={finances}
            finReportPeriod={finReportPeriod}
            setFinReportPeriod={setFinReportPeriod}
          />
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/header/header';
import Dashboard from './components/dashboard/dashboard';
import Orders from './components/orders/orders';
import Stock from './components/stock/stock';
import Finances from './components/finances/finances';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stock, setStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [finances, setFinances] = useState([]); // Можна згодом теж підключити до бази, якщо потрібно

  const [folders, setFolders] = useState([
    { id: 'shoes', name: 'Взуття', type: 'root', icon: '🥿' },
    { id: 'boxes', name: 'Коробки', type: 'root', icon: '📦' },
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

  // Підписка на оновлення з Firebase в реальному часі для складу і замовлень
  useEffect(() => {
    // Слухаємо колекцію 'stock' у Firestore
    const unsubscribeStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
      const items = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setStock(items);
    });

    // Слухаємо колекцію 'orders' у Firestore
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setOrders(items);
    });

    return () => {
      unsubscribeStock();
      unsubscribeOrders();
    };
  }, []);

  // Додавання або оновлення товару на складі у Firebase
  const handleAddItem = async (newItem) => {
    try {
      const itemId = String(newItem.id);
      await setDoc(doc(db, 'stock', itemId), newItem);
    } catch (error) {
      console.error("Помилка збереження товару:", error);
    }
  };

  // Видалення товару зі складу у Firebase
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'stock', String(itemId)));
    } catch (error) {
      console.error("Помилка видалення товару:", error);
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
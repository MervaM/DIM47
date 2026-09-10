import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './js/firebase';
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

  // Примусова міграція та виправлення folderId у Firebase
  useEffect(() => {
    const migrateLocalData = async () => {
      try {
        const savedStock = localStorage.getItem('dim47_stock');
        if (savedStock) {
          const parsedStock = JSON.parse(savedStock);
          for (const item of parsedStock) {
            const itemId = String(item.id || Date.now());
            
            let fixedFolderId = item.folderId;
            if (!fixedFolderId) {
              const nameLower = (item.name || '').toLowerCase();
              if (nameLower.includes('коробк')) {
                fixedFolderId = 'boxes';
              } else if (nameLower.includes('пильовик')) {
                fixedFolderId = 'dustbags';
              } else {
                fixedFolderId = 'shoes';
              }
            }

            const fixedItem = { ...item, folderId: fixedFolderId };
            await setDoc(doc(db, 'stock', itemId), fixedItem);
          }
          console.log("Склад успішно мігровано та виправлено з folderId!");
        }
      } catch (error) {
        console.error("Помилка міграції:", error);
      }
    };

    migrateLocalData();
  }, []);

  // Підписка на оновлення з Firebase в реальному часі
  useEffect(() => {
    const unsubscribeStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
      const items = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setStock(items);
    });

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

  const handleAddItem = async (newItem) => {
    try {
      const itemId = String(newItem.id || Date.now());
      await setDoc(doc(db, 'stock', itemId), newItem);
      console.log("Товар успішно збережено!");
    } catch (error) {
      console.error("Помилка збереження товару:", error);
      alert("Помилка збереження: " + error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'stock', String(itemId)));
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
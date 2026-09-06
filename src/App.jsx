import React, { useState, useEffect } from 'react';
import Header from './components/header/header';
import Dashboard from './components/dashboard/dashboard';
import Orders from './components/orders/orders';
import Stock from './components/stock/stock';
import Finances from './components/finances/finances';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem('dim47_stock');
    return saved ? JSON.parse(saved) : [];
  });

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('dim47_folders_struct');
    return saved ? JSON.parse(saved) : [
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
    ];
  });

  const [currentFolderId, setCurrentFolderId] = useState(null);

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('dim47_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [finances, setFinances] = useState(() => {
    const saved = localStorage.getItem('dim47_finances');
    return saved ? JSON.parse(saved) : [];
  });

  const [finReportPeriod, setFinReportPeriod] = useState('month');

  useEffect(() => {
    localStorage.setItem('dim47_stock', JSON.stringify(stock));
    localStorage.setItem('dim47_folders_struct', JSON.stringify(folders));
    localStorage.setItem('dim47_orders', JSON.stringify(orders));
    localStorage.setItem('dim47_finances', JSON.stringify(finances));
  }, [stock, folders, orders, finances]);

  const totalIncome = finances.filter(f => f.type === 'Дохід').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'Витрата').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const sortedOrdersOldestFirst = [...orders].sort((a, b) => (a.timestamp || a.id) - (b.timestamp || b.id));

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-slate-800 font-sans overflow-hidden">
      {/* Верхня панель (Header) */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Основний контент на всю ширину */}
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
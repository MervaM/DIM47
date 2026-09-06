import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, DollarSign, Sparkles, Menu, X } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'orders', label: 'Замовлення', icon: ShoppingCart },
    { id: 'stock', label: 'Склад і Папки', icon: Package },
    { id: 'finances', label: 'Фінанси', icon: DollarSign },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm w-full shrink-0">
      {/* Логотип */}
      <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900 tracking-wider">
        <span className="bg-slate-900 text-white p-1.5 rounded-xl text-sm"><Sparkles size={18} /></span>
        DIM47
      </div>

      {/* Навігація для великих екранів (Десктоп) */}
      <nav className="hidden md:flex items-center gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} /> {item.label}
            </button>
          );
        })}
      </nav>

      {/* Кнопка бургера для мобільних пристроїв */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
          aria-label="Меню"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Виїзне мобільне меню */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-2 z-50 md:hidden">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </header>
  );
}
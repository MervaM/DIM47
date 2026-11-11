import React from 'react';
import { Calendar, Plus, Table as TableIcon, PieChart, Check, X } from 'lucide-react';

export default function FinancesHeader({
  usdRate,
  isEditingUsd,
  setIsEditingUsd,
  usdInput,
  setUsdInput,
  handleSaveUsdRate,
  periodFilter,
  setPeriodFilter,
  selectedMonth,
  setSelectedMonth,
  selectedWeek,
  setSelectedWeek,
  viewMode,
  setViewMode,
  setShowAddModal
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Курс НБУ */}
        <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-900">Курс USD (НБУ):</span>
          {!isEditingUsd ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950">{usdRate} грн/$</span>
              <button 
                type="button"
                onClick={() => setIsEditingUsd(true)}
                className="text-[10px] text-emerald-700 underline cursor-pointer"
              >
                змінити вручну
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                step="any"
                value={usdInput}
                onChange={e => setUsdInput(e.target.value)}
                className="w-16 px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-xs"
                autoFocus
              />
              <button type="button" onClick={handleSaveUsdRate} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
              <button type="button" onClick={() => setIsEditingUsd(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
            </div>
          )}
        </div>

        {/* Фільтри періодів */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> Період:
          </span>
          {['all', 'month', 'week'].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setPeriodFilter(f)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                periodFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Увесь час' : f === 'month' ? 'Місяць' : 'Тиждень'}
            </button>
          ))}

          {periodFilter === 'month' && (
            <input 
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          )}

          {periodFilter === 'week' && (
            <input 
              type="week"
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          )}
        </div>

        {/* Таблиця / Графік */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon size={14} /> Таблиця
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieChart size={14} /> Графік
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>
    </div>
  );
}
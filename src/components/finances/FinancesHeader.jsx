import React from 'react';
import { Calendar, Plus, Check, X } from 'lucide-react';

export default function FinancesHeader({
  usdRate,
  isEditingUsd,
  setIsEditingUsd,
  usdInput,
  setUsdInput,
  handleSaveUsdRate,
  periodFilter,
  setPeriodFilter,
  selectedDay,
  setSelectedDay,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  setShowAddModal
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Курс продажу */}
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-900">Курс продажу USD:</span>
          {!isEditingUsd ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950 text-sm">{usdRate} грн/$</span>
              <button onClick={() => setIsEditingUsd(true)} className="text-[10px] text-emerald-700 underline cursor-pointer">змінити</button>
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
              <button onClick={handleSaveUsdRate} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
              <button onClick={() => setIsEditingUsd(false)} className="p-1 bg-slate-200 rounded"><X size={12} /></button>
            </div>
          )}
        </div>

        {/* Фільтри періодів */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1"><Calendar size={14} /> Період:</span>
          {[
            { id: 'all', name: 'Увесь час' },
            { id: 'day', name: 'День' },
            { id: 'week', name: 'Тиждень' },
            { id: 'month', name: 'Місяць' },
            { id: 'custom', name: 'Свій діапазон' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPeriodFilter(f.id)}
              className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
                periodFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.name}
            </button>
          ))}

          {periodFilter === 'day' && (
            <input 
              type="date"
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
            />
          )}

          {periodFilter === 'week' && (
            <input 
              type="week"
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
            />
          )}

          {periodFilter === 'month' && (
            <input 
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
            />
          )}

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1">
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <span>—</span>
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus size={16} /> Додати транзакцію
        </button>
      </div>
    </div>
  );
}
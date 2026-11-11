import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Users, Check, X } from 'lucide-react';

export default function FinancesStats({
  totalIncome,
  totalExpense,
  netProfit,
  grandTotalInvested,
  usdRate,
  setShowInvestmentsModal,
  milaAdvance,
  isEditingMila,
  setIsEditingMila,
  milaAdvanceInput,
  setMilaAdvanceInput,
  handleSaveMilaAdvance,
  totalMilaUsed,
  isEditingMilaExtra,
  setIsEditingMilaExtra,
  milaExtraInput,
  setMilaExtraInput,
  handleSaveMilaExtra,
  milaRemainingBalance,
  valeriyTotalToPay,
  isEditingValeriy,
  setIsEditingValeriy,
  valeriyInput,
  setValeriyInput,
  handleSaveValeriy,
  valeriyManualOverride,
  setValeriyManualOverride,
  db
}) {
  return (
    <div className="space-y-4">
      {/* Головні картки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/85 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальний дохід</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {totalIncome.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(totalIncome / usdRate).toFixed(2)})</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/85 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Загальні витрати</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={16} /></span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {totalExpense.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(totalExpense / usdRate).toFixed(2)})</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/85 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Чистий прибуток</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></span>
          </div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-400">(${(netProfit / usdRate).toFixed(2)})</span>
          </div>
        </div>

        <div 
          onClick={() => setShowInvestmentsModal(true)}
          className="bg-amber-500/10 hover:bg-amber-500/20 p-4 rounded-2xl border border-amber-300/85 shadow-xs space-y-1 cursor-pointer transition group"
        >
          <div className="flex justify-between items-center text-amber-900 text-xs font-bold">
            <span>Інвестори</span>
            <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs group-hover:scale-105 transition">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="text-xl font-black text-amber-950">
            {grandTotalInvested.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
            <span className="text-xs font-normal text-slate-500">(${(grandTotalInvested / usdRate).toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* Блоки Міли та Валерія */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
              <Users size={16} className="text-indigo-600" /> Виробник: Міла (Аванс)
            </span>
            {!isEditingMila ? (
              <button 
                type="button"
                onClick={() => { setIsEditingMila(true); setMilaAdvanceInput(String(milaAdvance)); }}
                className="text-[10px] text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Змінити аванс
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  step="any"
                  value={milaAdvanceInput}
                  onChange={e => setMilaAdvanceInput(e.target.value)}
                  className="w-20 px-1.5 py-0.5 bg-white border border-indigo-300 rounded text-xs"
                  autoFocus
                />
                <button type="button" onClick={handleSaveMilaAdvance} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
                <button type="button" onClick={() => setIsEditingMila(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block">Внесений аванс:</span>
              <span className="font-bold text-slate-900">{milaAdvance.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн</span>
            </div>
            
            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-semibold">Використано:</span>
                {!isEditingMilaExtra && (
                  <button 
                    type="button"
                    onClick={() => { setIsEditingMilaExtra(true); setMilaExtraInput(String(milaExtraCost)); }}
                    className="text-[9px] text-indigo-600 underline cursor-pointer"
                  >
                    змінити
                  </button>
                )}
              </div>
              {!isEditingMilaExtra ? (
                <span className="font-bold text-rose-600 block">-{totalMilaUsed.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн</span>
              ) : (
                <div className="flex items-center gap-1 pt-1">
                  <input 
                    type="number"
                    step="any"
                    value={milaExtraInput}
                    onChange={e => setMilaExtraInput(e.target.value)}
                    className="w-16 px-1 py-0.5 border rounded text-xs"
                    autoFocus
                  />
                  <button type="button" onClick={handleSaveMilaExtra} className="text-emerald-600"><Check size={12} /></button>
                  <button type="button" onClick={() => setIsEditingMilaExtra(false)} className="text-slate-400"><X size={12} /></button>
                </div>
              )}
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block">Залишок у Міли:</span>
              <span className={`font-bold text-sm ${milaRemainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {milaRemainingBalance.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-purple-950 text-sm flex items-center gap-1.5">
              <Users size={16} className="text-purple-600" /> Виробник: Валерій (Тижнева оплата)
            </span>
            {!isEditingValeriy ? (
              <button 
                type="button"
                onClick={() => { setIsEditingValeriy(true); setValeriyInput(String(valeriyTotalToPay)); }}
                className="text-[10px] text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Змінити суму
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  step="any"
                  value={valeriyInput}
                  onChange={e => setValeriyInput(e.target.value)}
                  className="w-20 px-1.5 py-0.5 bg-white border border-purple-300 rounded text-xs"
                  autoFocus
                />
                <button type="button" onClick={handleSaveValeriy} className="p-1 bg-emerald-600 text-white rounded"><Check size={12} /></button>
                <button type="button" onClick={() => setIsEditingValeriy(false)} className="p-1 bg-slate-200 text-slate-700 rounded"><X size={12} /></button>
              </div>
            )}
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-purple-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-semibold">Сума до виплати за тиждень:</span>
              {valeriyManualOverride !== null && (
                <button 
                  type="button"
                  onClick={() => setValeriyManualOverride(null)}
                  className="text-[9px] text-purple-600 underline cursor-pointer"
                >
                  скинути до авто
                </button>
              )}
            </div>
            <div className="text-xl font-black text-purple-900">
              {valeriyTotalToPay.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
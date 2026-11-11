import React from 'react';
import { Search, Calendar, Edit2, Check, X, Trash2, BarChart2 } from 'lucide-react';

export default function FinancesTable({
  filteredTransactions,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  editingTxId,
  setEditingTxId,
  editingAmount,
  setEditingAmount,
  handleSaveEditedAmount,
  handleDeleteTransaction,
  setSelectedCategoryAnalytics,
  boxesStats,
  dustbagsStats,
  shoesStats,
  adsStats,
  taxesStats,
  accountantStats,
  salaryStats,
  usdRate
}) {
  return (
    <div className="space-y-4">
      {/* Міні-категорії */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: 'коробки', title: 'Коробки', stats: boxesStats, color: 'border-amber-200 bg-amber-50/30' },
          { key: 'пильовики', title: 'Пильовики', stats: dustbagsStats, color: 'border-blue-200 bg-blue-50/30' },
          { key: 'пошиття', title: 'Пошиття взуття', stats: shoesStats, color: 'border-purple-200 bg-purple-50/30' },
          { key: 'реклама', title: 'Реклама / Таргет', stats: adsStats, color: 'border-emerald-200 bg-emerald-50/30' },
          { key: 'податк', title: 'Податки', stats: taxesStats, color: 'border-rose-200 bg-rose-50/30' },
          { key: 'бухгалтер', title: 'Бухгалтер', stats: accountantStats, color: 'border-indigo-200 bg-indigo-50/30' },
          { key: 'зарплат', title: 'Зарплатня', stats: salaryStats, color: 'border-teal-200 bg-teal-50/30' }
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setSelectedCategoryAnalytics(item.key)}
            className={`p-2.5 rounded-xl border ${item.color} cursor-pointer transition space-y-0.5 hover:shadow-xs group`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{item.title}</span>
              <BarChart2 size={12} className="text-slate-400 group-hover:text-slate-900 transition" />
            </div>
            <div className="text-xs font-black text-slate-900">{item.stats.total.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн</div>
            <div className="text-[9px] text-slate-500 font-medium truncate">~{item.stats.avg} грн ({item.stats.count} завед.)</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/85 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Пошук операції або інвестора..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-0.5">
            {[
              { id: 'всі', name: 'Усі' },
              { id: 'податки', name: 'Податки' },
              { id: 'бухгалтер', name: 'Бухгалтер' },
              { id: 'зарплата', name: 'Зарплата' },
              { id: 'інвестиція', name: 'Інвестиції' },
              { id: 'взуття', name: 'Пошиття' },
              { id: 'коробки', name: 'Коробки' },
              { id: 'пильовики', name: 'Пильовики' },
              { id: 'реклама', name: 'Реклама' },
              { id: 'успішно', name: 'Оплата' },
              { id: 'передплата', name: 'Передплата' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap cursor-pointer transition ${
                  selectedFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="pb-2">Дата</th>
                <th className="pb-2">Тип</th>
                <th className="pb-2">Категорія</th>
                <th className="pb-2">Опис / Інвестор</th>
                <th className="pb-2">Сума</th>
                <th className="pb-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">Операцій за обраний період не знайдено</td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isShoesCost = tx.category === 'Пошиття взуття';
                  const amountUsd = (tx.amount / usdRate).toFixed(2);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-2 text-slate-500 text-[10px]">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {tx.date}</span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          tx.type === 'Інвестиція' ? 'bg-amber-100 text-amber-900' : tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2 font-semibold text-slate-900">{tx.category}</td>
                      <td className="py-2 text-slate-600 text-[11px]">{tx.comment || '—'}</td>
                      
                      <td className={`py-2 font-bold text-xs ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {editingTxId === tx.id ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              step="any"
                              value={editingAmount}
                              onChange={(e) => setEditingAmount(e.target.value)}
                              className="w-20 px-1.5 py-1 border border-slate-300 rounded text-slate-900 font-normal bg-white text-[11px]"
                              autoFocus
                            />
                            <button type="button" onClick={() => handleSaveEditedAmount(tx)} className="p-1 bg-emerald-100 text-emerald-700 rounded"><Check size={12} /></button>
                            <button type="button" onClick={() => setEditingTxId(null)} className="p-1 bg-slate-100 text-slate-600 rounded"><X size={12} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/edit">
                            <span>
                              {isShoesCost ? (
                                <>
                                  {tx.type === 'Витрата' ? '-' : '+'}${amountUsd}{' '}
                                  <span className="text-[10px] font-normal text-slate-400">({Number(tx.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн)</span>
                                </>
                              ) : (
                                <>
                                  {tx.type === 'Витрата' ? '-' : '+'}{Number(tx.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн{' '}
                                  <span className="text-[10px] font-normal text-slate-400">(${amountUsd})</span>
                                </>
                              )}
                            </span>
                            {!String(tx.id).startsWith('stock-') && (
                              <button 
                                type="button"
                                onClick={() => { setEditingTxId(tx.id); setEditingAmount(tx.amount || ''); }}
                                className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                title="Редагувати суму гривень"
                              >
                                <Edit2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="py-2 text-right">
                        {!tx.isAuto && (
                          <button type="button" onClick={() => handleDeleteTransaction(tx.id)} className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
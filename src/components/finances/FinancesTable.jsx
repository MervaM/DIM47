import React from 'react';

export default function FinancesTable({ filteredTransactions, usdRate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <h3 className="font-bold text-sm text-slate-800">Список операцій ({filteredTransactions.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
              <th className="pb-2">Дата</th>
              <th className="pb-2">Тип</th>
              <th className="pb-2">Категорія</th>
              <th className="pb-2">Опис</th>
              <th className="pb-2">Сума</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-slate-400">Немає транзакцій за цей період</td></tr>
            ) : (
              filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-2.5 text-slate-500">{tx.date}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Дохід' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-slate-800">{tx.category}</td>
                  <td className="py-2.5 text-slate-600">{tx.comment || '—'}</td>
                  <td className={`py-2.5 font-bold ${tx.type === 'Дохід' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'Витрата' ? '-' : '+'}{Number(tx.amount).toLocaleString('uk-UA')} грн 
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(${(tx.amount / usdRate).toFixed(2)})</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
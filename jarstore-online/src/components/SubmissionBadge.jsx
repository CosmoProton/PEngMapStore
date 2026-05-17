import React from 'react';

export const SubmissionBadge = ({ status, delayDays }) => {
  if (status === 'on_time') {
    return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">✅ In tempo</span>;
  }
  if (status === 'missing') {
    return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">❌ Mancante</span>;
  }

  let marker = '🔴';
  let badgeStyle = 'bg-red-100 text-red-800 border-red-200';
  if (delayDays === 1) {
    marker = '🟡';
    badgeStyle = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (delayDays >= 2 && delayDays <= 3) {
    marker = '🟠';
    badgeStyle = 'bg-orange-100 text-orange-800 border-orange-200';
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200">⚠️ In ritardo</span>
      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${badgeStyle}`}>{marker} {delayDays} {delayDays === 1 ? 'giorno' : 'giorni'}</span>
    </div>
  );
};
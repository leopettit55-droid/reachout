import React from 'react';

const config = {
  'Pending': { cls: 'badge-pending', dot: 'bg-amber-400' },
  'Message Sent': { cls: 'badge-sent', dot: 'bg-blue-400' },
  'Replied': { cls: 'badge-replied', dot: 'bg-emerald-400' },
  'In Progress': { cls: 'badge-inprogress', dot: 'bg-purple-400' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = config[status] || config['Pending'];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${textSize} font-medium border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {Icon && (
        <div className="w-16 h-16 bg-navy-700 rounded-2xl flex items-center justify-center mb-4 border border-navy-500">
          <Icon size={28} className="text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>}
      {actionTo && (
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      )}
      {action && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

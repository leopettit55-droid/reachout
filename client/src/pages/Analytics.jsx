import React, { useEffect, useState } from 'react';
import { Menu, Users, MessageSquare, Reply, Clock, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { getAnalytics } from '../api';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, sub, color = 'blue', size = 'normal' }) {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', val: 'text-white' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', val: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', val: 'text-amber-400' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', val: 'text-purple-400' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', val: 'text-red-400' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className={`${c.bg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={c.icon} />
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className={`text-2xl font-bold mt-0.5 ${c.val}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = 'blue' }) {
  const colorMap = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', purple: 'bg-purple-500' };
  return (
    <div className="w-full bg-navy-700 rounded-full h-1.5 mt-2">
      <div
        className={`h-1.5 rounded-full transition-all duration-700 ${colorMap[color] || colorMap.blue}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export default function Analytics({ onMenuClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const avgTimeDisplay = data.avgHours !== null
    ? data.avgHours < 24
      ? `${data.avgHours}h`
      : `${Math.round(data.avgHours / 24)}d`
    : '—';

  const statusColors = {
    'Pending': 'amber',
    'Message Sent': 'blue',
    'Replied': 'emerald',
    'In Progress': 'purple',
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your networking performance at a glance</p>
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total contacts" value={data.totalContacts} color="blue" />
        <StatCard
          icon={MessageSquare}
          label="Follow-up rate"
          value={`${data.followUpRate}%`}
          sub={`${data.followedUp} of ${data.totalContacts} contacted`}
          color="emerald"
        />
        <StatCard
          icon={Reply}
          label="Reply rate"
          value={`${data.replyRate}%`}
          sub={`${data.replied} replies received`}
          color="purple"
        />
        <StatCard
          icon={Clock}
          label="Avg. time to follow up"
          value={avgTimeDisplay}
          sub={avgTimeDisplay !== '—' ? 'after meeting' : 'No data yet'}
          color="amber"
        />
      </div>

      {/* Alert row */}
      {(data.needsFollowUp > 0 || data.urgent > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {data.needsFollowUp > 0 && (
            <StatCard
              icon={AlertTriangle}
              label="Need follow-up"
              value={data.needsFollowUp}
              sub="Met 3+ days ago, no message sent"
              color="amber"
            />
          )}
          {data.urgent > 0 && (
            <StatCard
              icon={AlertTriangle}
              label="Urgent"
              value={data.urgent}
              sub="Met 7+ days ago, still pending"
              color="red"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Contact Status</h2>
          {data.statusBreakdown.length === 0 ? (
            <p className="text-slate-500 text-sm">No contacts yet</p>
          ) : (
            <div className="space-y-3">
              {data.statusBreakdown.map(({ status, count }) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{status}</span>
                    <span className="text-slate-400 font-medium">
                      {count} <span className="text-slate-600">({data.totalContacts > 0 ? Math.round((count / data.totalContacts) * 100) : 0}%)</span>
                    </span>
                  </div>
                  <ProgressBar
                    value={data.totalContacts > 0 ? (count / data.totalContacts) * 100 : 0}
                    color={statusColors[status] || 'blue'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top events */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Top Events</h2>
          {data.events.length === 0 ? (
            <p className="text-slate-500 text-sm">No events yet</p>
          ) : (
            <div className="space-y-3">
              {data.events.map(ev => {
                const fr = ev.contact_count > 0 ? Math.round((ev.followed_up / ev.contact_count) * 100) : 0;
                const rr = ev.followed_up > 0 ? Math.round((ev.replied / ev.followed_up) * 100) : 0;
                return (
                  <div key={ev.id} className="flex items-center justify-between gap-3 py-2 border-b border-navy-700 last:border-0">
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-slate-500 text-xs">{ev.contact_count} contacts</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-blue-400 text-sm font-medium">{fr}%</p>
                      <p className="text-slate-500 text-xs">{rr}% replied</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {data.recentContacts > 0 && (
        <div className="card p-5 mt-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            <p className="text-slate-300 text-sm">
              <span className="font-semibold text-white">{data.recentContacts} new contact{data.recentContacts !== 1 ? 's' : ''}</span> added in the last 7 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

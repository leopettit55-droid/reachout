import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, UserPlus, Users, AlertTriangle, Filter, Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { getContacts, getEvents } from '../api';
import ContactCard from '../components/ContactCard';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['All', 'Pending', 'Message Sent', 'Replied', 'In Progress'];

export default function Dashboard({ onMenuClick }) {
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEvent, setFilterEvent] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [c, e] = await Promise.all([getContacts(), getEvents()]);
      setContacts(c);
      setEvents(e);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  const filtered = contacts.filter(c => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterEvent && String(c.event_id) !== filterEvent) return false;
    return true;
  });

  const needsFollowUp = contacts.filter(c => {
    if (c.status !== 'Pending') return false;
    if (!c.date_met) return false;
    return differenceInDays(new Date(), parseISO(c.date_met)) > 3;
  });

  const urgent = needsFollowUp.filter(c =>
    differenceInDays(new Date(), parseISO(c.date_met)) > 7
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
        </div>
        <Link to="/contacts/new" className="btn-primary">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Add Contact</span>
        </Link>
      </div>

      {/* Needs follow-up section */}
      {needsFollowUp.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
              Needs Follow-up ({needsFollowUp.length})
            </h2>
            {urgent.length > 0 && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                {urgent.length} urgent
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {needsFollowUp.slice(0, 6).map(c => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
          {needsFollowUp.length > 6 && (
            <button
              onClick={() => setFilterStatus('Pending')}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Clock size={13} /> View all {needsFollowUp.length} pending contacts
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wide">Filter</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {events.length > 0 && (
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="input py-1 text-sm w-auto"
            style={{ maxWidth: 200 }}
          >
            <option value="">All events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}

        {(filterStatus !== 'All' || filterEvent) && (
          <button
            onClick={() => { setFilterStatus('All'); setFilterEvent(''); }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Contacts grid */}
      {filtered.length === 0 ? (
        contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            description="Add your first contact and let Reachout help you stay on top of your network."
            actionTo="/contacts/new"
            actionLabel="Add your first contact"
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No contacts match these filters"
            description="Try clearing your filters to see all contacts."
            action={() => { setFilterStatus('All'); setFilterEvent(''); }}
            actionLabel="Clear filters"
          />
        )
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">{filtered.length} contact{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(c => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

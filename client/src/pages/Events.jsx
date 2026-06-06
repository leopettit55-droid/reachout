import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Calendar, Plus, Trash2, ChevronRight, Users, Check, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getEvents, createEvent, deleteEvent } from '../api';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

function EventCard({ event, onDelete }) {
  const followUpRate = event.contact_count > 0
    ? Math.round((event.followed_up_count / event.contact_count) * 100)
    : 0;
  const replyRate = event.followed_up_count > 0
    ? Math.round((event.replied_count / event.followed_up_count) * 100)
    : 0;

  return (
    <div className="card-hover p-5 group">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/events/${event.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={15} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-100 group-hover:text-white truncate">{event.name}</h3>
          </div>
          {event.date && (
            <p className="text-slate-500 text-xs ml-10 mb-2">
              {format(parseISO(event.date), 'MMM d, yyyy')}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-400 ml-10">
            <span className="flex items-center gap-1">
              <Users size={11} /> {event.contact_count} contact{event.contact_count !== 1 ? 's' : ''}
            </span>
            {event.contact_count > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <Check size={11} className="text-blue-400" /> {followUpRate}% followed up
                </span>
                {event.followed_up_count > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} className="text-emerald-400" /> {replyRate}% replied
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link to={`/events/${event.id}`} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
            <ChevronRight size={16} />
          </Link>
          <button
            onClick={() => onDelete(event)}
            className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Events({ onMenuClick }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setEvents(await getEvents());
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Event name required'); return; }
    setSaving(true);
    try {
      const ev = await createEvent(form);
      setEvents(prev => [ev, ...prev]);
      setForm({ name: '', date: '', location: '', description: '' });
      setShowForm(false);
      toast.success('Event created!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event) {
    if (event.contact_count > 0) {
      toast.error(`Cannot delete — ${event.contact_count} contacts are linked to this event`);
      return;
    }
    try {
      await deleteEvent(event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Event deleted');
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="page-title">Events</h1>
            <p className="text-slate-400 text-sm mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 mb-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">New Event</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label">Event Name *</label>
              <input
                className="input"
                placeholder="London Tech Week 2026"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  placeholder="London, UK"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="Annual tech conference..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Event'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Create events to group your contacts and track networking performance by event."
          action={() => setShowForm(true)}
          actionLabel="Create your first event"
        />
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} onDelete={e => setDeleteTarget(e)} />
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-white mb-2">Delete "{deleteTarget.name}"?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteTarget)} className="btn-primary bg-red-600 hover:bg-red-500">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

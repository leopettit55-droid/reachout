import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, ArrowLeft, Calendar, MapPin, Users, Check, MessageSquare, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getEvent } from '../api';
import ContactCard from '../components/ContactCard';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

export default function EventDetail({ onMenuClick }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvent(id)
      .then(setEvent)
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const contacts = event.contacts || [];
  const followedUp = contacts.filter(c => c.status !== 'Pending').length;
  const replied = contacts.filter(c => c.status === 'Replied').length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <Link to="/events" className="text-slate-400 hover:text-white p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title truncate">{event.name}</h1>
      </div>

      {/* Event info + stats */}
      <div className="card p-5 mb-6 animate-slide-up">
        <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
          {event.date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {format(parseISO(event.date), 'MMMM d, yyyy')}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {event.location}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-slate-400 text-sm mb-4">{event.description}</p>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-navy-700 rounded-lg">
            <p className="text-2xl font-bold text-white">{contacts.length}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Users size={11} /> Contacts
            </p>
          </div>
          <div className="text-center p-3 bg-navy-700 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{contacts.length > 0 ? Math.round((followedUp / contacts.length) * 100) : 0}%</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Check size={11} /> Follow-up rate
            </p>
          </div>
          <div className="text-center p-3 bg-navy-700 rounded-lg">
            <p className="text-2xl font-bold text-emerald-400">{followedUp > 0 ? Math.round((replied / followedUp) * 100) : 0}%</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <MessageSquare size={11} /> Reply rate
            </p>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">Contacts from this event</h2>
        <Link
          to={`/contacts/new`}
          className="btn-ghost text-xs"
        >
          <UserPlus size={13} /> Add contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts from this event yet"
          description="Add contacts and link them to this event."
          actionTo="/contacts/new"
          actionLabel="Add a contact"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={{ ...c, event_name: event.name }} />
          ))}
        </div>
      )}
    </div>
  );
}

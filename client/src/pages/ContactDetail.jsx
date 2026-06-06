import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Menu, ArrowLeft, Edit3, Trash2, Zap, Building2, MapPin, Calendar, Linkedin, Mail, MoreVertical, ChevronDown } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getContact, generateMessages, deleteContact, updateContactStatus } from '../api';
import MessageCard from '../components/MessageCard';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'Message Sent', 'Replied', 'In Progress'];
const MESSAGE_TYPES = ['linkedin_connection', 'linkedin_followup', 'email'];

function Avatar({ contact }) {
  if (contact.photo_path) {
    return <img src={contact.photo_path} alt={contact.full_name} className="w-16 h-16 rounded-full object-cover ring-2 ring-navy-600" />;
  }
  const initials = contact.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = ['from-blue-600 to-blue-700', 'from-purple-600 to-purple-700', 'from-emerald-600 to-emerald-700', 'from-rose-600 to-rose-700', 'from-amber-600 to-amber-700'];
  const color = colors[contact.id % colors.length];
  return (
    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg ring-2 ring-navy-600`}>
      {initials}
    </div>
  );
}

export default function ContactDetail({ onMenuClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadContact();
  }, [id]);

  async function loadContact() {
    try {
      const c = await getContact(id);
      setContact(c);
    } catch {
      toast.error('Contact not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateMessages(id);
      setContact(prev => ({ ...prev, messages: result.messages }));
      toast.success('Messages generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate messages');
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatusChange(status) {
    try {
      const updated = await updateContactStatus(id, status);
      setContact(prev => ({ ...prev, status: updated.status }));
      setShowStatusMenu(false);
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteContact(id);
      toast.success('Contact deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleMessageUpdate(type, updated) {
    setContact(prev => ({
      ...prev,
      messages: { ...prev.messages, [type]: updated }
    }));
    // Refresh to get latest status
    loadContact();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) return null;

  const daysSinceMet = contact.date_met
    ? differenceInDays(new Date(), parseISO(contact.date_met))
    : null;
  const hasMessages = MESSAGE_TYPES.some(t => contact.messages?.[t]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <Link to="/" className="text-slate-400 hover:text-white p-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1" />
        <Link to={`/contacts/${id}/edit`} className="btn-ghost text-xs">
          <Edit3 size={14} /> Edit
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-ghost text-xs text-red-400 hover:text-red-300"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Contact header card */}
      <div className="card p-6 mb-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <Avatar contact={contact} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-white">{contact.full_name}</h1>
                {(contact.job_title || contact.company) && (
                  <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                    <Building2 size={13} />
                    {[contact.job_title, contact.company].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* Status pill + dropdown */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  className="flex items-center gap-1"
                >
                  <StatusBadge status={contact.status} size="md" />
                  <ChevronDown size={12} className="text-slate-400" />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 mt-1 bg-navy-700 border border-navy-500 rounded-lg shadow-xl z-10 min-w-[160px] py-1 animate-fade-in">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-navy-600 transition-colors ${s === contact.status ? 'text-blue-400' : 'text-slate-300'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
              {(contact.where_met || contact.event_name) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {contact.where_met || contact.event_name}
                </span>
              )}
              {contact.date_met && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {format(parseISO(contact.date_met), 'MMMM d, yyyy')}
                  {daysSinceMet !== null && (
                    <span className={`text-xs ${daysSinceMet > 7 && contact.status === 'Pending' ? 'text-red-400' : 'text-slate-500'}`}>
                      ({daysSinceMet === 0 ? 'today' : `${daysSinceMet}d ago`})
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="mt-2 flex gap-3">
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1"
                >
                  <Mail size={14} /> {contact.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="mt-4 pt-4 border-t border-navy-700">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Conversation notes</p>
            <p className="text-slate-300 text-sm leading-relaxed">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Generate messages section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Follow-up Messages</h2>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Zap size={16} /> {hasMessages ? 'Regenerate All' : 'Generate Messages'}</>
            )}
          </button>
        </div>

        {!hasMessages && !generating && (
          <div className="card p-8 text-center mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap size={22} className="text-blue-400" />
            </div>
            <p className="text-slate-300 font-medium mb-1">No messages generated yet</p>
            <p className="text-slate-500 text-sm">Click "Generate Messages" to create personalised LinkedIn and email follow-ups powered by AI.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MESSAGE_TYPES.map(type => (
            <MessageCard
              key={type}
              contactId={id}
              type={type}
              message={contact.messages?.[type]}
              onUpdate={handleMessageUpdate}
              onRegenerate={handleGenerate}
              regenerating={generating}
            />
          ))}
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-white mb-2">Delete contact?</h3>
            <p className="text-slate-400 text-sm mb-5">
              This will permanently delete {contact.full_name} and all their messages. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-500">
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

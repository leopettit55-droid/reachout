import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Menu, ArrowLeft, Upload, X, User } from 'lucide-react';
import { createContact, getContact, getEvents, createEvent } from '../api';
import toast from 'react-hot-toast';

export default function AddContact({ onMenuClick }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [newEventMode, setNewEventMode] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    company: '',
    event_id: '',
    where_met: '',
    date_met: new Date().toISOString().split('T')[0],
    notes: '',
    linkedin_url: '',
    email: '',
  });

  useEffect(() => {
    getEvents().then(setEvents).catch(() => {});
    if (isEdit) {
      getContact(id).then(c => {
        setForm({
          full_name: c.full_name || '',
          job_title: c.job_title || '',
          company: c.company || '',
          event_id: c.event_id ? String(c.event_id) : '',
          where_met: c.where_met || '',
          date_met: c.date_met || '',
          notes: c.notes || '',
          linkedin_url: c.linkedin_url || '',
          email: c.email || '',
        });
        if (c.photo_path) setPhotoPreview(c.photo_path);
      }).catch(() => toast.error('Failed to load contact'));
    }
  }, [id]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }

    setLoading(true);
    try {
      let eventId = form.event_id;

      // Create new event if needed
      if (newEventMode && newEventName.trim()) {
        const ev = await createEvent({ name: newEventName.trim() });
        eventId = String(ev.id);
      }

      const fd = new FormData();
      Object.entries({ ...form, event_id: eventId }).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (photoFile) fd.append('photo', photoFile);

      if (isEdit) {
        const { updateContact } = await import('../api');
        await updateContact(id, fd);
        toast.success('Contact updated!');
        navigate(`/contacts/${id}`);
      } else {
        const contact = await createContact(fd);
        toast.success('Contact added!');
        navigate(`/contacts/${contact.id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <Link to={isEdit ? `/contacts/${id}` : '/'} className="text-slate-400 hover:text-white p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">{isEdit ? 'Edit Contact' : 'Add Contact'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo upload */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-navy-700 border-2 border-dashed border-navy-500 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden relative group"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={16} className="text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-500">
                <User size={20} />
                <span className="text-xs">Photo</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <div>
            <p className="text-sm text-slate-300 font-medium">Profile photo</p>
            <p className="text-xs text-slate-500">Optional · Max 5MB</p>
            {photoPreview && (
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
              >
                <X size={11} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact Info</h2>
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Alex Johnson" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job Title</label>
              <input className="input" placeholder="Product Manager" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" placeholder="Acme Corp" value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Where we met */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Where We Met</h2>

          {/* Event picker */}
          <div>
            <label className="label">Event</label>
            {!newEventMode ? (
              <div className="flex gap-2">
                <select
                  className="input"
                  value={form.event_id}
                  onChange={e => set('event_id', e.target.value)}
                >
                  <option value="">No event</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewEventMode(true)}
                  className="btn-secondary text-xs whitespace-nowrap"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Event name (e.g. London Tech Week 2026)"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  autoFocus
                />
                <button type="button" onClick={() => setNewEventMode(false)} className="btn-ghost">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Location / Description</label>
              <input className="input" placeholder="Booth 42, main hall..." value={form.where_met} onChange={e => set('where_met', e.target.value)} />
            </div>
            <div>
              <label className="label">Date Met</label>
              <input type="date" className="input" value={form.date_met} onChange={e => set('date_met', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Conversation Notes</h2>
          <label className="label">What did you talk about?</label>
          <textarea
            className="input min-h-[120px] resize-none"
            placeholder="We discussed their new product launch, their challenges with developer tooling, and their upcoming move to Berlin. They mentioned they're hiring senior engineers. We bonded over a shared love of climbing..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1.5">The more detail here, the better the AI-generated messages will be.</p>
        </div>

        {/* Contact details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact Details</h2>
          <div>
            <label className="label">LinkedIn URL</label>
            <input
              className="input"
              type="url"
              placeholder="https://linkedin.com/in/alexjohnson"
              value={form.linkedin_url}
              onChange={e => set('linkedin_url', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : isEdit ? 'Save Changes' : 'Add Contact'}
          </button>
          <Link to={isEdit ? `/contacts/${id}` : '/'} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

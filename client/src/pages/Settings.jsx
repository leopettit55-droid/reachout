import React, { useEffect, useState } from 'react';
import { Menu, Save, Mail, TestTube, Send } from 'lucide-react';
import { getSettings, updateSettings, testEmail, sendDigest } from '../api';
import toast from 'react-hot-toast';

const TONES = ['Warm & casual', 'Professional', 'Concise'];
const FREQUENCIES = ['daily', 'weekly'];

export default function Settings({ onMenuClick }) {
  const [form, setForm] = useState({
    user_name: '', user_title: '', user_company: '', user_linkedin: '',
    message_tone: 'Warm & casual',
    reminder_frequency: 'weekly', email_reminders: false,
    reminder_email: '', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  useEffect(() => {
    getSettings()
      .then(s => setForm({
        user_name: s.user_name || '',
        user_title: s.user_title || '',
        user_company: s.user_company || '',
        user_linkedin: s.user_linkedin || '',
        message_tone: s.message_tone || 'Warm & casual',
        reminder_frequency: s.reminder_frequency || 'weekly',
        email_reminders: Boolean(s.email_reminders),
        reminder_email: s.reminder_email || '',
        smtp_host: s.smtp_host || '',
        smtp_port: s.smtp_port || 587,
        smtp_user: s.smtp_user || '',
        smtp_pass: s.smtp_pass || ''
      }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    try {
      await testEmail();
      toast.success('Test email sent!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTestingEmail(false);
    }
  }

  async function handleSendDigest() {
    setSendingDigest(true);
    try {
      const result = await sendDigest();
      toast.success(result.message || `Digest sent — ${result.count} contacts`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingDigest(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Personalise Reachout for your workflow</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Your profile */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Your Profile</h2>
          <p className="text-xs text-slate-500 -mt-2">Used by the AI to write messages from your perspective.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Your Name</label>
              <input className="input" placeholder="Sarah Chen" value={form.user_name} onChange={e => set('user_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input className="input" placeholder="Head of Product" value={form.user_title} onChange={e => set('user_title', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company</label>
              <input className="input" placeholder="Acme Corp" value={form.user_company} onChange={e => set('user_company', e.target.value)} />
            </div>
            <div>
              <label className="label">Your LinkedIn URL</label>
              <input className="input" type="url" placeholder="https://linkedin.com/in/..." value={form.user_linkedin} onChange={e => set('user_linkedin', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Message preferences */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Message Style</h2>
          <div>
            <label className="label">Preferred Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('message_tone', t)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                    form.message_tone === t
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                      : 'bg-navy-700 border-navy-500 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reminder preferences */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Follow-up Reminders</h2>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.email_reminders}
                onChange={e => set('email_reminders', e.target.checked)}
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${form.email_reminders ? 'bg-blue-600' : 'bg-navy-600 border border-navy-400'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.email_reminders ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Email reminders</p>
              <p className="text-xs text-slate-500">Get a digest of contacts needing follow-up</p>
            </div>
          </label>

          {form.email_reminders && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <label className="label">Reminder frequency</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set('reminder_frequency', f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border capitalize ${
                        form.reminder_frequency === f
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                          : 'bg-navy-700 border-navy-500 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Reminder email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.reminder_email}
                  onChange={e => set('reminder_email', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* SMTP config */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Email Server (SMTP)</h2>
          <p className="text-xs text-slate-500 -mt-2">Required for sending reminder digest emails.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SMTP Host</label>
              <input className="input" placeholder="smtp.gmail.com" value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} />
            </div>
            <div>
              <label className="label">Port</label>
              <input className="input" type="number" placeholder="587" value={form.smtp_port} onChange={e => set('smtp_port', Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="you@gmail.com" value={form.smtp_user} onChange={e => set('smtp_user', e.target.value)} />
            </div>
            <div>
              <label className="label">Password / App Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.smtp_pass} onChange={e => set('smtp_pass', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="btn-secondary text-sm"
            >
              <TestTube size={14} /> {testingEmail ? 'Sending...' : 'Send test email'}
            </button>
            <button
              type="button"
              onClick={handleSendDigest}
              disabled={sendingDigest}
              className="btn-secondary text-sm"
            >
              <Send size={14} /> {sendingDigest ? 'Sending...' : 'Send digest now'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

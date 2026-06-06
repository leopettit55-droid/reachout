import React, { useState } from 'react';
import { Copy, Check, Send, RefreshCw, Edit3, X, Save, MessageSquare, Mail, Linkedin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { updateMessage, markMessageSent, addResponseNote } from '../api';

const TYPE_CONFIG = {
  linkedin_connection: {
    label: 'LinkedIn Connection',
    icon: Linkedin,
    iconColor: 'text-blue-400',
    bg: 'from-blue-500/5',
    charLimit: 300,
    hint: 'Connection request — max 300 characters'
  },
  linkedin_followup: {
    label: 'LinkedIn Message',
    icon: MessageSquare,
    iconColor: 'text-sky-400',
    bg: 'from-sky-500/5',
    hint: 'Direct message for existing connections'
  },
  email: {
    label: 'Follow-up Email',
    icon: Mail,
    iconColor: 'text-purple-400',
    bg: 'from-purple-500/5',
    hint: 'Personalised email follow-up'
  },
};

export default function MessageCard({ contactId, type, message, onUpdate, onRegenerate, regenerating }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [note, setNote] = useState(message?.response_note || '');
  const [markReplied, setMarkReplied] = useState(false);

  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const content = message?.content || '';

  const charCount = type === 'linkedin_connection' ? content.length : null;
  const overLimit = charCount !== null && charCount > 300;

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMessage(contactId, type, editContent);
      onUpdate(type, updated);
      setEditing(false);
      toast.success('Message saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent() {
    try {
      const updated = await markMessageSent(contactId, type);
      onUpdate(type, updated);
      toast.success('Marked as sent!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveNote() {
    try {
      const updated = await addResponseNote(contactId, type, note, markReplied);
      onUpdate(type, updated);
      setShowNoteForm(false);
      toast.success(markReplied ? 'Marked as replied!' : 'Note saved');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!message) {
    return (
      <div className={`card p-5 bg-gradient-to-b ${cfg.bg} to-transparent`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon size={16} className={cfg.iconColor} />
          <span className="font-medium text-slate-200 text-sm">{cfg.label}</span>
          <span className="text-xs text-slate-500 ml-auto">{cfg.hint}</span>
        </div>
        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
          Generate messages to see this
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-5 bg-gradient-to-b ${cfg.bg} to-transparent transition-all`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={cfg.iconColor} />
        <span className="font-medium text-slate-200 text-sm">{cfg.label}</span>
        {message.sent_at && (
          <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
            <Check size={11} /> Sent {format(parseISO(message.sent_at), 'MMM d')}
          </span>
        )}
        {!message.sent_at && charCount !== null && (
          <span className={`ml-auto text-xs ${overLimit ? 'text-red-400' : 'text-slate-500'}`}>
            {charCount}/300
          </span>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          className="input text-sm resize-none min-h-[140px] font-mono leading-relaxed"
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          autoFocus
        />
      ) : (
        <div
          className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-navy-900/50 rounded-lg p-3 min-h-[80px] cursor-text"
          onClick={() => { setEditing(true); setEditContent(content); }}
        >
          {content}
        </div>
      )}

      {/* Response note */}
      {message.response_note && !showNoteForm && (
        <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
          <p className="text-xs text-slate-400 font-medium mb-0.5">Response note</p>
          <p className="text-xs text-slate-300">{message.response_note}</p>
        </div>
      )}

      {/* Note form */}
      {showNoteForm && (
        <div className="mt-3 space-y-2">
          <textarea
            className="input text-sm resize-none h-20"
            placeholder="Note about the response received..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={markReplied}
              onChange={e => setMarkReplied(e.target.checked)}
            />
            Mark contact as replied
          </label>
          <div className="flex gap-2">
            <button onClick={handleSaveNote} className="btn-primary text-xs px-3 py-1.5">Save note</button>
            <button onClick={() => setShowNoteForm(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
              <Save size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs">
              <X size={12} /> Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={handleCopy} className="btn-ghost text-xs">
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => { setEditing(true); setEditContent(content); }} className="btn-ghost text-xs">
              <Edit3 size={12} /> Edit
            </button>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="btn-ghost text-xs"
            >
              <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
            {!message.sent_at && (
              <button onClick={handleMarkSent} className="btn-ghost text-xs text-emerald-400 hover:text-emerald-300">
                <Send size={12} /> Mark sent
              </button>
            )}
            {message.sent_at && !showNoteForm && (
              <button onClick={() => setShowNoteForm(true)} className="btn-ghost text-xs text-slate-400">
                + Add note
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

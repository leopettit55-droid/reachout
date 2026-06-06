import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { Building2, MapPin, Clock, AlertTriangle, MessageSquare, Linkedin, Mail } from 'lucide-react';
import StatusBadge from './StatusBadge';

function Avatar({ contact }) {
  if (contact.photo_path) {
    return (
      <img
        src={contact.photo_path}
        alt={contact.full_name}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-navy-600"
      />
    );
  }
  const initials = contact.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = [
    'from-blue-600 to-blue-700',
    'from-purple-600 to-purple-700',
    'from-emerald-600 to-emerald-700',
    'from-rose-600 to-rose-700',
    'from-amber-600 to-amber-700',
  ];
  const color = colors[contact.id % colors.length];
  return (
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold text-sm ring-2 ring-navy-600`}>
      {initials}
    </div>
  );
}

export default function ContactCard({ contact }) {
  const daysSinceMet = contact.date_met
    ? differenceInDays(new Date(), parseISO(contact.date_met))
    : null;
  const isUrgent = daysSinceMet !== null && daysSinceMet > 7 && contact.status === 'Pending';
  const needsFollowUp = daysSinceMet !== null && daysSinceMet > 3 && contact.status === 'Pending';

  const hasMsgTypes = Object.keys(contact.messages || {});
  const sentCount = hasMsgTypes.filter(k => contact.messages[k]?.sent_at).length;

  return (
    <Link to={`/contacts/${contact.id}`}>
      <div className={`card-hover p-5 animate-slide-up cursor-pointer group ${isUrgent ? 'border-red-500/30 hover:border-red-500/50' : ''}`}>
        {/* Urgency banner */}
        {isUrgent && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium mb-3 -mt-1">
            <AlertTriangle size={12} />
            <span>{daysSinceMet} days — urgent follow-up needed</span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar contact={contact} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-100 group-hover:text-white truncate">
                  {contact.full_name}
                </h3>
                {(contact.job_title || contact.company) && (
                  <p className="text-slate-400 text-sm truncate flex items-center gap-1 mt-0.5">
                    <Building2 size={12} className="flex-shrink-0" />
                    {[contact.job_title, contact.company].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <StatusBadge status={contact.status} />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-slate-500">
              {contact.where_met || contact.event_name ? (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {contact.where_met || contact.event_name}
                </span>
              ) : null}
              {contact.date_met && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {daysSinceMet === 0 ? 'Today' : daysSinceMet === 1 ? 'Yesterday' : `${daysSinceMet}d ago`}
                </span>
              )}
            </div>

            {/* Contact channels */}
            <div className="mt-2.5 flex items-center gap-2">
              {contact.linkedin_url && (
                <span className="text-blue-400/60 text-xs flex items-center gap-0.5">
                  <Linkedin size={11} /> LinkedIn
                </span>
              )}
              {contact.email && (
                <span className="text-slate-500 text-xs flex items-center gap-0.5">
                  <Mail size={11} /> Email
                </span>
              )}
              {sentCount > 0 && (
                <span className="ml-auto text-xs text-emerald-400/70 flex items-center gap-0.5">
                  <MessageSquare size={11} /> {sentCount} sent
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

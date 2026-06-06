const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;

  const followedUp = db.prepare(`
    SELECT COUNT(DISTINCT contact_id) as count FROM messages WHERE sent_at IS NOT NULL
  `).get().count;

  const replied = db.prepare(`SELECT COUNT(*) as count FROM contacts WHERE status = 'Replied'`).get().count;

  const followUpRate = totalContacts > 0 ? Math.round((followedUp / totalContacts) * 100) : 0;
  const replyRate = followedUp > 0 ? Math.round((replied / followedUp) * 100) : 0;

  // Average time to first follow-up in hours
  const avgTimeRows = db.prepare(`
    SELECT c.date_met, MIN(m.sent_at) as first_sent
    FROM contacts c
    JOIN messages m ON m.contact_id = c.id
    WHERE m.sent_at IS NOT NULL AND c.date_met IS NOT NULL
    GROUP BY c.id
  `).all();

  let avgHours = null;
  if (avgTimeRows.length > 0) {
    const totalHours = avgTimeRows.reduce((sum, row) => {
      const met = new Date(row.date_met);
      const sent = new Date(row.first_sent);
      return sum + Math.max(0, (sent - met) / (1000 * 60 * 60));
    }, 0);
    avgHours = Math.round(totalHours / avgTimeRows.length);
  }

  // Events with stats
  const events = db.prepare(`
    SELECT e.name, e.id,
      COUNT(c.id) as contact_count,
      SUM(CASE WHEN c.status != 'Pending' THEN 1 ELSE 0 END) as followed_up,
      SUM(CASE WHEN c.status = 'Replied' THEN 1 ELSE 0 END) as replied
    FROM events e
    LEFT JOIN contacts c ON c.event_id = e.id
    GROUP BY e.id
    ORDER BY contact_count DESC
    LIMIT 5
  `).all();

  // Contacts needing follow-up (met > 3 days ago, status Pending)
  const needsFollowUp = db.prepare(`
    SELECT COUNT(*) as count FROM contacts
    WHERE status = 'Pending'
    AND date_met <= date('now', '-3 days')
  `).get().count;

  // Urgent contacts (met > 7 days, still pending)
  const urgent = db.prepare(`
    SELECT COUNT(*) as count FROM contacts
    WHERE status = 'Pending'
    AND date_met <= date('now', '-7 days')
  `).get().count;

  // Status breakdown
  const statusBreakdown = db.prepare(`
    SELECT status, COUNT(*) as count FROM contacts GROUP BY status
  `).all();

  // Recent activity (last 7 days)
  const recentContacts = db.prepare(`
    SELECT COUNT(*) as count FROM contacts
    WHERE created_at >= datetime('now', '-7 days')
  `).get().count;

  res.json({
    totalContacts,
    followedUp,
    replied,
    followUpRate,
    replyRate,
    avgHours,
    events,
    needsFollowUp,
    urgent,
    statusBreakdown,
    recentContacts
  });
});

module.exports = router;

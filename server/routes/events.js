const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all events with stats
router.get('/', (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      COUNT(c.id) as contact_count,
      SUM(CASE WHEN c.status != 'Pending' THEN 1 ELSE 0 END) as followed_up_count,
      SUM(CASE WHEN c.status = 'Replied' THEN 1 ELSE 0 END) as replied_count
    FROM events e
    LEFT JOIN contacts c ON c.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(events);
});

// GET single event with contacts
router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const contacts = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM messages WHERE contact_id = c.id AND sent_at IS NOT NULL) as messages_sent_count
    FROM contacts c
    WHERE c.event_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.id);

  const contactsWithMessages = contacts.map(c => {
    const messages = db.prepare('SELECT * FROM messages WHERE contact_id = ?').all(c.id);
    const messageMap = {};
    messages.forEach(m => { messageMap[m.type] = m; });
    return { ...c, messages: messageMap };
  });

  res.json({ ...event, contacts: contactsWithMessages });
});

// POST create event
router.post('/', (req, res) => {
  const { name, date, location, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Event name is required' });

  const result = db.prepare(`
    INSERT INTO events (name, date, location, description) VALUES (?, ?, ?, ?)
  `).run(name.trim(), date || null, location || null, description || null);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(event);
});

// PUT update event
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { name, date, location, description } = req.body;
  db.prepare(`
    UPDATE events SET name = ?, date = ?, location = ?, description = ? WHERE id = ?
  `).run(
    name ?? existing.name,
    date !== undefined ? date || null : existing.date,
    location !== undefined ? location || null : existing.location,
    description !== undefined ? description || null : existing.description,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

// DELETE event
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

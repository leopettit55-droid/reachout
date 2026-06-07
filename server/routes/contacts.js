const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const db = require('../db');
const Groq = require('groq-sdk');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

function getContactWithMessages(id) {
  const contact = db.prepare(`
    SELECT c.*, e.name as event_name
    FROM contacts c
    LEFT JOIN events e ON c.event_id = e.id
    WHERE c.id = ?
  `).get(id);
  if (!contact) return null;
  const messages = db.prepare('SELECT * FROM messages WHERE contact_id = ? ORDER BY type').all(id);
  const messageMap = {};
  messages.forEach(m => { messageMap[m.type] = m; });
  return { ...contact, messages: messageMap };
}

// GET all contacts
router.get('/', (req, res) => {
  const { event_id, status } = req.query;
  let query = `
    SELECT c.*, e.name as event_name,
      (SELECT COUNT(*) FROM messages WHERE contact_id = c.id AND sent_at IS NOT NULL) as messages_sent_count
    FROM contacts c
    LEFT JOIN events e ON c.event_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (event_id) { query += ' AND c.event_id = ?'; params.push(event_id); }
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  query += ' ORDER BY c.created_at DESC';

  const contacts = db.prepare(query).all(...params);
  const result = contacts.map(c => {
    const messages = db.prepare('SELECT * FROM messages WHERE contact_id = ?').all(c.id);
    const messageMap = {};
    messages.forEach(m => { messageMap[m.type] = m; });
    return { ...c, messages: messageMap };
  });
  res.json(result);
});

// GET single contact
router.get('/:id', (req, res) => {
  const contact = getContactWithMessages(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

// POST create contact
router.post('/', upload.single('photo'), (req, res) => {
  const { full_name, job_title, company, event_id, where_met, date_met, notes, linkedin_url, email } = req.body;
  if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required' });

  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(`
    INSERT INTO contacts (full_name, job_title, company, event_id, where_met, date_met, notes, linkedin_url, email, photo_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    full_name.trim(), job_title || null, company || null,
    event_id || null, where_met || null, date_met || null,
    notes || null, linkedin_url || null, email || null, photo_path
  );
  const contact = getContactWithMessages(result.lastInsertRowid);
  res.status(201).json(contact);
});

// PUT update contact
router.put('/:id', upload.single('photo'), (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const { full_name, job_title, company, event_id, where_met, date_met, notes, linkedin_url, email, status } = req.body;
  const photo_path = req.file ? `/uploads/${req.file.filename}` : existing.photo_path;

  db.prepare(`
    UPDATE contacts SET
      full_name = ?, job_title = ?, company = ?, event_id = ?, where_met = ?,
      date_met = ?, notes = ?, linkedin_url = ?, email = ?, photo_path = ?,
      status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    full_name ?? existing.full_name,
    job_title !== undefined ? job_title || null : existing.job_title,
    company !== undefined ? company || null : existing.company,
    event_id !== undefined ? event_id || null : existing.event_id,
    where_met !== undefined ? where_met || null : existing.where_met,
    date_met !== undefined ? date_met || null : existing.date_met,
    notes !== undefined ? notes || null : existing.notes,
    linkedin_url !== undefined ? linkedin_url || null : existing.linkedin_url,
    email !== undefined ? email || null : existing.email,
    photo_path,
    status ?? existing.status,
    req.params.id
  );

  res.json(getContactWithMessages(req.params.id));
});

// DELETE contact
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST generate AI messages
router.post('/:id/generate-messages', async (req, res) => {
  const contact = db.prepare(`
    SELECT c.*, e.name as event_name
    FROM contacts c
    LEFT JOIN events e ON c.event_id = e.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const userName = settings?.user_name?.trim() || 'a professional';
  const userContext = [
    userName,
    settings?.user_title ? `(${settings.user_title}` : '',
    settings?.user_company ? `at ${settings.user_company})` : settings?.user_title ? ')' : ''
  ].filter(Boolean).join(' ');
  const tone = settings?.message_tone || 'Warm & casual';

  const prompt = `You are helping ${userContext} write follow-up messages for a professional contact they just met.

CONTACT DETAILS:
Name: ${contact.full_name}
Job Title: ${contact.job_title || 'not specified'}
Company: ${contact.company || 'not specified'}
Where we met: ${contact.where_met || contact.event_name || 'at a networking event'}
Date met: ${contact.date_met || 'recently'}
Conversation notes: ${contact.notes || 'We had a great chat and want to stay in touch'}

TONE PREFERENCE: ${tone}

Write three messages as a JSON object. Be specific, reference the actual conversation details, sound like a real person wrote this (not a template):

{
  "linkedin_connection": "Connection request note - STRICT 300 character limit, mention where you met",
  "linkedin_followup": "DM for if already connected - 2-3 short paragraphs, conversational, reference specific things from notes",
  "email_subject": "Email subject line",
  "email_body": "Email body - 2-3 paragraphs, warm but professional, specific references to conversation"
}

Rules:
- Never say "I hope this finds you well" or "as per our conversation" or "reaching out"
- Every message must reference something specific from the conversation notes
- Match the ${tone} tone throughout
- linkedin_connection MUST be under 300 characters (count carefully)
- Return ONLY the JSON object, no markdown fences or explanation`;

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = response.choices[0].message.content.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse AI response');
      parsed = JSON.parse(match[0]);
    }

    const emailContent = `Subject: ${parsed.email_subject}\n\n${parsed.email_body}`;
    const messageTypes = [
      { type: 'linkedin_connection', content: parsed.linkedin_connection },
      { type: 'linkedin_followup', content: parsed.linkedin_followup },
      { type: 'email', content: emailContent }
    ];

    const savedMessages = {};
    for (const msg of messageTypes) {
      const existing = db.prepare('SELECT id FROM messages WHERE contact_id = ? AND type = ?').get(req.params.id, msg.type);
      if (existing) {
        db.prepare(`UPDATE messages SET content = ?, generated_at = datetime('now'), sent_at = NULL, updated_at = datetime('now') WHERE contact_id = ? AND type = ?`)
          .run(msg.content, req.params.id, msg.type);
      } else {
        db.prepare(`INSERT INTO messages (contact_id, type, content) VALUES (?, ?, ?)`)
          .run(req.params.id, msg.type, msg.content);
      }
      savedMessages[msg.type] = db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(req.params.id, msg.type);
    }

    res.json({ messages: savedMessages });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate messages. Check your API key.' });
  }
});

// PUT update message content
router.put('/:id/messages/:type', (req, res) => {
  const { content } = req.body;
  const { id, type } = req.params;
  const existing = db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(id, type);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  db.prepare(`UPDATE messages SET content = ?, updated_at = datetime('now') WHERE contact_id = ? AND type = ?`).run(content, id, type);
  res.json(db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(id, type));
});

// POST mark message as sent
router.post('/:id/messages/:type/mark-sent', (req, res) => {
  const { id, type } = req.params;
  const existing = db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(id, type);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  db.prepare(`UPDATE messages SET sent_at = datetime('now'), updated_at = datetime('now') WHERE contact_id = ? AND type = ?`).run(id, type);
  // Promote status if still Pending
  db.prepare(`UPDATE contacts SET status = 'Message Sent', updated_at = datetime('now') WHERE id = ? AND status = 'Pending'`).run(id);
  res.json(db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(id, type));
});

// PUT response note + mark replied
router.put('/:id/messages/:type/response', (req, res) => {
  const { response_note, mark_replied } = req.body;
  const { id, type } = req.params;
  db.prepare(`UPDATE messages SET response_note = ?, updated_at = datetime('now') WHERE contact_id = ? AND type = ?`).run(response_note, id, type);
  if (mark_replied) {
    db.prepare(`UPDATE contacts SET status = 'Replied', updated_at = datetime('now') WHERE id = ?`).run(id);
  }
  res.json(db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(id, type));
});

// PUT update contact status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['Pending', 'Message Sent', 'Replied', 'In Progress'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare(`UPDATE contacts SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
  res.json(getContactWithMessages(req.params.id));
});

// POST send email directly
router.post('/:id/messages/email/send', async (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  if (!contact.email) return res.status(400).json({ error: 'This contact has no email address. Add one by editing the contact.' });

  const message = db.prepare('SELECT * FROM messages WHERE contact_id = ? AND type = ?').get(req.params.id, 'email');
  if (!message?.content) return res.status(404).json({ error: 'No email message generated yet. Click Generate Messages first.' });

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings?.smtp_host || !settings?.smtp_user) {
    return res.status(400).json({ error: 'Email not configured. Go to Settings and fill in your SMTP details.' });
  }

  // Parse "Subject: ...\n\nbody..." format
  const firstNewline = message.content.indexOf('\n\n');
  const subjectLine = message.content.substring(0, firstNewline).replace(/^Subject:\s*/i, '').trim();
  const body = message.content.substring(firstNewline + 2).trim();

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_port === 465,
      auth: { user: settings.smtp_user, pass: settings.smtp_pass }
    });

    await transporter.sendMail({
      from: `${settings.user_name || 'Reachout'} <${settings.smtp_user}>`,
      to: contact.email,
      subject: subjectLine,
      text: body
    });

    // Auto mark as sent
    db.prepare(`UPDATE messages SET sent_at = datetime('now'), updated_at = datetime('now') WHERE contact_id = ? AND type = 'email'`).run(req.params.id);
    db.prepare(`UPDATE contacts SET status = 'Message Sent', updated_at = datetime('now') WHERE id = ? AND status = 'Pending'`).run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: `Failed to send: ${error.message}` });
  }
});

module.exports = router;

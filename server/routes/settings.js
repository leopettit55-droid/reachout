const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db');

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

router.put('/', (req, res) => {
  const {
    user_name, user_title, user_company, user_linkedin,
    message_tone, reminder_frequency, email_reminders,
    reminder_email, smtp_host, smtp_port, smtp_user, smtp_pass
  } = req.body;

  db.prepare(`
    UPDATE settings SET
      user_name = ?, user_title = ?, user_company = ?, user_linkedin = ?,
      message_tone = ?, reminder_frequency = ?, email_reminders = ?,
      reminder_email = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?
    WHERE id = 1
  `).run(
    user_name ?? '', user_title ?? '', user_company ?? '', user_linkedin ?? '',
    message_tone ?? 'Warm & casual', reminder_frequency ?? 'weekly',
    email_reminders ? 1 : 0,
    reminder_email ?? '', smtp_host ?? '', smtp_port ?? 587, smtp_user ?? '', smtp_pass ?? ''
  );

  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

  if (!settings.smtp_host || !settings.smtp_user) {
    return res.status(400).json({ error: 'SMTP configuration incomplete' });
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_port === 465,
      auth: { user: settings.smtp_user, pass: settings.smtp_pass }
    });

    await transporter.sendMail({
      from: settings.smtp_user,
      to: settings.reminder_email || settings.smtp_user,
      subject: 'Reachout — Test Email',
      text: 'Your Reachout email configuration is working correctly!'
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send follow-up reminder digest
router.post('/send-digest', async (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings.smtp_host || !settings.reminder_email) {
    return res.status(400).json({ error: 'Email settings not configured' });
  }

  const needsFollowUp = db.prepare(`
    SELECT c.full_name, c.company, c.date_met, c.where_met
    FROM contacts c
    WHERE c.status = 'Pending'
    AND (c.date_met IS NULL OR c.date_met <= date('now', '-3 days'))
    ORDER BY c.date_met ASC
  `).all();

  if (needsFollowUp.length === 0) {
    return res.json({ message: 'No contacts need following up right now.' });
  }

  const lines = needsFollowUp.map(c =>
    `• ${c.full_name}${c.company ? ` (${c.company})` : ''} — met ${c.date_met || 'recently'}${c.where_met ? ` at ${c.where_met}` : ''}`
  ).join('\n');

  const emailBody = `Hi ${settings.user_name || 'there'},\n\nYou have ${needsFollowUp.length} contact${needsFollowUp.length !== 1 ? 's' : ''} waiting for a follow-up:\n\n${lines}\n\nHead to Reachout to generate and send your messages.\n\nReachout`;

  try {
    const transporter = nodemailer.createTransporter({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_port === 465,
      auth: { user: settings.smtp_user, pass: settings.smtp_pass }
    });

    await transporter.sendMail({
      from: settings.smtp_user,
      to: settings.reminder_email,
      subject: `Reachout — ${needsFollowUp.length} contact${needsFollowUp.length !== 1 ? 's' : ''} need following up`,
      text: emailBody
    });

    res.json({ success: true, count: needsFollowUp.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

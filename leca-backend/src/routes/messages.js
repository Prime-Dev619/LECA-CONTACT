const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { emitToUser } = require('../socket');

const router = express.Router();

const startSchema = Joi.object({
  recipientId: Joi.string().uuid().required(),
});

router.post('/start', requireAuth, async (req, res) => {
  const { error, value } = startSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { recipientId } = value;
  if (recipientId === req.user.id) return res.status(400).json({ error: 'Cannot start with self' });
  const a = req.user.id;
  const b = recipientId;
  const [userA, userB] = a < b ? [a, b] : [b, a];
  try {
    const existing = await query('SELECT id FROM conversations WHERE user_a = $1 AND user_b = $2', [userA, userB]);
    if (existing.rowCount) return res.json({ conversationId: existing.rows[0].id });
    const id = uuidv4();
    await query('INSERT INTO conversations(id, user_a, user_b) VALUES($1,$2,$3)', [id, userA, userB]);
    return res.status(201).json({ conversationId: id });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.created_at,
              CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS other_user_id,
              (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.recipient_id = $1 AND read_at IS NULL) as unread_count
       FROM conversations c
       WHERE c.user_a = $1 OR c.user_b = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return res.json({ items: result.rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/:conversationId/messages', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conv = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (!conv.rowCount) return res.status(404).json({ error: 'Not found' });
    const c = conv.rows[0];
    if (c.user_a !== req.user.id && c.user_b !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const msgs = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return res.json({ items: msgs.rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

const sendSchema = Joi.object({
  body: Joi.string().min(1).max(3000).required(),
});

router.post('/:conversationId/messages', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  const { error, value } = sendSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { body } = value;
  try {
    const conv = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (!conv.rowCount) return res.status(404).json({ error: 'Not found' });
    const c = conv.rows[0];
    if (c.user_a !== req.user.id && c.user_b !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const recipientId = c.user_a === req.user.id ? c.user_b : c.user_a;
    const id = uuidv4();
    await query(
      'INSERT INTO messages(id, conversation_id, sender_id, recipient_id, body) VALUES($1,$2,$3,$4,$5)',
      [id, conversationId, req.user.id, recipientId, body]
    );
    emitToUser(recipientId, 'message:new', { conversationId, id, body, senderId: req.user.id });
    return res.status(201).json({ id });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:conversationId/read', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  try {
    await query(
      'UPDATE messages SET read_at = now() WHERE conversation_id = $1 AND recipient_id = $2 AND read_at IS NULL',
      [conversationId, req.user.id]
    );
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;


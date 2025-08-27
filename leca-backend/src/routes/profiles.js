const express = require('express');
const Joi = require('joi');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await query('SELECT id, name, email, university_id, university_email, rating_avg, rating_count FROM users WHERE id = $1', [req.user.id]);
    const listings = await query('SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const purchases = await query('SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    return res.json({ user: user.rows[0], listings: listings.rows, purchases: purchases.rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
});

router.patch('/me', requireAuth, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { name } = value;
  try {
    if (name) await query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
    const user = await query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    return res.json(user.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

const ratingSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  stars: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null)
});

router.post('/rate', requireAuth, async (req, res) => {
  const { error, value } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { orderId, stars, comment } = value;
  try {
    const ord = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!ord.rowCount) return res.status(404).json({ error: 'Order not found' });
    const order = ord.rows[0];
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rateeId = order.buyer_id === req.user.id ? order.seller_id : order.buyer_id;
    await query(
      'INSERT INTO ratings(rater_id, ratee_id, order_id, stars, comment) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
      [req.user.id, rateeId, orderId, stars, comment || null]
    );
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;


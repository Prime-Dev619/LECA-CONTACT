const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { emitToUser } = require('../socket');

const router = express.Router();

const checkoutSchema = Joi.object({
  listingId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

router.post('/checkout', requireAuth, async (req, res) => {
  const { error, value } = checkoutSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { listingId, quantity } = value;
  try {
    const listingRes = await query('SELECT id, seller_id, price_cents, is_active FROM listings WHERE id = $1', [listingId]);
    if (!listingRes.rowCount) return res.status(404).json({ error: 'Listing not found' });
    const listing = listingRes.rows[0];
    if (!listing.is_active) return res.status(400).json({ error: 'Listing is not active' });
    if (listing.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot buy your own listing' });
    const orderId = uuidv4();
    const totalCents = listing.price_cents * quantity;
    await query(
      `INSERT INTO orders(id, buyer_id, seller_id, listing_id, quantity, total_cents, status)
       VALUES($1,$2,$3,$4,$5,$6,'paid')`,
      [orderId, req.user.id, listing.seller_id, listingId, quantity, totalCents]
    );
    await query('UPDATE listings SET is_active = false WHERE id = $1', [listingId]);
    emitToUser(listing.seller_id, 'order:new', { orderId, listingId, buyerId: req.user.id });
    return res.status(201).json({ orderId, status: 'paid' });
  } catch (e) {
    return res.status(500).json({ error: 'Checkout failed' });
  }
});

router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await query(
      `SELECT * FROM orders WHERE buyer_id = $1 OR seller_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ items: orders.rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.post('/orders/:id/confirm', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const ord = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!ord.rowCount) return res.status(404).json({ error: 'Order not found' });
    const order = ord.rows[0];
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', ['completed', id]);
    emitToUser(order.buyer_id, 'order:completed', { orderId: id });
    emitToUser(order.seller_id, 'order:completed', { orderId: id });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to confirm order' });
  }
});

module.exports = router;


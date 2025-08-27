const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const listingSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  description: Joi.string().min(10).max(2000).required(),
  categoryId: Joi.number().integer().optional(),
  priceCents: Joi.number().integer().min(0).required(),
  condition: Joi.string().valid('new', 'like-new', 'good', 'fair').default('good'),
  location: Joi.string().max(120).allow('', null),
  images: Joi.array().items(Joi.string().uri()).max(6).default([])
});

router.get('/', async (req, res) => {
  const { q, categoryId, minPrice, maxPrice, sort = 'newest', limit = 20, offset = 0 } = req.query;
  const wheres = ['l.is_active = true'];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    wheres.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`);
  }
  if (categoryId) {
    params.push(Number(categoryId));
    wheres.push(`l.category_id = $${params.length}`);
  }
  if (minPrice) {
    params.push(Number(minPrice));
    wheres.push(`l.price_cents >= $${params.length}`);
  }
  if (maxPrice) {
    params.push(Number(maxPrice));
    wheres.push(`l.price_cents <= $${params.length}`);
  }
  let orderBy = 'l.created_at DESC';
  if (sort === 'price-asc') orderBy = 'l.price_cents ASC';
  if (sort === 'price-desc') orderBy = 'l.price_cents DESC';
  params.push(Number(limit));
  params.push(Number(offset));
  const sql = `
    SELECT l.*, u.name AS seller_name, c.name as category_name,
           COALESCE(json_agg(li.url) FILTER (WHERE li.url IS NOT NULL), '[]') AS images
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    LEFT JOIN categories c ON c.id = l.category_id
    LEFT JOIN listing_images li ON li.listing_id = l.id
    WHERE ${wheres.join(' AND ')}
    GROUP BY l.id, u.name, c.name
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  try {
    const result = await query(sql, params);
    return res.json({ items: result.rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to query listings' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { error, value } = listingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { title, description, categoryId, priceCents, condition, location, images } = value;
  const id = uuidv4();
  try {
    await query(
      `INSERT INTO listings(id, seller_id, title, description, category_id, price_cents, condition, location)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.user.id, title, description, categoryId || null, priceCents, condition, location || null]
    );
    for (let i = 0; i < images.length; i += 1) {
      await query('INSERT INTO listing_images(id, listing_id, url, position) VALUES($1,$2,$3,$4)', [uuidv4(), id, images[i], i]);
    }
    const created = await query('SELECT * FROM listings WHERE id = $1', [id]);
    return res.status(201).json(created.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create listing' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT l.*, u.name AS seller_name, c.name as category_name,
              COALESCE(json_agg(li.url) FILTER (WHERE li.url IS NOT NULL), '[]') AS images
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN categories c ON c.id = l.category_id
       LEFT JOIN listing_images li ON li.listing_id = l.id
       WHERE l.id = $1
       GROUP BY l.id, u.name, c.name`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json(result.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const allowed = ['title', 'description', 'categoryId', 'priceCents', 'condition', 'location', 'is_active'];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  try {
    const owner = await query('SELECT seller_id FROM listings WHERE id = $1', [id]);
    if (!owner.rowCount) return res.status(404).json({ error: 'Not found' });
    if (owner.rows[0].seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const setParts = [];
    const params = [];
    let idx = 1;
    if (updates.title) { setParts.push(`title = $${idx++}`); params.push(updates.title); }
    if (updates.description) { setParts.push(`description = $${idx++}`); params.push(updates.description); }
    if (updates.categoryId !== undefined) { setParts.push(`category_id = $${idx++}`); params.push(updates.categoryId || null); }
    if (updates.priceCents !== undefined) { setParts.push(`price_cents = $${idx++}`); params.push(updates.priceCents); }
    if (updates.condition) { setParts.push(`condition = $${idx++}`); params.push(updates.condition); }
    if (updates.location !== undefined) { setParts.push(`location = $${idx++}`); params.push(updates.location || null); }
    if (updates.is_active !== undefined) { setParts.push(`is_active = $${idx++}`); params.push(!!updates.is_active); }
    params.push(id);
    await query(`UPDATE listings SET ${setParts.join(', ')} WHERE id = $${idx}`, params);
    const updated = await query('SELECT * FROM listings WHERE id = $1', [id]);
    return res.json(updated.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update listing' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const owner = await query('SELECT seller_id FROM listings WHERE id = $1', [id]);
    if (!owner.rowCount) return res.status(404).json({ error: 'Not found' });
    if (owner.rows[0].seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await query('DELETE FROM listings WHERE id = $1', [id]);
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;


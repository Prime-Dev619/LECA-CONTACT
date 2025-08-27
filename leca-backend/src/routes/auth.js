const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

const router = express.Router();

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  universityId: Joi.string().min(4).max(64).required(),
  universityEmail: Joi.string().email().required()
});

router.post('/signup', async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { name, email, password, universityId, universityEmail } = value;

  // Require university domain match
  const uniDomain = universityEmail.split('@')[1];
  if (!uniDomain || !/\.edu$/.test(uniDomain)) {
    return res.status(400).json({ error: 'University email must end with .edu' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) return res.status(409).json({ error: 'Email already registered' });

    const id = uuidv4();
    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO users(id, name, email, password_hash, university_id, university_email, is_verified)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [id, name, email.toLowerCase(), passwordHash, universityId, universityEmail.toLowerCase(), true]
    );

    const token = signJwt({ id, email, name });
    return res.status(201).json({ token, user: { id, name, email } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to signup' });
  }
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { email, password } = value;
  try {
    const result = await query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;


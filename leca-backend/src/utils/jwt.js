const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function signJwt(user) {
  const payload = { sub: user.id, email: user.email, name: user.name };
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

module.exports = { signJwt };


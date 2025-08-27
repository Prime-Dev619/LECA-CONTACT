const REQUIRED_VARS = ['JWT_SECRET', 'DATABASE_URL'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v] || String(process.env[v]).trim() === '');
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
}

function getNumber(name, defaultValue) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : defaultValue;
}

validateEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: getNumber('PORT', 4000),
  jwtSecret: process.env.JWT_SECRET || 'insecure-dev-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/leca',
  clientOrigin: (process.env.CLIENT_ORIGIN || '*').split(','),
};


const crypto = require('crypto');

function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecodeToBuffer(input) {
  if (typeof input !== 'string') return Buffer.alloc(0);
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.isBuffer(a) ? a : Buffer.from(String(a), 'utf8');
  const bBuf = Buffer.isBuffer(b) ? b : Buffer.from(String(b), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function hashPassword(password, opts = {}) {
  const iterations = Number(opts.iterations ?? 200_000);
  const saltBytes = Number(opts.saltBytes ?? 16);
  const keyLen = Number(opts.keyLen ?? 32);
  const digest = String(opts.digest ?? 'sha256');

  const salt = crypto.randomBytes(saltBytes);
  const derivedKey = crypto.pbkdf2Sync(String(password), salt, iterations, keyLen, digest);

  return `pbkdf2_${digest}$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(derivedKey)}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;

  const [scheme, iterationsRaw, saltB64, hashB64] = parts;
  if (!scheme.startsWith('pbkdf2_')) return false;
  const digest = scheme.slice('pbkdf2_'.length);

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = base64UrlDecodeToBuffer(saltB64);
  const expectedHash = base64UrlDecodeToBuffer(hashB64);
  if (salt.length === 0 || expectedHash.length === 0) return false;

  const actualHash = crypto.pbkdf2Sync(String(password), salt, iterations, expectedHash.length, digest);
  return timingSafeEqual(actualHash, expectedHash);
}

function signToken(payload, secret, opts = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = Number(opts.expiresInSeconds ?? 60 * 60 * 24 * 7);

  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(body));
  const data = `${headerB64}.${payloadB64}`;

  const signature = crypto.createHmac('sha256', String(secret)).update(data).digest();
  const sigB64 = base64UrlEncode(signature);

  return `${data}.${sigB64}`;
}

function verifyToken(token, secret) {
  if (typeof token !== 'string') return { ok: false, error: 'missing_token' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, error: 'bad_format' };

  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto.createHmac('sha256', String(secret)).update(data).digest();
  const providedSig = base64UrlDecodeToBuffer(sigB64);
  if (providedSig.length !== expectedSig.length) return { ok: false, error: 'bad_signature' };
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return { ok: false, error: 'bad_signature' };

  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString('utf8'));
  } catch {
    return { ok: false, error: 'bad_payload' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp === 'number' && payload.exp < nowSeconds) {
    return { ok: false, error: 'expired' };
  }

  return { ok: true, payload };
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
};


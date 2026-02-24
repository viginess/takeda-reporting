
// Simple in-memory store for rate limiting
// Key: IP address, Value: { count: number, resetTime: number }
const storage = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter middleware logic
 * @param fingerprint Unique client fingerprint (IP + UserAgent + ClientID)
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(fingerprint: string, limit: number = 50, windowMs: number = 3600000) {
  const now = Date.now();
  const record = storage.get(fingerprint);

  if (!record || now > record.resetTime) {
    // New record or expired
    storage.set(fingerprint, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Limit exceeded
  }

  record.count += 1;
  return true;
}

// Optional: Cleanup old records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of storage.entries()) {
    if (now > record.resetTime) {
      storage.delete(ip);
    }
  }
}, 3600000); // Clean every hour

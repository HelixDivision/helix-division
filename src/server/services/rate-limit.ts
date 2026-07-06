// Rate limiting — architecture only, no real limiter yet. `RateLimiter` is
// called from every auth entry point that should eventually be rate-limited
// (registerAction, requestPasswordResetAction, resetPasswordAction,
// verifyCredentials), so swapping `NoopRateLimiter` for a real
// Upstash-Redis-backed implementation later touches only this file — none of
// those call sites change. Mirrors the "interface today, real implementation
// later" pattern already used twice in this codebase (NotificationService,
// PaymentProvider).

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  /** `key` is caller-defined — e.g. `login:${email}` or `login:${email}:${ip}` once IP is available. */
  check(key: string): Promise<RateLimitResult>;
}

class NoopRateLimiter implements RateLimiter {
  async check(_key: string): Promise<RateLimitResult> {
    return { allowed: true };
  }
}

export const rateLimiter: RateLimiter = new NoopRateLimiter();

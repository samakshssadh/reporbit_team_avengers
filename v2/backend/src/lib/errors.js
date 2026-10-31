// Uniform error type matching contract: {error:{code,message,retryable,requestId,retryAfterSeconds?}}
const STATUS = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  CSRF_FAILED: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  UPSTREAM_ERROR: 502,
  MODEL_UNAVAILABLE: 503,
  UPSTREAM_TIMEOUT: 504,
};
const RETRYABLE = new Set(['RATE_LIMITED', 'MODEL_UNAVAILABLE', 'UPSTREAM_TIMEOUT', 'UPSTREAM_ERROR', 'INTERNAL_ERROR']);

export class AppError extends Error {
  constructor(code, message, { details, retryAfterSeconds, status } = {}) {
    super(message);
    this.code = code;
    this.status = status || STATUS[code] || 500;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const errors = {
  unauth: (m = 'Sign in required') => new AppError('UNAUTHENTICATED', m),
  validation: (m, details) => new AppError('VALIDATION_ERROR', m, { details }),
  notFound: (m = 'Not found') => new AppError('NOT_FOUND', m),
  conflict: (m) => new AppError('CONFLICT', m),
  rateLimited: (s) => new AppError('RATE_LIMITED', 'Too many requests, slow down', { retryAfterSeconds: s }),
  modelUnavailable: (m = 'Gemma model is not available right now') => new AppError('MODEL_UNAVAILABLE', m),
  timeout: (m = 'Upstream service timed out') => new AppError('UPSTREAM_TIMEOUT', m),
};

export function toErrorBody(err, requestId) {
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const body = {
    error: {
      code,
      message: err instanceof AppError ? err.message : 'Something went wrong',
      retryable: RETRYABLE.has(code),
      requestId,
    },
  };
  if (err instanceof AppError && err.retryAfterSeconds) body.error.retryAfterSeconds = err.retryAfterSeconds;
  if (err instanceof AppError && err.details) body.error.details = err.details;
  return { status: err instanceof AppError ? err.status : 500, body };
}

// Redact anything that looks like a secret before logging.
export function redact(text) {
  return String(text)
    .replace(/(gh[pousr]_[A-Za-z0-9]{20,})/g, '[REDACTED]')
    .replace(/(AIza[0-9A-Za-z\-_]{20,})/g, '[REDACTED]')
    .replace(/(key=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+@/gi, '$1[REDACTED]@');
}

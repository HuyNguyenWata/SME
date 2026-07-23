const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const PLACEHOLDER_VALUES = new Set([
  'your-jwt-secret',
  'your-jwt-refresh-secret',
  'your-database-url',
  'dev-secret-change-me',
  'dev-refresh-secret-change-me',
]);

const MIN_SECRET_LENGTH = 16;

/**
 * Fails app startup instead of silently signing JWTs with a well-known
 * fallback secret (previously `?? 'dev-secret-change-me'`) if the env var
 * is missing or left as the .env.example placeholder.
 */
export function validate(config: Record<string, unknown>) {
  const missing: string[] = [];
  const insecure: string[] = [];

  for (const key of REQUIRED_KEYS) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(key);
      continue;
    }
    if (PLACEHOLDER_VALUES.has(value)) {
      insecure.push(`${key} is still set to its .env.example placeholder`);
    }
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = config[key];
    if (typeof value === 'string' && value.length < MIN_SECRET_LENGTH) {
      insecure.push(
        `${key} must be at least ${MIN_SECRET_LENGTH} characters`,
      );
    }
  }

  const problems = [
    ...missing.map((key) => `${key} is not set`),
    ...insecure,
  ];

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${problems.join('\n- ')}`,
    );
  }

  return config;
}

/** Load .env for CLI scripts (Next.js loads it automatically for the app). */
export function loadEnv(): void {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env file: rely on the real environment (CI, Docker, hosting panel).
  }
}

export function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : "";
}

export function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

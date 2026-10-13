import { hash, verify } from "@node-rs/argon2";

// OWASP Password Storage Cheat Sheet: argon2id, m=19 MiB, t=2, p=1.
const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export const PASSWORD_MIN_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** A real hash used to keep login timing constant when the email is unknown. */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("timing-equalisation-placeholder");
  return dummyHash;
}

export function passwordProblems(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  if (password.length > 200) return "Password terlalu panjang.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return "Password harus memuat huruf dan angka.";
  return null;
}

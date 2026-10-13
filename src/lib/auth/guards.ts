import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export type Role = SessionUser["role"];

/** Capabilities per role. Mentors review problems; editors manage content; admins manage everything. */
const CAPABILITIES = {
  "content:write": ["admin", "editor"],
  "questions:write": ["admin", "editor", "mentor"],
  "questions:review": ["admin", "mentor"],
  "leads:read": ["admin", "editor"],
  "redirects:write": ["admin", "editor"],
  "users:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(user: Pick<SessionUser, "role"> | null, capability: Capability): boolean {
  return !!user && (CAPABILITIES[capability] as readonly Role[]).includes(user.role);
}

/** For pages: redirect to login when signed out, to the dashboard when not permitted. */
export async function requirePageUser(capability?: Capability, opts: { allowPendingPasswordChange?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword && !opts.allowPendingPasswordChange) redirect("/admin/akun?error=ganti-password");
  if (capability && !can(user, capability)) redirect("/admin?error=akses");
  return user;
}

export class AuthError extends Error {}

/** For Server Actions and Route Handlers: every mutation re-checks authorisation. */
export async function requireActionUser(capability: Capability): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Sesi berakhir. Silakan masuk kembali.");
  if (user.mustChangePassword) throw new AuthError("Ganti password sementara Anda terlebih dahulu di menu Akun saya.");
  if (!can(user, capability)) throw new AuthError("Anda tidak memiliki akses untuk tindakan ini.");
  return user;
}

import "server-only";
import { getDb, schema } from "./db";

/** Append-only record of admin changes (who changed what, when). Never blocks the action. */
export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string | number | null,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await getDb()
      .insert(schema.auditLog)
      .values({ userId, action, entity, entityId: entityId == null ? null : String(entityId), detail });
  } catch (error) {
    console.error("[audit] gagal mencatat", error instanceof Error ? error.message : error);
  }
}

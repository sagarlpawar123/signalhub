"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPageInOrg, requireCapability } from "@/lib/admin-guard";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { database } from "@/lib/postgres/client";
import {
  createMaintenance as createMaintenanceDomain,
  deleteMaintenance as deleteMaintenanceDomain,
  transitionMaintenance,
} from "@/lib/domain/maintenance";
import { zonedDateTimeToUtc } from "@/lib/page-locale";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "@/lib/status";
import { writeSupportMutationAudit } from "@/lib/support-audit";
import { writeActiveTenantAudit } from "@/lib/tenant-audit";

async function pageSlug(pageId: string) {
  return (await database.selectFrom("pages").select("slug").where("id", "=", pageId).executeTakeFirst())?.slug;
}

export async function createMaintenance(formData: FormData) {
  const pageId = String(formData.get("pageId") ?? "");
  const session = await requireCapability("incident.manage", pageId);
  const page = await assertPageInOrg(pageId, session.orgId);
  const scheduledStart = zonedDateTimeToUtc(String(formData.get("scheduledStart") ?? ""), page.timezone);
  if (scheduledStart < new Date()) throw new Error("Start time cannot be in the past");
  const maintenance = await createMaintenanceDomain(session.orgId, {
    pageId,
    name: String(formData.get("name") ?? ""),
    body: String(formData.get("body") ?? ""),
    scheduledStart,
    scheduledEnd: zonedDateTimeToUtc(String(formData.get("scheduledEnd") ?? ""), page.timezone),
    autoTransition: formData.get("autoTransition") === "on",
    notify: formData.get("notify") === "on",
    reminderMinutesBefore:
      formData.get("sendReminder") === "on"
        ? Number(formData.get("reminderMinutesBefore") ?? 60)
        : null,
    pageWide: formData.get("pageWide") === "on",
    componentIds: formData.getAll("componentIds").map(String),
  });
  await writeActiveTenantAudit(session.orgId, {
    actor: session.email,
    action: "CREATE_MAINTENANCE",
    target: maintenance.id,
    supportSessionId: session.supportSessionId ?? null,
    createdAt: new Date(),
  });
  await writeSupportMutationAudit(session, {
    action: "CREATE_MAINTENANCE",
    targetType: "maintenance",
    targetId: maintenance.id,
    metadata: { pageId },
    tenantAuditExists: true,
  });
  revalidatePath("/organization/events");
  revalidatePath(`/${await pageSlug(pageId)}`);
  redirect(`/organization/events/${maintenance.id}`);
}

export async function setMaintenanceStatus(incidentId: string, formData: FormData) {
  const session = await requireCapability("incident.update");
  const incident = await database.selectFrom("incidents").select(["id", "pageId"])
    .where("id", "=", incidentId).where("isMaintenance", "=", true).executeTakeFirst();
  if (!incident) throw new Error("Maintenance not found");
  await assertPageInOrg(incident.pageId, session.orgId);
  const status = String(formData.get("maintenanceStatus") ?? "") as MaintenanceStatus;
  if (!MAINTENANCE_STATUSES.includes(status)) throw new Error("Invalid maintenance status");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("A maintenance update message is required");
  if (body.length > INPUT_LIMITS.body) throw new Error(`Update messages must be ${INPUT_LIMITS.body.toLocaleString("en-US")} characters or fewer`);
  await transitionMaintenance({
    incidentId,
    status,
    body,
    notify: formData.get("notify") === "on",
  });
  await writeSupportMutationAudit(session, {
    action: "UPDATE_MAINTENANCE",
    targetType: "maintenance",
    targetId: incidentId,
    metadata: { pageId: incident.pageId, status },
  });
  revalidatePath(`/organization/events/${incidentId}`);
  revalidatePath(`/${await pageSlug(incident.pageId)}`);
}

export async function deleteMaintenance(incidentId: string) {
  const session = await requireCapability("incident.manage");
  const incident = await database.selectFrom("incidents").select(["id", "pageId"])
    .where("id", "=", incidentId).where("isMaintenance", "=", true).executeTakeFirst();
  if (!incident) throw new Error("Maintenance not found");
  await assertPageInOrg(incident.pageId, session.orgId);
  const slug = await pageSlug(incident.pageId);
  const deleted = await deleteMaintenanceDomain(session.orgId, incidentId);
  if (!deleted) throw new Error("Maintenance not found");
  await writeActiveTenantAudit(session.orgId, {
    actor: session.email,
    action: "DELETE_MAINTENANCE",
    target: incidentId,
    supportSessionId: session.supportSessionId ?? null,
    createdAt: new Date(),
  });
  await writeSupportMutationAudit(session, {
    action: "DELETE_MAINTENANCE",
    targetType: "maintenance",
    targetId: incidentId,
    metadata: { pageId: incident.pageId },
    tenantAuditExists: true,
  });
  revalidatePath("/organization/events");
  if (slug) revalidatePath(`/${slug}`);
  redirect(`/organization/events?pageId=${incident.pageId}`);
}

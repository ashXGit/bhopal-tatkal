import "server-only";
import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Side effects shared by all workflow steps: in-app notifications + audit trail.

export async function notify(userId: string, type: NotificationType, title: string, body: string, link?: string) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
}

export async function notifyDepartment(departmentId: string, type: NotificationType, title: string, complaintRef: string) {
  const users = await prisma.user.findMany({ where: { role: "AUTHORITY", departmentId }, select: { id: true } });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, type, title, body: `Complaint ${complaintRef}`, link: `/authority/review/${complaintRef}` })),
  });
}

export async function audit(actorId: string | null, action: string, entityType: string, entityId: string, details?: Prisma.InputJsonValue) {
  await prisma.auditLog.create({ data: { actorId, action, entityType, entityId, details } });
}

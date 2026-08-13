import { currency, formatDate, formatDateTime, reference, serviceLabel, statusInfo, type Booking, type Fine, type Profile, type Tone, type Vehicle } from "./dashboard-utils";

export type AdminRole = "super" | "reviewer" | "fines" | "support";

export const roleLabel: Record<AdminRole, string> = {
  super: "Super Administrator",
  reviewer: "Traffic Officer / Reviewer",
  fines: "Fines Officer",
  support: "Support Administrator",
};

export type Permission =
  | "applications:review"
  | "vehicles:verify"
  | "fines:manage"
  | "citizens:view"
  | "citizens:reveal"
  | "security:view"
  | "settings:manage";

const rolePermissions: Record<AdminRole, Permission[]> = {
  super: ["applications:review", "vehicles:verify", "fines:manage", "citizens:view", "citizens:reveal", "security:view", "settings:manage"],
  reviewer: ["applications:review", "vehicles:verify", "citizens:view", "security:view"],
  fines: ["fines:manage", "citizens:view"],
  support: ["citizens:view"],
};

export function can(role: AdminRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

/** Bookings with the appointment lens applied. */
export function appointmentBuckets(bookings: Booking[]) {
  const today = new Date().toISOString().slice(0, 10);
  const scheduled = bookings.filter((b) => b.status === "approved");
  return {
    today: scheduled.filter((b) => (b.appointment_date ?? b.preferred_date).slice(0, 10) === today),
    upcoming: scheduled.filter((b) => (b.appointment_date ?? b.preferred_date).slice(0, 10) > today),
    past: scheduled.filter((b) => (b.appointment_date ?? b.preferred_date).slice(0, 10) < today),
    completed: bookings.filter((b) => b.status === "passed" || b.status === "failed"),
    cancelled: bookings.filter((b) => b.status === "cancelled" || b.status === "rejected"),
  };
}

export function countThisMonth(records: { created_at: string }[]) {
  const now = new Date();
  return records.filter((record) => {
    const created = new Date(record.created_at);
    return created.getUTCFullYear() === now.getUTCFullYear() && created.getUTCMonth() === now.getUTCMonth();
  }).length;
}

export function trendLabel(count: number, unit: string) {
  if (!count) return `No change this month`;
  return `+${count} ${unit} this month`;
}

export type AdminTask = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  at: string;
  service: string;
  actionLabel: string;
  target: string;
};

export function deriveAdminTasks(bookings: Booking[], vehicles: Vehicle[], fines: Fine[]): AdminTask[] {
  const tasks: AdminTask[] = [];
  const pending = bookings.filter((b) => b.status === "pending");
  if (pending.length) {
    const learners = pending.filter((b) => b.booking_type === "learners").length;
    const drivers = pending.length - learners;
    if (learners) {
      tasks.push({
        id: "apps-learners",
        priority: "high",
        title: `${learners} learner licence ${learners === 1 ? "application" : "applications"} awaiting review`,
        description: "Applications have been submitted and require an administrator decision.",
        at: pending[0]!.created_at,
        service: "Applications",
        actionLabel: "Review applications",
        target: "applications:pending",
      });
    }
    if (drivers) {
      tasks.push({
        id: "apps-drivers",
        priority: "high",
        title: `${drivers} driving licence ${drivers === 1 ? "application" : "applications"} awaiting review`,
        description: "Applications have been submitted and require an administrator decision.",
        at: pending[0]!.created_at,
        service: "Applications",
        actionLabel: "Review applications",
        target: "applications:pending",
      });
    }
  }
  const unverified = vehicles.filter((v) => v.registration_status === "pending");
  if (unverified.length) {
    tasks.push({
      id: "vehicles-verify",
      priority: "medium",
      title: `${unverified.length} vehicle ${unverified.length === 1 ? "registration requires" : "registrations require"} verification`,
      description: "Confirm the submitted vehicle details before a disc reference is issued.",
      at: unverified[0]!.created_at,
      service: "Vehicles",
      actionLabel: "Verify vehicles",
      target: "vehicles:verification",
    });
  }
  const overdue = fines.filter((f) => f.payment_status === "unpaid" && new Date(f.due_date) < new Date());
  if (overdue.length) {
    const total = overdue.reduce((sum, f) => sum + Number(f.amount), 0);
    tasks.push({
      id: "fines-overdue",
      priority: "high",
      title: `${overdue.length} overdue ${overdue.length === 1 ? "fine" : "fines"} (${currency(total)})`,
      description: "These fines have passed their due date and require enforcement follow-up.",
      at: overdue[0]!.created_at,
      service: "Fines",
      actionLabel: "View fines",
      target: "fines:outstanding",
    });
  }
  return tasks;
}

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  resource: string;
  result: "Successful" | "Pending" | "Failed";
  category: "Applications" | "Vehicles" | "Fines" | "Citizens" | "Security";
  tone: Tone;
};

/**
 * Derived from real record state changes in the database. Dedicated audit
 * storage is not yet available, so this is a read-only reconstruction.
 */
export function deriveAuditTrail(bookings: Booking[], vehicles: Vehicle[], fines: Fine[], users: Profile[]): AuditEvent[] {
  const name = (id: string) => users.find((u) => u.id === id)?.full_name ?? "Citizen";
  const events: AuditEvent[] = [];

  for (const booking of bookings) {
    const ref = reference("APP", booking.id);
    events.push({
      id: `b-new-${booking.id}`,
      at: booking.created_at,
      actor: name(booking.user_id),
      action: `Submitted ${serviceLabel[booking.booking_type] ?? "application"}`,
      resource: ref,
      result: "Successful",
      category: "Applications",
      tone: "neutral",
    });
    if (booking.status !== "pending") {
      events.push({
        id: `b-dec-${booking.id}-${booking.status}`,
        at: booking.updated_at ?? booking.created_at,
        actor: "Administrator",
        action: `Application ${statusInfo(booking.status).label.toLowerCase()}`,
        resource: ref,
        result: booking.status === "rejected" || booking.status === "failed" ? "Failed" : "Successful",
        category: "Applications",
        tone: statusInfo(booking.status).tone,
      });
    }
  }

  for (const vehicle of vehicles) {
    events.push({
      id: `v-new-${vehicle.id}`,
      at: vehicle.created_at,
      actor: vehicle.user_id ? name(vehicle.user_id) : "Citizen",
      action: "Vehicle registration submitted",
      resource: vehicle.number_plate,
      result: "Successful",
      category: "Vehicles",
      tone: "neutral",
    });
    if (vehicle.registration_status !== "pending") {
      events.push({
        id: `v-dec-${vehicle.id}-${vehicle.registration_status}`,
        at: vehicle.updated_at ?? vehicle.created_at,
        actor: "Administrator",
        action: `Vehicle ${statusInfo(vehicle.registration_status).label.toLowerCase()}`,
        resource: vehicle.number_plate,
        result: vehicle.registration_status === "rejected" ? "Failed" : "Successful",
        category: "Vehicles",
        tone: statusInfo(vehicle.registration_status).tone,
      });
    }
  }

  for (const fine of fines) {
    events.push({
      id: `f-${fine.id}-${fine.payment_status}`,
      at: fine.created_at,
      actor: "Traffic system",
      action: `Fine recorded — ${currency(Number(fine.amount))}`,
      resource: fine.reference_number,
      result: fine.payment_status === "paid" ? "Successful" : "Pending",
      category: "Fines",
      tone: fine.payment_status === "paid" ? "positive" : "warning",
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function fineState(fine: Fine): string {
  if (fine.payment_status === "paid") return "paid";
  if (fine.payment_status === "refunded" || fine.payment_status === "failed") return fine.payment_status;
  if (fine.payment_status === "pending") return "pending";
  return new Date(fine.due_date) < new Date() ? "overdue" : "outstanding";
}

export function toCsv(headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export { formatDate, formatDateTime, reference, serviceLabel, currency, statusInfo };

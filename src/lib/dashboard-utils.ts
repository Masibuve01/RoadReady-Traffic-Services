export type Profile = {
  id: string;
  email: string;
  full_name: string;
  id_number: string | null;
  phone: string | null;
  learners_number: string | null;
  learners_expiry: string | null;
  drivers_number: string | null;
  drivers_expiry: string | null;
};

export type Booking = {
  id: string;
  user_id: string;
  booking_type: "learners" | "drivers";
  preferred_date: string;
  traffic_department: string;
  status: string;
  appointment_date: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  user_id?: string;
  number_plate: string;
  vin?: string | null;
  make: string;
  model: string;
  manufacture_year: number | null;
  color: string | null;
  registration_status: string;
  admin_notes?: string | null;
  document_reference?: string | null;
  created_at: string;
  updated_at: string;
};

export type Fine = {
  id: string;
  user_id?: string;
  vehicle_id?: string | null;
  reference_number: string;
  offence: string;
  offence_date: string;
  location: string;
  amount: number;
  due_date: string;
  payment_status: string;
  created_at: string;
};

export type Tone = "neutral" | "progress" | "positive" | "warning" | "critical";

export const statusMeta: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Under review", tone: "progress" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Rejected", tone: "critical" },
  passed: { label: "Passed", tone: "positive" },
  failed: { label: "Not passed", tone: "critical" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  verified: { label: "Verified", tone: "positive" },
  unpaid: { label: "Unpaid", tone: "warning" },
  paid: { label: "Paid", tone: "positive" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export function statusInfo(value: string) {
  return statusMeta[value] ?? { label: value.replace(/_/g, " "), tone: "neutral" as Tone };
}

/** Ordered lifecycle used by the application progress tracker. */
export const applicationSteps = ["Submitted", "Verification", "Processing", "Outcome", "Completed"] as const;

export function applicationStage(status: string): { index: number; message: string; closed: boolean } {
  switch (status) {
    case "pending":
      return { index: 1, message: "Your application is currently being verified by a traffic officer.", closed: false };
    case "approved":
      return { index: 3, message: "Approved. Attend your appointment at the selected traffic department.", closed: false };
    case "passed":
      return { index: 4, message: "You passed. Your licence record has been updated.", closed: true };
    case "failed":
      return { index: 4, message: "You did not pass this attempt. You may book again.", closed: true };
    case "rejected":
      return { index: 3, message: "This application was not approved. Review the details and re-apply.", closed: true };
    case "cancelled":
      return { index: 4, message: "This application was cancelled.", closed: true };
    default:
      return { index: 0, message: "Submitted and awaiting processing.", closed: false };
  }
}

export function nextStep(status: string): string {
  switch (status) {
    case "pending":
      return "Wait for verification";
    case "approved":
      return "Attend your appointment";
    case "passed":
      return "Collect your licence";
    case "failed":
    case "rejected":
      return "Book a new test";
    default:
      return "No action needed";
  }
}

export const serviceLabel: Record<string, string> = {
  learners: "Learner's licence test",
  drivers: "Driver's licence test",
};

export function reference(prefix: string, id: string) {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function currency(amount: number) {
  return `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Masks an identifier, keeping only the last 4 characters visible. */
export function maskIdentifier(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return `${"•".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

export type ActionItem = {
  id: string;
  title: string;
  detail: string;
  target: string;
  tone: Tone;
};

export function deriveActions(bookings: Booking[], fines: Fine[], vehicles: Vehicle[]): ActionItem[] {
  const actions: ActionItem[] = [];
  for (const booking of bookings) {
    if (booking.status === "approved") {
      actions.push({
        id: `booking-${booking.id}`,
        title: `${serviceLabel[booking.booking_type] ?? "Test"} scheduled`,
        detail: `Your appointment is set for ${formatDate(booking.appointment_date ?? booking.preferred_date)} at ${booking.traffic_department}.`,
        target: "applications",
        tone: "progress",
      });
    }
  }
  const unpaid = fines.filter((fine) => fine.payment_status === "unpaid");
  if (unpaid.length) {
    const total = unpaid.reduce((sum, fine) => sum + Number(fine.amount), 0);
    actions.push({
      id: "fines",
      title: `${unpaid.length} outstanding ${unpaid.length === 1 ? "fine" : "fines"}`,
      detail: `${currency(total)} is due. Settle before the due date to avoid enforcement.`,
      target: "fines",
      tone: "warning",
    });
  }
  const pendingVehicles = vehicles.filter((vehicle) => vehicle.registration_status === "pending");
  if (pendingVehicles.length) {
    actions.push({
      id: "vehicles",
      title: `${pendingVehicles.length} vehicle ${pendingVehicles.length === 1 ? "registration" : "registrations"} awaiting verification`,
      detail: "Take your supporting documents to your traffic department to complete verification.",
      target: "vehicles",
      tone: "progress",
    });
  }
  return actions;
}

export type Notice = {
  id: string;
  title: string;
  body: string;
  service: string;
  at: string;
  target: string;
};

export function deriveNotices(bookings: Booking[], fines: Fine[], vehicles: Vehicle[]): Notice[] {
  const notices: Notice[] = [];
  for (const booking of bookings) {
    const info = statusInfo(booking.status);
    notices.push({
      id: `b-${booking.id}-${booking.status}`,
      title: `Application ${info.label.toLowerCase()}`,
      body: `${serviceLabel[booking.booking_type] ?? "Application"} at ${booking.traffic_department} — ${applicationStage(booking.status).message}`,
      service: "Applications",
      at: booking.updated_at ?? booking.created_at,
      target: "applications",
    });
  }
  for (const vehicle of vehicles) {
    notices.push({
      id: `v-${vehicle.id}-${vehicle.registration_status}`,
      title: `Vehicle ${vehicle.number_plate} ${statusInfo(vehicle.registration_status).label.toLowerCase()}`,
      body: `${vehicle.make} ${vehicle.model} registration status updated.`,
      service: "Vehicles",
      at: vehicle.updated_at ?? vehicle.created_at,
      target: "vehicles",
    });
  }
  for (const fine of fines) {
    if (fine.payment_status === "unpaid") {
      notices.push({
        id: `f-${fine.id}`,
        title: `Fine ${fine.reference_number} is due ${formatDate(fine.due_date)}`,
        body: `${fine.offence} — ${currency(Number(fine.amount))} outstanding.`,
        service: "Fines",
        at: fine.created_at,
        target: "fines",
      });
    }
  }
  return notices.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

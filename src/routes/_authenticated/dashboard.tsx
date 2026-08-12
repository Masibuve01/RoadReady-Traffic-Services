import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Car, CheckCircle2, Clock3, FileCheck2, LayoutDashboard, LogOut, Menu, MessageCircle, ShieldCheck, Ticket, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard | RoadReady" },
    { name: "description", content: "Manage RoadReady licence bookings, vehicles, fines and approvals." },
    { property: "og:title", content: "RoadReady Dashboard" },
    { property: "og:description", content: "Your secure traffic services dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: Dashboard,
});

type Profile = { id: string; email: string; full_name: string; learners_number: string | null; drivers_number: string | null };
type Booking = { id: string; booking_type: "learners" | "drivers"; preferred_date: string; traffic_department: string; status: string; profiles?: { full_name: string } | null };
type Vehicle = { id: string; number_plate: string; make: string; model: string; registration_status: string };
type Fine = { id: string; reference_number: string; offence: string; amount: number; due_date: string; payment_status: string };

function Dashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [plateAnswer, setPlateAnswer] = useState("");

  async function loadData() {
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,learners_number,drivers_number").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const admin = roles?.some((role) => role.role === "admin") ?? false;
    setProfile(p); setIsAdmin(admin);
    const [bookingResult, vehicleResult, fineResult, usersResult] = await Promise.all([
      supabase.from("bookings").select("id,booking_type,preferred_date,traffic_department,status,profiles(full_name)").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("id,number_plate,make,model,registration_status").order("created_at", { ascending: false }),
      supabase.from("fines").select("id,reference_number,offence,amount,due_date,payment_status").order("created_at", { ascending: false }),
      admin ? supabase.from("profiles").select("id,email,full_name,learners_number,drivers_number").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setBookings((bookingResult.data ?? []) as Booking[]); setVehicles(vehicleResult.data ?? []); setFines(fineResult.data ?? []); setUsers(usersResult.data ?? []);
  }

  useEffect(() => { void loadData(); }, []);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const type = String(data.get("type")) as "learners" | "drivers";
    if (type === "drivers" && !profile?.learners_number) { toast.error("A learner's licence must be recorded before booking a driver test."); return; }
    const { error } = await supabase.from("bookings").insert({ user_id: user.id, booking_type: type, preferred_date: String(data.get("date")), traffic_department: String(data.get("department")) });
    if (error) toast.error(error.message); else { toast.success("Booking submitted for approval"); event.currentTarget.reset(); await loadData(); }
  }

  async function registerVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const { error } = await supabase.from("vehicles").insert({ user_id: user.id, number_plate: String(data.get("plate")).toUpperCase(), make: String(data.get("make")), model: String(data.get("model")) });
    if (error) toast.error(error.message); else { toast.success("Vehicle submitted for verification"); event.currentTarget.reset(); await loadData(); }
  }

  async function updateBooking(id: string, status: "approved" | "rejected" | "passed" | "failed") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Booking marked ${status}`); await loadData(); }
  }

  async function signOut() {
    await supabase.auth.signOut(); await navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }

  const nav = isAdmin ? [["overview", LayoutDashboard, "Overview"], ["users", Users, "All users"], ["approvals", FileCheck2, "Approvals"]] : [["overview", LayoutDashboard, "Overview"], ["book", CheckCircle2, "Book a test"], ["vehicles", Car, "My vehicles"], ["fines", Ticket, "Fines"]] as const;
  return (
    <main className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-border bg-road text-primary-foreground lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center gap-3 border-b border-primary-foreground/15 px-5"><ShieldCheck className="text-warning" /><strong className="text-lg">RoadReady</strong></div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:grid lg:p-4">{nav.map(([id, Icon, label]) => <Button key={id} variant="ghost" onClick={() => setSection(id)} className={`justify-start text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground ${section === id ? "bg-primary-foreground/15" : ""}`}><Icon />{label}</Button>)}</nav>
      </aside>
      <div>
        <header className="flex h-20 items-center justify-between border-b border-border bg-background px-5 lg:px-8"><div><p className="text-xs font-bold uppercase text-primary">{isAdmin ? "Administration" : "Citizen services"}</p><h1 className="font-bold">{profile?.full_name ?? user.email}</h1></div><Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button></header>
        <div className="mx-auto max-w-7xl p-5 lg:p-8">
          {section === "overview" && <Overview isAdmin={isAdmin} users={users} bookings={bookings} vehicles={vehicles} fines={fines} />}
          {section === "book" && !isAdmin && <section><PageTitle title="Book a licence test" subtitle="Your request will be reviewed by a traffic administrator." /><form onSubmit={book} className="app-card mt-6 grid max-w-2xl gap-5"><Select name="type" required><SelectTrigger><SelectValue placeholder="Choose test type" /></SelectTrigger><SelectContent><SelectItem value="learners">Learner's licence</SelectItem><SelectItem value="drivers">Driver's licence</SelectItem></SelectContent></Select><Input name="date" type="date" required /><Input name="department" placeholder="Preferred traffic department" required /><Button>Submit booking</Button></form></section>}
          {section === "vehicles" && !isAdmin && <section><PageTitle title="My vehicles" subtitle="Register a car and track its verification status." /><form onSubmit={registerVehicle} className="app-card my-6 grid gap-4 md:grid-cols-4"><Input name="plate" placeholder="Number plate" required /><Input name="make" placeholder="Make" required /><Input name="model" placeholder="Model" required /><Button>Register vehicle</Button></form><DataTable headers={["Number plate", "Vehicle", "Status"]} rows={vehicles.map(v => [v.number_plate, `${v.make} ${v.model}`, <Status value={v.registration_status} />])} /></section>}
          {section === "fines" && !isAdmin && <section><PageTitle title="Traffic fines" subtitle="Review amounts and payment status." /><div className="mt-6"><DataTable headers={["Reference", "Offence", "Due", "Amount", "Status"]} rows={fines.map(f => [f.reference_number, f.offence, f.due_date, `R ${Number(f.amount).toFixed(2)}`, <Status value={f.payment_status} />])} /></div></section>}
          {section === "users" && isAdmin && <section><PageTitle title="All registered users" subtitle="Every citizen account in the system." /><div className="mt-6"><DataTable headers={["Full name", "Email", "Learner licence", "Driver licence"]} rows={users.map(u => [u.full_name, u.email, u.learners_number ?? "Not recorded", u.drivers_number ?? "Not recorded"])} /></div></section>}
          {section === "approvals" && isAdmin && <section><PageTitle title="Booking approvals" subtitle="Review requests and record outcomes." /><div className="mt-6"><DataTable headers={["Applicant", "Type", "Department", "Preferred date", "Status", "Actions"]} rows={bookings.map(b => [b.profiles?.full_name ?? "User", b.booking_type, b.traffic_department, b.preferred_date, <Status value={b.status} />, <div className="flex flex-wrap gap-1"><Button size="sm" onClick={() => updateBooking(b.id,"approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateBooking(b.id,"rejected")}>Reject</Button><Button size="sm" variant="secondary" onClick={() => updateBooking(b.id,"passed")}>Pass</Button></div>])} /></div></section>}
        </div>
      </div>
      {!isAdmin && <><Button size="icon" className="fixed bottom-6 right-6 size-12 rounded-full" onClick={() => setChatOpen(!chatOpen)} aria-label="Open vehicle assistant">{chatOpen ? <X /> : <MessageCircle />}</Button>{chatOpen && <div className="app-card fixed bottom-24 right-5 z-20 w-[calc(100%-2.5rem)] max-w-sm shadow-xl"><h2 className="font-bold">Vehicle assistant</h2><p className="mt-1 text-sm text-muted-foreground">Ask for the number plate linked to your account.</p><Button className="mt-4 w-full" variant="outline" onClick={() => setPlateAnswer(vehicles.length ? vehicles.map(v => v.number_plate).join(", ") : "No vehicle is registered yet.")}>Show my number plate</Button>{plateAnswer && <p className="mt-3 rounded-md bg-muted p-3 text-sm font-semibold">{plateAnswer}</p>}</div>}</>}
    </main>
  );
}

function Overview({ isAdmin, users, bookings, vehicles, fines }: { isAdmin: boolean; users: Profile[]; bookings: Booking[]; vehicles: Vehicle[]; fines: Fine[] }) {
  const stats = isAdmin ? [["Registered users", users.length, Users], ["Pending approvals", bookings.filter(b => b.status === "pending").length, Clock3], ["Registered vehicles", vehicles.length, Car]] : [["Applications", bookings.length, FileCheck2], ["My vehicles", vehicles.length, Car], ["Unpaid fines", fines.filter(f => f.payment_status !== "paid").length, Ticket]];
  return <section><PageTitle title={isAdmin ? "System overview" : "Your dashboard"} subtitle={isAdmin ? "Monitor activity and process citizen requests." : "A clear view of your traffic services."} /><div className="mt-6 grid gap-4 md:grid-cols-3">{stats.map(([label,value,Icon]) => { const I = Icon as typeof Users; return <article className="app-card" key={String(label)}><I className="text-primary" /><p className="mt-5 text-sm text-muted-foreground">{String(label)}</p><p className="mt-1 text-4xl font-black">{String(value)}</p></article>; })}</div><div className="mt-7"><h2 className="mb-3 text-lg font-bold">Recent applications</h2><DataTable headers={["Type", "Department", "Date", "Status"]} rows={bookings.slice(0,5).map(b => [b.booking_type, b.traffic_department, b.preferred_date, <Status value={b.status} />])} /></div></section>;
}
function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><h2 className="text-3xl font-black">{title}</h2><p className="mt-1 text-muted-foreground">{subtitle}</p></div>; }
function Status({ value }: { value: string }) { return <span className="status-pill">{value}</span>; }
function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) { return <div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-road text-primary-foreground"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row,i) => <tr key={i} className="border-t border-border">{row.map((cell,j) => <td key={j} className="px-4 py-3">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">No records yet</td></tr>}</tbody></table></div>; }
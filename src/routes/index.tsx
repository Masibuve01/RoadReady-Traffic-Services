import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Car, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoadReady | Traffic Services Online" },
      { name: "description", content: "Book learner and driver tests, register vehicles, and manage traffic fines online." },
      { property: "og:title", content: "RoadReady Traffic Services" },
      { property: "og:description", content: "A secure digital traffic department for bookings, vehicles and fines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const services = [
  { icon: CheckCircle2, title: "Licence bookings", text: "Apply for learner and driver licence test appointments." },
  { icon: Car, title: "Vehicle records", text: "Register vehicles and keep every number plate in one place." },
  { icon: Ticket, title: "Traffic fines", text: "View road fines, due dates and payment progress securely." },
];

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="RoadReady home">
            <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck /></span>
            <span><strong className="block text-lg font-bold">RoadReady</strong><span className="block text-xs text-muted-foreground">Traffic Services</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/auth" search={{ mode: "login" }}>Sign in</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "register" }}>Create account</Link></Button>
          </div>
        </div>
      </header>

      <section className="hero-grid border-b border-border">
        <div className="mx-auto grid min-h-[68vh] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-success"><span className="size-2 rounded-full bg-success" /> South African traffic services</span>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">Your road services, moving faster.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Book licence tests, register your car, track approvals and manage fines from one secure account.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/auth" search={{ mode: "register" }}>Get started <ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/auth" search={{ mode: "login" }}>I have an account</Link></Button>
            </div>
          </div>
          <div className="signal-panel" aria-label="Traffic signal illustration">
            <div className="signal-light bg-destructive" />
            <div className="signal-light bg-warning" />
            <div className="signal-light bg-success shadow-signal" />
            <div className="mt-7 border-t border-primary-foreground/20 pt-6 text-primary-foreground">
              <p className="text-sm opacity-70">One account. Every service.</p>
              <p className="mt-2 text-2xl font-bold">Clear status at every step.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <article key={title} className="service-card">
              <Icon className="size-7 text-primary" />
              <h2 className="mt-6 text-xl font-bold">{title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
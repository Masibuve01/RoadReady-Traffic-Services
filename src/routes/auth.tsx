import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CarFront, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ mode: z.enum(["login", "register"]).catch("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Sign in | RoadReady" },
    { name: "description", content: "Sign in or create your RoadReady traffic services account." },
    { property: "og:title", content: "RoadReady Account" },
    { property: "og:description", content: "Secure access to your traffic services dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setIsRegister(mode === "register"); }, [mode]);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (data.user) void navigate({ to: "/dashboard" }); }); }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMessage(error.message);
      else if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, email, full_name: fullName });
        if (profileError) setMessage(profileError.message);
        else if (data.session) await navigate({ to: "/dashboard" });
        else setMessage("Account created. Check your email to confirm it, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message); else await navigate({ to: "/dashboard" });
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true); setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { setMessage(result.error.message); setLoading(false); return; }
    if (!result.redirected) await navigate({ to: "/dashboard" });
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[.85fr_1.15fr]">
      <section className="hidden bg-road p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-md bg-warning text-road"><ShieldCheck /></span><strong className="text-xl">RoadReady</strong></a>
        <div><CarFront className="size-16 text-warning" /><h1 className="mt-7 max-w-lg text-5xl font-black leading-tight">All your road services in one secure place.</h1><p className="mt-5 max-w-md text-lg opacity-70">Licence applications, vehicles, fines and approvals—clear and accessible.</p></div>
        <p className="text-sm opacity-60">Secure digital traffic services</p>
      </section>
      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <a href="/" className="mb-10 flex items-center gap-2 lg:hidden"><ShieldCheck className="text-primary" /><strong>RoadReady</strong></a>
          <p className="text-sm font-bold text-primary">{isRegister ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p>
          <h2 className="mt-2 text-3xl font-black">{isRegister ? "Start using RoadReady" : "Sign in to continue"}</h2>
          <p className="mt-2 text-muted-foreground">{isRegister ? "Enter your details to access traffic services." : "Access your bookings, vehicles and fines."}</p>
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            {isRegister && <div className="field"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" required autoComplete="name" /></div>}
            <div className="field"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
            <div className="field"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete={isRegister ? "new-password" : "current-password"} className="pr-11" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
            {message && <p className="rounded-md bg-muted p-3 text-sm" role="status">{message}</p>}
            <Button size="lg" disabled={loading}>{loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
          <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>Continue with Google</Button>
          <p className="mt-7 text-center text-sm text-muted-foreground">{isRegister ? "Already registered?" : "New to RoadReady?"} <button className="font-bold text-primary hover:underline" onClick={() => { setIsRegister(!isRegister); setMessage(""); }}>{isRegister ? "Sign in" : "Create an account"}</button></p>
        </div>
      </section>
    </main>
  );
}
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusInfo, type Tone } from "@/lib/dashboard-utils";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted text-foreground",
  progress: "border-primary/30 bg-primary/10 text-primary",
  positive: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/50 bg-warning/15 text-foreground",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
};

const toneIcons: Record<Tone, typeof Info> = {
  neutral: CircleDashed,
  progress: Clock3,
  positive: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export function StatusBadge({ value }: { value: string }) {
  const { label, tone } = statusInfo(value);
  const Icon = toneIcons[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", toneClasses[tone])}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading your traffic services…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-center">
      <Loader2 aria-hidden="true" className="size-6 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, description, action }: { icon?: typeof Info; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle aria-hidden="true" className="size-6 text-destructive" />
      <p className="max-w-md text-sm font-medium">{message}</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function DataTable({ headers, rows, caption }: { headers: string[]; rows: (string | ReactNode)[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{headers.map((header) => <th scope="col" key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-t border-border align-middle">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">No records yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

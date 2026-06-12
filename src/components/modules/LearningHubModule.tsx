import { useState } from "react";
import { useFinance } from "@/lib/finance/store";
import { coachInsights } from "@/lib/finance/calculations";
import { LEARN_CATEGORIES, THUMB_RULES, Lesson, LearnCategory } from "@/lib/finance/learnContent";
import { Panel, Badge } from "./shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Sparkles, BookOpen, Clock, CheckCircle2, AlertCircle, XCircle, GraduationCap,
} from "lucide-react";

const FORMAT_TONE: Record<string, "primary" | "gold" | "success" | "muted" | "danger"> = {
  "2-min read": "primary",
  Video: "danger",
  Infographic: "gold",
  Calculator: "success",
  Quiz: "muted",
};

export function LearningHubModule() {
  const { data } = useFinance();
  const insights = coachInsights(data);
  const [activeCat, setActiveCat] = useState<LearnCategory>(LEARN_CATEGORIES[0]);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const StatusIcon = { good: CheckCircle2, warning: AlertCircle, bad: XCircle };

  return (
    <div className="space-y-6">
      {/* AI Coach */}
      <Panel
        title="AI Financial Coach"
        action={<Sparkles className="h-4 w-4 text-accent" />}
      >
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">
          Personalised guidance that turns financial concepts into action, based on your profile.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => {
            const Icon = StatusIcon[ins.status];
            const tone = ins.status === "good" ? "text-success" : ins.status === "warning" ? "text-accent" : "text-danger";
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone)} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ins.rule}</p>
                  <p className="mt-0.5 text-sm">{ins.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Thumb rules */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Financial Thumb Rules</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THUMB_RULES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display font-semibold">{r.title}</p>
                </div>
                <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 font-mono text-sm font-semibold text-primary">{r.formula}</p>
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning library */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Learning Hub</h3>
        <div className="flex flex-wrap gap-2">
          {LEARN_CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = c.id === activeCat.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {c.title}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <activeCat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">{activeCat.title}</p>
              <p className="text-sm text-muted-foreground">{activeCat.blurb}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {activeCat.lessons.map((l) => (
              <button
                key={l.title}
                onClick={() => setLesson(l)}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-4 text-left transition hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={FORMAT_TONE[l.format] || "muted"}>{l.format}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {l.minutes} min
                  </span>
                </div>
                <p className="font-display font-semibold group-hover:text-primary">{l.title}</p>
                <p className="text-sm text-muted-foreground">{l.summary}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <BookOpen className="h-3.5 w-3.5" /> Read lesson
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson reader */}
      <Dialog open={!!lesson} onOpenChange={(o) => !o && setLesson(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {lesson && (
            <>
              <DialogHeader>
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone={FORMAT_TONE[lesson.format] || "muted"}>{lesson.format}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {lesson.minutes} min read
                  </span>
                </div>
                <DialogTitle className="font-display text-xl">{lesson.title}</DialogTitle>
                <DialogDescription>{lesson.summary}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm leading-relaxed text-foreground/90">
                {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
                <GraduationCap className="h-4 w-4 shrink-0" />
                Apply it: check the AI Coach above to see how this concept maps to your finances.
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Circle,
  Trophy,
  RotateCcw,
  X,
  GraduationCap,
  Layers,
  Flame,
  Lightbulb,
  ListChecks,
  Smartphone,
  ArrowRight,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  COURSE_LEVELS,
  CourseLesson,
  QuizQuestion,
  loadProgress,
  saveProgress,
  totalLessons,
  levelLessons,
} from "@/lib/finance/courseContent";
import { LESSON_STUDY, LessonStudy } from "@/lib/finance/courseStudy";

/* ─── Fisher-Yates shuffle ─────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const indices = shuffle<number>([0, 1, 2, 3]);
  return {
    q: q.q,
    options: indices.map((i) => q.options[i]) as [string, string, string, string],
    answer: indices.indexOf(q.answer) as 0 | 1 | 2 | 3,
  };
}

/* ─── Quiz state machine ────────────────────────────────────────────────── */
type QuizState =
  | { phase: "idle" }
  | { phase: "question"; lesson: CourseLesson; questions: QuizQuestion[]; idx: number; score: number; selected: number | null; answered: boolean }
  | { phase: "result"; lesson: CourseLesson; score: number; passed: boolean };

type QuizAction =
  | { type: "OPEN"; lesson: CourseLesson }
  | { type: "SELECT"; idx: number }
  | { type: "SUBMIT" }
  | { type: "NEXT" }
  | { type: "CLOSE" }
  | { type: "RETRY" };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "OPEN": {
      const questions = shuffle(action.lesson.questions).map(shuffleOptions);
      return { phase: "question", lesson: action.lesson, questions, idx: 0, score: 0, selected: null, answered: false };
    }
    case "SELECT": {
      if (state.phase !== "question" || state.answered) return state;
      return { ...state, selected: action.idx };
    }
    case "SUBMIT": {
      if (state.phase !== "question" || state.selected === null || state.answered) return state;
      const correct = state.selected === state.questions[state.idx].answer;
      return { ...state, answered: true, score: state.score + (correct ? 1 : 0) };
    }
    case "NEXT": {
      if (state.phase !== "question" || !state.answered) return state;
      const nextIdx = state.idx + 1;
      if (nextIdx >= state.questions.length) {
        const passed = state.score >= 7;
        return { phase: "result", lesson: state.lesson, score: state.score, passed };
      }
      return { ...state, idx: nextIdx, selected: null, answered: false };
    }
    case "RETRY":
      if (state.phase !== "result") return state;
      return quizReducer({ phase: "idle" }, { type: "OPEN", lesson: state.lesson });
    case "CLOSE":
      return { phase: "idle" };
    default:
      return state;
  }
}

/* ─── CourseModule ──────────────────────────────────────────────────────── */
export function CourseModule() {
  const [done, setDone] = useState<Set<number>>(() => loadProgress());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [quiz, dispatch] = useReducer(quizReducer, { phase: "idle" });
  const [studyLesson, setStudyLesson] = useState<CourseLesson | null>(null);

  /* Persist progress */
  const markDone = useCallback((lessonId: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(lessonId);
      saveProgress(next);
      return next;
    });
  }, []);

  /* Auto-mark complete when quiz passes */
  useEffect(() => {
    if (quiz.phase === "result" && quiz.passed) {
      markDone(quiz.lesson.id);
    }
  }, [quiz, markDone]);

  /* Sync localStorage changes from course.html (same key) */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fp-course-progress") setDone(loadProgress());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = totalLessons();
  const completedCount = done.size;
  const overallPct = Math.round((completedCount / total) * 100);

  const toggleModule = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-500 shadow-[var(--shadow-glow)]">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Financial Freedom Journey
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                30 Lessons · 3 Levels
              </h2>
              <p className="text-sm text-muted-foreground">
                Learn a concept → apply it to your numbers → take a quiz → mark it done.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="font-display text-3xl font-bold tabular-nums text-primary">
              {completedCount}
              <span className="text-lg font-normal text-muted-foreground">/{total}</span>
            </p>
            <p className="text-xs text-muted-foreground">lessons completed</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2.5" />
        </div>
      </div>

      {/* ── Levels ───────────────────────────────────────────── */}
      {COURSE_LEVELS.map((level) => {
        const allLessons = levelLessons(level);
        const levelDone = allLessons.filter((l) => done.has(l.id)).length;
        const levelPct = Math.round((levelDone / allLessons.length) * 100);

        return (
          <div
            key={level.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
          >
            {/* Level header */}
            <div className={cn("bg-gradient-to-r p-5 text-white", level.accentClass)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                      {level.subtitle}
                    </p>
                    <p className="font-display text-xl font-bold">{level.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {levelDone}/{allLessons.length}
                  </p>
                  <p className="text-xs text-white/70">done</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/80">{level.description}</p>
              <div className="mt-3">
                <Progress value={levelPct} className="h-1.5 bg-white/25 [&>div]:bg-white" />
              </div>
            </div>

            {/* Modules */}
            <div className="divide-y divide-border">
              {level.modules.map((mod) => {
                const modDone = mod.lessons.filter((l) => done.has(l.id)).length;
                const isOpen = expanded[mod.id] ?? false;

                return (
                  <div key={mod.id}>
                    {/* Module row */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-semibold text-sm">{mod.title}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <ModuleProgressPill done={modDone} total={mod.lessons.length} />
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    {/* Lesson list */}
                    {isOpen && (
                      <div className="border-t border-border bg-muted/20">
                        {mod.lessons.map((lesson, li) => {
                          const isCompleted = done.has(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className={cn(
                                "flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
                                li < mod.lessons.length - 1 && "border-b border-border/60",
                              )}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                {/* Status icon */}
                                <div className="mt-0.5 shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                      {String(lesson.id).padStart(2, "0")}
                                    </span>
                                    <p
                                      className={cn(
                                        "font-semibold text-sm",
                                        isCompleted && "text-muted-foreground line-through decoration-success/60",
                                      )}
                                    >
                                      {lesson.title}
                                    </p>
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    <span className="font-medium text-primary/70">Tool:</span>{" "}
                                    {lesson.tool}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-primary/70">Action:</span>{" "}
                                    {lesson.action}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 pl-8 sm:pl-0 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full text-xs font-semibold px-3 gap-1.5"
                                  onClick={() => setStudyLesson(lesson)}
                                >
                                  <BookMarked className="h-3.5 w-3.5" />
                                  Study
                                </Button>
                                {isCompleted ? (
                                  <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                    <Trophy className="h-3.5 w-3.5" />
                                    Done
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="rounded-full text-xs font-semibold px-3"
                                    onClick={() => dispatch({ type: "OPEN", lesson })}
                                  >
                                    Take Quiz
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Quiz Modal ───────────────────────────────────────── */}
      <Dialog
        open={quiz.phase !== "idle"}
        onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
          {quiz.phase === "question" && (
            <QuizQuestion
              lesson={quiz.lesson}
              question={quiz.questions[quiz.idx]}
              idx={quiz.idx}
              total={quiz.questions.length}
              selected={quiz.selected}
              answered={quiz.answered}
              score={quiz.score}
              onSelect={(i) => dispatch({ type: "SELECT", idx: i })}
              onSubmit={() => dispatch({ type: "SUBMIT" })}
              onNext={() => dispatch({ type: "NEXT" })}
              onClose={() => dispatch({ type: "CLOSE" })}
            />
          )}
          {quiz.phase === "result" && (
            <QuizResult
              lesson={quiz.lesson}
              score={quiz.score}
              passed={quiz.passed}
              onRetry={() => dispatch({ type: "RETRY" })}
              onClose={() => dispatch({ type: "CLOSE" })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Study Material Modal ─────────────────────────────── */}
      <Dialog
        open={studyLesson !== null}
        onOpenChange={(open) => !open && setStudyLesson(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden gap-0 flex flex-col">
          {studyLesson && (
            <StudyReader
              lesson={studyLesson}
              study={LESSON_STUDY[studyLesson.id]}
              onClose={() => setStudyLesson(null)}
              onGoToQuiz={() => {
                setStudyLesson(null);
                dispatch({ type: "OPEN", lesson: studyLesson });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Study Reader ─────────────────────────────────────────────────────── */
function StudyReader({
  lesson,
  study,
  onClose,
  onGoToQuiz,
}: {
  lesson: CourseLesson;
  study: LessonStudy | undefined;
  onClose: () => void;
  onGoToQuiz: () => void;
}) {
  if (!study) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Study material coming soon.</p>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="pr-10 p-5 border-b bg-gradient-to-r from-primary/5 to-primary/0">
        <div className="flex items-center gap-2 mb-1">
          <BookMarked className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Lesson {lesson.id} · Study Material</span>
        </div>
        <h2 className="text-base font-bold leading-snug text-foreground">{lesson.title}</h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* Overview */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            Overview
          </h3>
          <div className="space-y-2.5">
            {study.overview.map((para, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
        </section>

        {/* Key Points */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <ListChecks className="h-4 w-4 text-amber-500" />
            Key Points
          </h3>
          <ul className="space-y-2">
            {study.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-foreground/85 leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Worked Example */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Lightbulb className="h-4 w-4 text-emerald-500" />
            Worked Example
          </h3>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3">
              {study.example.title}
            </p>
            <ol className="space-y-2">
              {study.example.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {i + 1}
                  </span>
                  <span className="text-foreground/85 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* App Guide */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Smartphone className="h-4 w-4 text-blue-500" />
            Try It in Freedom Planner
          </h3>
          <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                {study.appGuide.tab}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 mt-1">{study.appGuide.description}</p>
            <ol className="space-y-2">
              {study.appGuide.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {i + 1}
                  </span>
                  <span className="text-foreground/85 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">Ready to test your knowledge?</p>
        <Button size="sm" className="rounded-full gap-2" onClick={onGoToQuiz}>
          Take the Quiz
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  );
}

/* ─── Module progress pill ─────────────────────────────────────────────── */
function ModuleProgressPill({ done, total }: { done: number; total: number }) {
  const allDone = done === total;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        allDone
          ? "bg-success/10 text-success"
          : done > 0
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
      )}
    >
      {allDone && <Flame className="h-3 w-3" />}
      {done}/{total}
    </span>
  );
}

/* ─── Quiz question panel ──────────────────────────────────────────────── */
function QuizQuestion({
  lesson,
  question,
  idx,
  total,
  selected,
  answered,
  score,
  onSelect,
  onSubmit,
  onNext,
  onClose,
}: {
  lesson: CourseLesson;
  question: QuizQuestion;
  idx: number;
  total: number;
  selected: number | null;
  answered: boolean;
  score: number;
  onSelect: (i: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isLast = idx === total - 1;
  const pct = Math.round((idx / total) * 100);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Lesson {lesson.id}
          </p>
          <p className="truncate text-sm font-semibold">{lesson.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {idx + 1} of {total}</span>
          <span className="font-semibold tabular-nums text-primary">{score} correct so far</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      {/* Question */}
      <div className="px-6 py-4 space-y-3">
        <p className="font-semibold text-base leading-snug">{question.q}</p>
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = answered && i === question.answer;
            const isWrong = answered && isSelected && i !== question.answer;

            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => onSelect(i)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                  !answered && "hover:border-primary/50 hover:bg-muted/40",
                  !answered && isSelected && "border-primary bg-primary/5 font-semibold",
                  !answered && !isSelected && "border-border",
                  isCorrect && "border-success bg-success/10 font-semibold text-success",
                  isWrong && "border-danger bg-danger/10 font-semibold text-danger",
                  answered && !isSelected && !isCorrect && "border-border opacity-50",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      !answered && isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCorrect
                          ? "border-success bg-success text-white"
                          : isWrong
                            ? "border-danger bg-danger text-white"
                            : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="border-t border-border px-6 py-4">
        {!answered ? (
          <Button className="w-full" disabled={selected === null} onClick={onSubmit}>
            Submit Answer
          </Button>
        ) : (
          <Button className="w-full" onClick={onNext}>
            {isLast ? "See Result →" : "Next Question →"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Quiz result panel ────────────────────────────────────────────────── */
function QuizResult({
  lesson,
  score,
  passed,
  onRetry,
  onClose,
}: {
  lesson: CourseLesson;
  score: number;
  passed: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
      <div
        className={cn(
          "flex h-24 w-24 items-center justify-center rounded-full",
          passed ? "bg-success/15" : "bg-accent/15",
        )}
      >
        {passed ? (
          <Trophy className="h-12 w-12 text-success" />
        ) : (
          <RotateCcw className="h-12 w-12 text-accent" />
        )}
      </div>

      <div>
        <p
          className={cn(
            "font-display text-6xl font-bold tabular-nums",
            passed ? "text-success" : "text-accent",
          )}
        >
          {score}/10
        </p>
        <p className="mt-1 font-display text-xl font-semibold">
          {passed ? "You passed! 🎉" : "Not quite yet"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {passed
            ? `Great work on Lesson ${lesson.id}. It's now marked as complete in your progress.`
            : `You need at least 7/10 to complete this lesson. Review the material and try again.`}
        </p>
      </div>

      <div className="flex w-full gap-3">
        {passed ? (
          <Button className="flex-1" onClick={onClose}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Done
          </Button>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={onRetry}>
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

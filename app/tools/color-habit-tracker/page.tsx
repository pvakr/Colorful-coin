"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

// ---------- Types ----------
type Habit = {
  id: string;
  name: string;
  color: string;
  weeklyGoal: number; // completions per week target
  history: Record<string, boolean>; // ISO date -> done?
  total: number; // lifetime completions
};

// ---------- Helpers ----------
const todayISO = () => new Date().toISOString().slice(0, 10);
function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(base: Date, days: number) { const d = new Date(base); d.setDate(d.getDate() + days); return d; }
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 9); }

const DEFAULTS: Habit[] = [
  { id: uid(), name: "Workout", color: "#4ade80", weeklyGoal: 4, history: {}, total: 0 },
  { id: uid(), name: "Read", color: "#facc15", weeklyGoal: 5, history: {}, total: 0 },
];

const MILESTONES = [10, 25, 50, 100, 200];

// ---------- Storage ----------
const KEY = "colorHabit.v2";
function load(): Habit[] {
  if (typeof window === "undefined") return DEFAULTS;
  try { const raw = localStorage.getItem(KEY); if (!raw) return DEFAULTS; const parsed = JSON.parse(raw) as Habit[]; return parsed; } catch { return DEFAULTS; }
}
function save(data: Habit[]) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }

// ---------- UI Bits ----------
function ProgressRing({ value, max = 1, size = 64, stroke = 8 }: { value: number; max?: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r; const pct = Math.min(1, value / Math.max(1, max));
  return (
    <svg width={size} height={size} className="drop-shadow">
      <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="#10b981" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-bold fill-slate-800">{Math.round(pct*100)}%</text>
    </svg>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-slate-800 shadow ring-1 ring-black/5">{children}</span>;
}

// ---------- Back Button (inline) ----------
function BackButton({
  label = "Back to Tools",
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return router.push(hrefFallback);

    const ref = document.referrer;
    const hasHistory = window.history.length > 1;

    const sameOrigin = !!ref && (() => {
      try { return new URL(ref).origin === window.location.origin; } catch { return false; }
    })();

    const notSelf = !!ref && (() => {
      try { return new URL(ref).pathname !== pathname; } catch { return true; }
    })();

    if (hasHistory && sameOrigin && notSelf) {
      router.back();
    } else {
      router.push(hrefFallback);
    }
  }, [router, hrefFallback, pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack]);

  return (
    <motion.button
      onClick={goBack}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-800 ring-1 ring-black/5 shadow hover:bg-white ${className}`}
      aria-label="Go back"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  );
}

// ---------- Subcomponents ----------
function WeekStrip({ habit, onToggle }: { habit: Habit; onToggle: (dateISO: string) => void }) {
  const start = startOfWeek();
  const days = new Array(7).fill(0).map((_, i) => addDays(start, i));
  const doneCount = days.filter((d) => habit.history[iso(d)]).length;
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {days.map((d) => {
          const k = iso(d); const done = !!habit.history[k];
          const isToday = k === todayISO();
          return (
            <button
              key={k}
              onClick={() => onToggle(k)}
              title={k}
              className={`h-9 w-9 rounded-xl shadow-inner ring-1 ring-black/5 transition ${done ? "scale-100" : "scale-95"}`}
              style={{ background: done ? habit.color : "#ffffff" }}
            >
              <span className={`block h-full w-full rounded-xl ${isToday ? "ring-2 ring-black/40" : ""}`} />
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Badge>🔥 {streak(habit)}</Badge>
        <Badge>{doneCount}/{habit.weeklyGoal} this week</Badge>
      </div>
    </div>
  );
}

function streak(h: Habit) {
  // count consecutive days ending today
  let count = 0; const now = new Date(todayISO());
  for (let i = 0; i < 999; i++) {
    const d = addDays(now, -i); if (h.history[iso(d)]) count++; else break;
  }
  return count;
}

function MilestoneToast({ show, onClose, amount }: { show: boolean; onClose: () => void; amount: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.8, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 18 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-2">
            <div className="text-4xl">🏆</div>
            <div className="text-xl font-extrabold text-emerald-600">Milestone!</div>
            <div className="text-slate-700">You reached <b>{amount}</b> total completions. Keep going!</div>
            <button onClick={onClose} className="mt-2 rounded-xl bg-emerald-600 px-5 py-2 text-white shadow hover:brightness-110">Nice!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Page ----------
export default function HabitTrackerPage() {
  const [habits, setHabits] = useState<Habit[]>(load());
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#60a5fa");
  const [newGoal, setNewGoal] = useState(5);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => { save(habits); }, [habits]);

  const weekStart = startOfWeek();
  const weekDays = useMemo(() => new Array(7).fill(0).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const weekProgress = (h: Habit) => weekDays.filter((d) => h.history[iso(d)]).length;

  function toggle(h: Habit, dateISO: string) {
    setHabits((prev) => prev.map((x) => {
      if (x.id !== h.id) return x;
      const now = { ...x };
      const before = !!now.history[dateISO];
      now.history = { ...now.history, [dateISO]: !before };
      if (!before) now.total += 1; else now.total = Math.max(0, now.total - 1);
      // milestone check only on increment
      if (!before) {
        const hit = MILESTONES.find((m) => m === now.total);
        if (hit) setMilestone(hit);
      }
      return now;
    }));
  }

  function addHabit() {
    if (!newName.trim()) return;
    const h: Habit = { id: uid(), name: newName.trim(), color: newColor, weeklyGoal: Math.max(1, Math.min(7, newGoal)), history: {}, total: 0 };
    setHabits((p) => [h, ...p]);
    setNewName("");
  }

  function setGoal(h: Habit, goal: number) {
    setHabits((prev) => prev.map((x) => (x.id === h.id ? { ...x, weeklyGoal: Math.max(1, Math.min(7, Math.round(goal))) } : x)));
  }

  function resetWeek(h: Habit) {
    const start = startOfWeek(); 
    setHabits((prev) => prev.map((x) => {
      if (x.id !== h.id) return x;
      const nh = { ...x, history: { ...x.history } };
      for (let i = 0; i < 7; i++) { const d = iso(addDays(start, i)); delete nh.history[d]; }
      return nh;
    }));
  }

  return (
    <main className="min-h-screen p-6">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        {/* Back navigation */}
        <div className="mb-4">
          <BackButton hrefFallback="/tools" label="Back to Tools" />
        </div>

        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-3 text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 drop-shadow-sm">📅 Color Habit Tracker</h1>
            <p className="text-slate-700">Daily impacts → Weekly goals → Lifetime milestones. Keep the chain alive!</p>
          </header>

          {/* Add Habit */}
          <section className="rounded-3xl bg-white/80 p-4 shadow-xl backdrop-blur ring-1 ring-black/5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New habit name (e.g., Meditate)" className="rounded-xl border px-4 py-3" />
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-12 w-full rounded-xl border p-0" />
              <input type="number" min={1} max={7} value={newGoal} onChange={(e) => setNewGoal(parseInt(e.target.value || "1", 10))} className="w-24 rounded-xl border px-3 py-3" />
              <button onClick={addHabit} className="rounded-xl bg-slate-900 px-4 py-3 text-white shadow">➕ Add</button>
            </div>
            <div className="mt-2 text-xs text-slate-600">Pick a weekly goal (1–7). Colors help you recognize your habits at a glance.</div>
          </section>

          {/* Habit List */}
          <section className="space-y-5">
            {habits.map((h) => (
              <article key={h.id} className="rounded-3xl bg-white/80 p-5 shadow-xl backdrop-blur ring-1 ring-black/5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl shadow-inner ring-1 ring-black/5" style={{ background: h.color }} />
                    <div>
                      <div className="text-xl font-bold text-slate-900">{h.name}</div>
                      <div className="text-sm text-slate-600">Lifetime: <b>{h.total}</b> • Streak: <b>{streak(h)}</b></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block"><ProgressRing value={weekProgress(h)} max={h.weeklyGoal} /></div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">Weekly goal</label>
                      <input type="number" min={1} max={7} value={h.weeklyGoal} onChange={(e) => setGoal(h, parseInt(e.target.value || "1", 10))} className="w-20 rounded-xl border px-3 py-2" />
                    </div>
                    <button onClick={() => resetWeek(h)} className="rounded-xl bg-slate-800 px-4 py-2 text-white shadow">♻️ Reset week</button>
                  </div>
                </div>

                <div className="mt-4">
                  <WeekStrip habit={h} onToggle={(d) => toggle(h, d)} />
                </div>
              </article>
            ))}

            {habits.length === 0 && (
              <div className="rounded-3xl bg-white/80 p-6 text-center text-slate-600 shadow">No habits yet — add one above!</div>
            )}
          </section>
        </div>

        {/* Milestone toast */}
        <MilestoneToast show={milestone !== null} amount={milestone ?? 0} onClose={() => setMilestone(null)} />
      </section>
    </main>
  );
}

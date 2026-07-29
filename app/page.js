"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Wind,
  MessageCircleQuestion,
  Compass,
  ChevronRight,
  RotateCcw,
  Shuffle,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* ---------- design tokens (same as the artifact/static versions) ---------- */
const COLORS = {
  bg: "#EDE8DD", bgAlt: "#E3DCCC", card: "#F5F1E8",
  ink: "#2B2A28", inkSoft: "#6B655C", inkFaint: "#9B948A",
  border: "#D8D0C0", sage: "#4A6B5C",
};
const STRATA_COLORS = ["#8CA88F", "#9CA875", "#C9A961", "#C97B52", "#B5563C"];
const STRATA_LABELS = ["Calm", "Steady", "Stirred", "Strained", "Overwhelmed"];

const PROMPTS = [
  "What took more out of you today than it should have?",
  "What's a small thing that went right today?",
  "What are you avoiding thinking about right now?",
  "Who or what gave you energy today?",
  "What would you tell a friend who felt exactly like you do now?",
  "What's one thing you're carrying that isn't actually yours to carry?",
  "What did you need today that you didn't get?",
  "When did you feel most like yourself this week?",
  "What's underneath the stress — what are you actually afraid of?",
  "What's a pattern you keep noticing in yourself lately?",
  "What are you proud of that no one else noticed?",
  "If today had a weather forecast, what would it be?",
];
const REFRAME_PROMPTS = [
  "What part of this is actually in your control?",
  "What would this look like if it weren't a crisis, just a problem?",
  "What's the story you're telling yourself — and is it the only one?",
  "A year from now, how much of this will still matter?",
  "What's one thing you'd say to someone else in this exact spot?",
  "What need of yours isn't being met here?",
  "Is this a fact, or a fear dressed up as one?",
  "What's the smallest next step, ignoring the whole mountain?",
];
const VALUES = ["Honesty","Freedom","Connection","Achievement","Security","Curiosity","Creativity","Stability","Adventure","Compassion","Independence","Recognition","Growth","Loyalty","Justice","Calm","Discipline","Belonging","Craft","Influence"];

/* =========================== root =========================== */

export default function Page() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <Centered>Loading…</Centered>;
  }
  if (!session) {
    return <LoginView />;
  }
  return <App session={session} />;
}

function Centered({ children }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.inkFaint }} className="min-h-screen flex items-center justify-center text-sm">
      {children}
    </div>
  );
}

/* =========================== auth =========================== */

function LoginView() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }} className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-2">
        <Layers size={22} color={COLORS.sage} />
        <span className="font-display text-2xl">Strata</span>
      </div>
      <p className="text-sm mb-8 text-center max-w-xs" style={{ color: COLORS.inkSoft }}>
        Lay down a little of today. Watch the shape of you build up.
      </p>

      {sent ? (
        <p className="text-sm text-center max-w-xs" style={{ color: COLORS.inkSoft }}>
          Check <strong>{email}</strong> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={submit} className="w-full max-w-xs">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border p-3 text-sm mb-3 focus:outline-none"
            style={{ borderColor: COLORS.border, background: COLORS.card }}
          />
          <button type="submit" className="w-full py-3 rounded-full text-sm font-medium text-white" style={{ background: COLORS.sage }}>
            Send me a sign-in link
          </button>
          {error && <p className="text-xs mt-2" style={{ color: "#B5563C" }}>{error}</p>}
        </form>
      )}
    </div>
  );
}

/* =========================== data hooks =========================== */

function useEntries(userId) {
  const [entries, setEntries] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setEntries(data);
  }, []);

  useEffect(() => { if (userId) refresh(); }, [userId, refresh]);

  const addEntry = useCallback(async ({ stressLevel, note, prompt }) => {
    const { error } = await supabase.from("entries").insert({
      user_id: userId,
      stress_level: stressLevel,
      note,
      prompt,
    });
    if (!error) refresh();
    return error;
  }, [userId, refresh]);

  return { entries, addEntry };
}

/* =========================== app shell =========================== */

function App({ session }) {
  const [tab, setTab] = useState("core");
  const { entries, addEntry } = useEntries(session.user.id);

  const tabs = [
    { id: "core", label: "Core", icon: Layers },
    { id: "checkin", label: "Check in", icon: MessageCircleQuestion },
    { id: "breathe", label: "Breathe", icon: Wind },
    { id: "reframe", label: "Reframe", icon: Shuffle },
    { id: "compass", label: "Compass", icon: Compass },
  ];

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }} className="min-h-screen w-full flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={20} color={COLORS.sage} />
            <span className="font-display text-xl tracking-tight">Strata</span>
          </div>
          <p className="text-sm mt-1" style={{ color: COLORS.inkSoft }}>
            Lay down a little of today. Watch the shape of you build up.
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="p-2 rounded-full"
          style={{ color: COLORS.inkFaint }}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-28 max-w-xl w-full mx-auto">
        {tab === "core" && <CoreView entries={entries} onNavigate={setTab} />}
        {tab === "checkin" && <CheckInView addEntry={addEntry} onDone={() => setTab("core")} />}
        {tab === "breathe" && <BreatheView />}
        {tab === "reframe" && <ReframeView addEntry={addEntry} onDone={() => setTab("core")} />}
        {tab === "compass" && <CompassView userId={session.user.id} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex justify-center border-t" style={{ background: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex w-full max-w-xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 focus:outline-none"
                style={{ color: active ? COLORS.sage : COLORS.inkFaint }}>
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* =========================== views (same UI as the artifact) =========================== */

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border, background: COLORS.card }}>
      <div className="font-display text-2xl">{value}{sub && <span className="text-sm" style={{ color: COLORS.inkFaint }}> {sub}</span>}</div>
      <div className="text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>{label}</div>
    </div>
  );
}

function StrataBand({ entry, open, onToggle }) {
  const color = STRATA_COLORS[entry.stress_level - 1];
  const dateStr = new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <button onClick={onToggle} className="w-full text-left block" style={{ borderBottom: `1px solid ${COLORS.bg}` }}>
      <div className="flex items-center gap-3 px-4 transition-all" style={{ background: color, height: open ? "auto" : "34px", paddingTop: open ? 12 : 0, paddingBottom: open ? 12 : 0 }}>
        {!open && (<>
          <span className="font-mono text-[11px]" style={{ color: "rgba(43,42,40,0.55)" }}>{dateStr}</span>
          <span className="text-[11px]" style={{ color: "rgba(43,42,40,0.6)" }}>{STRATA_LABELS[entry.stress_level - 1]}</span>
        </>)}
        {open && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px]" style={{ color: "rgba(43,42,40,0.6)" }}>{dateStr} · {STRATA_LABELS[entry.stress_level - 1]}</span>
            </div>
            {entry.prompt && <p className="text-xs italic mb-1" style={{ color: "rgba(43,42,40,0.65)" }}>{entry.prompt}</p>}
            {entry.note ? <p className="text-sm leading-relaxed" style={{ color: "#2B2A28" }}>{entry.note}</p>
              : <p className="text-sm italic" style={{ color: "rgba(43,42,40,0.5)" }}>No note left for this one.</p>}
          </div>
        )}
      </div>
    </button>
  );
}

function CoreView({ entries, onNavigate }) {
  const [openId, setOpenId] = useState(null);

  if (entries === null) return <Centered>Loading your core sample…</Centered>;

  if (entries.length === 0) {
    return (
      <div className="pt-10 text-center">
        <div className="mx-auto w-full rounded-2xl border-2 border-dashed p-8" style={{ borderColor: COLORS.border }}>
          <Layers size={28} color={COLORS.inkFaint} className="mx-auto mb-3" />
          <p className="font-display text-lg mb-1">Nothing laid down yet</p>
          <p className="text-sm mb-5" style={{ color: COLORS.inkSoft }}>Every check-in adds one thin layer. Give it a few weeks and a pattern starts to show.</p>
          <button onClick={() => onNavigate("checkin")} className="px-5 py-2.5 rounded-full text-sm font-medium text-white" style={{ background: COLORS.sage }}>Add your first layer</button>
        </div>
      </div>
    );
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = entries.filter((e) => new Date(e.created_at).getTime() > weekAgo);
  const avgStress = thisWeek.length ? (thisWeek.reduce((s, e) => s + e.stress_level, 0) / thisWeek.length).toFixed(1) : "—";
  const counts = [0,0,0,0,0];
  entries.forEach((e) => counts[e.stress_level - 1]++);
  const dominant = counts.indexOf(Math.max(...counts));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Layers laid" value={entries.length} />
        <StatCard label="This week's avg" value={avgStress} sub="/ 5" />
      </div>
      <p className="text-xs uppercase tracking-wide mb-2 font-mono" style={{ color: COLORS.inkFaint }}>Your core sample — newest on top</p>
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: COLORS.border, background: COLORS.card }}>
        {entries.map((e) => <StrataBand key={e.id} entry={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />)}
        <div className="h-3" style={{ background: COLORS.bgAlt }} />
      </div>
      {entries.length >= 5 && (
        <p className="text-sm mt-4 leading-relaxed" style={{ color: COLORS.inkSoft }}>
          Most of your layers sit at <strong>{STRATA_LABELS[dominant].toLowerCase()}</strong>. That's not a verdict — just the sediment so far.
        </p>
      )}
    </div>
  );
}

function CheckInView({ addEntry, onDone }) {
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setSaving(true);
    await addEntry({ stressLevel: stress, note: note.trim(), prompt });
    setSaving(false);
    setSaved(true);
    setTimeout(onDone, 700);
  };

  if (saved) return (
    <div className="pt-16 text-center">
      <p className="font-display text-lg">Layer added.</p>
      <p className="text-sm mt-1" style={{ color: COLORS.inkSoft }}>Taking you back to your core sample…</p>
    </div>
  );

  return (
    <div>
      <p className="font-display text-lg mb-1 leading-snug">{prompt}</p>
      <p className="text-xs mb-5" style={{ color: COLORS.inkFaint }}>Answer in a sentence or a paragraph — whatever's true right now.</p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write here…" rows={5}
        className="w-full rounded-xl border p-4 text-sm resize-none focus:outline-none" style={{ borderColor: COLORS.border, background: COLORS.card }} />
      <p className="text-xs uppercase tracking-wide font-mono mt-6 mb-3" style={{ color: COLORS.inkFaint }}>How much is today weighing on you?</p>
      <div className="flex gap-2 mb-2">
        {STRATA_COLORS.map((c, i) => (
          <button key={i} onClick={() => setStress(i + 1)} className="flex-1 h-10 rounded-lg transition-all"
            style={{ background: c, outline: stress === i + 1 ? `2px solid ${COLORS.ink}` : "none", outlineOffset: "2px", opacity: stress === i + 1 ? 1 : 0.55 }} />
        ))}
      </div>
      <div className="flex justify-between text-[11px] mb-8" style={{ color: COLORS.inkFaint }}>
        <span>{STRATA_LABELS[0]}</span><span>{STRATA_LABELS[4]}</span>
      </div>
      <button disabled={saving} onClick={submit} className="w-full py-3 rounded-full text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-1.5" style={{ background: COLORS.sage }}>
        {saving ? "Saving…" : <>Add this layer <ChevronRight size={16} /></>}
      </button>
    </div>
  );
}

function ReframeView({ addEntry, onDone }) {
  const [stage, setStage] = useState("vent");
  const [vent, setVent] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  const findAWay = () => {
    setPrompts([...REFRAME_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3));
    setStage("reframe");
  };

  const save = async () => {
    setSaving(true);
    const note = [vent.trim(), response.trim()].filter(Boolean).join("\n\n→ ");
    await addEntry({ stressLevel: 4, note, prompt: "Vent & reframe" });
    setSaving(false);
    setStage("saved");
    setTimeout(onDone, 800);
  };

  if (stage === "saved") return (
    <div className="pt-16 text-center">
      <p className="font-display text-lg">Layer added.</p>
      <p className="text-sm mt-1" style={{ color: COLORS.inkSoft }}>Taking you back to your core sample…</p>
    </div>
  );

  if (stage === "reframe") return (
    <div>
      <p className="font-display text-lg mb-1">Sit with one of these</p>
      <p className="text-sm mb-5" style={{ color: COLORS.inkSoft }}>Not to talk yourself out of it — just to look at it from another angle.</p>
      <div className="flex flex-col gap-2 mb-5">
        {prompts.map((p) => <div key={p} className="rounded-xl border p-3.5 text-sm" style={{ borderColor: COLORS.border, background: COLORS.card }}>{p}</div>)}
      </div>
      <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write whatever comes up…" rows={5}
        className="w-full rounded-xl border p-4 text-sm resize-none focus:outline-none mb-4" style={{ borderColor: COLORS.border, background: COLORS.card }} />
      <div className="flex gap-2">
        <button onClick={findAWay} className="px-4 py-3 rounded-full text-sm font-medium border" style={{ borderColor: COLORS.border, color: COLORS.inkSoft }}>
          <Shuffle size={14} className="inline mr-1.5 -mt-0.5" /> Different angle
        </button>
        <button disabled={saving} onClick={save} className="flex-1 py-3 rounded-full text-sm font-medium text-white disabled:opacity-50" style={{ background: COLORS.sage }}>
          {saving ? "Saving…" : "Save this layer"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <p className="font-display text-lg mb-1">Get it out first</p>
      <p className="text-sm mb-5" style={{ color: COLORS.inkSoft }}>No filter, no fixing. Just say what's actually going on.</p>
      <textarea value={vent} onChange={(e) => setVent(e.target.value)} placeholder="I'm stressed because…" rows={7}
        className="w-full rounded-xl border p-4 text-sm resize-none focus:outline-none mb-5" style={{ borderColor: COLORS.border, background: COLORS.card }} />
      <button disabled={!vent.trim()} onClick={findAWay} className="w-full py-3 rounded-full text-sm font-medium text-white disabled:opacity-40 flex items-center justify-center gap-1.5" style={{ background: COLORS.sage }}>
        Find a way through <ChevronRight size={16} />
      </button>
    </div>
  );
}

const PHASES = [
  { key: "in", label: "Breathe in", seconds: 4 },
  { key: "hold1", label: "Hold", seconds: 4 },
  { key: "out", label: "Breathe out", seconds: 4 },
  { key: "hold2", label: "Hold", seconds: 4 },
];

function BreatheView() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        setPhaseIdx((p) => {
          const next = (p + 1) % PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
        return PHASES[(phaseIdx + 1) % PHASES.length].seconds;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phaseIdx]);

  const phase = PHASES[phaseIdx];
  const scale = phase.key === "in" ? 1.15 : phase.key === "out" ? 0.85 : 1;
  const toggle = () => {
    if (!running) { setPhaseIdx(0); setSecondsLeft(PHASES[0].seconds); setCycles(0); }
    setRunning((r) => !r);
  };

  return (
    <div className="flex flex-col items-center pt-8">
      <p className="font-display text-lg mb-1 text-center">Box breathing</p>
      <p className="text-sm mb-10 text-center" style={{ color: COLORS.inkSoft }}>Four seconds in, four held, four out, four held. Follow the circle.</p>
      <div className="relative w-56 h-56 flex items-center justify-center mb-10">
        <div className="absolute rounded-full transition-transform ease-in-out" style={{ width: "12rem", height: "12rem", background: COLORS.sage, opacity: 0.18, transform: `scale(${running ? scale : 1})`, transitionDuration: "1000ms" }} />
        <div className="absolute rounded-full transition-transform ease-in-out" style={{ width: "8rem", height: "8rem", background: COLORS.sage, opacity: 0.35, transform: `scale(${running ? scale : 1})`, transitionDuration: "1000ms" }} />
        <div className="relative text-center">
          <div className="font-display text-xl">{running ? phase.label : "Ready"}</div>
          {running && <div className="font-mono text-sm mt-1" style={{ color: COLORS.inkSoft }}>{secondsLeft}</div>}
        </div>
      </div>
      {running && <p className="text-xs mb-6 font-mono" style={{ color: COLORS.inkFaint }}>{cycles} full cycle{cycles !== 1 ? "s" : ""} completed</p>}
      <button onClick={toggle} className="px-8 py-3 rounded-full text-sm font-medium flex items-center gap-2"
        style={{ background: running ? "transparent" : COLORS.sage, color: running ? COLORS.ink : "white", border: running ? `1px solid ${COLORS.border}` : "none" }}>
        {running ? <><RotateCcw size={15} /> Stop</> : "Start breathing"}
      </button>
    </div>
  );
}

function diffValues(oldV, newV) {
  return { added: newV.filter((v) => !oldV.includes(v)), dropped: oldV.filter((v) => !newV.includes(v)) };
}

function CompassView({ userId }) {
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("value_readings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setHistory(data);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = (v) => setSelected((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : prev.length >= 5 ? prev : [...prev, v]);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("value_readings").insert({ user_id: userId, values: selected });
    setSaving(false);
    if (!error) {
      await refresh();
      setSaved(true);
    }
  };

  if (history === null) return <Centered>Loading…</Centered>;

  const last = history[0];

  if (saved) {
    const changed = last ? diffValues(last.values, selected) : null;
    return (
      <div className="pt-10">
        <p className="font-display text-lg mb-1">Noted.</p>
        <p className="text-sm mb-6" style={{ color: COLORS.inkSoft }}>Come back to this in a month or two — it's more interesting to see what shifts than what stays.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {selected.map((v) => <span key={v} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: COLORS.sage, color: "white" }}>{v}</span>)}
        </div>
        {changed && (changed.added.length > 0 || changed.dropped.length > 0) && (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: COLORS.border, background: COLORS.card }}>
            {changed.added.length > 0 && <p className="mb-1">New this time: <strong>{changed.added.join(", ")}</strong></p>}
            {changed.dropped.length > 0 && <p style={{ color: COLORS.inkSoft }}>Dropped since last time: {changed.dropped.join(", ")}</p>}
          </div>
        )}
        <button onClick={() => { setSaved(false); setSelected([]); }} className="mt-6 text-sm underline" style={{ color: COLORS.inkSoft }}>Back to compass</button>
      </div>
    );
  }

  return (
    <div>
      <p className="font-display text-lg mb-1">Pick your top 5, right now</p>
      <p className="text-sm mb-1" style={{ color: COLORS.inkSoft }}>Not who you want to be — what actually matters to you today.</p>
      {last ? <p className="text-xs mb-5 font-mono" style={{ color: COLORS.inkFaint }}>Last time ({new Date(last.created_at).toLocaleDateString()}): {last.values.join(", ")}</p> : <div className="mb-5" />}
      <div className="flex flex-wrap gap-2 mb-6">
        {VALUES.map((v) => {
          const active = selected.includes(v);
          return <button key={v} onClick={() => toggle(v)} className="px-3.5 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{ background: active ? COLORS.sage : COLORS.card, color: active ? "white" : COLORS.ink, borderColor: active ? COLORS.sage : COLORS.border }}>{v}</button>;
        })}
      </div>
      <p className="text-xs mb-4 font-mono" style={{ color: COLORS.inkFaint }}>{selected.length} / 5 selected</p>
      <button disabled={selected.length === 0 || saving} onClick={submit} className="w-full py-3 rounded-full text-sm font-medium text-white disabled:opacity-40" style={{ background: COLORS.sage }}>
        {saving ? "Saving…" : "Save this reading"}
      </button>
    </div>
  );
}

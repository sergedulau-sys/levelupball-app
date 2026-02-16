import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL = "https://wvbzifqbugjusthwlfzl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2YnppZnFidWdqdXN0aHdsZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTkxMTAsImV4cCI6MjA4NjMzNTExMH0._p8Firq7U6oiHsvvSwNxZT2WJ0MNMQEOze_mjt4xE7w";
const SUBMISSION_EMAIL = "levelupball24@gmail.com";

const supabase = {
  headers: (token) => ({
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }),
  auth: {
    async signIn(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || "Login failed"); }
      return res.json();
    },
    async signUp(email, password, metadata = {}) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: metadata }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || "Signup failed"); }
      return res.json();
    },
  },
  from: (table) => ({
    token: null,
    _token(t) { this.token = t; return this; },
    async select(columns = "*", params = "") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${params}`, { headers: supabase.headers(this.token) });
      if (!res.ok) throw new Error(await res.text()); return res.json();
    },
    async insert(data) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: supabase.headers(this.token), body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text()); return res.json();
    },
    async upsert(data) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { ...supabase.headers(this.token), "Prefer": "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text()); return res.json();
    },
    async update(data, match) {
      const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { method: "PATCH", headers: supabase.headers(this.token), body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text()); return res.json();
    },
    async delete(match) {
      const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { method: "DELETE", headers: supabase.headers(this.token) });
      if (!res.ok) throw new Error(await res.text()); return res.json();
    },
  }),
};

// ============================================================
// DESIGN SYSTEM — #1 updated belts, #8 branding
// ============================================================
const BELT_LEVELS = [
  { id: "white", name: "White Belt", color: "#E0E0E0", bg: "rgba(224,224,224,0.08)", tc: "#333", level: 1, weeks: 3, workoutsNeeded: 9 },
  { id: "blue", name: "Blue Belt", color: "#3B82F6", bg: "rgba(59,130,246,0.08)", tc: "#fff", level: 2, weeks: 4, workoutsNeeded: 12 },
  { id: "purple", name: "Purple Belt", color: "#A855F7", bg: "rgba(168,85,247,0.08)", tc: "#fff", level: 3, weeks: 5, workoutsNeeded: 15 },
  { id: "brown", name: "Brown Belt", color: "#A16207", bg: "rgba(161,98,7,0.08)", tc: "#fff", level: 4, weeks: 6, workoutsNeeded: 18 },
  { id: "black", name: "Black Belt", color: "#A3A3A3", bg: "rgba(163,163,163,0.08)", tc: "#fff", level: 5, weeks: 0, workoutsNeeded: 0 },
];

const C = {
  bg: "#09090b", surface: "#18181b", surfaceHover: "#27272a", border: "#27272a", borderLight: "#3f3f46",
  text: "#fafafa", textMuted: "#a1a1aa", textDim: "#71717a",
  accent: "#F97316", accentLight: "#FB923C", accentGlow: "rgba(249,115,22,0.15)",
  success: "#22C55E", successGlow: "rgba(34,197,94,0.15)", danger: "#EF4444",
  challenge: "#FACC15", challengeGlow: "rgba(250,204,21,0.12)",
};

const FONTS = `'DM Sans', sans-serif`;
const DISPLAY = `'Bricolage Grotesque', sans-serif`;
const F = DISPLAY; // alias for admin

function embedUrl(url) {
  if (!url) return null;
  try {
    if (url.includes("youtube.com/watch")) { const v = new URL(url).searchParams.get("v"); return v ? `https://www.youtube.com/embed/${v}` : null; }
    if (url.includes("youtube.com/embed")) return url;
    if (url.includes("youtu.be/")) { const v = url.split("youtu.be/")[1]?.split("?")[0]; return v ? `https://www.youtube.com/embed/${v}` : null; }
    if (url.includes("vimeo.com/")) { const v = url.split("vimeo.com/")[1]?.split("?")[0]; return v ? `https://player.vimeo.com/video/${v}` : null; }
  } catch (e) { return null; }
  return url;
}
const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${C.bg}; font-family: ${FONTS}; color: ${C.text}; -webkit-font-smoothing: antialiased; }
input::placeholder, textarea::placeholder { color: ${C.textDim}; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.fade-in { animation: fadeIn 0.4s ease-out forwards; }
`;

// ============================================================
// SHARED COMPONENTS
// ============================================================
function VideoPlayer({ url }) {
  const eu = embedUrl(url);
  if (!eu) return (<div style={{ width: "100%", aspectRatio: "16/9", background: C.surface, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}` }}><div style={{ textAlign: "center", color: C.textDim }}><div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div><div style={{ fontSize: 13 }}>No video yet</div></div></div>);
  return <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: "#000" }}><iframe src={eu} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}

function RestTimer({ seconds }) {
  const [rem, setRem] = useState(seconds);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setRem(seconds); setOn(false); if (ref.current) clearInterval(ref.current); }, [seconds]);
  useEffect(() => { if (on && rem > 0) { ref.current = setInterval(() => setRem(r => { if (r <= 1) { clearInterval(ref.current); setOn(false); return 0; } return r - 1; }), 1000); } return () => clearInterval(ref.current); }, [on, rem]);
  const pct = seconds > 0 ? ((seconds - rem) / seconds) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, marginTop: 10 }}>
      <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
        <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke={C.border} strokeWidth="3" /><circle cx="24" cy="24" r="20" fill="none" stroke={rem === 0 ? C.success : C.accent} strokeWidth="3" strokeDasharray={`${(pct/100)*125.6} 125.6`} strokeLinecap="round" transform="rotate(-90 24 24)" style={{ transition: "stroke-dasharray 0.5s" }} /></svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: DISPLAY }}>{fmtTime(rem)}</span>
      </div>
      <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>REST</div><div style={{ height: 4, background: C.border, borderRadius: 2 }}><div style={{ height: "100%", width: `${pct}%`, background: rem === 0 ? C.success : C.accent, borderRadius: 2, transition: "width 0.5s" }} /></div></div>
      <div style={{ display: "flex", gap: 6 }}>
        {!on && rem > 0 && <button onClick={() => setOn(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS }}>Start</button>}
        {on && <button onClick={() => { setOn(false); clearInterval(ref.current); }} style={{ background: C.surfaceHover, color: C.text, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS }}>Pause</button>}
        {rem === 0 && <span style={{ color: C.success, fontWeight: 700, fontSize: 12 }}>✓ Done</span>}
        <button onClick={() => { setRem(seconds); setOn(false); clearInterval(ref.current); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: C.textDim, cursor: "pointer" }}>↺</button>
      </div>
    </div>
  );
}

// #1 Belt icon - SVG belt shape
function BeltIcon({ beltId, size = 40 }) {
  const belt = BELT_LEVELS.find(b => b.id === beltId) || BELT_LEVELS[0];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: belt.bg, border: `1.5px solid ${belt.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="8" width="20" height="8" rx="2" fill={belt.color} opacity="0.3" />
        <rect x="2" y="9" width="20" height="6" rx="1.5" fill={belt.color} />
        <rect x="9" y="7" width="6" height="10" rx="1.5" fill={belt.color} stroke={C.bg} strokeWidth="1" />
        <rect x="10.5" y="9" width="3" height="6" rx="0.5" fill={C.bg} opacity="0.4" />
      </svg>
    </div>
  );
}

function BeltBadge({ beltId, size = "md" }) {
  const belt = BELT_LEVELS.find(b => b.id === beltId) || BELT_LEVELS[0];
  const s = size === "sm" ? { h: 24, fs: 9, px: 10 } : { h: 28, fs: 10, px: 12 };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: s.h, padding: `0 ${s.px}px`, borderRadius: 999, background: belt.bg, border: `1px solid ${belt.color}33` }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: belt.color }} />
      <span style={{ fontFamily: DISPLAY, fontSize: s.fs, fontWeight: 600, color: belt.color }}>{belt.name}</span>
    </div>
  );
}

function ProgressRing({ percent, size = 56, strokeWidth = 4, color = C.accent }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={strokeWidth} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${(percent/100)*circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 0.8s" }} /></svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: size * 0.22, fontWeight: 700 }}>{percent}%</div>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const go = async () => { setErr(""); setLoading(true); try { onLogin(await supabase.auth.signIn(email, pw)); } catch (e) { setErr(e.message); } setLoading(false); };
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONTS };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06), transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`, backgroundSize: "24px 24px", opacity: 0.3 }} />
      <div className="fade-in" style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 16, boxShadow: `0 8px 32px ${C.accentGlow}` }}>🏀</div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>Level<span style={{ color: C.accent }}>Up</span>Ball</h1>
          <p style={{ color: C.textDim, fontSize: 14, marginTop: 8 }}>Your basketball training platform</p>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, padding: 32, border: `1px solid ${C.border}` }}>
          {err && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: C.danger, fontSize: 13 }}>{err}</div>}
          <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: C.textMuted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="you@email.com" /></div>
          <div style={{ marginBottom: 24 }}><label style={{ display: "block", color: C.textMuted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="••••••••" /></div>
          <button onClick={go} disabled={loading} style={{ width: "100%", background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: DISPLAY, opacity: loading ? 0.7 : 1, boxShadow: `0 4px 16px ${C.accentGlow}` }}>{loading ? "Signing in..." : "Sign In"}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ activeTab, setActiveTab, profile, onLogout }) {
  const belt = BELT_LEVELS.find(b => b.id === profile.belt_id) || BELT_LEVELS[0];
  const tabs = [
    { id: "dashboard", icon: "⚡", label: "Dashboard" },
    { id: "workouts", icon: "🏀", label: "Workouts" },
    { id: "challenges", icon: "🏆", label: "Challenge" },
    { id: "resources", icon: "📖", label: "Resources" },
  ];
  return (
    <>
      <div style={{ width: 240, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }} className="sidebar-desktop">
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
            <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700 }}>Level<span style={{ color: C.accent }}>Up</span>Ball</span>
          </div>
          <div style={{ background: C.bg, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <BeltIcon beltId={profile.belt_id} size={36} />
              <div><div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{profile.full_name.split(" ")[0]}</div><div style={{ fontSize: 11, color: C.textDim }}>{belt.name}</div></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {BELT_LEVELS.map((b, i) => (<div key={b.id} style={{ flex: 1, height: 3, borderRadius: 2, background: i < belt.level ? belt.color : C.border }} />))}
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: activeTab === t.id ? C.accentGlow : "transparent", color: activeTab === t.id ? C.accent : C.textMuted, fontSize: 13.5, fontWeight: activeTab === t.id ? 600 : 400, cursor: "pointer", fontFamily: FONTS, marginBottom: 2, textAlign: "left" }}><span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{t.icon}</span>{t.label}</button>))}
        </nav>
        <div style={{ padding: "16px 12px" }}><button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 13, cursor: "pointer", fontFamily: FONTS }}><span>↩</span> Log Out</button></div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "none", padding: "6px 8px 10px", zIndex: 100 }} className="mobile-nav">
        {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0", border: "none", background: "transparent", color: activeTab === t.id ? C.accent : C.textDim, cursor: "pointer", fontFamily: FONTS, fontSize: 10, fontWeight: activeTab === t.id ? 600 : 400 }}><span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}</button>))}
      </div>
    </>
  );
}

// ============================================================
// #6 DASHBOARD — progress shows belt journey, #10 next workout clickable
// ============================================================
function DashboardView({ profile, workoutsData, completedIds, completedWorkoutIds, onSelectWorkout }) {
  const belt = BELT_LEVELS.find(b => b.id === profile.belt_id) || BELT_LEVELS[0];
  const bw = workoutsData || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // #6 Progress: workouts completed for this belt
  const wDone = bw.filter(w => completedWorkoutIds.has(w.id)).length;
  const needed = belt.workoutsNeeded || 9;
  const totalWeeks = belt.weeks || 3;
  const currentWeek = wDone < Math.ceil(needed / 3) ? 1 : wDone < Math.ceil(needed * 2 / 3) ? 2 : totalWeeks;
  const beltPct = needed > 0 ? Math.min(100, Math.round((wDone / needed) * 100)) : 100;

  // #10 Next workout = first incomplete
  const nextWorkout = bw.find(w => !completedWorkoutIds.has(w.id));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: C.textDim, fontSize: 14, marginBottom: 4 }}>{greeting}</p>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>{profile.full_name.split(" ")[0]} 👊</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {/* #6 Belt progress */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: C.accentGlow, filter: "blur(30px)" }} />
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Belt Progress</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{beltPct}<span style={{ fontSize: 16, color: C.textDim }}>%</span></p>
                <p style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Week {currentWeek} of {totalWeeks}</p>
              </div>
              <ProgressRing percent={beltPct} size={52} />
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 14 }}><div style={{ height: "100%", width: `${beltPct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: 2, transition: "width 0.8s" }} /></div>
            <p style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Workout {wDone} of {needed}</p>
          </div>
        </div>

        {/* Belt card */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Current Belt</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BeltIcon beltId={profile.belt_id} size={52} />
            <div><p style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}>{belt.name}</p><p style={{ fontSize: 12, color: C.textDim }}>Level {belt.level} of 5</p></div>
          </div>
        </div>

        {/* Workouts stat */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Workouts</p>
          <p style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{wDone}<span style={{ fontSize: 16, color: C.textDim }}>/{bw.length}</span></p>
          <p style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>completed</p>
        </div>
      </div>

      {/* #10 Next workout — clickable */}
      {nextWorkout && (
        <div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Up Next</h2>
          <button onClick={() => onSelectWorkout(nextWorkout)} style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.accent}44`, borderRadius: 18, padding: 20, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: FONTS, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, color: "#fff" }}>{nextWorkout.name.replace("Workout ", "")}</div>
              <div><p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.text }}>{nextWorkout.name}</p><p style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{(nextWorkout.cats||[]).length} categories · {(nextWorkout.cats||[]).reduce((s,c)=>s+(c.exercises||[]).length,0)} exercises</p></div>
            </div>
            <span style={{ color: C.accent, fontSize: 20 }}>→</span>
          </button>
        </div>
      )}
      {!nextWorkout && bw.length > 0 && (
        <div style={{ background: C.successGlow, borderRadius: 16, padding: 24, textAlign: "center", border: `1px solid ${C.success}33` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.success }}>All workouts completed!</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// WORKOUTS LIST — #3 numbered, #4/#6 show completion status
// ============================================================
function WorkoutsList({ workoutsData, completedIds, completedWorkoutIds, onSelect }) {
  const bw = workoutsData || [];
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>My Workouts</h1>
      {bw.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 48, border: `1px solid ${C.border}`, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><p style={{ color: C.textMuted }}>No workouts assigned yet</p></div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {bw.map((w, idx) => {
            const ec = (w.cats||[]).reduce((s,c)=>s+(c.exercises||[]).length,0);
            const dc = (w.cats||[]).reduce((s,c)=>s+(c.exercises||[]).filter(e=>completedIds.has(e.id)).length,0);
            const wDone = completedWorkoutIds.has(w.id);
            return (
              <button key={w.id} onClick={() => onSelect(w)} style={{ background: C.surface, border: wDone ? `1px solid ${C.success}33` : `1px solid ${C.border}`, borderRadius: 16, padding: 18, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", fontFamily: FONTS, transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: wDone ? C.successGlow : C.bg, border: wDone ? `1.5px solid ${C.success}44` : `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: wDone ? C.success : C.textDim }}>{wDone ? "✓" : idx + 1}</div>
                  <div><p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: wDone ? C.success : C.text }}>{w.name}</p><p style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{dc}/{ec} exercises</p></div>
                </div>
                <span style={{ color: C.textDim, fontSize: 16 }}>→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// WORKOUT DETAIL — #4 complete button, #5 challenge exercises, #7 supersets
// ============================================================
function WorkoutView({ workout, onBack, completedIds, onToggle, token, profile, completedWorkoutIds, onCompleteWorkout, challengeResults, onSaveChallengeResult }) {
  const [expanded, setExpanded] = useState(null);
  const isWorkoutDone = completedWorkoutIds.has(workout.id);

  // #7 Group exercises by superset
  const renderCategory = (cat) => {
    const exercises = cat.exercises || [];
    const groups = [];
    let currentSuperset = null;
    let currentGroup = [];

    exercises.forEach((ex) => {
      if (ex.superset_group && ex.superset_group === currentSuperset) {
        currentGroup.push(ex);
      } else {
        if (currentGroup.length > 0) groups.push({ superset: currentSuperset, exercises: currentGroup });
        currentSuperset = ex.superset_group || null;
        currentGroup = [ex];
      }
    });
    if (currentGroup.length > 0) groups.push({ superset: currentSuperset, exercises: currentGroup });

    return groups.map((group, gi) => {
      const isSuperset = group.superset && group.exercises.length > 1;
      const lastEx = group.exercises[group.exercises.length - 1];
      return (
        <div key={gi} style={{ marginBottom: 8 }}>
          {isSuperset && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginLeft: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.accent }}>⚡</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, letterSpacing: 0.5, textTransform: "uppercase" }}>Superset</span>
            </div>
          )}
          <div style={isSuperset ? { borderLeft: `2px solid ${C.accent}44`, paddingLeft: 12, marginLeft: 8 } : {}}>
            {group.exercises.map((ex, ei) => {
              const open = expanded === ex.id;
              const done = completedIds.has(ex.id);
              const isChallenge = ex.is_challenge;
              // #5 get previous result for challenge exercise
              const prevResult = isChallenge ? challengeResults.find(r => r.exercise_id === ex.id) : null;
              const showRest = !isSuperset || ei === group.exercises.length - 1;
              return (
                <div key={ex.id} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${isChallenge ? C.challenge + "44" : done ? C.success + "33" : C.border}`, marginBottom: 6, overflow: "hidden" }}>
                  <div onClick={() => setExpanded(open ? null : ex.id)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={e => { e.stopPropagation(); onToggle(ex.id); }} style={{ width: 26, height: 26, borderRadius: 7, border: done ? "none" : `2px solid ${C.borderLight}`, background: done ? C.success : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 11, fontWeight: 700 }}>{done && "✓"}</button>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: done ? C.success : C.text, textDecoration: done ? "line-through" : "none" }}>{ex.name}</span>
                          {isChallenge && <span style={{ fontSize: 9, fontWeight: 700, background: C.challengeGlow, color: C.challenge, padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.challenge}33`, letterSpacing: 0.5 }}>CHALLENGE</span>}
                        </div>
                        <p style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{ex.sets}×{ex.reps} · {ex.rest_seconds}s rest</p>
                      </div>
                    </div>
                    <span style={{ color: C.textDim, fontSize: 14, transform: open ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▾</span>
                  </div>
                  {open && (
                    <div style={{ padding: "0 16px 14px" }} className="fade-in">
                      <VideoPlayer url={ex.video_url} />
                      {ex.instructions && (<div style={{ background: C.bg, borderRadius: 10, padding: 14, marginTop: 10, border: `1px solid ${C.border}` }}><p style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instructions</p><p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>{ex.instructions}</p></div>)}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                        {[["Sets", ex.sets], ["Reps", ex.reps], ["Rest", ex.rest_seconds + "s"]].map(([l, v]) => (<div key={l} style={{ background: C.bg, borderRadius: 10, padding: 10, textAlign: "center", border: `1px solid ${C.border}` }}><p style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, color: C.accent }}>{v}</p><p style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{l}</p></div>))}
                      </div>
                      {/* #5 Challenge exercise input */}
                      {isChallenge && (
                        <div style={{ background: C.challengeGlow, borderRadius: 12, padding: 14, marginTop: 10, border: `1px solid ${C.challenge}33` }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.challenge, letterSpacing: 1, marginBottom: 8 }}>⭐ CHALLENGE DRILL</p>
                          {prevResult && <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Last time: <span style={{ fontWeight: 700, color: C.text }}>{prevResult.reps_completed} reps</span></p>}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: C.textMuted }}>Reps completed:</span>
                            <input type="number" min="0" defaultValue={prevResult?.reps_completed || ""} onBlur={e => { const v = parseInt(e.target.value); if (v >= 0) onSaveChallengeResult(ex.id, workout.id, v); }} style={{ width: 70, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", fontFamily: DISPLAY }} placeholder="0" />
                          </div>
                        </div>
                      )}
                      {showRest && <RestTimer seconds={ex.rest_seconds} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", color: C.textMuted, cursor: "pointer", fontFamily: FONTS, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>{workout.name}</h1>
      {(workout.cats || []).map(cat => (
        <div key={cat.id} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: C.accent }} />
            <h3 style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.5, textTransform: "uppercase" }}>{cat.name}</h3>
          </div>
          {renderCategory(cat)}
        </div>
      ))}
      {/* #4 Complete workout button */}
      {!isWorkoutDone ? (
        <button onClick={() => onCompleteWorkout(workout.id)} style={{ width: "100%", background: `linear-gradient(135deg, ${C.success}, #16A34A)`, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 12, boxShadow: `0 4px 16px ${C.successGlow}` }}>✓ Mark Workout Complete</button>
      ) : (
        <div style={{ textAlign: "center", padding: 16, color: C.success, fontFamily: DISPLAY, fontSize: 14, fontWeight: 600 }}>✓ Workout Completed!</div>
      )}
    </div>
  );
}

// ============================================================
// #11 CHALLENGES — with social submissions feed
// ============================================================
function StudentChallenges({ token, profile }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [allProfiles, setAllProfiles] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const c = await supabase.from("challenges")._token(token).select("*", "&active=eq.true&limit=1");
        if (c.length > 0) {
          setChallenge(c[0]);
          const subs = await supabase.from("challenge_submissions")._token(token).select("*", `&challenge_id=eq.${c[0].id}&order=created_at.desc`);
          setSubmissions(subs);
          // Load names
          const profs = await supabase.from("profiles")._token(token).select("id,full_name,belt_id", "&role=eq.student");
          const map = {}; profs.forEach(p => map[p.id] = p); setAllProfiles(map);
        }
      } catch(e){ console.error(e); }
      setLoading(false);
    })();
  }, [token]);

  const submitVideo = async () => {
    if (!videoUrl || !challenge) return;
    setSubmitting(true);
    try {
      await supabase.from("challenge_submissions")._token(token).insert({ student_id: profile.id, challenge_id: challenge.id, video_url: videoUrl, caption });
      const subs = await supabase.from("challenge_submissions")._token(token).select("*", `&challenge_id=eq.${challenge.id}&order=created_at.desc`);
      setSubmissions(subs);
      setVideoUrl(""); setCaption("");
    } catch(e) { console.error(e); }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.textDim }}>Loading...</div>;
  if (!challenge) return (<div className="fade-in" style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div><p style={{ color: C.textMuted }}>No active challenge right now</p></div>);

  const deadlineStr = challenge.deadline ? new Date(challenge.deadline + "T23:59:59").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null;
  const isExpired = challenge.deadline ? new Date(challenge.deadline + "T23:59:59") < new Date() : false;
  const mailSubject = encodeURIComponent("Challenge Submission - " + profile.full_name);
  const mailBody = encodeURIComponent("Hi Coach!\n\nHere is my video.\n\nPlayer: " + profile.full_name);
  const mailLink = "mailto:" + (challenge.submission_email || SUBMISSION_EMAIL) + "?subject=" + mailSubject + "&body=" + mailBody;

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>Weekly Challenge</h1>

      {/* Challenge banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}, #EA580C, #DC2626)`, borderRadius: 20, padding: 28, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -30, fontSize: 100, opacity: 0.1 }}>🏆</div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>This Week</p>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: "#fff" }}>{challenge.title}</h2>
        {deadlineStr && (<div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "5px 14px", marginTop: 12 }}><span style={{ fontSize: 11 }}>⏰</span><span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{isExpired ? "Ended" : `Due ${deadlineStr}`}</span></div>)}
      </div>

      {challenge.description && (<div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}><p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{challenge.description}</p></div>)}
      {challenge.video_url && (<div style={{ marginBottom: 14 }}><VideoPlayer url={challenge.video_url} /></div>)}

      {!isExpired && (
        <a href={mailLink} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${C.success}, #16A34A)`, borderRadius: 14, padding: "14px 24px", textDecoration: "none", marginBottom: 28 }}><span>📧</span><span style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", fontWeight: 700 }}>Email Your Video</span></a>
      )}

      {/* #11 Social submissions */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 8 }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Submissions 🔥</h2>

        {/* Submit form */}
        {!isExpired && !submissions.find(s => s.student_id === profile.id) && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 10 }}>Share your attempt</p>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste YouTube/Vimeo link..." style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONTS, marginBottom: 8 }} />
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption (optional)" style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONTS, marginBottom: 10 }} />
            <button onClick={submitVideo} disabled={!videoUrl || submitting} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 600, cursor: videoUrl ? "pointer" : "default", fontFamily: FONTS, opacity: videoUrl ? 1 : 0.5 }}>{submitting ? "Posting..." : "Post"}</button>
          </div>
        )}

        {!isExpired && submissions.find(s => s.student_id === profile.id) && (
          <div style={{ background: C.successGlow, borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: `1px solid ${C.success}33`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.success, fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13, color: C.success }}>You've submitted your video!</span>
          </div>
        )}

        {/* Feed */}
        {submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: C.textDim }}><p>No submissions yet. Be the first! 🏀</p></div>
        ) : submissions.map(sub => {
          const author = allProfiles[sub.student_id];
          return (
            <div key={sub.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: `1px solid ${C.border}` }}>{author?.full_name?.charAt(0) || "?"}</div>
                <div><p style={{ fontSize: 13, fontWeight: 600 }}>{author?.full_name || "Player"}</p><p style={{ fontSize: 11, color: C.textDim }}>{new Date(sub.created_at).toLocaleDateString()}</p></div>
              </div>
              <VideoPlayer url={sub.video_url} />
              {sub.caption && <p style={{ padding: "10px 16px", fontSize: 13, color: C.textMuted }}>{sub.caption}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// RESOURCES — #2 with video support
// ============================================================
function StudentResources({ token }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { (async () => { try { setArticles(await supabase.from("articles")._token(token).select("*", "&published=eq.true&order=sort_order,created_at.desc")); } catch(e){} setLoading(false); })(); }, [token]);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.textDim }}>Loading...</div>;
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>Resources</h1>
      {articles.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 48, border: `1px solid ${C.border}`, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📖</div><p style={{ color: C.textMuted }}>No resources yet</p></div>
      ) : articles.map(a => (
        <div key={a.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 10, overflow: "hidden" }}>
          <div onClick={() => setExpanded(expanded === a.id ? null : a.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📖</div><div><p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600 }}>{a.title}</p><p style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString()}</p></div></div>
            <span style={{ color: C.textDim, fontSize: 14, transform: expanded === a.id ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▾</span>
          </div>
          {expanded === a.id && (<div style={{ padding: "0 20px 20px" }} className="fade-in">
            {/* #2 article video */}
            {a.video_url && <div style={{ marginBottom: 12 }}><VideoPlayer url={a.video_url} /></div>}
            <div style={{ background: C.bg, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{a.content}</div>
          </div>)}
        </div>
      ))}
    </div>
  );
}
function LibrarySearch({ token, onAdd, onClose }) {
  const [library, setLibrary] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await supabase.from("exercise_library")._token(token).select("*", "&order=category,name");
        setLibrary(items);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [token]);

  const filtered = library.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = {};
  filtered.forEach(ex => {
    if (!grouped[ex.category]) grouped[ex.category] = [];
    grouped[ex.category].push(ex);
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#141414", borderRadius: 16, border: "1px solid #333", width: "100%", maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: F, fontSize: 16, color: "#fff", letterSpacing: 1 }}>ADD FROM LIBRARY</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)} autoFocus
            placeholder="Search exercises..."
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {loading ? <p style={{ color: "#555", textAlign: "center", padding: 20 }}>Loading library...</p> :
           filtered.length === 0 ? <p style={{ color: "#555", textAlign: "center", padding: 20 }}>No exercises found. Add some in the Library tab first!</p> :
           Object.entries(grouped).map(([category, exercises]) => (
            <div key={category} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: F, fontSize: 11, color: "#FF6D00", letterSpacing: 2, marginBottom: 8 }}>{category.toUpperCase()}</p>
              {exercises.map(ex => (
                <div key={ex.id} style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px", marginBottom: 6, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: F, fontSize: 14, color: "#fff", fontWeight: 500 }}>{ex.name}</p>
                    <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ex.default_sets}×{ex.default_reps} · {ex.default_rest_seconds}s rest</p>
                  </div>
                  <button onClick={() => onAdd(ex)} style={{ background: "#FF6D00", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+ ADD</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PANEL
// ============================================================
function Admin({ token }) {
  const [tab, setTab] = useState("workouts");
  const [belt, setBelt] = useState("white");
  const [workouts, setWorkouts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [ns, setNs] = useState({ name: "", email: "", password: "", beltId: "white" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // Library state
  const [library, setLibrary] = useState([]);
  const [libLoading, setLibLoading] = useState(true);
  const [libEditing, setLibEditing] = useState(null);
  const [libNew, setLibNew] = useState(false);
  const [libForm, setLibForm] = useState({ name: "", category: "", video_url: "", default_sets: 3, default_reps: 10, default_rest_seconds: 30, instructions: "" });
  const [libSearch, setLibSearch] = useState("");
  // Library search modal for workout editor
  const [showLibSearch, setShowLibSearch] = useState(null);
  // Articles
  const [articles, setArticles] = useState([]);
  const [artEditing, setArtEditing] = useState(null);
  const [artNew, setArtNew] = useState(false);
  const [artForm, setArtForm] = useState({ title: "", content: "", video_url: "", published: true });
  // Challenges
  const [challenges, setChallenges] = useState([]);
  const [chalEditing, setChalEditing] = useState(null);
  const [chalNew, setChalNew] = useState(false);
  const [chalForm, setChalForm] = useState({ title: "", description: "", video_url: "", submission_email: SUBMISSION_EMAIL, deadline: "", active: false }); // { catId, workoutId }

  const inp = { width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" };
  const sinp = { ...inp, width: 80, textAlign: "center", padding: "8px" };

  // Load workouts
  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const wks = await supabase.from("workouts")._token(token).select("*", `&belt_id=eq.${belt}&order=sort_order`);
      const full = [];
      for (const w of wks) {
        const cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${w.id}&order=sort_order`);
        for (const c of cats) { c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`); }
        w.cats = cats;
        full.push(w);
      }
      setWorkouts(full);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [belt, token]);

  const loadStudents = useCallback(async () => {
    try { setStudents(await supabase.from("profiles")._token(token).select("*", `&role=eq.student&order=created_at`)); } catch (e) { console.error(e); }
  }, [token]);

  const loadLibrary = useCallback(async () => {
    setLibLoading(true);
    try { setLibrary(await supabase.from("exercise_library")._token(token).select("*", "&order=category,name")); } catch (e) { console.error(e); }
    setLibLoading(false);
  }, [token]);

  const loadArticles = useCallback(async () => { try { setArticles(await supabase.from("articles")._token(token).select("*", "&order=sort_order,created_at.desc")); } catch(e){} }, [token]);
  const loadChallenges = useCallback(async () => { try { setChallenges(await supabase.from("challenges")._token(token).select("*", "&order=created_at.desc")); } catch(e){} }, [token]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);
  useEffect(() => { if (tab === "students") loadStudents(); if (tab === "library") loadLibrary(); if (tab === "articles") loadArticles(); if (tab === "challenges") loadChallenges(); }, [tab]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const debounceRef = useRef({});
  const debouncedSave = (key, fn, delay = 600) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(fn, delay);
  };

  // -- Workout CRUD --
  const addWorkout = async () => { setSaving(true); try { await supabase.from("workouts")._token(token).insert({ belt_id: belt, name: `Workout ${workouts.length + 1}`, sort_order: workouts.length }); await loadWorkouts(); flash("Workout added!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const deleteWorkout = async (id) => { setSaving(true); try { await supabase.from("workouts")._token(token).delete({ id }); if (editing?.id === id) setEditing(null); await loadWorkouts(); flash("Workout deleted."); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const saveWorkoutName = async (id, name) => { try { await supabase.from("workouts")._token(token).update({ name }, { id }); } catch (e) { console.error(e); } };

  const addCategory = async (workoutId) => { setSaving(true); try { await supabase.from("categories")._token(token).insert({ workout_id: workoutId, name: "New Category", sort_order: (editing?.cats || []).length }); await reloadEditing(workoutId); flash("Category added!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const deleteCategory = async (catId, workoutId) => { setSaving(true); try { await supabase.from("categories")._token(token).delete({ id: catId }); await reloadEditing(workoutId); flash("Category removed."); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const saveCategoryName = async (catId, name) => { try { await supabase.from("categories")._token(token).update({ name }, { id: catId }); } catch (e) { console.error(e); } };

  const addExercise = async (catId, workoutId) => { setSaving(true); try { const cat = editing?.cats?.find(c => c.id === catId); await supabase.from("exercises")._token(token).insert({ category_id: catId, name: "New Exercise", sets: 3, reps: 10, rest_seconds: 30, sort_order: (cat?.exercises || []).length }); await reloadEditing(workoutId); flash("Exercise added!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };

  // Add from library
  const addExerciseFromLibrary = async (libEx) => {
    if (!showLibSearch) return;
    const { catId, workoutId } = showLibSearch;
    setSaving(true);
    try {
      const cat = editing?.cats?.find(c => c.id === catId);
      await supabase.from("exercises")._token(token).insert({
        category_id: catId,
        name: libEx.name,
        video_url: libEx.video_url || "",
        sets: libEx.default_sets,
        reps: libEx.default_reps,
        rest_seconds: libEx.default_rest_seconds,
        instructions: libEx.instructions || "",
        sort_order: (cat?.exercises || []).length,
      });
      await reloadEditing(workoutId);
      flash(`Added "${libEx.name}"!`);
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
    setShowLibSearch(null);
  };

  const deleteExercise = async (exId, workoutId) => { setSaving(true); try { await supabase.from("exercises")._token(token).delete({ id: exId }); await reloadEditing(workoutId); flash("Exercise removed."); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const saveExercise = async (exId, field, value) => { try { await supabase.from("exercises")._token(token).update({ [field]: value }, { id: exId }); } catch (e) { console.error(e); } };

  const reloadEditing = async (workoutId) => {
    try {
      const w = (await supabase.from("workouts")._token(token).select("*", `&id=eq.${workoutId}`))[0];
      if (w) { w.cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${workoutId}&order=sort_order`); for (const c of w.cats) { c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`); } setEditing(w); }
      await loadWorkouts();
    } catch (e) { console.error(e); }
  };

  // -- Student CRUD --
  const addStudent = async () => { if (!ns.name || !ns.email || !ns.password) return; setSaving(true); try { await supabase.auth.signUp(ns.email, ns.password, { full_name: ns.name, role: "student", belt_id: ns.beltId }); setNs({ name: "", email: "", password: "", beltId: "white" }); setShowAdd(false); await loadStudents(); flash("Student added!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const promoteStudent = async (student) => { const ci = BELT_LEVELS.findIndex(b => b.id === student.belt_id); if (ci >= BELT_LEVELS.length - 1) return; setSaving(true); try { await supabase.from("profiles")._token(token).update({ belt_id: BELT_LEVELS[ci + 1].id }, { id: student.id }); await loadStudents(); flash("Student promoted!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
  const deleteStudent = async (id) => { setSaving(true); try { await supabase.from("profiles")._token(token).delete({ id }); await loadStudents(); flash("Student removed."); } catch (e) { flash("Error: " + e.message); } setSaving(false); };

  // -- Library CRUD --
  const saveLibItem = async () => {
    if (!libForm.name || !libForm.category) { flash("Name and category required."); return; }
    setSaving(true);
    try {
      if (libEditing) {
        await supabase.from("exercise_library")._token(token).update(libForm, { id: libEditing.id });
        flash("Exercise updated!");
      } else {
        await supabase.from("exercise_library")._token(token).insert(libForm);
        flash("Exercise added to library!");
      }
      setLibEditing(null); setLibNew(false);
      setLibForm({ name: "", category: "", video_url: "", default_sets: 3, default_reps: 10, default_rest_seconds: 30, instructions: "" });
      await loadLibrary();
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const deleteLibItem = async (id) => { setSaving(true); try { await supabase.from("exercise_library")._token(token).delete({ id }); await loadLibrary(); flash("Removed from library."); } catch (e) { flash("Error: " + e.message); } setSaving(false); };

  const startEditLib = (item) => {
    setLibEditing(item); setLibNew(false);
    setLibForm({ name: item.name, category: item.category, video_url: item.video_url || "", default_sets: item.default_sets, default_reps: item.default_reps, default_rest_seconds: item.default_rest_seconds, instructions: item.instructions || "" });
  };

  const startNewLib = () => {
    setLibNew(true); setLibEditing(null);
    setLibForm({ name: "", category: "", video_url: "", default_sets: 3, default_reps: 10, default_rest_seconds: 30, instructions: "" });
  };

  // Library grouped + filtered
  const libFiltered = library.filter(ex => ex.name.toLowerCase().includes(libSearch.toLowerCase()) || ex.category.toLowerCase().includes(libSearch.toLowerCase()));
  const libGrouped = {};
  libFiltered.forEach(ex => { if (!libGrouped[ex.category]) libGrouped[ex.category] = []; libGrouped[ex.category].push(ex); });
  const existingCategories = [...new Set(library.map(e => e.category))].sort();


  // Articles CRUD
  const saveArticle = async () => { if(!artForm.title){ flash("Title required."); return; } setSaving(true); try { if(artEditing){ await supabase.from("articles")._token(token).update(artForm, { id: artEditing.id }); } else { await supabase.from("articles")._token(token).insert({ ...artForm, sort_order: articles.length }); } setArtEditing(null); setArtNew(false); setArtForm({ title: "", content: "", video_url: "", published: true }); await loadArticles(); flash("Saved!"); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const deleteArticle = async (id) => { setSaving(true); try { await supabase.from("articles")._token(token).delete({ id }); await loadArticles(); flash("Removed."); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const startEditArt = (a) => { setArtEditing(a); setArtNew(false); setArtForm({ title: a.title, content: a.content, video_url: a.video_url || "", published: a.published }); };
  const startNewArt = () => { setArtNew(true); setArtEditing(null); setArtForm({ title: "", content: "", video_url: "", published: true }); };

  // Challenges CRUD
  const saveChallenge = async () => { if(!chalForm.title){ flash("Title required."); return; } setSaving(true); try { if(chalForm.active){ try { await supabase.from("challenges")._token(token).update({ active: false }, { active: true }); } catch(e){} } if(chalEditing){ await supabase.from("challenges")._token(token).update(chalForm, { id: chalEditing.id }); } else { await supabase.from("challenges")._token(token).insert(chalForm); } setChalEditing(null); setChalNew(false); setChalForm({ title: "", description: "", video_url: "", submission_email: SUBMISSION_EMAIL, deadline: "", active: false }); await loadChallenges(); flash("Saved!"); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const deleteChallenge = async (id) => { setSaving(true); try { await supabase.from("challenges")._token(token).delete({ id }); await loadChallenges(); flash("Removed."); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const startEditChal = (c) => { setChalEditing(c); setChalNew(false); setChalForm({ title: c.title, description: c.description||"", video_url: c.video_url||"", submission_email: c.submission_email||SUBMISSION_EMAIL, deadline: c.deadline||"", active: c.active }); };
  const startNewChal = () => { setChalNew(true); setChalEditing(null); setChalForm({ title: "", description: "", video_url: "", submission_email: SUBMISSION_EMAIL, deadline: "", active: false }); };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      {msg && <div style={{ position: "fixed", top: 70, right: 20, background: msg.startsWith("Error") ? "#ff4444" : "#00C853", color: "#fff", padding: "10px 20px", borderRadius: 8, fontFamily: F, fontSize: 13, letterSpacing: 1, zIndex: 200 }}>{msg}</div>}
      {saving && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#FF6D00", color: "#fff", padding: "6px 16px", borderRadius: 6, fontFamily: F, fontSize: 11, letterSpacing: 1, zIndex: 200 }}>SAVING...</div>}
      {showLibSearch && <LibrarySearch token={token} onAdd={addExerciseFromLibrary} onClose={() => setShowLibSearch(null)} />}

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #222" }}>
        {["workouts", "library", "articles", "challenges", "students"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid #FF6D00" : "2px solid transparent", padding: "12px 20px", color: tab === t ? "#FF6D00" : "#666", fontFamily: F, fontSize: 13, letterSpacing: 2, cursor: "pointer", fontWeight: 600 }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* ========== WORKOUTS TAB ========== */}
      {tab === "workouts" && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {BELT_LEVELS.map(b => (
            <button key={b.id} onClick={() => { setBelt(b.id); setEditing(null); }} style={{ background: belt === b.id ? b.color : "#141414", color: belt === b.id ? b.tc : "#888", border: belt === b.id ? "none" : "1px solid #333", borderRadius: 8, padding: "7px 16px", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>{b.name.toUpperCase()}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading workouts...</div> : !editing ? <>
          {workouts.map(w => {
            const ec = (w.cats || []).reduce((s, c) => s + (c.exercises || []).length, 0);
            return (
              <div key={w.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: 16, color: "#fff", fontWeight: 600 }}>{w.name}</p>
                  <p style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{(w.cats || []).length} categories · {ec} exercises</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditing(w)} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>EDIT</button>
                  <button onClick={() => deleteWorkout(w.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "7px 12px", color: "#ff4444", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            );
          })}
          <button onClick={addWorkout} disabled={saving} style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: 12, padding: 18, width: "100%", color: "#FF6D00", fontFamily: F, fontSize: 13, letterSpacing: 1, cursor: "pointer", fontWeight: 600, marginTop: 6 }}>+ ADD WORKOUT</button>
        </> : <>
          <button onClick={() => { setEditing(null); loadWorkouts(); }} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "7px 14px", color: "#fff", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", marginBottom: 18 }}>← BACK TO LIST</button>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#666", fontSize: 10, fontFamily: F, letterSpacing: 1, marginBottom: 5 }}>WORKOUT NAME</label>
            <input defaultValue={editing.name} onBlur={e => saveWorkoutName(editing.id, e.target.value)} onChange={e => debouncedSave(`wname-${editing.id}`, () => saveWorkoutName(editing.id, e.target.value))} style={inp} />
          </div>
          {(editing.cats || []).map(cat => (
            <div key={cat.id} style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <input defaultValue={cat.name} onBlur={e => saveCategoryName(cat.id, e.target.value)} onChange={e => debouncedSave(`cname-${cat.id}`, () => saveCategoryName(cat.id, e.target.value))} style={{ ...inp, maxWidth: 280, fontFamily: F, fontSize: 15, fontWeight: 600 }} />
                <button onClick={() => deleteCategory(cat.id, editing.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 10px", color: "#ff4444", fontSize: 10, fontFamily: F, cursor: "pointer", letterSpacing: 1 }}>REMOVE</button>
              </div>
              {(cat.exercises || []).map(ex => (
                <div key={ex.id} style={{ background: "#0a0a0a", borderRadius: 10, padding: 14, marginBottom: 8, border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <input defaultValue={ex.name} onBlur={e => saveExercise(ex.id, "name", e.target.value)} onChange={e => debouncedSave(`ename-${ex.id}`, () => saveExercise(ex.id, "name", e.target.value))} style={{ ...inp, fontWeight: 600 }} placeholder="Exercise name" />
                    <button onClick={() => deleteExercise(ex.id, editing.id)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: 15, marginLeft: 10, flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>VIDEO URL (YouTube / Vimeo)</label>
                    <input defaultValue={ex.video_url} onBlur={e => saveExercise(ex.id, "video_url", e.target.value)} onChange={e => debouncedSave(`evid-${ex.id}`, () => saveExercise(ex.id, "video_url", e.target.value))} style={inp} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {[["SETS", "sets"], ["REPS", "reps"], ["REST (sec)", "rest_seconds"]].map(([l, k]) => (
                      <div key={k}>
                        <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>{l}</label>
                        <input type="number" min={k === "rest_seconds" ? 0 : 1} defaultValue={ex[k]} onBlur={e => saveExercise(ex.id, k, parseInt(e.target.value) || 0)} onChange={e => debouncedSave(`e${k}-${ex.id}`, () => saveExercise(ex.id, k, parseInt(e.target.value) || 0))} style={sinp} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#aaa", fontSize: 11, cursor: "pointer" }}><input type="checkbox" defaultChecked={ex.is_challenge} onChange={e => saveExercise(ex.id, "is_challenge", e.target.checked)} style={{ width: 16, height: 16 }} /> Challenge Exercise</label>
                      <div style={{ flex: 1 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>SUPERSET GROUP</label><input defaultValue={ex.superset_group || ""} onBlur={e => saveExercise(ex.id, "superset_group", e.target.value)} style={{ width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none" }} placeholder="e.g. A" /></div>
                    </div>
                    <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>INSTRUCTIONS</label>
                    <textarea defaultValue={ex.instructions} onBlur={e => saveExercise(ex.id, "instructions", e.target.value)} onChange={e => debouncedSave(`einst-${ex.id}`, () => saveExercise(ex.id, "instructions", e.target.value))} style={{ ...inp, minHeight: 50, resize: "vertical" }} placeholder="Simple instructions..." />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowLibSearch({ catId: cat.id, workoutId: editing.id })} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: 9, flex: 1, color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>📚 ADD FROM LIBRARY</button>
                <button onClick={() => addExercise(cat.id, editing.id)} disabled={saving} style={{ background: "none", border: "1px dashed #333", borderRadius: 8, padding: 9, flex: 1, color: "#666", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>+ ADD CUSTOM</button>
              </div>
            </div>
          ))}
          <button onClick={() => addCategory(editing.id)} disabled={saving} style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: 12, padding: 14, width: "100%", color: "#FF6D00", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ ADD CATEGORY</button>
        </>}
      </>}

      {/* ========== LIBRARY TAB ========== */}
      {tab === "library" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontFamily: F, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>EXERCISE LIBRARY</h2>
          <button onClick={startNewLib} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW EXERCISE</button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 18 }}>
          <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search exercises..." style={{ ...inp, maxWidth: 400 }} />
        </div>

        {/* Add/Edit Form */}
        {(libNew || libEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: F, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{libEditing ? "EDIT EXERCISE" : "NEW EXERCISE"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>NAME *</label>
                <input value={libForm.name} onChange={e => setLibForm({ ...libForm, name: e.target.value })} style={inp} placeholder="e.g. Crossover Dribble" />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>CATEGORY *</label>
                <input value={libForm.category} onChange={e => setLibForm({ ...libForm, category: e.target.value })} style={inp} placeholder="e.g. Ball Handling" list="cat-suggestions" />
                <datalist id="cat-suggestions">
                  {existingCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>VIDEO URL</label>
              <input value={libForm.video_url} onChange={e => setLibForm({ ...libForm, video_url: e.target.value })} style={inp} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DEFAULT SETS</label>
                <input type="number" min="1" value={libForm.default_sets} onChange={e => setLibForm({ ...libForm, default_sets: parseInt(e.target.value) || 1 })} style={sinp} />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DEFAULT REPS</label>
                <input type="number" min="1" value={libForm.default_reps} onChange={e => setLibForm({ ...libForm, default_reps: parseInt(e.target.value) || 1 })} style={sinp} />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DEFAULT REST (sec)</label>
                <input type="number" min="0" value={libForm.default_rest_seconds} onChange={e => setLibForm({ ...libForm, default_rest_seconds: parseInt(e.target.value) || 0 })} style={sinp} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>INSTRUCTIONS</label>
              <textarea value={libForm.instructions} onChange={e => setLibForm({ ...libForm, instructions: e.target.value })} style={{ ...inp, minHeight: 50, resize: "vertical" }} placeholder="How to perform this exercise..." />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={saveLibItem} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button>
              <button onClick={() => { setLibEditing(null); setLibNew(false); }} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Library List */}
        {libLoading ? <p style={{ color: "#555", padding: 20, textAlign: "center" }}>Loading...</p> :
         Object.keys(libGrouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#555" }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>📚</p>
            <p style={{ fontSize: 14 }}>{libSearch ? "No exercises match your search." : "Your exercise library is empty."}</p>
            <p style={{ fontSize: 12, marginTop: 4, color: "#444" }}>Add your first exercise above!</p>
          </div>
        ) : Object.entries(libGrouped).map(([category, exercises]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: "#FF6D00" }} />
              <p style={{ fontFamily: F, fontSize: 14, color: "#FF6D00", letterSpacing: 2, fontWeight: 600 }}>{category.toUpperCase()}</p>
              <span style={{ fontSize: 11, color: "#555" }}>{exercises.length}</span>
            </div>
            {exercises.map(ex => (
              <div key={ex.id} style={{ background: "#141414", borderRadius: 10, padding: "14px 16px", marginBottom: 6, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: 14, color: "#fff", fontWeight: 500 }}>{ex.name}</p>
                  <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ex.default_sets}×{ex.default_reps} · {ex.default_rest_seconds}s rest {ex.video_url ? "· 🎬" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => startEditLib(ex)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button>
                  <button onClick={() => deleteLibItem(ex.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </>}


      {/* ===== ARTICLES ===== */}
      {tab === "articles" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ fontFamily: F, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>RESOURCES / ARTICLES</h2><button onClick={startNewArt} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW ARTICLE</button></div>
        {(artNew||artEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: F, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{artEditing ? "EDIT" : "NEW"} ARTICLE</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>TITLE *</label><input value={artForm.title} onChange={e=>setArtForm({...artForm,title:e.target.value})} style={inp} placeholder="Article title..." /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>CONTENT</label><textarea value={artForm.content} onChange={e=>setArtForm({...artForm,content:e.target.value})} style={{ ...inp, minHeight: 200, resize: "vertical" }} placeholder="Write your article here..." /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>VIDEO URL (optional)</label><input value={artForm.video_url} onChange={e=>setArtForm({...artForm,video_url:e.target.value})} style={inp} placeholder="https://youtube.com/watch?v=..." /></div>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}><label style={{ color: "#555", fontSize: 11, fontFamily: F, letterSpacing: 1 }}>PUBLISHED</label><input type="checkbox" checked={artForm.published} onChange={e=>setArtForm({...artForm,published:e.target.checked})} style={{ width: 18, height: 18, cursor: "pointer" }} /></div>
            <div style={{ display: "flex", gap: 6 }}><button onClick={saveArticle} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button><button onClick={()=>{setArtEditing(null);setArtNew(false);}} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button></div>
          </div>
        )}
        {articles.length===0 ? (<div style={{ textAlign: "center", padding: 40, color: "#555" }}><p style={{ fontSize: 36, marginBottom: 10 }}>📖</p><p>No articles yet.</p></div>) : articles.map(a=>(<div key={a.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div><p style={{ fontFamily: F, fontSize: 15, color: "#fff", fontWeight: 600 }}>{a.title}</p><p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{a.published ? "Published" : "Draft"} · {new Date(a.created_at).toLocaleDateString()}</p></div><div style={{ display: "flex", gap: 6 }}><button onClick={()=>startEditArt(a)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button><button onClick={()=>deleteArticle(a.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DEL</button></div></div>))}
      </>}

      {/* ===== CHALLENGES ===== */}
      {tab === "challenges" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ fontFamily: F, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>WEEKLY CHALLENGES</h2><button onClick={startNewChal} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW CHALLENGE</button></div>
        {(chalNew||chalEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: F, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{chalEditing ? "EDIT" : "NEW"} CHALLENGE</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>TITLE *</label><input value={chalForm.title} onChange={e=>setChalForm({...chalForm,title:e.target.value})} style={inp} placeholder="e.g. 50 Made Free Throws" /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DESCRIPTION</label><textarea value={chalForm.description} onChange={e=>setChalForm({...chalForm,description:e.target.value})} style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="Explain the challenge..." /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DEMO VIDEO URL</label><input value={chalForm.video_url} onChange={e=>setChalForm({...chalForm,video_url:e.target.value})} style={inp} placeholder="https://youtube.com/..." /></div><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>DEADLINE</label><input type="date" value={chalForm.deadline} onChange={e=>setChalForm({...chalForm,deadline:e.target.value})} style={inp} /></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>SUBMISSION EMAIL</label><input value={chalForm.submission_email} onChange={e=>setChalForm({...chalForm,submission_email:e.target.value})} style={inp} /></div><div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 18 }}><label style={{ color: "#555", fontSize: 11, fontFamily: F, letterSpacing: 1 }}>ACTIVE</label><input type="checkbox" checked={chalForm.active} onChange={e=>setChalForm({...chalForm,active:e.target.checked})} style={{ width: 18, height: 18, cursor: "pointer" }} /><span style={{ fontSize: 10, color: "#FF6D00" }}>{chalForm.active ? "Students see this" : "Hidden"}</span></div></div>
            <div style={{ display: "flex", gap: 6 }}><button onClick={saveChallenge} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button><button onClick={()=>{setChalEditing(null);setChalNew(false);}} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button></div>
          </div>
        )}
        {challenges.length===0 ? (<div style={{ textAlign: "center", padding: 40, color: "#555" }}><p style={{ fontSize: 36, marginBottom: 10 }}>🏆</p><p>No challenges yet.</p></div>) : challenges.map(c=>(<div key={c.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: c.active ? "2px solid #FF6D00" : "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><p style={{ fontFamily: F, fontSize: 15, color: "#fff", fontWeight: 600 }}>{c.title}</p>{c.active && <span style={{ background: "#FF6D00", color: "#fff", fontFamily: F, fontSize: 9, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>ACTIVE</span>}</div><p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.deadline ? "Due " + new Date(c.deadline+"T12:00:00").toLocaleDateString() : "No deadline"}</p></div><div style={{ display: "flex", gap: 6 }}><button onClick={()=>startEditChal(c)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button><button onClick={()=>deleteChallenge(c.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DEL</button></div></div>))}
      </>}

      {/* ========== STUDENTS TAB ========== */}
      {tab === "students" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: F, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>MANAGE STUDENTS</h2>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ ADD STUDENT</button>
        </div>
        {showAdd && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222", marginBottom: 18 }}>
            <h3 style={{ fontFamily: F, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>NEW STUDENT</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["NAME", "name", "Player name"], ["EMAIL", "email", "email@example.com"], ["PASSWORD", "password", "Temp password"]].map(([l, k, ph]) => (
                <div key={k}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>{l}</label><input value={ns[k]} onChange={e => setNs({ ...ns, [k]: e.target.value })} style={inp} placeholder={ph} /></div>
              ))}
              <div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>STARTING BELT</label><select value={ns.beltId} onChange={e => setNs({ ...ns, beltId: e.target.value })} style={{ ...inp, cursor: "pointer" }}>{BELT_LEVELS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addStudent} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button>
            </div>
          </div>
        )}
        {students.map(s => {
          const sb = BELT_LEVELS.find(b => b.id === s.belt_id);
          return (
            <div key={s.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sb.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `2px solid ${sb.color}` }}>🏀</div>
                <div><p style={{ fontFamily: F, fontSize: 15, color: "#fff", fontWeight: 600 }}>{s.full_name}</p><p style={{ fontSize: 11, color: "#555" }}>{s.email}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${sb.color}18`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${sb.color}33` }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sb.color }} />
                  <span style={{ fontFamily: F, fontSize: 10, color: sb.color, letterSpacing: 1 }}>{sb.name.toUpperCase()}</span>
                </div>
                {s.belt_id !== "black" && <button onClick={() => promoteStudent(s)} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "5px 12px", color: "#fff", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>PROMOTE ↑</button>}
                <button onClick={() => deleteStudent(s.id)} disabled={saving} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "5px 12px", color: "#ff4444", fontFamily: F, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>REMOVE</button>
              </div>
            </div>
          );
        })}
        {students.length === 0 && <div style={{ textAlign: "center", padding: 36, color: "#555" }}><p style={{ fontSize: 28, marginBottom: 8 }}>👥</p><p>No students yet.</p></div>}
      </>}
    </div>
  );
}

// ============================================================
// MAIN APP

// ============================================================
// STUDENT LAYOUT
// ============================================================
function StudentLayout({ profile, token, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [workoutsData, setWorkoutsData] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState(new Set());
  const [challengeResults, setChallengeResults] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const wks = await supabase.from("workouts")._token(token).select("*", `&belt_id=eq.${profile.belt_id}&order=sort_order`);
        for (const w of wks) { w.cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${w.id}&order=sort_order`); for (const c of w.cats) { c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`); } }
        setWorkoutsData(wks);
        const comps = await supabase.from("completed_exercises")._token(token).select("exercise_id", `&student_id=eq.${profile.id}`);
        setCompletedIds(new Set(comps.map(c => c.exercise_id)));
        const wComps = await supabase.from("completed_workouts")._token(token).select("workout_id", `&student_id=eq.${profile.id}`);
        setCompletedWorkoutIds(new Set(wComps.map(c => c.workout_id)));
        const cResults = await supabase.from("challenge_results")._token(token).select("*", `&student_id=eq.${profile.id}`);
        setChallengeResults(cResults);
      } catch (e) { console.error(e); }
      setLoaded(true);
    })();
  }, [token, profile]);

  const toggleComplete = async (exerciseId) => {
    const ns = new Set(completedIds);
    if (ns.has(exerciseId)) { ns.delete(exerciseId); setCompletedIds(ns); try { await supabase.from("completed_exercises")._token(token).delete({ student_id: profile.id, exercise_id: exerciseId }); } catch(e){} }
    else { ns.add(exerciseId); setCompletedIds(ns); try { await supabase.from("completed_exercises")._token(token).insert({ student_id: profile.id, exercise_id: exerciseId }); } catch(e){} }
  };

  const completeWorkout = async (workoutId) => {
    try {
      await supabase.from("completed_workouts")._token(token).insert({ student_id: profile.id, workout_id: workoutId });
      setCompletedWorkoutIds(new Set([...completedWorkoutIds, workoutId]));
    } catch(e) { console.error(e); }
  };

  const saveChallengeResult = async (exerciseId, workoutId, reps) => {
    try {
      // Upsert - update if exists, insert if not
      const existing = challengeResults.find(r => r.exercise_id === exerciseId && r.workout_id === workoutId);
      if (existing) {
        await supabase.from("challenge_results")._token(token).update({ reps_completed: reps }, { id: existing.id });
        setChallengeResults(challengeResults.map(r => r.id === existing.id ? { ...r, reps_completed: reps } : r));
      } else {
        const res = await supabase.from("challenge_results")._token(token).insert({ student_id: profile.id, exercise_id: exerciseId, workout_id: workoutId, reps_completed: reps });
        setChallengeResults([...challengeResults, ...res]);
      }
    } catch(e) { console.error(e); }
  };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 40, animation: "pulse 1.5s infinite" }}>🏀</div></div>;

  return (
    <>
      <style>{`
        @media (max-width: 768px) { .sidebar-desktop { display: none !important; } .mobile-nav { display: flex !important; } .main-content { padding-bottom: 80px !important; } }
        @media (min-width: 769px) { .sidebar-desktop { display: flex !important; } .mobile-nav { display: none !important; } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar activeTab={activeWorkout ? "workouts" : activeTab} setActiveTab={(t) => { setActiveTab(t); setActiveWorkout(null); }} profile={profile} onLogout={onLogout} />
        <main className="main-content" style={{ flex: 1, padding: "32px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
          {activeWorkout ? (
            <WorkoutView workout={activeWorkout} onBack={() => setActiveWorkout(null)} completedIds={completedIds} onToggle={toggleComplete} token={token} profile={profile} completedWorkoutIds={completedWorkoutIds} onCompleteWorkout={completeWorkout} challengeResults={challengeResults} onSaveChallengeResult={saveChallengeResult} />
          ) : activeTab === "dashboard" ? (
            <DashboardView profile={profile} workoutsData={workoutsData} completedIds={completedIds} completedWorkoutIds={completedWorkoutIds} onSelectWorkout={(w) => { setActiveWorkout(w); setActiveTab("workouts"); }} />
          ) : activeTab === "workouts" ? (
            <WorkoutsList workoutsData={workoutsData} completedIds={completedIds} completedWorkoutIds={completedWorkoutIds} onSelect={setActiveWorkout} />
          ) : activeTab === "challenges" ? (
            <StudentChallenges token={token} profile={profile} />
          ) : activeTab === "resources" ? (
            <StudentResources token={token} />
          ) : null}
        </main>
      </div>
    </>
  );
}

// ============================================================
// ADMIN HEADER
// ============================================================
function AdminHeader({ onLogout }) {
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
        <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700 }}>Level<span style={{ color: C.accent }}>Up</span>Ball</span>
        <span style={{ background: C.accent, color: "#fff", fontFamily: DISPLAY, fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 600, letterSpacing: 1 }}>ADMIN</span>
      </div>
      <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: FONTS }}>Log Out</button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function LevelUpBallApp() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data) => {
    setSession(data); setLoading(true);
    try {
      const profiles = await supabase.from("profiles")._token(data.access_token).select("*", `&id=eq.${data.user.id}`);
      if (profiles.length > 0) setProfile(profiles[0]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const logout = () => { setSession(null); setProfile(null); };

  if (loading) return <><style>{GLOBAL_CSS}</style><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}><div style={{ fontSize: 48, animation: "pulse 1.5s infinite" }}>🏀</div></div></>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{GLOBAL_CSS}</style>
      {!session && <Login onLogin={handleLogin} />}
      {session && profile?.role === "admin" && <><AdminHeader onLogout={logout} /><Admin token={session.access_token} /></>}
      {session && profile?.role === "student" && <StudentLayout profile={profile} token={session.access_token} onLogout={logout} />}
    </div>
  );
}

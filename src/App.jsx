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
// DESIGN SYSTEM
// ============================================================
const BELT_LEVELS = [
  { id: "white", name: "White Belt", color: "#E0E0E0", bg: "rgba(224,224,224,0.08)", tc: "#333", level: 1 },
  { id: "yellow", name: "Yellow Belt", color: "#FACC15", bg: "rgba(250,204,21,0.08)", tc: "#333", level: 2 },
  { id: "orange", name: "Orange Belt", color: "#F97316", bg: "rgba(249,115,22,0.08)", tc: "#fff", level: 3 },
  { id: "green", name: "Green Belt", color: "#22C55E", bg: "rgba(34,197,94,0.08)", tc: "#fff", level: 4 },
  { id: "black", name: "Black Belt", color: "#A3A3A3", bg: "rgba(163,163,163,0.08)", tc: "#fff", level: 5 },
];

// Color palette
const C = {
  bg: "#09090b",        // zinc-950
  surface: "#18181b",   // zinc-900
  surfaceHover: "#27272a", // zinc-800
  border: "#27272a",    // zinc-800
  borderLight: "#3f3f46", // zinc-700
  text: "#fafafa",      // zinc-50
  textMuted: "#a1a1aa",  // zinc-400
  textDim: "#71717a",    // zinc-500
  accent: "#F97316",     // orange-500
  accentLight: "#FB923C", // orange-400
  accentGlow: "rgba(249,115,22,0.15)",
  success: "#22C55E",
  successGlow: "rgba(34,197,94,0.15)",
  danger: "#EF4444",
};

const FONTS = `'DM Sans', sans-serif`;
const DISPLAY = `'Bricolage Grotesque', sans-serif`;

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

// ============================================================
// GLOBAL STYLES
// ============================================================
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${C.bg}; font-family: ${FONTS}; color: ${C.text}; -webkit-font-smoothing: antialiased; }
input::placeholder, textarea::placeholder { color: ${C.textDim}; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
a { color: inherit; text-decoration: none; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.2); } 50% { box-shadow: 0 0 30px rgba(249,115,22,0.4); } }
.fade-in { animation: fadeIn 0.4s ease-out forwards; }
.slide-in { animation: slideIn 0.3s ease-out forwards; }
`;

// ============================================================
// SHARED COMPONENTS
// ============================================================
function VideoPlayer({ url }) {
  const eu = embedUrl(url);
  if (!eu) return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: C.surface, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}` }}>
      <div style={{ textAlign: "center", color: C.textDim }}><div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div><div style={{ fontSize: 13 }}>No video yet</div></div>
    </div>
  );
  return <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: "#000" }}><iframe src={eu} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}

function RestTimer({ seconds }) {
  const [rem, setRem] = useState(seconds);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setRem(seconds); setOn(false); if (ref.current) clearInterval(ref.current); }, [seconds]);
  useEffect(() => { if (on && rem > 0) { ref.current = setInterval(() => setRem(r => { if (r <= 1) { clearInterval(ref.current); setOn(false); return 0; } return r - 1; }), 1000); } return () => clearInterval(ref.current); }, [on, rem]);
  const pct = seconds > 0 ? ((seconds - rem) / seconds) * 100 : 0;
  const circumference = 2 * Math.PI * 22;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, marginTop: 12 }}>
      <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
        <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="3" /><circle cx="26" cy="26" r="22" fill="none" stroke={rem === 0 ? C.success : C.accent} strokeWidth="3" strokeDasharray={`${(pct / 100) * circumference} ${circumference}`} strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: "stroke-dasharray 0.5s ease" }} /></svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, color: rem === 0 ? C.success : C.text }}>{fmtTime(rem)}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Rest Timer</div>
        <div style={{ height: 4, background: C.border, borderRadius: 2 }}><div style={{ height: "100%", width: `${pct}%`, background: rem === 0 ? C.success : `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: 2, transition: "width 0.5s ease" }} /></div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {!on && rem > 0 && <button onClick={() => setOn(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS, transition: "all 0.2s" }}>Start</button>}
        {on && <button onClick={() => { setOn(false); clearInterval(ref.current); }} style={{ background: C.surfaceHover, color: C.text, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS }}>Pause</button>}
        {rem === 0 && <div style={{ color: C.success, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>✓ Done</div>}
        <button onClick={() => { setRem(seconds); setOn(false); clearInterval(ref.current); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.textDim, cursor: "pointer", fontFamily: FONTS }}>Reset</button>
      </div>
    </div>
  );
}

// Belt badge component
function BeltBadge({ beltId, size = "md" }) {
  const belt = BELT_LEVELS.find(b => b.id === beltId) || BELT_LEVELS[0];
  const s = size === "sm" ? { h: 24, fs: 9, px: 10 } : size === "lg" ? { h: 36, fs: 12, px: 16 } : { h: 28, fs: 10, px: 12 };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: s.h, padding: `0 ${s.px}px`, borderRadius: 999, background: belt.bg, border: `1px solid ${belt.color}33` }}>
      <div style={{ width: size === "sm" ? 6 : 8, height: size === "sm" ? 6 : 8, borderRadius: "50%", background: belt.color }} />
      <span style={{ fontFamily: DISPLAY, fontSize: s.fs, fontWeight: 600, color: belt.color, letterSpacing: 0.5 }}>{belt.name}</span>
    </div>
  );
}

// Progress ring
function ProgressRing({ percent, size = 64, strokeWidth = 4, color = C.accent }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={strokeWidth} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${(percent/100)*circumference} ${circumference}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 0.8s ease" }} /></svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: size * 0.22, fontWeight: 700, color: C.text }}>{percent}%</div>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const go = async () => { setErr(""); setLoading(true); try { onLogin(await supabase.auth.signIn(email, pw)); } catch (e) { setErr(e.message); } setLoading(false); };
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONTS, transition: "border-color 0.2s" };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Background effects */}
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06), transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.04), transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`, backgroundSize: "24px 24px", opacity: 0.3 }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 16, boxShadow: `0 8px 32px ${C.accentGlow}` }}>🏀</div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.1 }}>Level<span style={{ color: C.accent }}>Up</span>Ball</h1>
          <p style={{ color: C.textDim, fontSize: 14, marginTop: 8, fontWeight: 400 }}>Your basketball training platform</p>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          {err && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: C.danger, fontSize: 13 }}>{err}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="you@email.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="••••••••" />
          </div>
          <button onClick={go} disabled={loading} style={{ width: "100%", background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: DISPLAY, letterSpacing: 0.3, opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: `0 4px 16px ${C.accentGlow}` }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STUDENT: SIDEBAR NAV
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
      {/* Desktop sidebar */}
      <div style={{ width: 240, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }} className="sidebar-desktop">
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏀</div>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.text }}>Level<span style={{ color: C.accent }}>Up</span></span>
          </div>
          <div style={{ background: C.bg, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${belt.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: `1.5px solid ${belt.color}33` }}>
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{profile.full_name.split(" ")[0]}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{belt.name}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {BELT_LEVELS.map((b, i) => (
                <div key={b.id} style={{ flex: 1, height: 3, borderRadius: 2, background: i < belt.level ? belt.color : C.border, transition: "background 0.3s" }} />
              ))}
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: activeTab === t.id ? C.accentGlow : "transparent", color: activeTab === t.id ? C.accent : C.textMuted, fontSize: 13.5, fontWeight: activeTab === t.id ? 600 : 400, cursor: "pointer", fontFamily: FONTS, marginBottom: 2, transition: "all 0.15s", textAlign: "left" }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{t.icon}</span>{t.label}
              {activeTab === t.id && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: C.accent }} />}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 13, cursor: "pointer", fontFamily: FONTS, transition: "all 0.15s" }}>
            <span style={{ fontSize: 14 }}>↩</span> Log Out
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "none", padding: "6px 8px 10px", zIndex: 100 }} className="mobile-nav">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0", border: "none", background: "transparent", color: activeTab === t.id ? C.accent : C.textDim, cursor: "pointer", fontFamily: FONTS, fontSize: 10, fontWeight: activeTab === t.id ? 600 : 400, transition: "color 0.15s" }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ============================================================
// STUDENT: DASHBOARD VIEW (Overview)
// ============================================================
function DashboardView({ profile, workoutsData, completedIds, onGoWorkouts }) {
  const belt = BELT_LEVELS.find(b => b.id === profile.belt_id) || BELT_LEVELS[0];
  const bw = workoutsData || [];
  const today = new Date();
  let total = 0, done = 0;
  bw.forEach(w => (w.cats || []).forEach(c => (c.exercises || []).forEach(e => { total++; if (completedIds.has(e.id)) done++; })));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: C.textDim, fontSize: 14, marginBottom: 4 }}>{greeting}</p>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{profile.full_name.split(" ")[0]} 👊</h1>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {/* Progress card */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: C.accentGlow, filter: "blur(30px)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Progress</p>
              <p style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 800, color: C.text, lineHeight: 1 }}>{pct}<span style={{ fontSize: 18, color: C.textDim }}>%</span></p>
              <p style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{done} of {total} exercises</p>
            </div>
            <ProgressRing percent={pct} size={56} strokeWidth={4} />
          </div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 16 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
        </div>

        {/* Belt card */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Current Belt</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: belt.bg, border: `2px solid ${belt.color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 24, height: 6, borderRadius: 3, background: belt.color }} />
            </div>
            <div>
              <p style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.text }}>{belt.name}</p>
              <p style={{ fontSize: 12, color: C.textDim }}>Level {belt.level} of 5</p>
            </div>
          </div>
        </div>

        {/* Workouts card */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Workouts</p>
          <p style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 800, color: C.text, lineHeight: 1 }}>{bw.length}</p>
          <p style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>assigned for {belt.name}</p>
          <button onClick={onGoWorkouts} style={{ marginTop: 14, background: C.accentGlow, color: C.accent, border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS, transition: "all 0.2s" }}>View Workouts →</button>
        </div>
      </div>

      {/* Quick workout cards */}
      {bw.length > 0 && (
        <div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Continue Training</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {bw.slice(0, 3).map((w, idx) => {
              const ec = (w.cats||[]).reduce((s,c) => s + (c.exercises||[]).length, 0);
              const dc = (w.cats||[]).reduce((s,c) => s + (c.exercises||[]).filter(e => completedIds.has(e.id)).length, 0);
              const wp = ec > 0 ? Math.round((dc/ec)*100) : 0;
              return (
                <div key={w.id} style={{ background: C.surface, borderRadius: 16, padding: "16px 20px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.15s" }} className="fade-in" onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: idx === 0 ? `linear-gradient(135deg, ${C.accent}, #EA580C)` : C.bg, border: idx === 0 ? "none" : `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: idx === 0 ? "#fff" : C.textDim }}>{w.name.replace("Workout ", "").charAt(0)}</div>
                    <div>
                      <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: C.text }}>{w.name}</p>
                      <p style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{(w.cats||[]).length} categories · {ec} exercises</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${wp}%`, background: wp === 100 ? C.success : C.accent, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, color: wp === 100 ? C.success : C.textDim }}>{wp}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STUDENT: WORKOUTS LIST
// ============================================================
function WorkoutsList({ workoutsData, completedIds, onSelect }) {
  const bw = workoutsData || [];
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.5, marginBottom: 24 }}>My Workouts</h1>
      {bw.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 48, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ color: C.textMuted, fontSize: 15, fontWeight: 500 }}>No workouts assigned yet</p>
          <p style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>Your coach will add workouts soon!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {bw.map((w, idx) => {
            const ec = (w.cats||[]).reduce((s,c) => s + (c.exercises||[]).length, 0);
            const dc = (w.cats||[]).reduce((s,c) => s + (c.exercises||[]).filter(e => completedIds.has(e.id)).length, 0);
            const wp = ec > 0 ? Math.round((dc/ec)*100) : 0;
            const suggested = idx === 0;
            return (
              <button key={w.id} onClick={() => onSelect(w)} style={{ background: C.surface, border: suggested ? `1.5px solid ${C.accent}44` : `1px solid ${C.border}`, borderRadius: 18, padding: 20, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", position: "relative", transition: "all 0.2s", fontFamily: FONTS }} className="fade-in" onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                {suggested && <div style={{ position: "absolute", top: -1, right: 16, background: C.accent, borderRadius: "0 0 8px 8px", padding: "3px 12px" }}><span style={{ fontFamily: DISPLAY, fontSize: 9, color: "#fff", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Up Next</span></div>}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: suggested ? `linear-gradient(135deg, ${C.accent}, #EA580C)` : C.bg, border: suggested ? "none" : `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, color: suggested ? "#fff" : C.textDim }}>{w.name.replace("Workout ", "").charAt(0)}</div>
                  <div>
                    <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.text }}>{w.name}</p>
                    <p style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{(w.cats||[]).length} categories · {ec} exercises</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <ProgressRing percent={wp} size={48} strokeWidth={3} color={wp === 100 ? C.success : C.accent} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STUDENT: WORKOUT DETAIL
// ============================================================
function WorkoutView({ workout, onBack, completedIds, onToggle }) {
  const [expanded, setExpanded] = useState(null);
  const totalEx = (workout.cats||[]).reduce((s,c) => s + (c.exercises||[]).length, 0);
  const doneEx = (workout.cats||[]).reduce((s,c) => s + (c.exercises||[]).filter(e => completedIds.has(e.id)).length, 0);
  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", color: C.textMuted, cursor: "pointer", fontFamily: FONTS, fontSize: 13, fontWeight: 500, marginBottom: 20, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{workout.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 100, height: 5, background: C.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${totalEx > 0 ? (doneEx/totalEx)*100 : 0}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: 3, transition: "width 0.5s" }} /></div>
          <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: C.textMuted }}>{doneEx}/{totalEx}</span>
        </div>
      </div>
      {(workout.cats || []).map((cat, ci) => (
        <div key={cat.id} style={{ marginBottom: 28 }} className="fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: C.accent }} />
            <h3 style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: 0.5, textTransform: "uppercase" }}>{cat.name}</h3>
            <span style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>{(cat.exercises||[]).filter(e => completedIds.has(e.id)).length}/{(cat.exercises||[]).length}</span>
          </div>
          {(cat.exercises || []).map(ex => {
            const open = expanded === ex.id, done = completedIds.has(ex.id);
            return (
              <div key={ex.id} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${done ? C.success+"33" : C.border}`, marginBottom: 8, overflow: "hidden", transition: "border-color 0.3s" }}>
                <div onClick={() => setExpanded(open ? null : ex.id)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={e => { e.stopPropagation(); onToggle(ex.id); }} style={{ width: 28, height: 28, borderRadius: 8, border: done ? "none" : `2px solid ${C.borderLight}`, background: done ? C.success : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>{done && "✓"}</button>
                    <div>
                      <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: done ? C.success : C.text, textDecoration: done ? "line-through" : "none", transition: "color 0.2s" }}>{ex.name}</p>
                      <p style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{ex.sets}×{ex.reps} · {ex.rest_seconds}s rest</p>
                    </div>
                  </div>
                  <span style={{ color: C.textDim, fontSize: 14, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                </div>
                {open && (
                  <div style={{ padding: "0 18px 18px" }} className="fade-in">
                    <VideoPlayer url={ex.video_url} />
                    {ex.instructions && (<div style={{ background: C.bg, borderRadius: 12, padding: 16, marginTop: 12, border: `1px solid ${C.border}` }}><p style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Instructions</p><p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>{ex.instructions}</p></div>)}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                      {[["Sets", ex.sets], ["Reps", ex.reps], ["Rest", ex.rest_seconds + "s"]].map(([label, val]) => (<div key={label} style={{ background: C.bg, borderRadius: 12, padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}><p style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, color: C.accent }}>{val}</p><p style={{ fontSize: 10, color: C.textDim, fontWeight: 500, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p></div>))}
                    </div>
                    <RestTimer seconds={ex.rest_seconds} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STUDENT: CHALLENGES
// ============================================================
function StudentChallenges({ token, studentName }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const c = await supabase.from("challenges")._token(token).select("*", "&active=eq.true&limit=1"); if (c.length > 0) setChallenge(c[0]); } catch(e){} setLoading(false); })(); }, [token]);
  if (loading) return <div style={{ textAlign: "center", padding: 40 }}><div style={{ animation: "pulse 1.5s infinite" }}>Loading...</div></div>;
  if (!challenge) return (
    <div className="fade-in" style={{ textAlign: "center", padding: 48 }}><div style={{ width: 72, height: 72, borderRadius: 20, background: C.surface, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16, border: `1px solid ${C.border}` }}>🏆</div><p style={{ color: C.textMuted, fontSize: 15, fontWeight: 500 }}>No active challenge</p><p style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>Check back soon!</p></div>
  );
  const deadlineStr = challenge.deadline ? new Date(challenge.deadline + "T23:59:59").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null;
  const isExpired = challenge.deadline ? new Date(challenge.deadline + "T23:59:59") < new Date() : false;
  const mailSubject = encodeURIComponent("Challenge Submission - " + studentName);
  const mailBody = encodeURIComponent("Hi Coach!\n\nHere is my video for the \"" + challenge.title + "\" challenge.\n\nPlayer: " + studentName + "\n\n[Attach your video]");
  const mailLink = "mailto:" + (challenge.submission_email || SUBMISSION_EMAIL) + "?subject=" + mailSubject + "&body=" + mailBody;
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.5, marginBottom: 24 }}>Weekly Challenge</h1>
      <div style={{ background: `linear-gradient(135deg, ${C.accent}, #EA580C, #DC2626)`, borderRadius: 20, padding: 28, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -30, fontSize: 100, opacity: 0.1 }}>🏆</div>
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>This Week's Challenge</p>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{challenge.title}</h2>
        {deadlineStr && (<div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "5px 14px", marginTop: 12 }}><span style={{ fontSize: 11 }}>⏰</span><span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{isExpired ? "Ended" : `Due ${deadlineStr}`}</span></div>)}
      </div>
      {challenge.description && (<div style={{ background: C.surface, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, marginBottom: 16 }}><p style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Details</p><p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{challenge.description}</p></div>)}
      {challenge.video_url && (<div style={{ marginBottom: 16 }}><p style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Demo Video</p><VideoPlayer url={challenge.video_url} /></div>)}
      {!isExpired && (<a href={mailLink} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${C.success}, #16A34A)`, borderRadius: 14, padding: "16px 24px", textDecoration: "none", transition: "all 0.2s", boxShadow: `0 4px 16px ${C.successGlow}` }}><span style={{ fontSize: 16 }}>📧</span><span style={{ fontFamily: DISPLAY, fontSize: 15, color: "#fff", fontWeight: 700 }}>Submit Your Video</span></a>)}
    </div>
  );
}

// ============================================================
// STUDENT: RESOURCES
// ============================================================
function StudentResources({ token }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { (async () => { try { setArticles(await supabase.from("articles")._token(token).select("*", "&published=eq.true&order=sort_order,created_at.desc")); } catch(e){} setLoading(false); })(); }, [token]);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.textDim }}>Loading...</div>;
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.5, marginBottom: 24 }}>Resources</h1>
      {articles.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 48, border: `1px solid ${C.border}`, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📖</div><p style={{ color: C.textMuted, fontSize: 15 }}>No resources yet</p></div>
      ) : articles.map(a => (
        <div key={a.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 10, overflow: "hidden", transition: "all 0.15s" }}>
          <div onClick={() => setExpanded(expanded === a.id ? null : a.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📖</div>
              <div><p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: C.text }}>{a.title}</p><p style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString()}</p></div>
            </div>
            <span style={{ color: C.textDim, fontSize: 14, transform: expanded === a.id ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
          </div>
          {expanded === a.id && (<div style={{ padding: "0 20px 20px" }} className="fade-in"><div style={{ background: C.bg, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{a.content}</div></div>)}
        </div>
      ))}
    </div>
  );
}
// Admin uses legacy font constant
const F = DISPLAY;

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
          <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: "#fff", letterSpacing: 1 }}>ADD FROM LIBRARY</h3>
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
              <p style={{ fontFamily: DISPLAY, fontSize: 11, color: "#FF6D00", letterSpacing: 2, marginBottom: 8 }}>{category.toUpperCase()}</p>
              {exercises.map(ex => (
                <div key={ex.id} style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px", marginBottom: 6, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", fontWeight: 500 }}>{ex.name}</p>
                    <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ex.default_sets}×{ex.default_reps} · {ex.default_rest_seconds}s rest</p>
                  </div>
                  <button onClick={() => onAdd(ex)} style={{ background: "#FF6D00", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+ ADD</button>
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
  const [artForm, setArtForm] = useState({ title: "", content: "", published: true });
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
  const addWorkout = async () => { setSaving(true); try { await supabase.from("workouts")._token(token).insert({ belt_id: belt, name: `Workout ${String.fromCharCode(65 + workouts.length)}`, sort_order: workouts.length }); await loadWorkouts(); flash("Workout added!"); } catch (e) { flash("Error: " + e.message); } setSaving(false); };
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
  const saveArticle = async () => { if(!artForm.title){ flash("Title required."); return; } setSaving(true); try { if(artEditing){ await supabase.from("articles")._token(token).update(artForm, { id: artEditing.id }); } else { await supabase.from("articles")._token(token).insert({ ...artForm, sort_order: articles.length }); } setArtEditing(null); setArtNew(false); setArtForm({ title: "", content: "", published: true }); await loadArticles(); flash("Saved!"); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const deleteArticle = async (id) => { setSaving(true); try { await supabase.from("articles")._token(token).delete({ id }); await loadArticles(); flash("Removed."); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const startEditArt = (a) => { setArtEditing(a); setArtNew(false); setArtForm({ title: a.title, content: a.content, published: a.published }); };
  const startNewArt = () => { setArtNew(true); setArtEditing(null); setArtForm({ title: "", content: "", published: true }); };

  // Challenges CRUD
  const saveChallenge = async () => { if(!chalForm.title){ flash("Title required."); return; } setSaving(true); try { if(chalForm.active){ try { await supabase.from("challenges")._token(token).update({ active: false }, { active: true }); } catch(e){} } if(chalEditing){ await supabase.from("challenges")._token(token).update(chalForm, { id: chalEditing.id }); } else { await supabase.from("challenges")._token(token).insert(chalForm); } setChalEditing(null); setChalNew(false); setChalForm({ title: "", description: "", video_url: "", submission_email: SUBMISSION_EMAIL, deadline: "", active: false }); await loadChallenges(); flash("Saved!"); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const deleteChallenge = async (id) => { setSaving(true); try { await supabase.from("challenges")._token(token).delete({ id }); await loadChallenges(); flash("Removed."); } catch(e){ flash("Error: "+e.message); } setSaving(false); };
  const startEditChal = (c) => { setChalEditing(c); setChalNew(false); setChalForm({ title: c.title, description: c.description||"", video_url: c.video_url||"", submission_email: c.submission_email||SUBMISSION_EMAIL, deadline: c.deadline||"", active: c.active }); };
  const startNewChal = () => { setChalNew(true); setChalEditing(null); setChalForm({ title: "", description: "", video_url: "", submission_email: SUBMISSION_EMAIL, deadline: "", active: false }); };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      {msg && <div style={{ position: "fixed", top: 70, right: 20, background: msg.startsWith("Error") ? "#ff4444" : "#00C853", color: "#fff", padding: "10px 20px", borderRadius: 8, fontFamily: DISPLAY, fontSize: 13, letterSpacing: 1, zIndex: 200 }}>{msg}</div>}
      {saving && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#FF6D00", color: "#fff", padding: "6px 16px", borderRadius: 6, fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, zIndex: 200 }}>SAVING...</div>}
      {showLibSearch && <LibrarySearch token={token} onAdd={addExerciseFromLibrary} onClose={() => setShowLibSearch(null)} />}

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #222" }}>
        {["workouts", "library", "articles", "challenges", "students"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid #FF6D00" : "2px solid transparent", padding: "12px 20px", color: tab === t ? "#FF6D00" : "#666", fontFamily: DISPLAY, fontSize: 13, letterSpacing: 2, cursor: "pointer", fontWeight: 600 }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* ========== WORKOUTS TAB ========== */}
      {tab === "workouts" && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {BELT_LEVELS.map(b => (
            <button key={b.id} onClick={() => { setBelt(b.id); setEditing(null); }} style={{ background: belt === b.id ? b.color : "#141414", color: belt === b.id ? b.tc : "#888", border: belt === b.id ? "none" : "1px solid #333", borderRadius: 8, padding: "7px 16px", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>{b.name.toUpperCase()}</button>
          ))}
        </div>
        {loading ? <LoadingScreen message="Loading workouts..." /> : !editing ? <>
          {workouts.map(w => {
            const ec = (w.cats || []).reduce((s, c) => s + (c.exercises || []).length, 0);
            return (
              <div key={w.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 16, color: "#fff", fontWeight: 600 }}>{w.name}</p>
                  <p style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{(w.cats || []).length} categories · {ec} exercises</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditing(w)} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>EDIT</button>
                  <button onClick={() => deleteWorkout(w.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "7px 12px", color: "#ff4444", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            );
          })}
          <button onClick={addWorkout} disabled={saving} style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: 12, padding: 18, width: "100%", color: "#FF6D00", fontFamily: DISPLAY, fontSize: 13, letterSpacing: 1, cursor: "pointer", fontWeight: 600, marginTop: 6 }}>+ ADD WORKOUT</button>
        </> : <>
          <button onClick={() => { setEditing(null); loadWorkouts(); }} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "7px 14px", color: "#fff", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", marginBottom: 18 }}>← BACK TO LIST</button>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#666", fontSize: 10, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 5 }}>WORKOUT NAME</label>
            <input defaultValue={editing.name} onBlur={e => saveWorkoutName(editing.id, e.target.value)} onChange={e => debouncedSave(`wname-${editing.id}`, () => saveWorkoutName(editing.id, e.target.value))} style={inp} />
          </div>
          {(editing.cats || []).map(cat => (
            <div key={cat.id} style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <input defaultValue={cat.name} onBlur={e => saveCategoryName(cat.id, e.target.value)} onChange={e => debouncedSave(`cname-${cat.id}`, () => saveCategoryName(cat.id, e.target.value))} style={{ ...inp, maxWidth: 280, fontFamily: DISPLAY, fontSize: 15, fontWeight: 600 }} />
                <button onClick={() => deleteCategory(cat.id, editing.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 10px", color: "#ff4444", fontSize: 10, fontFamily: DISPLAY, cursor: "pointer", letterSpacing: 1 }}>REMOVE</button>
              </div>
              {(cat.exercises || []).map(ex => (
                <div key={ex.id} style={{ background: "#0a0a0a", borderRadius: 10, padding: 14, marginBottom: 8, border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <input defaultValue={ex.name} onBlur={e => saveExercise(ex.id, "name", e.target.value)} onChange={e => debouncedSave(`ename-${ex.id}`, () => saveExercise(ex.id, "name", e.target.value))} style={{ ...inp, fontWeight: 600 }} placeholder="Exercise name" />
                    <button onClick={() => deleteExercise(ex.id, editing.id)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: 15, marginLeft: 10, flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>VIDEO URL (YouTube / Vimeo)</label>
                    <input defaultValue={ex.video_url} onBlur={e => saveExercise(ex.id, "video_url", e.target.value)} onChange={e => debouncedSave(`evid-${ex.id}`, () => saveExercise(ex.id, "video_url", e.target.value))} style={inp} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {[["SETS", "sets"], ["REPS", "reps"], ["REST (sec)", "rest_seconds"]].map(([l, k]) => (
                      <div key={k}>
                        <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>{l}</label>
                        <input type="number" min={k === "rest_seconds" ? 0 : 1} defaultValue={ex[k]} onBlur={e => saveExercise(ex.id, k, parseInt(e.target.value) || 0)} onChange={e => debouncedSave(`e${k}-${ex.id}`, () => saveExercise(ex.id, k, parseInt(e.target.value) || 0))} style={sinp} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>INSTRUCTIONS</label>
                    <textarea defaultValue={ex.instructions} onBlur={e => saveExercise(ex.id, "instructions", e.target.value)} onChange={e => debouncedSave(`einst-${ex.id}`, () => saveExercise(ex.id, "instructions", e.target.value))} style={{ ...inp, minHeight: 50, resize: "vertical" }} placeholder="Simple instructions..." />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowLibSearch({ catId: cat.id, workoutId: editing.id })} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: 9, flex: 1, color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>📚 ADD FROM LIBRARY</button>
                <button onClick={() => addExercise(cat.id, editing.id)} disabled={saving} style={{ background: "none", border: "1px dashed #333", borderRadius: 8, padding: 9, flex: 1, color: "#666", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>+ ADD CUSTOM</button>
              </div>
            </div>
          ))}
          <button onClick={() => addCategory(editing.id)} disabled={saving} style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: 12, padding: 14, width: "100%", color: "#FF6D00", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ ADD CATEGORY</button>
        </>}
      </>}

      {/* ========== LIBRARY TAB ========== */}
      {tab === "library" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>EXERCISE LIBRARY</h2>
          <button onClick={startNewLib} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW EXERCISE</button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 18 }}>
          <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search exercises..." style={{ ...inp, maxWidth: 400 }} />
        </div>

        {/* Add/Edit Form */}
        {(libNew || libEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{libEditing ? "EDIT EXERCISE" : "NEW EXERCISE"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>NAME *</label>
                <input value={libForm.name} onChange={e => setLibForm({ ...libForm, name: e.target.value })} style={inp} placeholder="e.g. Crossover Dribble" />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>CATEGORY *</label>
                <input value={libForm.category} onChange={e => setLibForm({ ...libForm, category: e.target.value })} style={inp} placeholder="e.g. Ball Handling" list="cat-suggestions" />
                <datalist id="cat-suggestions">
                  {existingCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>VIDEO URL</label>
              <input value={libForm.video_url} onChange={e => setLibForm({ ...libForm, video_url: e.target.value })} style={inp} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DEFAULT SETS</label>
                <input type="number" min="1" value={libForm.default_sets} onChange={e => setLibForm({ ...libForm, default_sets: parseInt(e.target.value) || 1 })} style={sinp} />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DEFAULT REPS</label>
                <input type="number" min="1" value={libForm.default_reps} onChange={e => setLibForm({ ...libForm, default_reps: parseInt(e.target.value) || 1 })} style={sinp} />
              </div>
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DEFAULT REST (sec)</label>
                <input type="number" min="0" value={libForm.default_rest_seconds} onChange={e => setLibForm({ ...libForm, default_rest_seconds: parseInt(e.target.value) || 0 })} style={sinp} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>INSTRUCTIONS</label>
              <textarea value={libForm.instructions} onChange={e => setLibForm({ ...libForm, instructions: e.target.value })} style={{ ...inp, minHeight: 50, resize: "vertical" }} placeholder="How to perform this exercise..." />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={saveLibItem} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button>
              <button onClick={() => { setLibEditing(null); setLibNew(false); }} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button>
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
              <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "#FF6D00", letterSpacing: 2, fontWeight: 600 }}>{category.toUpperCase()}</p>
              <span style={{ fontSize: 11, color: "#555" }}>{exercises.length}</span>
            </div>
            {exercises.map(ex => (
              <div key={ex.id} style={{ background: "#141414", borderRadius: 10, padding: "14px 16px", marginBottom: 6, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", fontWeight: 500 }}>{ex.name}</p>
                  <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ex.default_sets}×{ex.default_reps} · {ex.default_rest_seconds}s rest {ex.video_url ? "· 🎬" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => startEditLib(ex)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button>
                  <button onClick={() => deleteLibItem(ex.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </>}


      {/* ===== ARTICLES ===== */}
      {tab === "articles" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ fontFamily: DISPLAY, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>RESOURCES / ARTICLES</h2><button onClick={startNewArt} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW ARTICLE</button></div>
        {(artNew||artEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{artEditing ? "EDIT" : "NEW"} ARTICLE</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>TITLE *</label><input value={artForm.title} onChange={e=>setArtForm({...artForm,title:e.target.value})} style={inp} placeholder="Article title..." /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>CONTENT</label><textarea value={artForm.content} onChange={e=>setArtForm({...artForm,content:e.target.value})} style={{ ...inp, minHeight: 200, resize: "vertical" }} placeholder="Write your article here..." /></div>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}><label style={{ color: "#555", fontSize: 11, fontFamily: DISPLAY, letterSpacing: 1 }}>PUBLISHED</label><input type="checkbox" checked={artForm.published} onChange={e=>setArtForm({...artForm,published:e.target.checked})} style={{ width: 18, height: 18, cursor: "pointer" }} /></div>
            <div style={{ display: "flex", gap: 6 }}><button onClick={saveArticle} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button><button onClick={()=>{setArtEditing(null);setArtNew(false);}} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button></div>
          </div>
        )}
        {articles.length===0 ? (<div style={{ textAlign: "center", padding: 40, color: "#555" }}><p style={{ fontSize: 36, marginBottom: 10 }}>📖</p><p>No articles yet.</p></div>) : articles.map(a=>(<div key={a.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div><p style={{ fontFamily: DISPLAY, fontSize: 15, color: "#fff", fontWeight: 600 }}>{a.title}</p><p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{a.published ? "Published" : "Draft"} · {new Date(a.created_at).toLocaleDateString()}</p></div><div style={{ display: "flex", gap: 6 }}><button onClick={()=>startEditArt(a)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button><button onClick={()=>deleteArticle(a.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DEL</button></div></div>))}
      </>}

      {/* ===== CHALLENGES ===== */}
      {tab === "challenges" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ fontFamily: DISPLAY, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>WEEKLY CHALLENGES</h2><button onClick={startNewChal} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ NEW CHALLENGE</button></div>
        {(chalNew||chalEditing) && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 20 }}>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>{chalEditing ? "EDIT" : "NEW"} CHALLENGE</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>TITLE *</label><input value={chalForm.title} onChange={e=>setChalForm({...chalForm,title:e.target.value})} style={inp} placeholder="e.g. 50 Made Free Throws" /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DESCRIPTION</label><textarea value={chalForm.description} onChange={e=>setChalForm({...chalForm,description:e.target.value})} style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="Explain the challenge..." /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DEMO VIDEO URL</label><input value={chalForm.video_url} onChange={e=>setChalForm({...chalForm,video_url:e.target.value})} style={inp} placeholder="https://youtube.com/..." /></div><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>DEADLINE</label><input type="date" value={chalForm.deadline} onChange={e=>setChalForm({...chalForm,deadline:e.target.value})} style={inp} /></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}><div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>SUBMISSION EMAIL</label><input value={chalForm.submission_email} onChange={e=>setChalForm({...chalForm,submission_email:e.target.value})} style={inp} /></div><div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 18 }}><label style={{ color: "#555", fontSize: 11, fontFamily: DISPLAY, letterSpacing: 1 }}>ACTIVE</label><input type="checkbox" checked={chalForm.active} onChange={e=>setChalForm({...chalForm,active:e.target.checked})} style={{ width: 18, height: 18, cursor: "pointer" }} /><span style={{ fontSize: 10, color: "#FF6D00" }}>{chalForm.active ? "Students see this" : "Hidden"}</span></div></div>
            <div style={{ display: "flex", gap: 6 }}><button onClick={saveChallenge} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button><button onClick={()=>{setChalEditing(null);setChalNew(false);}} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button></div>
          </div>
        )}
        {challenges.length===0 ? (<div style={{ textAlign: "center", padding: 40, color: "#555" }}><p style={{ fontSize: 36, marginBottom: 10 }}>🏆</p><p>No challenges yet.</p></div>) : challenges.map(c=>(<div key={c.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: c.active ? "2px solid #FF6D00" : "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><p style={{ fontFamily: DISPLAY, fontSize: 15, color: "#fff", fontWeight: 600 }}>{c.title}</p>{c.active && <span style={{ background: "#FF6D00", color: "#fff", fontFamily: DISPLAY, fontSize: 9, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>ACTIVE</span>}</div><p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.deadline ? "Due " + new Date(c.deadline+"T12:00:00").toLocaleDateString() : "No deadline"}</p></div><div style={{ display: "flex", gap: 6 }}><button onClick={()=>startEditChal(c)} style={{ background: "#222", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>EDIT</button><button onClick={()=>deleteChallenge(c.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "5px 12px", color: "#ff4444", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>DEL</button></div></div>))}
      </>}

      {/* ========== STUDENTS TAB ========== */}
      {tab === "students" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 20, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>MANAGE STUDENTS</h2>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#FF6D00", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ ADD STUDENT</button>
        </div>
        {showAdd && (
          <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222", marginBottom: 18 }}>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 1 }}>NEW STUDENT</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["NAME", "name", "Player name"], ["EMAIL", "email", "email@example.com"], ["PASSWORD", "password", "Temp password"]].map(([l, k, ph]) => (
                <div key={k}><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>{l}</label><input value={ns[k]} onChange={e => setNs({ ...ns, [k]: e.target.value })} style={inp} placeholder={ph} /></div>
              ))}
              <div><label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: DISPLAY, letterSpacing: 1, marginBottom: 3 }}>STARTING BELT</label><select value={ns.beltId} onChange={e => setNs({ ...ns, beltId: e.target.value })} style={{ ...inp, cursor: "pointer" }}>{BELT_LEVELS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addStudent} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>SAVE</button>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "9px 18px", color: "#888", fontFamily: DISPLAY, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>CANCEL</button>
            </div>
          </div>
        )}
        {students.map(s => {
          const sb = BELT_LEVELS.find(b => b.id === s.belt_id);
          return (
            <div key={s.id} style={{ background: "#141414", borderRadius: 12, padding: 18, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sb.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `2px solid ${sb.color}` }}>🏀</div>
                <div><p style={{ fontFamily: DISPLAY, fontSize: 15, color: "#fff", fontWeight: 600 }}>{s.full_name}</p><p style={{ fontSize: 11, color: "#555" }}>{s.email}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${sb.color}18`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${sb.color}33` }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sb.color }} />
                  <span style={{ fontFamily: DISPLAY, fontSize: 10, color: sb.color, letterSpacing: 1 }}>{sb.name.toUpperCase()}</span>
                </div>
                {s.belt_id !== "black" && <button onClick={() => promoteStudent(s)} disabled={saving} style={{ background: "#00C853", border: "none", borderRadius: 8, padding: "5px 12px", color: "#fff", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>PROMOTE ↑</button>}
                <button onClick={() => deleteStudent(s.id)} disabled={saving} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "5px 12px", color: "#ff4444", fontFamily: DISPLAY, fontSize: 10, letterSpacing: 1, cursor: "pointer" }}>REMOVE</button>
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
// STUDENT LAYOUT (with sidebar)
// ============================================================
function StudentLayout({ profile, token, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [workoutsData, setWorkoutsData] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
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
      } catch (e) { console.error(e); }
      setLoaded(true);
    })();
  }, [token, profile]);

  const toggleComplete = async (exerciseId) => {
    const newSet = new Set(completedIds);
    if (newSet.has(exerciseId)) { newSet.delete(exerciseId); setCompletedIds(newSet); try { await supabase.from("completed_exercises")._token(token).delete({ student_id: profile.id, exercise_id: exerciseId }); } catch(e){} }
    else { newSet.add(exerciseId); setCompletedIds(newSet); try { await supabase.from("completed_exercises")._token(token).insert({ student_id: profile.id, exercise_id: exerciseId }); } catch(e){} }
  };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🏀</div><p style={{ color: C.textDim, fontSize: 14 }}>Loading...</p></div></div>;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .sidebar-desktop { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar activeTab={activeWorkout ? "workouts" : activeTab} setActiveTab={(t) => { setActiveTab(t); setActiveWorkout(null); }} profile={profile} onLogout={onLogout} />
        <main className="main-content" style={{ flex: 1, padding: "32px 32px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
          {activeWorkout ? (
            <WorkoutView workout={activeWorkout} onBack={() => setActiveWorkout(null)} completedIds={completedIds} onToggle={toggleComplete} />
          ) : activeTab === "dashboard" ? (
            <DashboardView profile={profile} workoutsData={workoutsData} completedIds={completedIds} onGoWorkouts={() => setActiveTab("workouts")} />
          ) : activeTab === "workouts" ? (
            <WorkoutsList workoutsData={workoutsData} completedIds={completedIds} onSelect={setActiveWorkout} />
          ) : activeTab === "challenges" ? (
            <StudentChallenges token={token} studentName={profile.full_name} />
          ) : activeTab === "resources" ? (
            <StudentResources token={token} />
          ) : null}
        </main>
      </div>
    </>
  );
}

// ============================================================
// ADMIN HEADER (for admin view)
// ============================================================
function AdminHeader({ onLogout }) {
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
        <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.text }}>Level<span style={{ color: C.accent }}>Up</span></span>
        <span style={{ background: C.accent, color: "#fff", fontFamily: DISPLAY, fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 600, letterSpacing: 1 }}>ADMIN</span>
      </div>
      <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: FONTS, fontWeight: 500 }}>Log Out</button>
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

  if (loading) return <><style>{GLOBAL_CSS}</style><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48, animation: "pulse 1.5s infinite" }}>🏀</div><p style={{ color: C.textDim, fontSize: 14, marginTop: 12 }}>Loading...</p></div></div></>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{GLOBAL_CSS}</style>
      {!session && <Login onLogin={handleLogin} />}
      {session && profile?.role === "admin" && <><AdminHeader onLogout={logout} /><Admin token={session.access_token} /></>}
      {session && profile?.role === "student" && <StudentLayout profile={profile} token={session.access_token} onLogout={logout} />}
    </div>
  );
}

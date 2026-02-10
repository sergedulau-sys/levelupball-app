import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL = "https://wvbzifqbugjusthwlfzl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2YnppZnFidWdqdXN0aHdsZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTkxMTAsImV4cCI6MjA4NjMzNTExMH0._p8Firq7U6oiHsvvSwNxZT2WJ0MNMQEOze_mjt4xE7w";

// Simple Supabase client
const supabase = {
  headers: (token) => ({
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }),
  auth: {
    async signIn(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || "Login failed"); }
      return res.json();
    },
    async signUp(email, password, metadata = {}) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: metadata }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || "Signup failed"); }
      return res.json();
    },
  },
  from: (table) => ({
    token: null,
    _token(t) { this.token = t; return this; },
    async select(columns = "*", params = "") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${params}`, {
        headers: supabase.headers(this.token),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async insert(data) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: supabase.headers(this.token),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async update(data, match) {
      const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        method: "PATCH",
        headers: supabase.headers(this.token),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async delete(match) {
      const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        method: "DELETE",
        headers: supabase.headers(this.token),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async upsert(data) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...supabase.headers(this.token), "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  }),
};

// ============================================================
// CONSTANTS & UTILS
// ============================================================
const BELT_LEVELS = [
  { id: "white", name: "White Belt", color: "#E0E0E0", accent: "#9E9E9E", tc: "#333" },
  { id: "yellow", name: "Yellow Belt", color: "#FFD600", accent: "#F9A825", tc: "#333" },
  { id: "orange", name: "Orange Belt", color: "#FF6D00", accent: "#E65100", tc: "#fff" },
  { id: "green", name: "Green Belt", color: "#00C853", accent: "#1B5E20", tc: "#fff" },
  { id: "black", name: "Black Belt", color: "#212121", accent: "#000", tc: "#fff" },
];

const F = "'Oswald', sans-serif";
const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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

// ============================================================
// SHARED COMPONENTS
// ============================================================
function RestTimer({ seconds }) {
  const [rem, setRem] = useState(seconds);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setRem(seconds); setOn(false); if (ref.current) clearInterval(ref.current); }, [seconds]);
  useEffect(() => {
    if (on && rem > 0) {
      ref.current = setInterval(() => setRem(r => { if (r <= 1) { clearInterval(ref.current); setOn(false); return 0; } return r - 1; }), 1000);
    }
    return () => clearInterval(ref.current);
  }, [on, rem]);
  const pct = ((seconds - rem) / seconds) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "12px 16px", background: "#0d0d0d", borderRadius: 10, border: "1px solid #1a1a1a" }}>
      <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#2a2a2a" strokeWidth="3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke={rem === 0 ? "#00C853" : "#FF6D00"} strokeWidth="3" strokeDasharray={`${(pct / 100) * 125.6} 125.6`} strokeLinecap="round" transform="rotate(-90 24 24)" style={{ transition: "stroke-dasharray 0.3s" }} />
        </svg>
        <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: F }}>{fmtTime(rem)}</span>
      </div>
      <div style={{ fontFamily: F, fontSize: 12, color: "#888", letterSpacing: 1 }}>REST TIMER</div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {!on && rem > 0 && <button onClick={() => setOn(true)} style={{ background: "#FF6D00", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, letterSpacing: 1 }}>START</button>}
        {on && <button onClick={() => { setOn(false); clearInterval(ref.current); }} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, letterSpacing: 1 }}>PAUSE</button>}
        {rem === 0 && <span style={{ color: "#00C853", fontWeight: 700, fontSize: 12, fontFamily: F, letterSpacing: 1 }}>DONE ✓</span>}
        <button onClick={() => { setRem(seconds); setOn(false); clearInterval(ref.current); }} style={{ background: "none", border: "1px solid #333", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#666", cursor: "pointer", fontFamily: F }}>RESET</button>
      </div>
    </div>
  );
}

function VideoPlayer({ url }) {
  const eu = embedUrl(url);
  if (!eu) return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a1a1a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14, border: "1px dashed #333" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div><div>No video added yet</div></div>
    </div>
  );
  return <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden", background: "#000" }}><iframe src={eu} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}

function Header({ admin, belt, onLogout, userName }) {
  return (
    <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🏀</span>
        <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>LEVEL<span style={{ color: "#FF6D00" }}>UP</span>BALL</span>
        {admin && <span style={{ background: "#FF6D00", color: "#fff", fontFamily: F, fontSize: 9, padding: "2px 8px", borderRadius: 4, letterSpacing: 2, marginLeft: 4 }}>ADMIN</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {belt && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a1a1a", padding: "5px 12px", borderRadius: 20, border: `1px solid ${belt.color}33` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: belt.color }} />
            <span style={{ fontFamily: F, fontSize: 11, color: belt.color, letterSpacing: 1 }}>{belt.name.toUpperCase()}</span>
          </div>
        )}
        <button onClick={onLogout} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "5px 12px", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: F, letterSpacing: 1 }}>LOG OUT</button>
      </div>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite" }}>🏀</div>
        <p style={{ color: "#888", fontFamily: F, fontSize: 14, letterSpacing: 1 }}>{message || "LOADING..."}</p>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await supabase.auth.signIn(email, pw);
      onLogin(data);
    } catch (e) {
      setErr(e.message || "Login failed. Check your email and password.");
    }
    setLoading(false);
  };

  const inp = { width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0a0a0a, #1a1a1a, #0d0d0d)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,109,0,0.08), transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -150, left: -50, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,0,0.05), transparent 70%)" }} />
      </div>
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏀</div>
          <h1 style={{ fontFamily: F, fontSize: 40, fontWeight: 700, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>LEVEL<span style={{ color: "#FF6D00" }}>UP</span>BALL</h1>
          <p style={{ color: "#666", fontSize: 13, marginTop: 8, letterSpacing: 2, fontFamily: F }}>TRAINING PLATFORM</p>
        </div>
        <div style={{ background: "#141414", borderRadius: 16, padding: 28, border: "1px solid #222" }}>
          <h2 style={{ fontFamily: F, fontSize: 18, color: "#fff", marginBottom: 20, letterSpacing: 1 }}>SIGN IN</h2>
          {err && <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "#ff4444", fontSize: 13 }}>{err}</div>}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#888", fontSize: 11, marginBottom: 5, fontFamily: F, letterSpacing: 1 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="you@email.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#888", fontSize: 11, marginBottom: 5, fontFamily: F, letterSpacing: 1 }}>PASSWORD</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={inp} placeholder="••••••••" />
          </div>
          <button onClick={go} disabled={loading} style={{ width: "100%", background: loading ? "#555" : "linear-gradient(135deg, #FF6D00, #FF8F00)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: F, letterSpacing: 2, opacity: loading ? 0.7 : 1 }}>
            {loading ? "SIGNING IN..." : "LOG IN"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WORKOUT VIEW (Player)
// ============================================================
function WorkoutView({ workout, onBack, completedIds, onToggle, token }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <button onClick={onBack} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontFamily: F, fontSize: 13, letterSpacing: 1, marginBottom: 20 }}>← BACK</button>
      <h2 style={{ fontFamily: F, fontSize: 26, color: "#fff", fontWeight: 700, letterSpacing: 1, marginBottom: 24 }}>{workout.name}</h2>
      {(workout.cats || []).map(cat => (
        <div key={cat.id} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: "#FF6D00" }} />
            <h3 style={{ fontFamily: F, fontSize: 16, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>{cat.name.toUpperCase()}</h3>
            <span style={{ fontSize: 12, color: "#555" }}>{(cat.exercises || []).filter(e => completedIds.has(e.id)).length}/{(cat.exercises || []).length}</span>
          </div>
          {(cat.exercises || []).map(ex => {
            const open = expanded === ex.id;
            const done = completedIds.has(ex.id);
            return (
              <div key={ex.id} style={{ background: "#141414", borderRadius: 12, border: done ? "1px solid #00C85344" : "1px solid #222", marginBottom: 8, overflow: "hidden" }}>
                <div onClick={() => setExpanded(open ? null : ex.id)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={e => { e.stopPropagation(); onToggle(ex.id); }} style={{ width: 26, height: 26, borderRadius: 7, border: done ? "none" : "2px solid #333", background: done ? "#00C853" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 13, fontWeight: 700 }}>
                      {done && "✓"}
                    </button>
                    <div>
                      <p style={{ fontFamily: F, fontSize: 14, color: done ? "#00C853" : "#fff", fontWeight: 500, letterSpacing: 0.5, textDecoration: done ? "line-through" : "none" }}>{ex.name}</p>
                      <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ex.sets} sets × {ex.reps} reps · {ex.rest_seconds}s rest</p>
                    </div>
                  </div>
                  <span style={{ color: "#444", fontSize: 16, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                </div>
                {open && (
                  <div style={{ padding: "0 18px 18px" }}>
                    <VideoPlayer url={ex.video_url} />
                    {ex.instructions && (
                      <div style={{ background: "#0a0a0a", borderRadius: 10, padding: 14, marginTop: 12, border: "1px solid #1a1a1a" }}>
                        <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 4 }}>INSTRUCTIONS</p>
                        <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.6 }}>{ex.instructions}</p>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                      {[["SETS", ex.sets], ["REPS", ex.reps], ["REST", ex.rest_seconds + "s"]].map(([label, val]) => (
                        <div key={label} style={{ background: "#0a0a0a", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid #1a1a1a" }}>
                          <p style={{ fontFamily: F, fontSize: 22, color: "#FF6D00", fontWeight: 700 }}>{val}</p>
                          <p style={{ fontSize: 9, color: "#555", fontFamily: F, letterSpacing: 1 }}>{label}</p>
                        </div>
                      ))}
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
// PLAYER DASHBOARD
// ============================================================
function Dashboard({ profile, workoutsData, onSelect, onLogout, completedIds, token }) {
  const belt = BELT_LEVELS.find(b => b.id === profile.belt_id);
  const bw = workoutsData || [];
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let total = 0, done = 0;
  bw.forEach(w => (w.cats || []).forEach(c => (c.exercises || []).forEach(e => { total++; if (completedIds.has(e.id)) done++; })));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const suggested = bw.length > 0 ? Math.floor((today.getTime() / (7 * 24 * 60 * 60 * 1000))) % bw.length : 0;

  const sow = new Date(today); sow.setDate(today.getDate() - today.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(sow); d.setDate(sow.getDate() + i); return d; });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: F, fontSize: 28, color: "#fff", fontWeight: 700, letterSpacing: 1 }}>What's up, {profile.full_name.split(" ")[0]}! 👊</h1>
        <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{dayNames[today.getDay()]} — Let's get to work.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222" }}>
          <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 10 }}>CURRENT BELT</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${belt.color}22`, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${belt.color}` }}>
              <div style={{ width: 18, height: 5, borderRadius: 3, background: belt.color }} />
            </div>
            <div>
              <p style={{ fontFamily: F, fontSize: 18, color: "#fff", fontWeight: 600 }}>{belt.name}</p>
              <p style={{ fontSize: 11, color: "#555" }}>Level {BELT_LEVELS.indexOf(belt) + 1} of 5</p>
            </div>
          </div>
        </div>
        <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222" }}>
          <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 10 }}>PROGRESS</p>
          <p style={{ fontFamily: F, fontSize: 28, color: "#FF6D00", fontWeight: 700 }}>{pct}%</p>
          <div style={{ width: "100%", height: 5, background: "#222", borderRadius: 3, marginTop: 6 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FF6D00, #FFD600)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <p style={{ fontSize: 11, color: "#555", marginTop: 5 }}>{done}/{total} exercises done</p>
        </div>
        <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222" }}>
          <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 10 }}>WORKOUTS</p>
          <p style={{ fontFamily: F, fontSize: 28, color: "#fff", fontWeight: 700 }}>{bw.length}</p>
          <p style={{ fontSize: 11, color: "#555", marginTop: 5 }}>for {belt.name}</p>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: "#141414", borderRadius: 14, padding: 18, border: "1px solid #222", marginBottom: 28 }}>
        <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 14 }}>THIS WEEK</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {week.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            const isPast = d < today && !isToday;
            const wi = bw.length > 0 ? i % bw.length : -1;
            return (
              <div key={i} style={{ textAlign: "center", padding: "10px 2px", borderRadius: 10, background: isToday ? "linear-gradient(135deg, #FF6D00, #FF8F00)" : "#0a0a0a", border: isToday ? "none" : "1px solid #1a1a1a", opacity: isPast ? 0.35 : 1 }}>
                <p style={{ fontFamily: F, fontSize: 10, color: isToday ? "#fff" : "#555", letterSpacing: 1 }}>{["SU", "MO", "TU", "WE", "TH", "FR", "SA"][i]}</p>
                <p style={{ fontFamily: F, fontSize: 16, color: isToday ? "#fff" : "#888", fontWeight: 600, margin: "3px 0" }}>{d.getDate()}</p>
                {i > 0 && i < 6 && wi >= 0 && <p style={{ fontSize: 8, color: isToday ? "rgba(255,255,255,0.8)" : "#444", fontFamily: F }}>{bw[wi]?.name?.replace("Workout ", "")}</p>}
                {(i === 0 || i === 6) && <p style={{ fontSize: 8, color: "#333", fontFamily: F }}>REST</p>}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontFamily: F, fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 14 }}>YOUR WORKOUTS</p>
      {bw.length === 0 ? (
        <div style={{ background: "#141414", borderRadius: 14, padding: 36, border: "1px solid #222", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ color: "#555", fontSize: 14 }}>No workouts assigned yet for {belt.name}.</p>
          <p style={{ color: "#444", fontSize: 12, marginTop: 4 }}>Your coach will add workouts soon!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {bw.map((w, idx) => {
            const ec = (w.cats || []).reduce((s, c) => s + (c.exercises || []).length, 0);
            const dc = (w.cats || []).reduce((s, c) => s + (c.exercises || []).filter(e => completedIds.has(e.id)).length, 0);
            const sug = idx === suggested;
            return (
              <button key={w.id} onClick={() => onSelect(w)} style={{ background: "#141414", border: sug ? "2px solid #FF6D00" : "1px solid #222", borderRadius: 14, padding: 18, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", width: "100%" }}>
                {sug && <div style={{ position: "absolute", top: 8, right: 12, background: "#FF6D00", borderRadius: 5, padding: "2px 8px" }}><span style={{ fontFamily: F, fontSize: 9, color: "#fff", letterSpacing: 1 }}>TODAY</span></div>}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: sug ? "linear-gradient(135deg, #FF6D00, #FF8F00)" : "#222", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 18, fontWeight: 700, color: sug ? "#fff" : "#666" }}>
                    {w.name.replace("Workout ", "")}
                  </div>
                  <div>
                    <p style={{ fontFamily: F, fontSize: 16, color: "#fff", fontWeight: 600, letterSpacing: 0.5 }}>{w.name}</p>
                    <p style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{(w.cats || []).length} categories · {ec} exercises</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: F, fontSize: 20, color: dc === ec && ec > 0 ? "#00C853" : "#555", fontWeight: 600 }}>{dc}/{ec}</p>
                  <p style={{ fontSize: 10, color: "#444" }}>completed</p>
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
// ADMIN PANEL
// ============================================================
function Admin({ token, onLogout }) {
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

  const inp = { width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" };
  const sinp = { ...inp, width: 80, textAlign: "center", padding: "8px" };

  // Load workouts for selected belt
  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const wks = await supabase.from("workouts")._token(token).select("*", `&belt_id=eq.${belt}&order=sort_order`);
      const full = [];
      for (const w of wks) {
        const cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${w.id}&order=sort_order`);
        for (const c of cats) {
          c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`);
        }
        w.cats = cats;
        full.push(w);
      }
      setWorkouts(full);
    } catch (e) { console.error("Load workouts error:", e); }
    setLoading(false);
  }, [belt, token]);

  const loadStudents = useCallback(async () => {
    try {
      const s = await supabase.from("profiles")._token(token).select("*", `&role=eq.student&order=created_at`);
      setStudents(s);
    } catch (e) { console.error("Load students error:", e); }
  }, [token]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);
  useEffect(() => { if (tab === "students") loadStudents(); }, [tab, loadStudents]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // CRUD operations
  const addWorkout = async () => {
    setSaving(true);
    try {
      await supabase.from("workouts")._token(token).insert({ belt_id: belt, name: `Workout ${String.fromCharCode(65 + workouts.length)}`, sort_order: workouts.length });
      await loadWorkouts();
      flash("Workout added!");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const deleteWorkout = async (id) => {
    setSaving(true);
    try {
      await supabase.from("workouts")._token(token).delete({ id });
      if (editing?.id === id) setEditing(null);
      await loadWorkouts();
      flash("Workout deleted.");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const saveWorkoutName = async (id, name) => {
    try {
      await supabase.from("workouts")._token(token).update({ name }, { id });
    } catch (e) { console.error(e); }
  };

  const addCategory = async (workoutId) => {
    setSaving(true);
    try {
      const cats = editing?.cats || [];
      await supabase.from("categories")._token(token).insert({ workout_id: workoutId, name: "New Category", sort_order: cats.length });
      await loadWorkouts();
      // Re-select editing workout
      const updated = (await supabase.from("workouts")._token(token).select("*", `&id=eq.${workoutId}`))[0];
      if (updated) {
        updated.cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${workoutId}&order=sort_order`);
        for (const c of updated.cats) {
          c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`);
        }
        setEditing(updated);
      }
      flash("Category added!");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const deleteCategory = async (catId, workoutId) => {
    setSaving(true);
    try {
      await supabase.from("categories")._token(token).delete({ id: catId });
      await reloadEditing(workoutId);
      flash("Category removed.");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const saveCategoryName = async (catId, name) => {
    try { await supabase.from("categories")._token(token).update({ name }, { id: catId }); } catch (e) { console.error(e); }
  };

  const addExercise = async (catId, workoutId) => {
    setSaving(true);
    try {
      const cat = editing?.cats?.find(c => c.id === catId);
      await supabase.from("exercises")._token(token).insert({ category_id: catId, name: "New Exercise", sets: 3, reps: 10, rest_seconds: 30, sort_order: (cat?.exercises || []).length });
      await reloadEditing(workoutId);
      flash("Exercise added!");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const deleteExercise = async (exId, workoutId) => {
    setSaving(true);
    try {
      await supabase.from("exercises")._token(token).delete({ id: exId });
      await reloadEditing(workoutId);
      flash("Exercise removed.");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const saveExercise = async (exId, field, value) => {
    try { await supabase.from("exercises")._token(token).update({ [field]: value }, { id: exId }); } catch (e) { console.error(e); }
  };

  const reloadEditing = async (workoutId) => {
    try {
      const w = (await supabase.from("workouts")._token(token).select("*", `&id=eq.${workoutId}`))[0];
      if (w) {
        w.cats = await supabase.from("categories")._token(token).select("*", `&workout_id=eq.${workoutId}&order=sort_order`);
        for (const c of w.cats) {
          c.exercises = await supabase.from("exercises")._token(token).select("*", `&category_id=eq.${c.id}&order=sort_order`);
        }
        setEditing(w);
      }
      await loadWorkouts();
    } catch (e) { console.error(e); }
  };

  // Student management
  const addStudent = async () => {
    if (!ns.name || !ns.email || !ns.password) return;
    setSaving(true);
    try {
      await supabase.auth.signUp(ns.email, ns.password, { full_name: ns.name, role: "student", belt_id: ns.beltId });
      setNs({ name: "", email: "", password: "", beltId: "white" });
      setShowAdd(false);
      await loadStudents();
      flash("Student added!");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const promoteStudent = async (student) => {
    const ci = BELT_LEVELS.findIndex(b => b.id === student.belt_id);
    if (ci >= BELT_LEVELS.length - 1) return;
    setSaving(true);
    try {
      await supabase.from("profiles")._token(token).update({ belt_id: BELT_LEVELS[ci + 1].id }, { id: student.id });
      await loadStudents();
      flash("Student promoted!");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  const deleteStudent = async (id) => {
    setSaving(true);
    try {
      await supabase.from("profiles")._token(token).delete({ id });
      await loadStudents();
      flash("Student removed.");
    } catch (e) { flash("Error: " + e.message); }
    setSaving(false);
  };

  // Debounced save for text inputs
  const debounceRef = useRef({});
  const debouncedSave = (key, fn, delay = 600) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(fn, delay);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      {msg && <div style={{ position: "fixed", top: 70, right: 20, background: msg.startsWith("Error") ? "#ff4444" : "#00C853", color: "#fff", padding: "10px 20px", borderRadius: 8, fontFamily: F, fontSize: 13, letterSpacing: 1, zIndex: 200 }}>{msg}</div>}
      {saving && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#FF6D00", color: "#fff", padding: "6px 16px", borderRadius: 6, fontFamily: F, fontSize: 11, letterSpacing: 1, zIndex: 200 }}>SAVING...</div>}

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #222" }}>
        {["workouts", "students"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid #FF6D00" : "2px solid transparent", padding: "12px 20px", color: tab === t ? "#FF6D00" : "#666", fontFamily: F, fontSize: 13, letterSpacing: 2, cursor: "pointer", fontWeight: 600 }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === "workouts" && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {BELT_LEVELS.map(b => (
            <button key={b.id} onClick={() => { setBelt(b.id); setEditing(null); }} style={{ background: belt === b.id ? b.color : "#141414", color: belt === b.id ? b.tc : "#888", border: belt === b.id ? "none" : "1px solid #333", borderRadius: 8, padding: "7px 16px", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>{b.name.toUpperCase()}</button>
          ))}
        </div>

        {loading ? <LoadingScreen message="Loading workouts..." /> : !editing ? <>
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
                    <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>INSTRUCTIONS</label>
                    <textarea defaultValue={ex.instructions} onBlur={e => saveExercise(ex.id, "instructions", e.target.value)} onChange={e => debouncedSave(`einst-${ex.id}`, () => saveExercise(ex.id, "instructions", e.target.value))} style={{ ...inp, minHeight: 50, resize: "vertical" }} placeholder="Simple instructions..." />
                  </div>
                </div>
              ))}
              <button onClick={() => addExercise(cat.id, editing.id)} disabled={saving} style={{ background: "none", border: "1px dashed #333", borderRadius: 8, padding: 9, width: "100%", color: "#FF6D00", fontFamily: F, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>+ ADD EXERCISE</button>
            </div>
          ))}
          <button onClick={() => addCategory(editing.id)} disabled={saving} style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: 12, padding: 14, width: "100%", color: "#FF6D00", fontFamily: F, fontSize: 12, letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>+ ADD CATEGORY</button>
        </>}
      </>}

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
                <div key={k}>
                  <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>{l}</label>
                  <input value={ns[k]} onChange={e => setNs({ ...ns, [k]: e.target.value })} style={inp} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", color: "#555", fontSize: 9, fontFamily: F, letterSpacing: 1, marginBottom: 3 }}>STARTING BELT</label>
                <select value={ns.beltId} onChange={e => setNs({ ...ns, beltId: e.target.value })} style={{ ...inp, cursor: "pointer" }}>
                  {BELT_LEVELS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
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
                <div>
                  <p style={{ fontFamily: F, fontSize: 15, color: "#fff", fontWeight: 600 }}>{s.full_name}</p>
                  <p style={{ fontSize: 11, color: "#555" }}>{s.email}</p>
                </div>
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
        {students.length === 0 && !loading && <div style={{ textAlign: "center", padding: 36, color: "#555" }}><p style={{ fontSize: 28, marginBottom: 8 }}>👥</p><p>No students yet.</p></div>}
      </>}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function LevelUpBallApp() {
  const [session, setSession] = useState(null); // { access_token, user }
  const [profile, setProfile] = useState(null);
  const [workoutsData, setWorkoutsData] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [activeW, setActiveW] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = session?.access_token;

  // After login, load profile
  const handleLogin = async (data) => {
    setSession(data);
    setLoading(true);
    try {
      const profiles = await supabase.from("profiles")._token(data.access_token).select("*", `&id=eq.${data.user.id}`);
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (profiles[0].role === "student") {
          await loadStudentData(data.access_token, profiles[0]);
        }
      }
    } catch (e) { console.error("Profile load error:", e); }
    setLoading(false);
  };

  const loadStudentData = async (tok, prof) => {
    try {
      // Load workouts for student's belt
      const wks = await supabase.from("workouts")._token(tok).select("*", `&belt_id=eq.${prof.belt_id}&order=sort_order`);
      const full = [];
      for (const w of wks) {
        const cats = await supabase.from("categories")._token(tok).select("*", `&workout_id=eq.${w.id}&order=sort_order`);
        for (const c of cats) {
          c.exercises = await supabase.from("exercises")._token(tok).select("*", `&category_id=eq.${c.id}&order=sort_order`);
        }
        w.cats = cats;
        full.push(w);
      }
      setWorkoutsData(full);

      // Load completions
      const comps = await supabase.from("completed_exercises")._token(tok).select("exercise_id", `&student_id=eq.${prof.id}`);
      setCompletedIds(new Set(comps.map(c => c.exercise_id)));
    } catch (e) { console.error("Student data load error:", e); }
  };

  const toggleComplete = async (exerciseId) => {
    if (!token || !profile) return;
    const newSet = new Set(completedIds);
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId);
      setCompletedIds(newSet);
      try { await supabase.from("completed_exercises")._token(token).delete({ student_id: profile.id, exercise_id: exerciseId }); } catch (e) { console.error(e); }
    } else {
      newSet.add(exerciseId);
      setCompletedIds(newSet);
      try { await supabase.from("completed_exercises")._token(token).insert({ student_id: profile.id, exercise_id: exerciseId }); } catch (e) { console.error(e); }
    }
  };

  const logout = () => {
    setSession(null);
    setProfile(null);
    setWorkoutsData([]);
    setCompletedIds(new Set());
    setActiveW(null);
  };

  const fontLink = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap";
  const belt = profile ? BELT_LEVELS.find(b => b.id === profile.belt_id) : null;

  if (loading) return <><link href={fontLink} rel="stylesheet" /><style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #0a0a0a; }`}</style><LoadingScreen message="Loading your profile..." /></>;

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", minHeight: "100vh", background: "#0a0a0a" }}>
      <link href={fontLink} rel="stylesheet" />
      <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #0a0a0a; } input::placeholder, textarea::placeholder { color: #444; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0a0a; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {!session && <Login onLogin={handleLogin} />}

      {session && profile?.role === "admin" && (
        <><Header admin onLogout={logout} /><Admin token={token} onLogout={logout} /></>
      )}

      {session && profile?.role === "student" && !activeW && (
        <><Header belt={belt} onLogout={logout} /><Dashboard profile={profile} workoutsData={workoutsData} onSelect={setActiveW} onLogout={logout} completedIds={completedIds} token={token} /></>
      )}

      {session && profile?.role === "student" && activeW && (
        <><Header belt={belt} onLogout={logout} /><WorkoutView workout={activeW} onBack={() => setActiveW(null)} completedIds={completedIds} onToggle={toggleComplete} token={token} /></>
      )}
    </div>
  );
}

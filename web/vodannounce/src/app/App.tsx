import { useState, type ReactNode } from "react";
import {
  Bell, Menu, Search, Plus, LogOut, Settings, ChevronRight,
  ChevronDown, RefreshCw, Loader2, Check, CheckCircle,
  AlertTriangle, Clock, Calendar, Send, Mail,
  MessageSquare, Smartphone, FileText, Globe,
  TrendingUp, Users, Filter, Eye, Pencil, Save, ArrowRight,
  Activity, Home, Info, Archive, Download, Building2,
  ChevronLeft, Zap, Shield, Radio,
  CheckSquare, EyeOff
} from "lucide-react";

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = "#E60000";
const DARK = "#1D1D1B";
const HOVER_RED = "#C20000";
const HOVER_DARK = "#333331";
const BG = "#F4F4F4";

// ─── Name extraction ─────────────────────────────────────────────────────────
function extractName(email: string) {
  if (!email || !email.includes("@")) return { full: "VOIS User", first: "there", initials: "VU" };
  const local = email.split("@")[0];
  const parts = local.split(/[._\-+]/).filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  const full = parts.join(" ") || "VOIS User";
  const first = parts[0] || "VOIS User";
  const initials = parts.slice(0, 2).map(p => p[0] ?? "").join("").toUpperCase() || "VU";
  return { full, first, initials };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type WebView = "login" | "dashboard" | "create" | "ai-plan" | "content-preview" | "approval" | "monitoring" | "history" | "detail";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CAMPAIGNS = [
  { id: 1, name: "SAP System Maintenance Window", priority: "critical", date: "Nov 15, 2024", status: "live", ackRate: 89, audience: 2092 },
  { id: 2, name: "Holiday Policy Update 2025", priority: "important", date: "Nov 10, 2024", status: "completed", ackRate: 94, audience: 2092 },
  { id: 3, name: "Security Awareness Training Deadline", priority: "important", date: "Nov 8, 2024", status: "completed", ackRate: 78, audience: 1856 },
  { id: 4, name: "New HR Portal Launch", priority: "normal", date: "Nov 1, 2024", status: "completed", ackRate: 82, audience: 2092 },
  { id: 5, name: "Q4 Town Hall Meeting Invite", priority: "important", date: "Oct 28, 2024", status: "completed", ackRate: 91, audience: 2092 },
  { id: 6, name: "Office Reopening Guidelines", priority: "critical", date: "Oct 20, 2024", status: "completed", ackRate: 96, audience: 2092 },
];

const PENDING = [
  { id: 10, name: "Year-End Performance Review Schedule", priority: "important", by: "HR Team", ago: "2 hours ago" },
  { id: 11, name: "IT Equipment Refresh Program", priority: "normal", by: "IT Department", ago: "5 hours ago" },
  { id: 12, name: "Emergency Generator Test", priority: "critical", by: "Facilities", ago: "30 min ago" },
];

const RECIPIENTS = [
  { name: "Mohammed Al-Rashid", dept: "Engineering", status: "acknowledged", time: "10:32 AM" },
  { name: "Sarah Chen", dept: "Finance", status: "opened", time: "10:45 AM" },
  { name: "David Okafor", dept: "HR", status: "delivered", time: "10:28 AM" },
  { name: "Emma Williams", dept: "Sales", status: "sent", time: "10:25 AM" },
  { name: "Khalid Al-Hassan", dept: "IT", status: "acknowledged", time: "10:30 AM" },
  { name: "Priya Sharma", dept: "Operations", status: "failed", time: "—" },
  { name: "Ahmed Al-Farsi", dept: "Legal", status: "acknowledged", time: "10:38 AM" },
  { name: "Lisa Park", dept: "Marketing", status: "opened", time: "10:52 AM" },
];

const CHART_DATA = [
  { time: "10:00", sent: 200, delivered: 195, acked: 100 },
  { time: "10:15", sent: 500, delivered: 488, acked: 280 },
  { time: "10:30", sent: 900, delivered: 876, acked: 520 },
  { time: "10:45", sent: 1400, delivered: 1367, acked: 850 },
  { time: "11:00", sent: 1847, delivered: 1823, acked: 1200 },
  { time: "11:15", sent: 1847, delivered: 1823, acked: 1432 },
];

// ─── Shared Badge Components ──────────────────────────────────────────────────
function PriorityBadge({ p }: { p: string }) {
  const conf: Record<string, string> = {
    critical: "bg-red-50 text-red-700 border-red-200",
    important: "bg-amber-50 text-amber-700 border-amber-200",
    normal: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const dot: Record<string, string> = { critical: "bg-red-600", important: "bg-amber-500", normal: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${conf[p] || conf.normal}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot[p] || dot.normal}`} />
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </span>
  );
}

function StatusBadge({ s }: { s: string }) {
  const conf: Record<string, [string, string]> = {
    live: ["bg-green-50 text-green-700 border-green-200", "Live"],
    completed: ["bg-slate-50 text-slate-600 border-slate-200", "Completed"],
    draft: ["bg-yellow-50 text-yellow-700 border-yellow-200", "Draft"],
    failed: ["bg-red-50 text-red-700 border-red-200", "Failed"],
    scheduled: ["bg-blue-50 text-blue-700 border-blue-200", "Scheduled"],
  };
  const [cls, label] = conf[s] || conf.completed;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{label}</span>;
}

function RecipientStatusDot({ s }: { s: string }) {
  const conf: Record<string, string> = {
    acknowledged: "text-green-700 bg-green-50",
    opened: "text-blue-700 bg-blue-50",
    delivered: "text-slate-600 bg-slate-50",
    sent: "text-indigo-600 bg-indigo-50",
    failed: "text-red-700 bg-red-50",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf[s] || conf.delivered}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

// ─── Vodafone Speech Mark SVG ─────────────────────────────────────────────────
function VodafoneIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="16" fill="#E60000" />
      <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 15a5 5 0 110-10 5 5 0 010 10z" fill="white" />
    </svg>
  );
}

// ─── WEB SCREENS ──────────────────────────────────────────────────────────────
function WebLogin({ onLogin }: { onLogin: (email: string) => void }) {
  const [tab, setTab] = useState<"credentials" | "sso">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setError("");
    onLogin(email);
  };

  return (
    <div className="min-h-full flex" style={{ background: BG }}>
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10" style={{ backgroundColor: DARK }}>
        <div className="flex items-center gap-3">
          <VodafoneIcon size={32} />
          <div>
            <div className="text-white font-bold text-base leading-tight">Vodannounce</div>
            <div className="text-white/40 text-[11px]">VOIS Sender Portal</div>
          </div>
        </div>
        <div>
          <h2 className="text-white text-3xl font-bold leading-snug mb-4">
            Communicate.<br />
            Inform.<br />
            <span style={{ color: RED }}>Connect.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            AI-powered corporate communication platform for VOIS. Send announcements across all channels and monitor acknowledgements in real time.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { value: "25,000+", label: "Employees reached" },
            { value: "89%", label: "Average ack rate" },
            { value: "4 channels", label: "Teams, Email, Push, SMS" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: RED }}>{value}</span>
              <span className="text-white/40 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <VodafoneIcon size={48} />
            <h1 className="text-2xl font-bold mt-3" style={{ color: DARK }}>Vodannounce</h1>
            <p className="text-slate-400 text-sm mt-1">VOIS Sender Portal</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold" style={{ color: DARK }}>Sign in</h1>
            <p className="text-slate-400 text-sm mt-1">Use your VOIS credentials to access the portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {([["credentials", "Email & Password"], ["sso", "Single Sign-On"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setError(""); }}
                  className="flex-1 py-3.5 text-xs font-bold transition-all border-b-2"
                  style={tab === id ? { borderBottomColor: RED, color: RED } : { borderBottomColor: "transparent", color: "#6E6E6E" }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-7">
              {tab === "credentials" ? (
                <>
                  <h2 className="text-base font-bold mb-0.5" style={{ color: DARK }}>Welcome back</h2>
                  <p className="text-sm text-slate-400 mb-5">Sign in with your VOIS credentials</p>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                      <AlertTriangle size={13} style={{ color: RED }} className="flex-shrink-0" />
                      <p className="text-xs text-red-700 font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-bold mb-1.5" style={{ color: DARK }}>Work Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleSignIn()}
                      placeholder="you@vodafone.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
                      style={{ color: DARK }}
                    />
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold" style={{ color: DARK }}>Password</label>
                      <a href="#" className="text-xs font-semibold hover:underline" style={{ color: RED }}>Forgot password?</a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleSignIn()}
                        placeholder="Enter your password"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors pr-10"
                        style={{ color: DARK }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold text-sm transition-colors"
                    style={{ backgroundColor: RED }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
                  >
                    Sign In <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold mb-0.5" style={{ color: DARK }}>Single Sign-On</h2>
                  <p className="text-sm text-slate-400 mb-5">Use your organisation identity provider</p>
                  <button
                    onClick={() => onLogin("")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-white rounded-xl font-bold text-sm transition-colors mb-3"
                    style={{ backgroundColor: DARK }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_DARK)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = DARK)}
                  >
                    <Building2 size={16} /> Continue with Microsoft
                  </button>
                  <button
                    onClick={() => onLogin("")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    <Globe size={16} /> Continue with Google
                  </button>
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">Your organisation may require MFA on first sign-in.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5">
            <VodafoneIcon size={14} />
            <p className="text-xs text-slate-400">VOIS · Vodafone — Strictly Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebDashboard({ nav, firstName }: { nav: (v: WebView) => void; firstName: string }) {
  return (
    <div className="p-5 lg:p-7 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: DARK }}>Good morning, {firstName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monday, November 15, 2024</p>
        </div>
        <button
          onClick={() => nav("create")}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          style={{ backgroundColor: RED }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Campaigns", value: "12", sub: "+2 from last week", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Approval", value: "3", sub: "Requires attention", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Failed Deliveries", value: "2", sub: "Across 1 campaign", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Avg. Ack Rate", value: "87%", sub: "↑ 4% vs last month", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: DARK }}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campaigns table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold" style={{ color: DARK }}>Active Campaigns</h2>
            <button onClick={() => nav("history")} className="text-xs font-bold hover:underline" style={{ color: RED }}>View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50">
                {["Campaign", "Priority", "Date", "Status", "Ack Rate"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {CAMPAIGNS.slice(0, 4).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => nav(c.status === "live" ? "monitoring" : "history")}>
                    <td className="px-4 py-3 text-sm font-semibold max-w-[200px] truncate" style={{ color: DARK }}>{c.name}</td>
                    <td className="px-4 py-3"><PriorityBadge p={c.priority} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.date}</td>
                    <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full min-w-[50px]">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${c.ackRate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{c.ackRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold" style={{ color: DARK }}>Pending Approvals</h2>
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: RED }}>{PENDING.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {PENDING.map(p => (
              <div key={p.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold leading-tight" style={{ color: DARK }}>{p.name}</p>
                  <PriorityBadge p={p.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">By {p.by} · {p.ago}</span>
                  <button onClick={() => nav("approval")} className="text-xs font-bold hover:underline" style={{ color: RED }}>Review →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live campaign banner */}
      <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4" style={{ backgroundColor: DARK }}>
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">Live Campaign</p>
          <p className="text-white font-bold text-lg">SAP System Maintenance Window</p>
          <p className="text-white/50 text-sm mt-1">1,432 of 2,092 employees acknowledged · 89%</p>
        </div>
        <button
          onClick={() => nav("monitoring")}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0"
          style={{ backgroundColor: RED }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
        >
          <Activity size={14} /> Live Monitor
        </button>
      </div>
    </div>
  );
}

function WebCreateCampaign({ nav }: { nav: (v: WebView) => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [priority, setPriority] = useState("important");
  const [audience, setAudience] = useState<string[]>(["all-employees"]);
  const toggleAudience = (g: string) => setAudience(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const handleAnalyze = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); nav("ai-plan"); }, 2200); };
  const groups = [
    { id: "all-employees", label: "All Employees", count: "2,092" },
    { id: "engineering", label: "Engineering", count: "423" },
    { id: "finance", label: "Finance & Accounting", count: "187" },
    { id: "sales", label: "Sales & Commercial", count: "312" },
    { id: "hr", label: "Human Resources", count: "64" },
    { id: "it", label: "IT Department", count: "98" },
    { id: "leadership", label: "Leadership & Exec.", count: "24" },
    { id: "operations", label: "Operations", count: "234" },
  ];

  return (
    <div className="p-5 lg:p-7">
      {analyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: `${DARK}CC` }}>
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-xs w-full mx-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader2 size={28} className="animate-spin" style={{ color: RED }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: DARK }}>Analyzing with AI</h3>
            <p className="text-sm text-slate-500">Classifying urgency, recommending channels, and assessing potential risks...</p>
            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full animate-pulse" style={{ width: "65%", backgroundColor: RED }} />
            </div>
          </div>
        </div>
      )}
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("dashboard")} className="text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: DARK }}>Create New Campaign</h1>
            <p className="text-sm text-slate-400 mt-0.5">Fill in the details — AI will optimise your communication plan</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold mb-2" style={{ color: DARK }}>Campaign Name <span style={{ color: RED }}>*</span></label>
            <input type="text" defaultValue="SAP System Maintenance Window" className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-red-500 transition-colors" style={{ color: DARK }} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold mb-2" style={{ color: DARK }}>Announcement <span style={{ color: RED }}>*</span></label>
            <textarea rows={5} defaultValue={"Dear all,\n\nWe have scheduled emergency maintenance for the SAP system tonight from 12:00 AM to 4:00 AM (Nov 15-16). All users must save their work and log out by 11:55 PM.\n\nSystems affected: SAP ERP, SAP Ariba, SAP HR Portal."} className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-red-500 resize-none transition-colors" style={{ color: DARK }} />
            <p className="text-xs text-slate-400 mt-2">AI will analyse this text to recommend the optimal communication strategy.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold mb-3" style={{ color: DARK }}>Priority Level <span style={{ color: RED }}>*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "normal", label: "Normal", desc: "Routine update", dot: "bg-slate-400" },
                { id: "important", label: "Important", desc: "Requires attention", dot: "bg-amber-500" },
                { id: "critical", label: "Critical", desc: "Urgent action needed", dot: "bg-red-600" },
              ].map(({ id, label, desc, dot }) => (
                <button
                  key={id}
                  onClick={() => setPriority(id)}
                  className="flex flex-col items-center justify-center px-3 py-4 rounded-xl border-2 transition-all text-center"
                  style={{ borderColor: priority === id ? RED : "#E2E8F0", backgroundColor: priority === id ? "#FFF5F5" : "#F9F9F9" }}
                >
                  <span className={`w-3 h-3 rounded-full mb-2 ${dot}`} />
                  <span className="text-sm font-bold" style={{ color: priority === id ? RED : DARK }}>{label}</span>
                  <span className="text-xs text-slate-400 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <label className="block text-sm font-bold mb-2" style={{ color: DARK }}>Required Action</label>
              <input type="text" defaultValue="Save work and log out by 11:55 PM" className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-red-500 transition-colors" style={{ color: DARK }} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <label className="block text-sm font-bold mb-2" style={{ color: DARK }}>Effective Date & Time</label>
              <div className="flex gap-2">
                <input type="date" defaultValue="2024-11-15" className="flex-1 px-3 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-red-500" style={{ color: DARK }} />
                <input type="time" defaultValue="23:55" className="w-24 px-3 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-red-500" style={{ color: DARK }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold mb-3" style={{ color: DARK }}>Audience Selection <span style={{ color: RED }}>*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {groups.map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => toggleAudience(id)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all"
                  style={{ borderColor: audience.includes(id) ? DARK : "#E2E8F0", backgroundColor: audience.includes(id) ? `${DARK}08` : "#F9F9F9" }}
                >
                  <div>
                    <div className="text-xs font-bold" style={{ color: audience.includes(id) ? DARK : "#6E6E6E" }}>{label}</div>
                    <div className="text-[10px] text-slate-400">{count} employees</div>
                  </div>
                  {audience.includes(id) && <Check size={13} style={{ color: RED }} className="flex-shrink-0 ml-1" />}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">Estimated reach: <span className="font-bold" style={{ color: DARK }}>{audience.includes("all-employees") ? "2,092" : "—"} employees</span></span>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-2xl font-bold text-base transition-colors shadow-md"
            style={{ backgroundColor: RED }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
          >
            <Zap size={20} /> Analyse with AI
          </button>
        </div>
      </div>
    </div>
  );
}

function WebAIPlan({ nav }: { nav: (v: WebView) => void }) {
  const [editing, setEditing] = useState(false);
  const risks = [
    "Remote workers may not receive email alerts in time",
    "Payroll processing could be disrupted if SAP is not properly closed",
    "Non-English speakers need additional communication channels",
    "Critical deadline requires multi-channel delivery strategy",
  ];
  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("create")} className="text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                <CheckCircle size={12} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">AI Analysis Complete</span>
              </div>
              <span className="text-xs text-slate-400">Confidence: <span className="font-bold" style={{ color: DARK }}>92%</span></span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: DARK }}>AI Communication Plan</h1>
          </div>
          <button
            onClick={() => setEditing(e => !e)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors"
            style={editing ? { backgroundColor: DARK, color: "white", borderColor: DARK } : { borderColor: "#E2E8F0", color: DARK }}
          >
            <Pencil size={14} /> {editing ? "Done" : "Edit"}
          </button>
        </div>

        <div className="rounded-2xl p-5 mb-5 flex items-center justify-between" style={{ backgroundColor: DARK }}>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">Campaign</p>
            <p className="text-white font-bold text-lg">SAP System Maintenance Window</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-xl">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wide">Critical</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="space-y-4">
            {[
              { label: "Urgency Classification", value: "Critical — Immediate Action Required", icon: AlertTriangle, iconClass: "text-red-600 bg-red-50" },
              { label: "Topic", value: "System Infrastructure Maintenance", icon: FileText, iconClass: "text-blue-600 bg-blue-50" },
              { label: "Required Deadline", value: "November 15, 2024 at 11:55 PM", icon: Calendar, iconClass: "text-amber-600 bg-amber-50" },
              { label: "Required Action", value: "Save all work and log out of SAP by 11:55 PM tonight", icon: CheckSquare, iconClass: "text-green-600 bg-green-50" },
            ].map(({ label, value, icon: Icon, iconClass }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    {editing
                      ? <input defaultValue={value} className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none" style={{ color: DARK }} />
                      : <p className="text-sm font-bold" style={{ color: DARK }}>{value}</p>}
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Confidence</p>
                <span className="text-sm font-bold" style={{ color: DARK }}>92%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "92%", background: `linear-gradient(to right, ${RED}, #22c55e)` }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">High confidence based on urgency indicators, time sensitivity and system-wide impact.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} style={{ color: DARK }} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recommended Audience</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All Employees (2,092)", "Engineering", "Finance", "IT Department"].map(a => (
                  <span key={a} className="px-2.5 py-1 border text-xs font-bold rounded-lg" style={{ backgroundColor: `${DARK}08`, borderColor: `${DARK}20`, color: DARK }}>{a}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Radio size={15} style={{ color: DARK }} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recommended Channels</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: MessageSquare, name: "Microsoft Teams", note: "Primary · Immediate reach", c: "text-indigo-600 bg-indigo-50" },
                  { icon: Mail, name: "Microsoft Outlook", note: "Formal record · Full details", c: "text-blue-600 bg-blue-50" },
                  { icon: Smartphone, name: "Mobile Push", note: "Remote workers · High visibility", c: "text-green-600 bg-green-50" },
                  { icon: FileText, name: "SMS Fallback", note: "No internet · Last resort", c: "text-amber-600 bg-amber-50" },
                ].map(({ icon: Icon, name, note, c }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.split(" ")[1]}`}>
                      <Icon size={13} className={c.split(" ")[0]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold" style={{ color: DARK }}>{name}</span>
                      <span className="text-xs text-slate-400 ml-2">{note}</span>
                    </div>
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Potential Risks</p>
              </div>
              <ul className="space-y-2">
                {risks.map(r => (
                  <li key={r} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => nav("content-preview")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-2xl font-bold transition-colors"
            style={{ backgroundColor: RED }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
          >
            Use These Recommendations <ArrowRight size={16} />
          </button>
          <button onClick={() => nav("create")} className="px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-sm">
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

// Per-channel content — v1 (original AI draft) and v2 (AI rewrite after "Regenerate")
const CHANNEL_CONTENT = {
  teams: {
    label: "Microsoft Teams",
    hint: "Short, scannable, emoji-led. Optimised for channel posts in #all-staff.",
    v1: "🔴 CRITICAL: SAP System Maintenance — Tonight 12:00 AM – 4:00 AM\n\nDear Team,\n\nEssential maintenance is scheduled for the SAP system. Please:\n\n✅ Save all work in progress\n✅ Complete pending transactions\n✅ Log out of all SAP modules by 11:55 PM\n\nSystems affected: SAP ERP, SAP Ariba, SAP HR Portal\n\nContact: it-support@vois.com | Ext. 1234",
    v2: "⚠️ ACTION REQUIRED — SAP Offline Tonight\n\nLog out of all SAP systems by 11:55 PM. Maintenance runs 12:00 AM – 4:00 AM (Nov 15–16).\n\nSystems down: SAP ERP · Ariba · HR Portal · SuccessFactors\n\n🕐 Deadline: 11:55 PM tonight\n📞 IT Help: Ext. 1234 | it-support@vois.com",
  },
  outlook: {
    label: "Microsoft Outlook",
    hint: "Formal email tone. Full context, salutation, sign-off, and structured paragraphs.",
    v1: "Dear All,\n\nThis is to inform you of a critical SAP system maintenance window scheduled for tonight, November 15–16, 2024.\n\nMaintenance Window: 12:00 AM – 4:00 AM\nDeadline to log out: 11:55 PM\n\nPlease ensure all pending work in SAP is saved and completed before maintenance begins.\n\nBest regards,\nIT Communications Team — VOIS",
    v2: "Dear Colleagues,\n\nPlease be advised that the VOIS SAP environment will undergo critical infrastructure maintenance tonight, November 15–16, 2024, from 12:00 AM to 4:00 AM GST.\n\nACTION REQUIRED — Deadline: 11:55 PM tonight\n\nTo prevent data loss and transaction failures, all employees must:\n  1. Save and close all open SAP work\n  2. Complete any pending purchase orders, leave requests, or HR transactions\n  3. Log out of all SAP modules (ERP, Ariba, HR Portal, SuccessFactors)\n\nFailure to log out may result in unsaved work being lost. The systems will be restored by 4:00 AM. You will receive a follow-up confirmation once maintenance is complete.\n\nFor urgent assistance, contact IT Support at Ext. 1234 or it-support@vois.com.\n\nThank you for your cooperation.\n\nKind regards,\nIT Communications — VOIS Technology Services",
  },
  push: {
    label: "Mobile Push Notification",
    hint: "Ultra-short. Title ≤50 chars, body ≤100 chars. Tap opens full announcement.",
    v1: { title: "🔴 URGENT: SAP Maintenance Tonight", body: "Log out of all SAP systems by 11:55 PM. Maintenance window: 12:00 AM – 4:00 AM." },
    v2: { title: "⚠️ SAP goes offline at midnight — act now", body: "Save your work and log out by 11:55 PM. Tap to acknowledge." },
  },
  sms: {
    label: "SMS",
    hint: "160-char limit. Plain text only. No links — include callback number.",
    v1: { text: "[VOIS] URGENT: SAP maintenance tonight 12:00AM-4:00AM. Log out by 11:55PM. IT Support: Ext 1234. Reply YES to confirm.", chars: 119 },
    v2: { text: "[VOIS] SAP offline 12AM-4AM tonight. LOG OUT BY 11:55PM or lose unsaved work. Help: Ext 1234. Reply ACK to confirm receipt.", chars: 124 },
  },
  faq: {
    label: "FAQ / Knowledge Base",
    hint: "Conversational Q&A format. Covers the most common employee questions.",
    v1: [
      { q: "What systems will be affected?", a: "SAP ERP, SAP Ariba, and SAP HR Portal will be offline from 12:00 AM to 4:00 AM." },
      { q: "What happens if I do not log out?", a: "Unsaved work may be lost. Please save all your work and complete pending transactions before 11:55 PM." },
      { q: "Who do I contact for help?", a: "Contact IT Support at Ext. 1234 or email it-support@vois.com during business hours." },
      { q: "Will this affect my payslip?", a: "If you complete HR transactions before 11:55 PM tonight, no impact on payroll is expected." },
    ],
    v2: [
      { q: "Why is SAP going offline tonight?", a: "VOIS IT is performing critical infrastructure upgrades that require a full system shutdown. This is a planned maintenance window to improve system stability and performance." },
      { q: "Which systems are affected?", a: "SAP ERP, SAP Ariba, SAP HR Portal, and SAP SuccessFactors will all be unavailable from 12:00 AM to 4:00 AM (November 15–16, 2024)." },
      { q: "Do I need to do anything right now?", a: "Yes. Before 11:55 PM tonight you must: save all open SAP work, complete pending transactions or leave requests, and log out of all SAP modules." },
      { q: "What if I forget and lose my work?", a: "Unfortunately unsaved work cannot be recovered after maintenance begins. Please act before the 11:55 PM deadline. Set a reminder if needed." },
      { q: "Will payroll be affected?", a: "Payroll will not be impacted as long as all HR transactions are completed before 11:55 PM. If you have a payroll emergency, contact HR directly." },
      { q: "How will I know when systems are back online?", a: "You will receive a follow-up push notification and Teams message once maintenance is complete, expected by 4:00 AM." },
    ],
  },
};

function WebContentPreview({ nav }: { nav: (v: WebView) => void }) {
  const [channel, setChannel] = useState<keyof typeof CHANNEL_CONTENT>("teams");
  const [rewritten, setRewritten] = useState<Partial<Record<keyof typeof CHANNEL_CONTENT, boolean>>>({});
  const [regenerating, setRegenerating] = useState(false);

  const isRewritten = !!rewritten[channel];
  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      setRewritten(r => ({ ...r, [channel]: !r[channel] }));
    }, 1800);
  };

  const pushMsg = isRewritten ? CHANNEL_CONTENT.push.v2 : CHANNEL_CONTENT.push.v1;
  const smsMsg = isRewritten ? CHANNEL_CONTENT.sms.v2 : CHANNEL_CONTENT.sms.v1;
  const channels: { id: keyof typeof CHANNEL_CONTENT; label: string; icon: (props: { size: number }) => ReactNode }[] = [
    { id: "teams", label: "Teams", icon: MessageSquare },
    { id: "outlook", label: "Outlook", icon: Mail },
    { id: "push", label: "Mobile Push", icon: Smartphone },
    { id: "sms", label: "SMS", icon: FileText },
    { id: "faq", label: "FAQ", icon: Info },
  ];

  const content = CHANNEL_CONTENT[channel];

  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("ai-plan")} className="text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: DARK }}>Content Preview</h1>
            <p className="text-sm text-slate-400 mt-0.5">AI rewrites each announcement for its channel format</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-colors"
              style={isRewritten ? { borderColor: RED, color: RED, backgroundColor: "#FFF5F5" } : { borderColor: "#E2E8F0", color: "#6E6E6E" }}
            >
              {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {isRewritten ? "Revert to v1" : "AI Rewrite"}
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-bold" style={{ backgroundColor: DARK }}>
              <Save size={13} /> Save Draft
            </button>
          </div>
        </div>

        {/* Channel tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-2 overflow-x-auto">
          {channels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChannel(id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={channel === id ? { backgroundColor: "white", color: DARK, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#6E6E6E" }}
            >
              <Icon size={13} /> {label}
              {rewritten[id] && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />}
            </button>
          ))}
        </div>

        {/* Channel format hint */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <Zap size={12} style={{ color: RED }} className="flex-shrink-0" />
          <p className="text-xs text-slate-400"><span className="font-bold" style={{ color: RED }}>AI format rule:</span> {content.hint}</p>
        </div>

        {/* Loading overlay */}
        {regenerating && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 mb-5 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: RED }} />
            </div>
            <p className="text-sm font-bold" style={{ color: DARK }}>Rewriting for {content.label}…</p>
            <p className="text-xs text-slate-400">Applying {content.label} tone, length constraints, and format rules</p>
          </div>
        )}

        {/* Content panel */}
        {!regenerating && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            {/* AI rewrite badge */}
            {isRewritten && (
              <div className="flex items-center gap-2 px-5 py-2.5 border-b" style={{ backgroundColor: "#FFF5F5", borderColor: "#FECACA" }}>
                <Zap size={12} style={{ color: RED }} />
                <span className="text-xs font-bold" style={{ color: RED }}>AI rewrite — optimised for {content.label} format</span>
                <span className="ml-auto text-xs text-slate-400">v2</span>
              </div>
            )}

            {/* Teams */}
            {channel === "teams" && (
              <div className="p-5">
                <div className="rounded-xl p-4 text-white" style={{ backgroundColor: DARK }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">IT</div>
                    <div>
                      <div className="text-sm font-bold">IT Communications · #all-staff</div>
                      <div className="text-xs text-white/50">Today at 10:25 AM</div>
                    </div>
                  </div>
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{isRewritten ? CHANNEL_CONTENT.teams.v2 : CHANNEL_CONTENT.teams.v1}</pre>
                </div>
              </div>
            )}

            {/* Outlook */}
            {channel === "outlook" && (
              <div className="p-5">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500">
                      Subject: <span className="font-bold" style={{ color: DARK }}>
                        {isRewritten
                          ? "IMPORTANT NOTICE: SAP System Maintenance — Mandatory Action Required by 11:55 PM Tonight"
                          : "URGENT: SAP System Maintenance — Action Required Tonight by 11:55 PM"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">To: <span className="font-semibold" style={{ color: DARK }}>All Staff (VOIS) &lt;all-staff@vois.com&gt;</span></div>
                    {isRewritten && <div className="text-xs text-slate-500">Priority: <span className="font-semibold text-red-600">High</span></div>}
                  </div>
                  <div className="p-4">
                    <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700">{isRewritten ? CHANNEL_CONTENT.outlook.v2 : CHANNEL_CONTENT.outlook.v1}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Push */}
            {channel === "push" && (
              <div className="p-5">
                <div className="flex justify-center mb-4">
                  <div className="w-80 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: DARK }}>
                      <VodafoneIcon size={20} />
                      <span className="text-white text-xs font-bold">Vodannounce — VOIS</span>
                      <span className="text-white/40 text-xs ml-auto">now</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold mb-1.5" style={{ color: DARK }}>{pushMsg.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{pushMsg.body}</p>
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: RED }}>Acknowledge</button>
                        <button className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">View Details</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 font-bold mb-1">Title length</p>
                    <p className="font-bold" style={{ color: pushMsg.title.length > 50 ? RED : "#16a34a" }}>{pushMsg.title.length} / 50 chars</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 font-bold mb-1">Body length</p>
                    <p className="font-bold" style={{ color: pushMsg.body.length > 100 ? RED : "#16a34a" }}>{pushMsg.body.length} / 100 chars</p>
                  </div>
                </div>
              </div>
            )}

            {/* SMS */}
            {channel === "sms" && (
              <div className="p-5">
                <div className="flex justify-center mb-4">
                  <div className="w-80 space-y-2">
                    <div className="text-white px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ backgroundColor: DARK }}>
                      {smsMsg.text}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs text-slate-400">SMS · English</p>
                      <p className="text-xs font-bold" style={{ color: smsMsg.chars > 160 ? RED : "#16a34a" }}>{smsMsg.chars} / 160 chars</p>
                    </div>
                  </div>
                </div>
                <div className="max-w-sm mx-auto bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                  <p className="font-bold text-slate-600 mb-1">SMS format rules applied</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-500" /> Sender prefix [VOIS] included</li>
                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-500" /> No URLs — callback number only</li>
                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-500" /> Reply keyword for confirmation</li>
                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-500" /> Plain text — no emoji or markdown</li>
                  </ul>
                </div>
              </div>
            )}

            {/* FAQ */}
            {channel === "faq" && (
              <div className="p-5">
                <div className="space-y-3">
                  {(isRewritten ? CHANNEL_CONTENT.faq.v2 : CHANNEL_CONTENT.faq.v1).map(({ q, a }) => (
                    <div key={q} className="border border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-bold mb-1.5" style={{ color: DARK }}>Q: {q}</p>
                      <p className="text-sm text-slate-600">A: {a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
            <Pencil size={14} /> Edit Content
          </button>
          <button
            onClick={() => nav("approval")}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-colors"
            style={{ backgroundColor: RED }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_RED)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
          >
            Proceed to Approval <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function WebApproval({ nav, onApprove }: { nav: (v: WebView) => void; onApprove: () => void }) {
  const [checked, setChecked] = useState(false);
  const handleApprove = () => { onApprove(); nav("monitoring"); };
  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("content-preview")} className="text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: DARK }}>Review & Approve</h1>
            <p className="text-sm text-slate-400 mt-0.5">Final review before sending to 2,092 recipients</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <PriorityBadge p="critical" />
              <h2 className="text-lg font-bold mt-2" style={{ color: DARK }}>SAP System Maintenance Window</h2>
            </div>
            <StatusBadge s="draft" />
          </div>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed border-l-4 pl-3" style={{ borderLeftColor: RED }}>
            Dear all, We have scheduled emergency maintenance for the SAP system tonight from 12:00 AM to 4:00 AM. All users must save their work and log out by 11:55 PM.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Audience", value: "All Employees · 2,092 recipients", icon: Users },
              { label: "Channels", value: "Teams, Outlook, Mobile Push, SMS", icon: Radio },
              { label: "Schedule", value: "Send now · November 15, 2024", icon: Calendar },
              { label: "Deadline", value: "November 15, 2024 at 11:55 PM", icon: Clock },
              { label: "Fallback Strategy", value: "SMS for undelivered within 15 min", icon: Shield },
              { label: "Acknowledgement", value: "Required from all recipients", icon: CheckCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F4F4F4] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">{label}</p>
                  <p className="text-sm font-bold" style={{ color: DARK }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-700">Before you send</p>
          </div>
          <div className="space-y-2.5">
            {["I have reviewed the announcement content and it is accurate", "The audience selection is correct for this communication", "The schedule and deadline have been verified"].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center bg-amber-500 border-amber-500">
                  <Check size={10} className="text-white" />
                </div>
                <span className="text-sm text-amber-700">{item}</span>
              </div>
            ))}
            <label className="flex items-start gap-2.5 cursor-pointer" onClick={() => setChecked(c => !c)}>
              <div className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${checked ? "bg-amber-500 border-amber-500" : "border-amber-300 bg-white"}`}>
                {checked && <Check size={10} className="text-white" />}
              </div>
              <span className="text-sm font-bold text-amber-700">I acknowledge this is a critical communication and understand it will be sent immediately</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => nav("content-preview")} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Pencil size={14} /> Edit
          </button>
          <button className="px-4 py-2.5 border rounded-xl text-sm font-bold transition-colors flex items-center gap-2" style={{ borderColor: DARK, color: DARK }}>
            <Calendar size={14} /> Schedule
          </button>
          <button
            onClick={handleApprove}
            disabled={!checked}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: RED }}
          >
            <Send size={14} /> Approve & Send
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryChart() {
  const W = 600; const H = 160; const PAD = { t: 8, r: 8, b: 28, l: 36 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const max = 1847;
  const series = [
    { key: "sent", color: DARK, label: "Sent" },
    { key: "delivered", color: "#6366f1", label: "Delivered" },
    { key: "acked", color: "#22c55e", label: "Acknowledged" },
  ] as const;
  const xPos = (i: number) => PAD.l + (i / (CHART_DATA.length - 1)) * cW;
  const yPos = (v: number) => PAD.t + cH - (v / max) * cH;
  const pathD = (key: "sent" | "delivered" | "acked") =>
    CHART_DATA.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d[key])}`).join(" ");
  const areaD = (key: "sent" | "delivered" | "acked") =>
    `${pathD(key)} L${xPos(CHART_DATA.length - 1)},${PAD.t + cH} L${PAD.l},${PAD.t + cH} Z`;
  const yTicks = [0, 500, 1000, 1500];
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 192 }}>
        {/* Grid lines */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.l} x2={PAD.l + cW} y1={yPos(v)} y2={yPos(v)} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD.l - 4} y={yPos(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{v === 0 ? "" : v}</text>
          </g>
        ))}
        {/* X labels */}
        {CHART_DATA.map((d, i) => (
          <text key={d.time} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.time}</text>
        ))}
        {/* Area fills */}
        {series.map(s => (
          <path key={s.key} d={areaD(s.key)} fill={s.color} fillOpacity={0.08} />
        ))}
        {/* Lines */}
        {series.map(s => (
          <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Hover zones */}
        {CHART_DATA.map((d, i) => (
          <rect
            key={d.time}
            x={xPos(i) - cW / (CHART_DATA.length * 2)}
            y={PAD.t}
            width={cW / CHART_DATA.length}
            height={cH}
            fill="transparent"
            onMouseEnter={e => setTooltip({ x: xPos(i), y: PAD.t + 8, idx: i })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: "crosshair" }}
          />
        ))}
        {/* Tooltip line */}
        {tooltip && (
          <>
            <line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + cH} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 2" />
            {series.map(s => (
              <circle key={s.key} cx={tooltip.x} cy={yPos(CHART_DATA[tooltip.idx][s.key])} r={3} fill={s.color} />
            ))}
          </>
        )}
      </svg>
      {/* Tooltip box */}
      {tooltip && (
        <div className="absolute bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs pointer-events-none z-10" style={{ left: tooltip.x + 8, top: tooltip.y }}>
          <p className="font-bold mb-1 text-slate-500">{CHART_DATA[tooltip.idx].time}</p>
          {series.map(s => (
            <p key={s.key} style={{ color: s.color }} className="font-semibold">{s.label}: {CHART_DATA[tooltip.idx][s.key].toLocaleString()}</p>
          ))}
        </div>
      )}
      {/* Legend */}
      <div className="flex items-center gap-4 mt-1">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebLiveMonitoring({ nav }: { nav: (v: WebView) => void }) {
  const [reminderSent, setReminderSent] = useState(false);
  const stats = [
    { label: "Queued", value: "245", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
    { label: "Sent", value: "1,847", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Delivered", value: "1,823", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
    { label: "Opened", value: "1,654", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { label: "Acknowledged", value: "1,432", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    { label: "Failed", value: "24", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
    { label: "Escalated", value: "5", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  ];
  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">LIVE</span>
            </span>
            <span className="text-xs text-slate-400">Last updated: just now · Auto-refreshing</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: DARK }}>SAP System Maintenance Window</h1>
          <p className="text-sm text-slate-400 mt-0.5">Started Nov 15, 2024 at 10:25 AM · Critical Priority</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (!reminderSent) setReminderSent(true); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${reminderSent ? "bg-green-50 text-green-700 border border-green-200" : "text-white"}`}
            style={reminderSent ? {} : { backgroundColor: RED }}
          >
            {reminderSent ? <><Check size={14} /> Reminder Sent!</> : <><Bell size={14} /> Send Reminder</>}
          </button>
          <button onClick={() => nav("history")} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-3 text-center`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 font-bold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Acknowledgement Rate</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold" style={{ color: DARK }}>77.6%</span>
              <span className="text-sm text-green-600 font-bold mb-1">Target: 85%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">1,432 / 1,847</p>
            <p className="text-xs text-slate-400">acknowledged</p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: "77.6%", background: `linear-gradient(to right, ${RED}, #f59e0b, #22c55e)` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0%</span><span className="text-green-600 font-bold">Target 85%</span><span>100%</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold mb-4" style={{ color: DARK }}>Delivery Timeline</h3>
        <DeliveryChart />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold" style={{ color: DARK }}>Recipient Status</h3>
          <div className="flex items-center gap-2 bg-[#F4F4F4] rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-400" />
            <input placeholder="Search recipients..." className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-32" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              {["Name", "Department", "Status", "Timestamp"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {RECIPIENTS.map(r => (
                <tr key={r.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: DARK }}>{r.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.dept}</td>
                  <td className="px-4 py-3"><RecipientStatusDot s={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">Showing 8 of 2,092 recipients · <button className="font-bold hover:underline" style={{ color: RED }}>View all →</button></p>
        </div>
      </div>
    </div>
  );
}

function WebCampaignHistory({ nav }: { nav: (v: WebView) => void }) {
  const [search, setSearch] = useState("");
  const filtered = CAMPAIGNS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: DARK }}>Campaign History</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"><Filter size={14} /> Filter</button>
          <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"><Download size={14} /> Export</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: "45", color: DARK },
          { label: "Successful", value: "38", color: "#16a34a" },
          { label: "Ongoing", value: "3", color: "#2563eb" },
          { label: "Failed", value: "4", color: RED },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 font-bold mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns by name..." className="flex-1 bg-transparent text-sm placeholder-slate-400 outline-none" style={{ color: DARK }} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              {["Campaign Name", "Priority", "Date Sent", "Status", "Ack Rate", "Audience", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold max-w-[220px]" style={{ color: DARK }}><div className="truncate">{c.name}</div></td>
                  <td className="px-4 py-3"><PriorityBadge p={c.priority} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.date}</td>
                  <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${c.ackRate}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{c.ackRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.audience.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => nav(c.status === "live" ? "monitoring" : "detail")} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center"><p className="text-slate-400 text-sm">No campaigns found matching &quot;{search}&quot;</p></div>
        )}
      </div>
    </div>
  );
}

function WebCampaignDetail({ nav }: { nav: (v: WebView) => void }) {
  const c = CAMPAIGNS[1];
  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("history")} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: DARK }}>Campaign Detail</h1>
            <p className="text-sm text-slate-400 mt-0.5">{c.name}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-2 flex-wrap"><PriorityBadge p={c.priority} /><StatusBadge s={c.status} /></div>
            <span className="text-xs text-slate-400">{c.date}</span>
          </div>
          <h2 className="text-lg font-bold" style={{ color: DARK }}>{c.name}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">Updated holiday schedule and leave policy for 2025 is now available on the HR portal. All employees are required to review and acknowledge the changes by November 20, 2024. Key changes include revised public holiday entitlements, updated leave application procedures, and new remote work leave categories.</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {[
              { label: "Total Sent", value: "2,092" },
              { label: "Delivered", value: "2,078 (99.3%)" },
              { label: "Acknowledged", value: `${Math.round(c.audience * c.ackRate / 100).toLocaleString()} (${c.ackRate}%)` },
              { label: "Failed", value: "14 (0.7%)" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-bold">{label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: DARK }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Web Layout ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "create", label: "Create Campaign", icon: Plus },
  { id: "monitoring", label: "Live Monitoring", icon: Activity },
  { id: "history", label: "Campaign History", icon: Archive },
];

function activeNavId(view: WebView) {
  if (["ai-plan", "content-preview", "approval"].includes(view)) return "create";
  if (view === "detail") return "history";
  return view;
}

function WebLayout({ children, nav, current, sidebar, setSidebar, userFull, userInitials, onLogout }: {
  children: ReactNode;
  nav: (v: WebView) => void;
  current: WebView;
  sidebar: boolean;
  setSidebar: (v: boolean) => void;
  userFull: string;
  userInitials: string;
  onLogout: () => void;
}) {
  if (current === "login") return <>{children}</>;
  const active = activeNavId(current);
  return (
    <div className="flex h-full" style={{ background: BG }}>
      {sidebar && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebar(false)} />}
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${sidebar ? "translate-x-0" : "-translate-x-full"}`} style={{ backgroundColor: DARK }}>
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <VodafoneIcon size={30} />
            <div>
              <div className="text-white font-bold text-sm leading-tight">Vodannounce</div>
              <div className="text-white/40 text-[10px]">VOIS Sender Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { nav(id as WebView); setSidebar(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={active === id ? { backgroundColor: "rgba(255,255,255,0.1)", color: "white" } : { color: "rgba(255,255,255,0.5)" }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="md:hidden text-slate-500 hover:text-slate-700 transition-colors" onClick={() => setSidebar(true)}><Menu size={20} /></button>
          <div className="flex-1 flex items-center gap-2 max-w-xs bg-[#F4F4F4] rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-400" />
            <input placeholder="Search campaigns..." className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none flex-1" />
          </div>
          <div className="flex-1" />
          <button className="relative text-slate-400 hover:text-slate-700 transition-colors p-1.5">
            <Bell size={17} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: RED }}>3</span>
          </button>
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: RED }}>{userInitials}</div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold" style={{ color: DARK }}>{userFull}</div>
              <div className="text-[10px] text-slate-400">IT Communications</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<WebView>("login");
  const [sidebar, setSidebar] = useState(false);
  const [campaignLive, setCampaignLive] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const nav = (v: WebView) => { setView(v); setSidebar(false); };
  const userName = extractName(userEmail);

  const renderScreen = () => {
    switch (view) {
      case "login": return <WebLogin onLogin={(email) => { setUserEmail(email); nav("dashboard"); }} />;
      case "dashboard": return <WebDashboard nav={nav} firstName={userName.first} />;
      case "create": return <WebCreateCampaign nav={nav} />;
      case "ai-plan": return <WebAIPlan nav={nav} />;
      case "content-preview": return <WebContentPreview nav={nav} />;
      case "approval": return <WebApproval nav={nav} onApprove={() => setCampaignLive(true)} />;
      case "monitoring": return <WebLiveMonitoring nav={nav} />;
      case "history": return <WebCampaignHistory nav={nav} />;
      case "detail": return <WebCampaignDetail nav={nav} />;
      default: return <WebDashboard nav={nav} firstName={userName.first} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden" style={{ background: BG }}>
      {view !== "login" && (
        <div className="h-10 flex items-center justify-between px-4 flex-shrink-0" style={{ backgroundColor: DARK }}>
          <div className="flex items-center gap-2">
            <VodafoneIcon size={20} />
            <span className="text-white font-bold text-sm">Vodannounce</span>
            <span className="text-white/30 text-xs hidden sm:block">· Sender Portal</span>
          </div>
          <div className="flex items-center gap-3">
            {campaignLive && (
              <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">CAMPAIGN LIVE</span>
              </span>
            )}
            <span className="text-white/30 text-xs hidden sm:block">VOIS · Vodafone</span>
          </div>
        </div>
      )}
      <div className="overflow-hidden" style={{ height: view !== "login" ? "calc(100% - 40px)" : "100%" }}>
        <WebLayout
          nav={nav}
          current={view}
          sidebar={sidebar}
          setSidebar={setSidebar}
          userFull={userName.full}
          userInitials={userName.initials}
          onLogout={() => { setView("login"); setUserEmail(""); setCampaignLive(false); }}
        >
          {renderScreen()}
        </WebLayout>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── SCRIPTS ────────────────────────────────────────────────
const DEFAULT_SCRIPTS = [
  {
    name: 'VINHUNTER',
    color: '#14F1C6',
    sections: [
      { label: 'OPENER', text: "Hey, is this [CONTACT_NAME]? Hey [FIRST_NAME], this is Chase calling from VinHunter — VinLedger AI Live — quick question for you..." },
      { label: 'HOOK', text: "Right now, when a buyer Googles one of your VINs before calling you — what do they find? Because we put a Trust Score, recall info, and a branded page on every vehicle on your lot, overnight. So instead of them finding sketchy third-party data, they find your dealership." },
      { label: 'DIFFERENTIATOR', text: "CARFAX charges dealers $99 to $300 a month just for reports. We give you unlimited reports, SEO-indexed inventory pages, lead capture, AND a full shop CRM to replace Tekmetric — all for $249 a month." },
      { label: 'CLOSE', text: "We're doing a founding partner rate right now — price is locked forever at whatever you sign up at. Can I send you a quick walkthrough link? Takes about 3 minutes to see what your lot would look like." },
      { label: 'CROSS-SELL', text: "Also — we have EconoClaw, 21 AI agents for $99/mo, great for your lead follow-up and review management. Dealers using both see a big lift in close rate." }
    ]
  },
  {
    name: 'ECONOCLAW',
    color: '#FF6B2B',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — do you have anyone working your business 24/7, handling leads, answering questions, following up? Because most businesses don't." },
      { label: 'HOOK', text: "We deploy 21 specialized AI agents to your business. They handle customer service, content, research, outreach, analytics — all while you sleep. It's like hiring a full department, except it costs $99 a month." },
      { label: 'COMPARISON', text: "An agency would charge you $5,000 setup and $1,500 a month for this. We're at $500 setup and $99 a month during our launch window. After the window closes it goes to $299 — but founding customers keep $99 forever." },
      { label: 'CLOSE', text: "Can I send you a 2-minute breakdown of exactly what the 21 agents do? No pitch call needed — just read it and tell me if it makes sense for your business." },
      { label: 'CROSS-SELL', text: "If you're in auto — we also have VinHunter at $99/mo, puts a Google-indexed Trust Score page on every VIN on your lot overnight. Most dealers see it pay for itself in the first week." }
    ]
  },
  {
    name: 'WHITEGLOVECLAW',
    color: '#FFD600',
    sections: [
      { label: 'OPENER', text: "Good [morning/afternoon] [CONTACT_NAME], I'm reaching out because we deploy enterprise-grade AI infrastructure for executive teams and founders who want the full white-glove experience." },
      { label: 'POSITIONING', text: "SetupClaw is the market leader in this space — we offer identical scope, identical hardening, identical deliverables, at 20% below their pricing. Same 24/7 infrastructure, same 14-day hypercare, same-day go-live." },
      { label: 'TIERS', text: "Hosted VPS at $2,400. Mac Mini with iMessage integration at $4,000. In-person deployment at $4,800. Additional specialized agents at $1,200 each." },
      { label: 'CLOSE', text: "I'd love to schedule a 15-minute call to understand your specific needs. What does your week look like?" },
      { label: 'CROSS-SELL', text: "We also have RentAClaw if you want to test before committing — $49/week gets you all 21 agents. Rental payments apply toward the full deployment." }
    ]
  },
  {
    name: 'RENTACLAW',
    color: '#3B8FFF',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — have you looked into AI agents for your business? Not asking you to commit to anything — we actually rent them." },
      { label: 'CONCEPT', text: "Think of it like renting a car. Daily at $9, weekly at $49, monthly at $149, annual at $999. You get all 21 agents for whatever period you need. Use them for a campaign, a product launch, a busy season — then pause." },
      { label: 'FLEXIBILITY', text: "We also accept IOU arrangements and revenue share if cash flow is tight. We're flexible because we want you to try it and see the value before you commit." },
      { label: 'CLOSE', text: "Want to try a week for $49? If it doesn't generate at least $49 in value, I'll give you your money back personally." },
      { label: 'CROSS-SELL', text: "After the rental, most customers convert to EconoClaw at $99/mo — and rental payments count toward the setup fee." }
    ]
  },
  {
    name: 'BUDGETCLAW',
    color: '#39FF14',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — what are you currently paying for Zapier, HubSpot, and any VA or freelancer help?" },
      { label: 'MATH', text: "Year 1 their way typically runs $6,188. BudgetClaw runs $2,687. Same outcomes — 21 AI agents replacing all of it. No setup fee on annual plans." },
      { label: 'PLANS', text: "Micro at $199/mo, Standard at $299/mo, Pro at $499/mo. All plans include the full 21-agent suite. No per-agent pricing, no platform fees on top." },
      { label: 'CLOSE', text: "Can I send you a side-by-side breakdown? Takes 2 minutes to see exactly what you're paying now vs what you'd pay with us." },
      { label: 'CROSS-SELL', text: "After you're running BudgetClaw, the EconoClaw launch rate at $99/mo is still available for your founding lock — price never increases once you're in." }
    ]
  },
  {
    name: 'TRANSBID',
    color: '#BF00FF',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], I'm calling about a contracting platform that charges zero upfront and only takes a cut when you actually win a job. You familiar with TransBid?" },
      { label: 'HOOK', text: "HomeAdvisor charges $15 to $30 per lead — whether they hire you or not. We charge zero upfront, and only 0.5% of the job value when you win. If you don't win, you don't pay anything." },
      { label: 'VETERANS', text: "If you're a veteran-owned business, you pay 0% forever. No commission, no fees. Public bidding means every bid is visible — no inflated quotes hiding lead fees." },
      { label: 'CLOSE', text: "Can I send you the link to post your first project? It's free to list, free to browse, and you only pay if you win work through the platform." },
      { label: 'CROSS-SELL', text: "We also have EconoClaw — 21 AI agents that handle your lead follow-up, proposals, and customer service for $99/mo. Contractors using both close significantly more jobs." }
    ]
  },
  {
    name: 'CLAWAWAY',
    color: '#2EFF9A',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME] — I'm going to be straight with you. We build AI systems. We're flexible on what we build, what you pay, and how you pay it." },
      { label: 'CORE MESSAGE', text: "Tell us what you want to build. Tell us what you want to pay. Tell us how you want to pay it. Card, ACH, Zelle, CashApp, crypto, rev share, equity, even barter. We'll figure it out." },
      { label: 'PROOF', text: "We're already running 21 AI agents across five live platforms. We know how to build this stuff. What we care about is getting you results, not getting you to sign a specific package." },
      { label: 'CLOSE', text: "What's the one thing in your business right now that's eating the most time or costing the most money? Let's start there." },
      { label: 'CROSS-SELL', text: "All 7 of our products are on the table — VinHunter, EconoClaw, WhiteGloveClaw, RentAClaw, BudgetClaw, TransBid, and ClawAway. Whatever fits, we'll make it work." }
    ]
  }
];

// Product-aware SMS templates
const SMS_TEMPLATES = {
  'VINHUNTER': (name) => `Chase @ VinHunter: Hey ${name}, just tried reaching you. Free lot audit shows what buyers find when they Google your VINs — see all plans at https://vinledgerai.live/pricing Founding rate locks forever. Reply STOP to opt out.`,
  'ECONOCLAW': (name) => `Chase @ EconoClaw: Hey ${name}, 21 AI agents working your business 24/7 for $99/mo. Launch pricing locks forever for founding customers. Details: https://econoclaw.vercel.app Reply STOP to opt out.`,
  'WHITEGLOVECLAW': (name) => `Chase @ WhiteGloveClaw: Hey ${name}, full AI infrastructure deployment at 20% below market. VPS $2,400 · Mac Mini $4,000 · In-person $4,800. Let's talk: (850) 341-4324. Reply STOP to opt out.`,
  'RENTACLAW': (name) => `Chase @ RentAClaw: Hey ${name}, try 21 AI agents for $49/week — no commitment. If it doesn't generate value, personal refund. Details: https://econoclaw.vercel.app Reply STOP to opt out.`,
  'BUDGETCLAW': (name) => `Chase @ BudgetClaw: Hey ${name}, quick math — your current stack probably costs $6,188/yr. Ours costs $2,687. 21 agents, replaces Zapier + HubSpot + VA. Details: https://econoclaw.vercel.app Reply STOP to opt out.`,
  'TRANSBID': (name) => `Chase @ TransBid: Hey ${name}, 0.5% only when you win — zero upfront. Veterans 0% forever. No HomeAdvisor hidden fees. Post your first project free: https://transbid.live Reply STOP to opt out.`,
  'CLAWAWAY': (name) => `Chase @ ClawAway: Hey ${name}, build what you want, pay how you want — card, crypto, rev share, barter. Let's talk: (850) 341-4324. Reply STOP to opt out.`,
};

function getSMSTemplate(scriptName, contactName) {
  const key = Object.keys(SMS_TEMPLATES).find(k => scriptName?.toUpperCase().includes(k)) || 'VINHUNTER';
  return SMS_TEMPLATES[key](contactName || 'there');
}

// ─── SKINS ───────────────────────────────────────────────────
const SKINS = {
  DEFAULT:     { accent: '#14F1C6', accentDim: '#0A9478', label: 'DEFAULT',     icon: '⚡' },
  CYBERCLAW:   { accent: '#BF00FF', accentDim: '#7A00AA', label: 'CYBERCLAW',   icon: '💜' },
  GOTHICCLAW:  { accent: '#CC0000', accentDim: '#880000', label: 'GOTHICCLAW',  icon: '🩸' },
  TACTICLAW:   { accent: '#7FFF00', accentDim: '#4ABF00', label: 'TACTICLAW',   icon: '🎯' },
  ECONOSKIN:   { accent: '#FF6B2B', accentDim: '#CC4400', label: 'ECONOSKIN',   icon: '🔥' },
  BUDGETSKIN:  { accent: '#39FF14', accentDim: '#20CC00', label: 'BUDGETSKIN',  icon: '📊' },
};

// ─── STYLES ─────────────────────────────────────────────────
const buildCSS = (skin) => `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080A0F; --surface: #0D1017; --surface2: #121820; --surface3: #1A2230;
    --border: #1E2D40; --border2: #243344;
    --accent: ${skin.accent}; --accent-dim: ${skin.accentDim};
    --teal: #14F1C6; --teal-dim: #0A9478;
    --orange: #FF6B2B; --red: #FF3B3B; --green: #2EFF9A; --yellow: #FFD600; --blue: #3B8FFF;
    --text: #E8EDF5; --text-dim: #6B7A8D; --text-mid: #9AAABB;
    --display: 'Bebas Neue', sans-serif; --mono: 'DM Mono', monospace; --ui: 'Barlow Condensed', sans-serif;
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--ui); overflow: hidden; }
  body::before { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px); pointer-events: none; z-index: 9999; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border2); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes flash { 0%{box-shadow:0 0 0 rgba(20,241,198,0)} 50%{box-shadow:0 0 60px rgba(20,241,198,0.4)} 100%{box-shadow:0 0 0 rgba(20,241,198,0)} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @media (max-width: 900px) {
    .desktop-only { display: none !important; }
    .mobile-grid { display: flex !important; flex-direction: column !important; }
  }
  @media (min-width: 901px) {
    .mobile-only { display: none !important; }
  }
`;

// ─── HELPERS ────────────────────────────────────────────────
function fmtTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
function storageGet(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
function isValidPhone(p) { return (p||'').replace(/\D/g,'').length >= 10 }

// ─── LOGIN SCREEN ────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (pw === 'claw2026') { onLogin(); }
    else {
      setErr(true); setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#080A0F',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(20,241,198,0.04) 0%, transparent 70%)',pointerEvents:'none'}}></div>
      <div style={{textAlign:'center',animation:'slideUp 0.4s ease',transform:shake?'translateX(-8px)':'none',transition:'transform 0.1s'}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:48,letterSpacing:8,color:'#14F1C6',textShadow:'0 0 40px rgba(20,241,198,0.4)',marginBottom:4}}>CLAW DIALER</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#6B7A8D',letterSpacing:4,marginBottom:40}}>// COMMAND CENTER · AUTHORIZED ACCESS ONLY</div>
        <div style={{background:'#0D1017',border:'1px solid #1E2D40',borderRadius:4,padding:32,width:340}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#6B7A8D',letterSpacing:2,textAlign:'left',marginBottom:8}}>ACCESS CODE</div>
          <input
            type="password"
            value={pw}
            onChange={e=>{setPw(e.target.value);setErr(false)}}
            onKeyDown={e=>e.key==='Enter'&&attempt()}
            placeholder="••••••••"
            autoFocus
            style={{width:'100%',background:'#121820',border:`1px solid ${err?'#FF3B3B':'#243344'}`,color:'#E8EDF5',fontFamily:'DM Mono,monospace',fontSize:16,padding:'12px 14px',outline:'none',borderRadius:2,letterSpacing:4,marginBottom:err?8:16,textAlign:'center'}}
          />
          {err && <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#FF3B3B',marginBottom:12,letterSpacing:1}}>ACCESS DENIED</div>}
          <button onClick={attempt} style={{width:'100%',padding:'13px',background:'#14F1C6',color:'#080A0F',fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:4,border:'none',cursor:'pointer',borderRadius:2}}>
            AUTHENTICATE
          </button>
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#1E2D40',marginTop:20,letterSpacing:2}}>SOLANA SOLAR SOLUTIONS · v7.0</div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function ClawDialer() {
  const [authed, setAuthed] = useState(() => storageGet('claw_authed', false));
  const [contacts, setContacts] = useState(() => storageGet('claw_contacts', []));
  const [callLog, setCallLog] = useState(() => storageGet('claw_calllog', []));
  const [scripts, setScripts] = useState(() => storageGet('claw_scripts', DEFAULT_SCRIPTS));
  const [activeIdx, setActiveIdx] = useState(null);
  const [tab, setTab] = useState('dialer');
  const [mobilePanel, setMobilePanel] = useState('leads'); // leads | dial | log
  const [scriptIdx, setScriptIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [callState, setCallState] = useState('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [callSid, setCallSid] = useState(null);
  const [aiMode, setAiMode] = useState(() => storageGet('claw_aimode', false));
  const [notes, setNotes] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [agentPaused, setAgentPaused] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null); // server agent status
  const [notification, setNotification] = useState(null);
  const [smsModal, setSmsModal] = useState(false);
  const [smsBody, setSmsBody] = useState('');
  const [clock, setClock] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', business_name:'', phone:'', email:'', list_name:'' });
  const [skin, setSkin] = useState(() => storageGet('claw_skin', 'DEFAULT'));
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [vinState, setVinState] = useState('FL');
  const [vinLoading, setVinLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tcpaOk, setTcpaOk] = useState(true);

  const timerRef = useRef(null);
  const agentRef = useRef(null);
  const agentModeRef = useRef(false);
  const agentPausedRef = useRef(false);
  const agentStatusRef = useRef(null);

  agentModeRef.current = agentMode;
  agentPausedRef.current = agentPaused;

  const currentSkin = SKINS[skin] || SKINS.DEFAULT;

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Clock + TCPA check
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US',{hour12:false}));
      const h = now.getHours();
      setTcpaOk(h >= 8 && h < 21);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Server agent poll
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const r = await fetch('/api/agent?action=status');
        const d = await r.json();
        setAgentStatus(d);
        agentStatusRef.current = d;
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => { storageSet('claw_contacts', contacts) }, [contacts]);
  useEffect(() => { storageSet('claw_calllog', callLog) }, [callLog]);
  useEffect(() => { storageSet('claw_scripts', scripts) }, [scripts]);
  useEffect(() => { storageSet('claw_skin', skin) }, [skin]);
  useEffect(() => { storageSet('claw_aimode', aiMode) }, [aiMode]);

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const activeContact = activeIdx !== null ? contacts[activeIdx] : null;

  const filteredContacts = contacts.filter(c => {
    if (c.dnc) return false;
    const ms = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.business_name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search);
    const mf = statusFilter === 'all' || c.status === statusFilter;
    return ms && mf;
  });

  function selectContact(idx) {
    setActiveIdx(idx);
    setNotes(contacts[idx]?.notes || '');
    setSmsBody(getSMSTemplate(scripts[scriptIdx]?.name, contacts[idx]?.name));
    if (isMobile) setMobilePanel('dial');
  }

  function updateContactStatus(idx, status) {
    setContacts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status, notes };
      return next;
    });
  }

  function markDNC(idx) {
    setContacts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], dnc: true, status: 'dnc' };
      return next;
    });
    notify('Contact marked DNC', 'warning');
    setActiveIdx(null);
  }

  function bulkDelete() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;
    setContacts(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    notify(`Deleted ${selectedIds.size} contacts`, 'warning');
  }

  function bulkDNC() {
    if (!selectedIds.size) return;
    setContacts(prev => prev.map(c => selectedIds.has(c.id) ? {...c, dnc:true, status:'dnc'} : c));
    setSelectedIds(new Set());
    setSelectMode(false);
    notify(`Marked ${selectedIds.size} as DNC`, 'warning');
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) return notify('CSV appears empty', 'warning');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''));
      const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('business') && !h.includes('company'));
      const bizIdx = headers.findIndex(h => h.includes('business') || h.includes('company') || h.includes('biz'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('cell'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const newOnes = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g,''));
        const phone = phoneIdx>=0 ? cols[phoneIdx] : '';
        const email = emailIdx>=0 ? cols[emailIdx] : '';
        if (!phone && !email) continue;
        newOnes.push({ id: Date.now()+i, name: nameIdx>=0?cols[nameIdx]:'', business_name: bizIdx>=0?cols[bizIdx]:'', phone, email, status:'new', notes:'', list_name: file.name.replace('.csv',''), created_at: new Date().toISOString() });
      }
      setContacts(prev => [...prev, ...newOnes]);
      notify(`Imported ${newOnes.length} contacts`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function loadVinLedger() {
    setVinLoading(true);
    try {
      const r = await fetch(`https://vinledgerai.live/api/dealers/export?has_phone=true&limit=500${vinState?`&state=${vinState}`:''}`);
      const data = await r.json();
      const dealers = (data.dealers || data || []).filter(d => d.phone);
      const mapped = dealers.map((d, i) => ({
        id: Date.now()+i,
        name: d.name || d.contact_name || '',
        business_name: d.business_name || d.name || '',
        phone: d.phone,
        email: d.email || '',
        status: 'new', notes: '',
        list_name: `VinLedger-${vinState}`,
        created_at: new Date().toISOString()
      }));
      setContacts(prev => [...prev, ...mapped]);
      notify(`Loaded ${mapped.length} dealers from VinLedger (${vinState})`, 'success');
    } catch (err) {
      notify(`VinLedger load failed: ${err.message}`, 'warning');
    }
    setVinLoading(false);
  }

  async function startCall() {
    if (activeIdx === null) return notify('Select a contact first', 'warning');
    if (!activeContact.phone) return notify('No phone number', 'warning');
    if (!isValidPhone(activeContact.phone)) return notify('Invalid phone number', 'warning');
    if (!tcpaOk) return notify('TCPA: Outside 8am-9pm calling window', 'warning');
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeContact.phone,
          contactId: activeContact.id,
          contactName: activeContact.name,
          contactEmail: activeContact.email || '',
          script: scripts[scriptIdx]?.name,
          aiMode
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`Dialing ${activeContact.name || activeContact.phone}...`, 'info');
    } catch (err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function endCall() {
    clearInterval(timerRef.current);
    setCallState('ended');
  }

  async function setDisposition(outcome) {
    if (activeIdx === null) return;
    clearInterval(timerRef.current);
    setCallState('idle');
    const entry = {
      id: Date.now(),
      contact_id: activeContact.id,
      name: activeContact.name,
      business: activeContact.business_name,
      phone: activeContact.phone,
      email: activeContact.email,
      outcome,
      duration: callSeconds,
      notes,
      script: scripts[scriptIdx]?.name,
      timestamp: new Date().toISOString()
    };
    setCallLog(prev => [entry, ...prev]);
    const statusMap = { answered:'called', voicemail:'voicemail', callback:'callback', interested:'interested', 'not-interested':'not-interested' };
    updateContactStatus(activeIdx, statusMap[outcome] || 'called');

    if (outcome === 'interested') {
      notify(`🔥 HOT LEAD! Auto-SMS + email firing for ${activeContact.name}`, 'success');
      // Auto SMS
      try {
        await fetch('/api/twilio?action=sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: activeContact.phone, body: getSMSTemplate(scripts[scriptIdx]?.name, activeContact.name) })
        });
      } catch {}
      // Auto Brevo email if we have one
      if (activeContact.email) {
        try {
          await fetch('/api/recordings?action=email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: activeContact.email, contactName: activeContact.name, business: activeContact.business_name, product: scripts[scriptIdx]?.name })
          });
        } catch {}
      }
    }
    setCallSeconds(0);
    setNotes('');
    if (agentModeRef.current && !agentPausedRef.current) {
      agentRef.current = setTimeout(() => agentNext(), 4000);
    }
  }

  function toggleAgent() {
    const next = !agentMode;
    setAgentMode(next);
    if (next) { setAgentPaused(false); notify('Browser Agent Mode ACTIVE', 'info'); setTimeout(() => agentNext(), 1000); }
    else { clearTimeout(agentRef.current); notify('Agent stopped', 'warning'); }
  }

  function agentNext() {
    if (!agentModeRef.current || agentPausedRef.current) return;
    const newOnes = contacts.filter(c => c.status === 'new' && !c.dnc);
    if (newOnes.length === 0) { setAgentMode(false); notify('Agent complete — no new contacts remaining', 'success'); return; }
    const nextIdx = contacts.indexOf(newOnes[0]);
    selectContact(nextIdx);
    setTimeout(() => { if (agentModeRef.current && !agentPausedRef.current) startCall(); }, 1500);
  }

  async function serverAgentAction(action, body = {}) {
    try {
      const r = await fetch(`/api/agent?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      notify(d.message || `Agent ${action}`, 'info');
    } catch (err) { notify(`Agent error: ${err.message}`, 'warning'); }
  }

  async function sendSMS() {
    if (!activeContact?.phone) return notify('No phone number', 'warning');
    if (smsBody.length > 160) return notify('Keep under 160 chars', 'warning');
    try {
      const r = await fetch('/api/twilio?action=sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: activeContact.phone, body: smsBody })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      notify(`SMS sent ✓`, 'success');
      setSmsModal(false);
    } catch (err) { notify(`SMS failed: ${err.message}`, 'warning'); }
  }

  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type:'text/csv'}));
    a.download = filename;
    a.click();
  }

  const totalCalls = callLog.length;
  const answeredCalls = callLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const interestedCalls = callLog.filter(c => c.outcome === 'interested').length;
  const pipeline = interestedCalls * 99;
  const answerRate = totalCalls > 0 ? Math.round(answeredCalls/totalCalls*100) : 0;
  const intRate = totalCalls > 0 ? Math.round(interestedCalls/totalCalls*100) : 0;
  const queuedCount = contacts.filter(c => c.status === 'new' && !c.dnc).length;
  const dncCount = contacts.filter(c => c.dnc).length;
  const statusColor = { idle:'#6B7A8D', dialing:'#FFD600', connected:'#2EFF9A', ended:'#FF6B2B' };
  const statusText = { idle:'STANDBY', dialing:'DIALING...', connected:'CONNECTED', ended:'CALL ENDED' };

  if (!authed) {
    return <LoginScreen onLogin={() => { setAuthed(true); storageSet('claw_authed', true); }} />;
  }

  // ── CONTACTS PANEL ────────────────────────────────────────
  function renderContactsPanel() { return (
    <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)'}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CONTACTS</span>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{filteredContacts.length}/{contacts.length}</span>
          {dncCount > 0 && <span style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--red)',padding:'1px 5px',border:'1px solid var(--red)',borderRadius:2}}>{dncCount} DNC</span>}
          <button onClick={() => { setSelectMode(s=>!s); setSelectedIds(new Set()); }} style={{padding:'3px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1,cursor:'pointer',border:`1px solid ${selectMode?'var(--accent)':'var(--border2)'}`,background: selectMode?'var(--surface3)':'transparent',color: selectMode?'var(--accent)':'var(--text-dim)',borderRadius:2}}>
            {selectMode ? 'CANCEL' : 'SELECT'}
          </button>
        </div>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div style={{padding:'6px 12px',borderBottom:'1px solid var(--border)',background:'rgba(255,59,59,0.05)',display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',flex:1}}>{selectedIds.size} selected</span>
          <button onClick={bulkDNC} style={{padding:'3px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--orange)',background:'transparent',color:'var(--orange)',borderRadius:2}}>DNC ALL</button>
          <button onClick={bulkDelete} style={{padding:'3px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--red)',background:'transparent',color:'var(--red)',borderRadius:2}}>DELETE</button>
        </div>
      )}

      <div style={{padding:'8px 10px',borderBottom:'1px solid var(--border)',display:'flex',gap:6}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'6px 10px',outline:'none',borderRadius:2}} />
        <button onClick={() => setShowAddModal(true)} style={{padding:'6px 10px',background:'var(--accent)',color:'var(--bg)',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:1,border:'none',cursor:'pointer',borderRadius:2,flexShrink:0}}>+ ADD</button>
      </div>

      <div style={{padding:'5px 10px',borderBottom:'1px solid var(--border)',display:'flex',gap:4,flexWrap:'wrap'}}>
        {['all','new','callback','interested','voicemail'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'3px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',border:`1px solid ${statusFilter===f ? 'var(--accent-dim)' : 'var(--border2)'}`,background: statusFilter===f ? 'var(--surface3)' : 'transparent',color: statusFilter===f ? 'var(--accent)' : 'var(--text-dim)',borderRadius:2}}>
            {f === 'all' ? 'ALL' : f === 'new' ? 'NEW' : f === 'callback' ? 'CB' : f === 'interested' ? 'HOT' : 'VM'}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto'}}>
        {filteredContacts.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:11}}>
            <div style={{fontSize:28,marginBottom:10,opacity:0.3}}>📋</div>
            {contacts.length === 0 ? 'Upload CSV or add contacts' : 'No matches'}
          </div>
        ) : filteredContacts.map((c) => {
          const idx = contacts.indexOf(c);
          const sColor = { new:'#3B8FFF', called:'#FFD600', interested:'var(--accent)', voicemail:'#6B7A8D', callback:'#FF6B2B', 'not-interested':'#FF3B3B', dnc:'#FF3B3B' }[c.status||'new'];
          return (
            <div key={c.id} onClick={() => selectMode ? setSelectedIds(prev => { const n=new Set(prev); n.has(c.id)?n.delete(c.id):n.add(c.id); return n; }) : selectContact(idx)}
              style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',gap:8,background: activeIdx===idx ? 'var(--surface3)' : selectedIds.has(c.id) ? 'rgba(255,59,59,0.05)' : 'transparent',borderLeft: activeIdx===idx ? `2px solid var(--accent)` : selectedIds.has(c.id) ? '2px solid var(--red)' : '2px solid transparent',transition:'background 0.15s'}}>
              {selectMode && (
                <div style={{width:14,height:14,border:`1px solid ${selectedIds.has(c.id)?'var(--red)':'var(--border2)'}`,background: selectedIds.has(c.id)?'var(--red)':'transparent',borderRadius:2,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {selectedIds.has(c.id) && <span style={{fontSize:9,color:'white'}}>✓</span>}
                </div>
              )}
              <div style={{width:28,height:28,background:'var(--surface3)',border:'1px solid var(--border2)',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue, sans-serif',fontSize:11,color:'var(--accent)',flexShrink:0}}>{initials(c.name)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'Unknown'}</div>
                <div style={{fontSize:10,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:1}}>{c.business_name||c.phone||'—'}</div>
              </div>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:7,padding:'2px 5px',borderRadius:2,color:sColor,border:`1px solid ${sColor}33`,background:`${sColor}11`,flexShrink:0,letterSpacing:1}}>{(c.status||'NEW').toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
  ); }

  // ── DIALER PANEL ──────────────────────────────────────────
  function renderDialerPanel() { return (
    <div style={{display:'flex',flexDirection:'column',overflow:'hidden',height:'100%'}}>
      {/* Agent mode toggle + stats */}
      <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:11,letterSpacing:3,color:'var(--orange)'}}>BROWSER AGENT</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)'}}>AUTO-DIAL</span>
          <div onClick={toggleAgent} style={{width:34,height:17,background: agentMode ? 'rgba(255,107,43,0.3)' : 'var(--surface3)',border:`1px solid ${agentMode ? 'var(--orange)' : 'var(--border2)'}`,borderRadius:10,cursor:'pointer',position:'relative',transition:'all 0.3s'}}>
            <div style={{position:'absolute',width:11,height:11,borderRadius:'50%',background: agentMode ? 'var(--orange)' : 'var(--text-dim)',top:2,left: agentMode ? 19 : 2,transition:'all 0.3s',boxShadow: agentMode ? '0 0 6px rgba(255,107,43,0.6)' : 'none'}}></div>
          </div>
          {agentMode && <button onClick={() => setAgentPaused(p => !p)} style={{padding:'3px 8px',fontFamily:'Barlow Condensed, sans-serif',fontSize:9,fontWeight:700,letterSpacing:1,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>{agentPaused ? 'RESUME' : 'PAUSE'}</button>}
          {/* AI MODE */}
          <div onClick={() => setAiMode(m=>!m)} style={{display:'flex',alignItems:'center',gap:5,padding:'3px 8px',borderRadius:2,border:`1px solid ${aiMode?'var(--accent)':'var(--border2)'}`,background: aiMode?'rgba(20,241,198,0.08)':'transparent',cursor:'pointer'}}>
            <span style={{fontFamily:'DM Mono, monospace',fontSize:8,color: aiMode?'var(--accent)':'var(--text-dim)',letterSpacing:1}}>AI MODE {aiMode?'ON':'OFF'}</span>
          </div>
        </div>
      </div>

      <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
        {[['QUEUE', queuedCount, 'var(--text)'],['CALLED', totalCalls, 'var(--text)'],['HOT', interestedCalls, 'var(--accent)'],['MRR', `$${pipeline}`, 'var(--green)']].map(([label,val,color]) => (
          <div key={label} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:2,padding:'6px 8px',textAlign:'center'}}>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:16,color,lineHeight:1}}>{val}</div>
            <div style={{fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginTop:2}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Active contact */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:22,letterSpacing:2,color:'var(--text)',lineHeight:1}}>{activeContact?.name || 'SELECT A CONTACT'}</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)',marginTop:3}}>{activeContact?.business_name || 'Choose from the list to begin'}</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:12,color:'var(--accent)',marginTop:4}}>{activeContact?.phone || '—'}</div>
          </div>
          {callState !== 'idle' && (
            <div style={{fontFamily:'DM Mono, monospace',fontSize:26,color:'var(--accent)',letterSpacing:4,textShadow:`0 0 20px ${currentSkin.accent}66`}}>{fmtTime(callSeconds)}</div>
          )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,fontFamily:'DM Mono, monospace',fontSize:10}}>
          <div style={{width:7,height:7,borderRadius:'50%',background: statusColor[callState],animation: ['dialing','connected'].includes(callState) ? 'pulse 1s infinite' : 'none'}}></div>
          <span style={{color: statusColor[callState]}}>{statusText[callState]}</span>
          {!tcpaOk && <span style={{color:'var(--red)',fontSize:9,marginLeft:8}}>⚠ TCPA BLOCK ACTIVE</span>}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {callState === 'idle' && (
            <button onClick={startCall} disabled={!tcpaOk} style={{padding:'10px 20px',fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,background: tcpaOk?'var(--green)':'#333',color: tcpaOk?'var(--bg)':'var(--text-dim)',border:'none',cursor: tcpaOk?'pointer':'not-allowed',borderRadius:2}}>📞 DIAL</button>
          )}
          {['dialing','connected'].includes(callState) && (
            <>
              <button onClick={endCall} style={{padding:'10px 20px',fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>🔴 END</button>
              <button onClick={() => setDisposition('voicemail')} style={{padding:'10px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🎙 DROP VM</button>
            </>
          )}
          <button onClick={() => activeContact ? setSmsModal(true) : notify('Select a contact','warning')} style={{padding:'10px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>💬 SMS</button>
          {activeContact && <button onClick={() => markDNC(activeIdx)} style={{padding:'10px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--red)',border:'1px solid rgba(255,59,59,0.3)',cursor:'pointer',borderRadius:2}}>DNC</button>}
        </div>

        {['connected','ended'].includes(callState) && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5,marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
            {[['answered','✅ ANS','var(--green)'],['voicemail','📬 VM','var(--text-dim)'],['callback','🔁 CB','var(--orange)'],['interested','🔥 HOT','var(--accent)'],['not-interested','❌ NO','var(--red)']].map(([outcome,label,color]) => (
              <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'8px 4px',fontFamily:'Barlow Condensed, sans-serif',fontSize:9,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',cursor:'pointer',border:`1px solid ${color}44`,background:`${color}11`,color,borderRadius:2,textAlign:'center'}}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)'}}>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Call notes..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2,resize:'none',height:52}} />
      </div>

      {/* Scripts */}
      <div style={{flex:1,overflowY:'auto',padding:'10px 16px'}}>
        <div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'}}>
          {scripts.map((s,i) => (
            <button key={i} onClick={() => { setScriptIdx(i); setSmsBody(getSMSTemplate(s.name, activeContact?.name)); }} style={{padding:'4px 10px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1,cursor:'pointer',border:`1px solid ${scriptIdx===i ? s.color+'88' : 'var(--border2)'}`,background: scriptIdx===i ? 'var(--surface3)' : 'transparent',color: scriptIdx===i ? s.color : 'var(--text-dim)',borderRadius:2,textTransform:'uppercase'}}>
              {s.name}
            </button>
          ))}
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:12}}>
          {scripts[scriptIdx]?.sections.map((sec,i) => (
            <div key={i} style={{marginBottom:12}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color: scripts[scriptIdx].color,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{sec.label}</div>
              <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:12,color:'var(--text-mid)',lineHeight:1.6}} dangerouslySetInnerHTML={{__html: sec.text.replace(/\[([^\]]+)\]/g, `<span style="color:var(--accent);font-family:DM Mono,monospace;font-size:10px">[$1]</span>`)}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ); }

  // ── STATS/LOG PANEL ───────────────────────────────────────
  function renderStatsPanel() { return (
    <div style={{background:'var(--surface)',overflowY:'auto',height:'100%'}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:10}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>LIVE STATS</span>
      </div>
      {[['Total Calls',totalCalls,'var(--accent)'],['Answer Rate',`${answerRate}%`,'var(--green)'],['Interested',`${intRate}%`,'var(--orange)']].map(([label,val,color]) => (
        <div key={label} style={{padding:'12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{label}</div>
          <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:28,letterSpacing:2,color,lineHeight:1}}>{val}</div>
        </div>
      ))}
      <div style={{padding:'12px',borderBottom:'1px solid var(--border)',background:`rgba(20,241,198,0.03)`,borderLeft:`2px solid var(--accent)`}}>
        <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>EST. PIPELINE MRR</div>
        <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:24,color:'var(--accent)',letterSpacing:2}}>${pipeline.toLocaleString()}</div>
        <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',marginTop:3}}>@ $99/mo per interested</div>
      </div>

      {/* Server Agent Status */}
      {agentStatus && (
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:6}}>SERVER AGENT</div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background: agentStatus.status==='running'?'var(--green)':agentStatus.status==='paused'?'var(--yellow)':'var(--text-dim)',animation: agentStatus.status==='running'?'pulse 1s infinite':'none'}}></div>
            <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-mid)',textTransform:'uppercase'}}>{agentStatus.status}</span>
          </div>
          {agentStatus.status !== 'idle' && (
            <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:6}}>{agentStatus.called}/{agentStatus.total} called · {agentStatus.queue} queued</div>
          )}
          <div style={{display:'flex',gap:4}}>
            {agentStatus.status === 'idle' && (
              <button onClick={() => serverAgentAction('start', {state: vinState})} style={{padding:'4px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--green)',background:'transparent',color:'var(--green)',borderRadius:2}}>▶ START</button>
            )}
            {agentStatus.status === 'running' && (
              <>
                <button onClick={() => serverAgentAction('pause')} style={{padding:'4px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--yellow)',background:'transparent',color:'var(--yellow)',borderRadius:2}}>⏸ PAUSE</button>
                <button onClick={() => serverAgentAction('stop')} style={{padding:'4px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--red)',background:'transparent',color:'var(--red)',borderRadius:2}}>■ STOP</button>
              </>
            )}
            {agentStatus.status === 'paused' && (
              <button onClick={() => serverAgentAction('resume')} style={{padding:'4px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--green)',background:'transparent',color:'var(--green)',borderRadius:2}}>▶ RESUME</button>
            )}
          </div>
        </div>
      )}

      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:11,letterSpacing:3,color:'var(--text-mid)'}}>CALL LOG</span>
        <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'3px 7px',fontFamily:'Barlow Condensed, sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>EXPORT</button>
      </div>
      {callLog.length === 0 ? (
        <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>No calls yet</div>
      ) : callLog.slice(0,60).map(entry => {
        const c = {answered:'var(--green)',voicemail:'var(--text-dim)',callback:'var(--orange)',interested:'var(--accent)','not-interested':'var(--red)'}[entry.outcome]||'var(--text-dim)';
        return (
          <div key={entry.id} style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name||'Unknown'}</div>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',marginTop:1}}>{entry.outcome?.toUpperCase()} · {fmtTime(entry.duration||0)}</div>
            </div>
          </div>
        );
      })}
    </div>
  ); }

  return (
    <>
      <Head>
        <title>⚡ CLAW DIALER</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
        <style>{buildCSS(currentSkin)}</style>
      </Head>

      {/* ── TOP BAR ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:46,background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:100,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--accent)',textShadow:`0 0 20px ${currentSkin.accent}66`}}>
            {currentSkin.icon} CLAW DIALER
          </span>
          <span style={{display:'flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:9,letterSpacing:1,background:'rgba(46,255,154,0.08)',border:'1px solid rgba(46,255,154,0.2)',color:'var(--green)'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite',display:'inline-block'}}></span>
            LIVE
          </span>
          {!tcpaOk && (
            <span style={{padding:'2px 8px',borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:9,background:'rgba(255,59,59,0.1)',border:'1px solid rgba(255,59,59,0.3)',color:'var(--red)'}}>
              ⚠ TCPA BLOCKED
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:12,fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)',alignItems:'center'}}>
          <span className="desktop-only">+1 (855) 960-0110</span>
          <span style={{color:'var(--border2)'}} className="desktop-only">|</span>
          <span style={{color:'var(--accent)'}}>{clock}</span>
          <button onClick={() => { setAuthed(false); storageSet('claw_authed', false); }} style={{padding:'2px 8px',fontSize:8,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2,marginLeft:4}}>LOCK</button>
        </div>
      </div>

      {/* ── NAV ── */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 16px',flexShrink:0}}>
        {['dialer','dashboard','admin'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'8px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color: tab===t ? 'var(--accent)' : 'var(--text-dim)',cursor:'pointer',border:'none',borderBottom: tab===t ? `2px solid var(--accent)` : '2px solid transparent',background:'none',transition:'all 0.2s'}}>
            {t.toUpperCase()}
          </button>
        ))}
        {/* Mobile sub-nav for dialer */}
        {tab === 'dialer' && isMobile && (
          <>
            <div style={{flex:1}}></div>
            {['leads','dial','log'].map(p => (
              <button key={p} onClick={() => setMobilePanel(p)} style={{padding:'8px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color: mobilePanel===p ? 'var(--accent)' : 'var(--text-dim)',cursor:'pointer',border:'none',borderBottom: mobilePanel===p ? `2px solid var(--accent)` : '2px solid transparent',background:'none'}}>
                {p.toUpperCase()}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && !isMobile && (
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr 260px',height:'calc(100vh - 90px)',overflow:'hidden'}}>
          {renderContactsPanel()}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden'}}>{renderDialerPanel()}</div>
          {renderStatsPanel()}
        </div>
      )}

      {/* ── DIALER TAB (MOBILE) ── */}
      {tab === 'dialer' && isMobile && (
        <div style={{height:'calc(100vh - 90px)',overflow:'hidden'}}>
          {mobilePanel === 'leads' && renderContactsPanel()}
          {mobilePanel === 'dial' && renderDialerPanel()}
          {mobilePanel === 'log' && renderStatsPanel()}
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:20}}>
            {[['Total Calls',totalCalls,'var(--accent)',totalCalls],['Answer Rate',`${answerRate}%`,'var(--green)',answerRate],['Hot Leads',interestedCalls,'var(--orange)',intRate],['Pipeline MRR',`$${pipeline}`,'var(--accent)',100]].map(([label,val,color,pct]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:18}}>
                <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:34,letterSpacing:2,color,lineHeight:1,marginBottom:4}}>{val}</div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase'}}>{label}</div>
                <div style={{height:2,background:'var(--surface3)',borderRadius:2,marginTop:8,overflow:'hidden'}}>
                  <div style={{height:'100%',background:color,width:`${Math.min(pct,100)}%`,transition:'width 0.5s'}}></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>OUTCOME BREAKDOWN</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['OUTCOME','COUNT','%'].map(h => <th key={h} style={{padding:'7px 14px',textAlign:h==='OUTCOME'?'left':'right',fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['INTERESTED 🔥',callLog.filter(c=>c.outcome==='interested').length,'var(--accent)'],['ANSWERED',callLog.filter(c=>c.outcome==='answered').length,'var(--green)'],['CALLBACK',callLog.filter(c=>c.outcome==='callback').length,'var(--orange)'],['VOICEMAIL',callLog.filter(c=>c.outcome==='voicemail').length,'var(--text-dim)'],['NOT INTERESTED',callLog.filter(c=>c.outcome==='not-interested').length,'var(--red)']].map(([label,count,color]) => (
                  <tr key={label} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:600,color}}>{label}</td>
                    <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:12}}>{count}</td>
                    <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{totalCalls>0?Math.round(count/totalCalls*100):0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab === 'admin' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>

          {/* Skin picker */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:13,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>SKIN / THEME</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {Object.entries(SKINS).map(([key, s]) => (
                <button key={key} onClick={() => setSkin(key)} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${skin===key ? s.accent : 'var(--border2)'}`,background: skin===key ? 'var(--surface3)' : 'transparent',color: skin===key ? s.accent : 'var(--text-dim)',borderRadius:2}}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* VinLedger load */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:13,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>LOAD FROM VINLEDGER</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={vinState} onChange={e=>setVinState(e.target.value)} style={{background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}}>
                {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={loadVinLedger} disabled={vinLoading} style={{padding:'9px 18px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:1.5,background: vinLoading?'var(--surface3)':'var(--accent)',color: vinLoading?'var(--text-dim)':'var(--bg)',border:'none',cursor: vinLoading?'wait':'pointer',borderRadius:2,display:'flex',alignItems:'center',gap:6}}>
                {vinLoading ? <span style={{animation:'spin 0.8s linear infinite',display:'inline-block'}}>⟳</span> : '📡'} LOAD DEALERS
              </button>
            </div>
          </div>

          {/* CSV upload */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:13,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>UPLOAD CONTACTS (CSV)</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:24,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:2}}>
              <div style={{fontSize:24,marginBottom:6}}>📂</div>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>Click to upload CSV<br/><span style={{fontSize:9,opacity:0.6}}>Columns: name, business_name, phone, email</span></div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
            </label>
          </div>

          {/* Edit scripts */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:13,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>EDIT SCRIPTS</div>
            {scripts.map((s,i) => (
              <div key={i} style={{marginBottom:14}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:s.color,letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>SCRIPT {String.fromCharCode(65+i)} — {s.name}</div>
                <textarea
                  defaultValue={s.sections.map(sec => `[${sec.label}]\n${sec.text}`).join('\n\n')}
                  onBlur={e => {
                    const raw = e.target.value;
                    const blocks = raw.split(/\[([^\]]+)\]\n/);
                    const sections = [];
                    for (let j = 1; j < blocks.length; j+=2) sections.push({label:blocks[j],text:(blocks[j+1]||'').trim()});
                    if (sections.length > 0) { setScripts(prev => { const next=[...prev]; next[i]={...next[i],sections}; return next; }); }
                  }}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:10,padding:'8px 10px',outline:'none',borderRadius:2,resize:'vertical',minHeight:80,lineHeight:1.5}}
                />
              </div>
            ))}
          </div>

          {/* Data management */}
          <div>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:13,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>DATA MANAGEMENT</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CALL LOG</button>
              <button onClick={() => exportCSV([['Name','Business','Phone','Email','Status','List'],...contacts.map(c=>[c.name,c.business_name,c.phone,c.email,c.status,c.list_name])],'contacts.csv')} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CONTACTS</button>
              <button onClick={() => { if(confirm('Clear all data?')) { setContacts([]); setCallLog([]); notify('Cleared','warning'); } }} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2,marginLeft:'auto'}}>CLEAR ALL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS MODAL ── */}
      {smsModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:'100%',maxWidth:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:16,letterSpacing:3,color:'var(--accent)',marginBottom:16}}>// SEND SMS</div>
            <div style={{marginBottom:10}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginBottom:5}}>TO</div>
              <input readOnly value={activeContact?.phone||''} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginBottom:5}}>MESSAGE</div>
              <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:`1px solid ${smsBody.length>160?'var(--red)':'var(--border2)'}`,color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:80}} />
              <div style={{fontFamily:'DM Mono, monospace',fontSize:8,textAlign:'right',marginTop:3,color: smsBody.length>160 ? 'var(--red)' : smsBody.length>140 ? 'var(--yellow)' : 'var(--text-dim)'}}>{smsBody.length} / 160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={() => setSmsModal(false)} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={sendSMS} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'var(--accent)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:'100%',maxWidth:420,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:16,letterSpacing:3,color:'var(--accent)',marginBottom:16}}>// ADD CONTACT</div>
            {[['Name','name'],['Business','business_name'],['Phone','phone'],['Email','email'],['List Name','list_name']].map(([label,key]) => (
              <div key={key} style={{marginBottom:9}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginBottom:4}}>{label.toUpperCase()}</div>
                <input value={newContact[key]} onChange={e => setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => {
                if (!newContact.name && !newContact.phone) return notify('Need name or phone','warning');
                setContacts(prev => [...prev, {...newContact, id:Date.now(), status:'new', notes:'', created_at:new Date().toISOString()}]);
                setNewContact({name:'',business_name:'',phone:'',email:'',list_name:''});
                setShowAddModal(false);
                notify('Contact added','success');
              }} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'var(--accent)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION ── */}
      {notification && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'10px 16px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--accent)'}`,borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text)',zIndex:1000,maxWidth:300,animation:'slideUp 0.3s ease'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

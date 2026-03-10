import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── PASSWORD ─────────────────────────────────────────────────────────────────
const APP_PASSWORD = 'claw2026';

// ─── SCRIPTS ─────────────────────────────────────────────────────────────────
const DEFAULT_SCRIPTS = [
  {
    name: 'VINHUNTER', color: '#14F1C6',
    sections: [
      { label: 'OPENER', text: "Hey — is this [CONTACT_NAME]? Real quick — AI calling on Chase's behalf from VinHunter. This call may be recorded. Quick question: are you the owner?" },
      { label: 'HOOK', text: "Right now, when a buyer Googles one of your VINs before calling you — what do they find? We put a Trust Score and a Google-indexed page on every vehicle overnight. Stuff CARFAX structurally cannot check: active NHTSA investigations, cross-model complaint patterns, theft databases CARFAX doesn't touch." },
      { label: 'DIFFERENTIATOR', text: "CARFAX charges $99-300/mo just for reports. We give unlimited reports, SEO pages for every VIN, lead capture, AND a full shop CRM — $249/mo. Or just the marketing tier at $99." },
      { label: 'CLOSE', text: "Founding partner rate locks forever. Can I text you a 2-min breakdown? No call needed — just read it." },
      { label: '🔀 CROSS-SELL → ECONOCLAW', text: "If they say yes to VinHunter: 'One more thing — we also run 21 AI agents for your business after hours. Handles lead follow-up, reviews, customer questions. $99/mo. Want me to include that in the text?'" }
    ]
  },
  {
    name: 'ECONOCLAW', color: '#FF6B2B',
    sections: [
      { label: 'OPENER', text: "Hey — AI calling on Chase's behalf from EconoClaw. This call may be recorded. Quick one — do you have anyone running your business after hours, handling leads automatically?" },
      { label: 'HOOK', text: "We deploy 21 specialized AI agents to your business. Customer service, content, research, outreach, analytics — running 24/7 while you sleep. Like hiring a full department for $99 a month." },
      { label: 'COMPARISON', text: "Agencies charge $5,000 setup and $1,500/mo for this. We're at $500 setup and $99/mo launch pricing. Founding customers keep $99 forever." },
      { label: 'CLOSE', text: "Can I text you a 2-min breakdown of what the 21 agents actually do? No pitch call needed." },
      { label: '🔀 CROSS-SELL', text: "Auto dealer → mention VinHunter ($99/mo SEO pages). Contractor → mention TransBid (0% upfront). Tight budget → RentAClaw ($49/week trial)." }
    ]
  },
  {
    name: 'WHITEGLOVECLAW', color: '#FFD600',
    sections: [
      { label: 'OPENER', text: "Good [morning/afternoon] — AI calling on behalf of Chase from WhiteGloveClaw. This call may be recorded. Quick question — are you the decision-maker for technology at your firm?" },
      { label: 'POSITIONING', text: "SetupClaw is the market leader in white-glove AI deployment. We offer identical scope, identical hardening, identical deliverables — at 20% below their pricing. Same 14-day hypercare, same same-day go-live." },
      { label: 'TIERS', text: "Hosted VPS at $2,400. Mac Mini with iMessage integration at $4,000. In-person at $4,800. Additional agents at $1,200 each. SetupClaw charges $600-1,200 more for the same thing." },
      { label: 'CLOSE', text: "Worth a 15-minute call? What does your week look like?" },
      { label: '🔀 CROSS-SELL', text: "Budget objection → EconoClaw ($500 setup + $99/mo, same 21 agents, software-only). Still interested in full deployment at lower cost." }
    ]
  },
  {
    name: 'RENTACLAW', color: '#3B8FFF',
    sections: [
      { label: 'OPENER', text: "Hey — AI calling on Chase's behalf from RentAClaw. This call may be recorded. Quick question — have you looked into AI agents for your business at all?" },
      { label: 'CONCEPT', text: "Think rental car. Daily $9, weekly $49, monthly $149, annual $999. All 21 agents for whatever period you need. Campaign, product launch, busy season — then stop." },
      { label: 'GUARANTEE', text: "Want to try a week for $49? If it doesn't generate at least $49 in value, I'll personally refund you. No commitment. Rental payments count toward EconoClaw setup if you want to keep it." },
      { label: 'CLOSE', text: "Can I text you the link? Takes 30 seconds to sign up." },
      { label: '🔀 UPSELL', text: "After trial: EconoClaw $500 setup + $99/mo. Their rental payment counts toward the setup fee." }
    ]
  },
  {
    name: 'BUDGETCLAW', color: '#39FF14',
    sections: [
      { label: 'OPENER', text: "Hey — AI calling on Chase's behalf from BUDGETclaw. This call may be recorded. Quick one — what are you spending monthly on tools like Zapier, HubSpot, or a virtual assistant?" },
      { label: 'MATH', text: "Year 1 your current way: $6,188+. Year 1 with BUDGETclaw: $2,687. Same result. We replace Zapier, HubSpot, ChatGPT, and your VA — cheaper than all of them combined." },
      { label: 'TIERS', text: "21 agents. Three tiers: Micro $199/mo, Standard $299/mo, Pro $499/mo. All the same agents — difference is configuration depth and support level." },
      { label: 'CLOSE', text: "Can I text you the cost breakdown? It's a literal spreadsheet comparison." },
      { label: '🔀 UPSELL', text: "Once they see value → EconoClaw launch pricing $500 setup + $99/mo. Or WhiteGloveClaw for enterprise." }
    ]
  },
  {
    name: 'TRANSBID', color: '#BF00FF',
    sections: [
      { label: 'OPENER', text: "Hey — AI calling on Chase's behalf from TransBid Live. This call may be recorded. Quick question — are you a contractor or do you hire contractors for projects?" },
      { label: 'HOOK FOR CONTRACTORS', text: "TransBid is the public contract exchange. Zero upfront fees. No paying for leads that go nowhere. You only pay 0.5% when you WIN a job. Veterans pay zero, forever." },
      { label: 'HOOK FOR HOMEOWNERS', text: "Post your project free. Every bid is public — contractors compete, you see all offers, you pay nothing until the job's done and you're satisfied. HomeAdvisor charges them 15-30% hidden — which they pass to you in inflated quotes." },
      { label: 'CLOSE', text: "Can I text you the link? Free to list, free to bid. You only pay when you win." },
      { label: '🔀 CROSS-SELL', text: "Contractor interested → EconoClaw for lead follow-up and after-hours customer service." }
    ]
  },
  {
    name: 'CLAWAWAY', color: '#2EFF9A',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME] — straight up, AI calling on Chase's behalf. We build AI systems. Flexible on what we build, what you pay, how you pay it." },
      { label: 'CORE', text: "Tell us what you want to build. Tell us what you want to pay. Tell us how you want to pay it. Card, Zelle, crypto, rev share, barter, IOU. We figure it out." },
      { label: 'OPTIONS', text: "Starter $99/mo. Full Claw $249/mo. Enterprise $599/mo. IOU Plan: $0 now. We've taken equity, rev share, and straight vibes (*vibes subject to approval)." },
      { label: 'CLOSE', text: "What's the one thing eating the most time or money in your business right now? Let's start there." },
      { label: '🔀 ROUTE BY PROBLEM', text: "Auto/dealer → VinHunter $99/mo | AI automation → EconoClaw $99/mo | Contracting → TransBid 0.5% | Tight budget → RentAClaw $9/day | Enterprise → WhiteGloveClaw $2,400+" }
    ]
  }
];

const SMS_TEMPLATES = {
  'VINHUNTER': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. Free lot audit: what buyers find when they Google your VINs + 4 things we check that CARFAX structurally can't. vinledgerai.live/pricing Reply STOP to opt out.`,
  'ECONOCLAW': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. 21 AI agents, your biz, 24/7. $500 setup + $99/mo — agencies charge $5K+ for the same. econoclaw.vercel.app Reply STOP to opt out.`,
  'WHITEGLOVECLAW': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. White-glove AI. SetupClaw scope, 20% less. VPS $2,400, Mac Mini $4K, same-day go-live. Reply STOP to opt out.`,
  'RENTACLAW': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. Try 21 AI agents a week, $49. Doesn't pay for itself, I refund you personally. econoclaw.vercel.app/rent Reply STOP to opt out.`,
  'BUDGETCLAW': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. Year 1 your way: $6,188+. Year 1 BUDGETclaw: $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
  'TRANSBID': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. TransBid: post projects free, zero cost until job done. HomeAdvisor charges 15-30% hidden. transbid.live Reply STOP to opt out.`,
  'CLAWAWAY': (n) => `Hey${n?' '+n.split(' ')[0]:''} — Chase. We build AI systems. Flexible on what, how you pay. Card, crypto, rev share, barter. econoclaw.vercel.app Reply STOP to opt out.`,
};
const SMS_FOLLOW_UP = (name, scriptName) => {
  const fn = SMS_TEMPLATES[scriptName] || SMS_TEMPLATES['VINHUNTER'];
  return fn(name);
};

// ─── SKINS ───────────────────────────────────────────────────────────────────
const SKINS = {
  DEFAULT:       { label:'CLAW DEFAULT',  icon:'🖤', dark:true,  accent:'#14F1C6', bg:'#080A0F', surface:'#0D1017', surface2:'#121820', surface3:'#1A2230', border:'#1E2D40', border2:'#243344', text:'#E8EDF5', textDim:'#6B7A8D', textMid:'#9AAABB' },
  CYBERCLAW:     { label:'CYBERCLAW',     icon:'💜', dark:true,  accent:'#BF00FF', bg:'#0A0010', surface:'#100020', surface2:'#160030', surface3:'#1E0040', border:'#2D0060', border2:'#3D0080', text:'#F0E0FF', textDim:'#7A5A9A', textMid:'#B090D0' },
  GOTHICCLAW:    { label:'GOTHICCLAW',    icon:'🩸', dark:true,  accent:'#CC0000', bg:'#0D0000', surface:'#1A0000', surface2:'#200000', surface3:'#2A0000', border:'#3D0000', border2:'#550000', text:'#FFDDDD', textDim:'#7A3333', textMid:'#BB7777' },
  TACTICLAW:     { label:'TACTICLAW',     icon:'🎯', dark:true,  accent:'#7FFF00', bg:'#0A0C07', surface:'#141A0E', surface2:'#1A2214', surface3:'#202A18', border:'#2A3820', border2:'#344828', text:'#E8F0D0', textDim:'#5A7040', textMid:'#8AAA60' },
  ECONOSKIN:     { label:'ECONOCLAW',     icon:'🔥', dark:true,  accent:'#FF6B2B', bg:'#0F0800', surface:'#1A0E00', surface2:'#221200', surface3:'#2C1800', border:'#3D2200', border2:'#552E00', text:'#FFE8D0', textDim:'#7A5030', textMid:'#BB8860' },
  BUDGETSKIN:    { label:'BUDGETCLAW',    icon:'📊', dark:true,  accent:'#39FF14', bg:'#000A00', surface:'#001400', surface2:'#001C00', surface3:'#002400', border:'#003800', border2:'#004A00', text:'#D0FFD0', textDim:'#3A7A3A', textMid:'#70BB70' },
  DEFAULT_LIGHT: { label:'CLAW LIGHT',   icon:'🤍', dark:false, accent:'#008B7A', bg:'#F0F4F8', surface:'#FFFFFF', surface2:'#E8EEF4', surface3:'#D8E4EE', border:'#C0CEDC', border2:'#A8BBCC', text:'#0D1E2E', textDim:'#5A7080', textMid:'#3A5468' },
  CYBER_LIGHT:   { label:'CYBER LIGHT',  icon:'🪻', dark:false, accent:'#7C00CC', bg:'#F5F0FF', surface:'#FFFFFF', surface2:'#EDE6FF', surface3:'#DDD0FF', border:'#C8B0EE', border2:'#B090DD', text:'#1A0A2E', textDim:'#6040A0', textMid:'#4A2080' },
  GOTHIC_LIGHT:  { label:'GOTHIC LIGHT', icon:'📜', dark:false, accent:'#8B0000', bg:'#F5F0E8', surface:'#FDF8EE', surface2:'#EDE4D4', surface3:'#DDD0BC', border:'#C8B898', border2:'#B0997A', text:'#1A0A00', textDim:'#6B4A30', textMid:'#4A2810' },
  TACTIC_LIGHT:  { label:'TACTIC LIGHT', icon:'🗺️', dark:false, accent:'#3A6600', bg:'#F2EED8', surface:'#FAFAF0', surface2:'#ECEACC', surface3:'#DCDAB8', border:'#BEBB88', border2:'#A8A870', text:'#1A1800', textDim:'#5A5830', textMid:'#3A3A10' },
  ECONO_LIGHT:   { label:'ECONO LIGHT',  icon:'☀️', dark:false, accent:'#CC4400', bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#FFF0E0', surface3:'#FFE4C8', border:'#FFCCAA', border2:'#FFB888', text:'#1A0800', textDim:'#7A4820', textMid:'#5A3010' },
  BUDGET_LIGHT:  { label:'BUDGET LIGHT', icon:'🟢', dark:false, accent:'#008800', bg:'#F8FFF8', surface:'#FFFFFF', surface2:'#EEFFEE', surface3:'#DDFFDD', border:'#AADDAA', border2:'#88CC88', text:'#001A00', textDim:'#3A6A3A', textMid:'#1A4A1A' },
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const baseCss = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; color: var(--text); font-family: 'Barlow Condensed', sans-serif; overflow: hidden; background: var(--bg); }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border2); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function fmtDate(ts) { try { return new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}); } catch { return ts; } }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
function storageGet(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
function isTCPAHour() { const h = new Date().getHours(); return h >= 8 && h < 21; }

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#080A0F"/><text x="4" y="24" font-size="22" font-family="monospace" fill="#14F1C6">⚡</text></svg>`;
const FAVICON_URL = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  function attempt() {
    if (pw === APP_PASSWORD) { onLogin(); }
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  }
  return (
    <div style={{minHeight:'100vh',background:'#080A0F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Barlow Condensed,sans-serif'}}>
      <div style={{width:340,animation:'slideUp 0.3s ease'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:42,letterSpacing:6,color:'#14F1C6',textShadow:'0 0 40px #14F1C688',lineHeight:1}}>⚡ CLAW</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#6B7A8D',letterSpacing:3,marginTop:6}}>DIALER // COMMAND CENTER</div>
        </div>
        <div style={{background:'#0D1017',border:'1px solid #1E2D40',borderRadius:4,padding:28}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#6B7A8D',letterSpacing:2,marginBottom:8}}>ACCESS CODE</div>
          <input
            type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}}
            onKeyDown={e=>e.key==='Enter'&&attempt()}
            placeholder="Enter password..."
            style={{width:'100%',background:'#121820',border:`1px solid ${err?'#FF3B3B':'#243344'}`,color:'#E8EDF5',fontFamily:'DM Mono,monospace',fontSize:13,padding:'12px 14px',outline:'none',borderRadius:3,marginBottom:12,transition:'border 0.2s',transform:shake?'translateX(6px)':'none'}}
          />
          {err && <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#FF3B3B',marginBottom:10}}>// INCORRECT PASSWORD</div>}
          <button onClick={attempt} style={{width:'100%',padding:'13px',background:'#14F1C6',color:'#080A0F',fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:3,border:'none',cursor:'pointer',borderRadius:3}}>
            ENTER
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:16,fontFamily:'DM Mono,monospace',fontSize:9,color:'#1E2D40'}}>SOLANA SOLAR SOLUTIONS · INTERNAL USE ONLY</div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClawDialer() {
  const [authed, setAuthed] = useState(() => storageGet('claw_authed', false));
  const [skinKey, setSkinKey] = useState(() => storageGet('claw_skin', 'DEFAULT'));
  const [contacts, setContacts] = useState(() => storageGet('claw_contacts', []));
  const [callLog, setCallLog] = useState(() => storageGet('claw_calllog', []));
  const [scripts, setScripts] = useState(() => storageGet('claw_scripts', DEFAULT_SCRIPTS));
  const [activeIdx, setActiveIdx] = useState(null);
  const [tab, setTab] = useState('dialer');
  const [scriptIdx, setScriptIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [callState, setCallState] = useState('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [callSid, setCallSid] = useState(null);
  const [notes, setNotes] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [agentPaused, setAgentPaused] = useState(false);
  const [aiCallMode, setAiCallMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [smsModal, setSmsModal] = useState(false);
  const [smsBody, setSmsBody] = useState('');
  const [clock, setClock] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', business_name:'', phone:'', email:'', list_name:'' });
  // Recordings tab
  const [recordings, setRecordings] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [expandedRec, setExpandedRec] = useState(null);
  // Inbox tab
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxReply, setInboxReply] = useState({});
  const [inboxReplyText, setInboxReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  // Agent confirm modal
  const [agentConfirm, setAgentConfirm] = useState(false);

  const timerRef = useRef(null);
  const agentRef = useRef(null);
  const agentModeRef = useRef(false);
  const agentPausedRef = useRef(false);
  const pollRef = useRef(null);

  agentModeRef.current = agentMode;
  agentPausedRef.current = agentPaused;

  const skin = SKINS[skinKey] || SKINS.DEFAULT;

  const skinCss = `:root {
    --bg:${skin.bg}; --surface:${skin.surface}; --surface2:${skin.surface2}; --surface3:${skin.surface3};
    --border:${skin.border}; --border2:${skin.border2};
    --teal:${skin.accent}; --teal-dim:${skin.accent}88;
    --text:${skin.text}; --text-dim:${skin.textDim}; --text-mid:${skin.textMid};
    --orange:#FF6B2B; --red:#FF3B3B; --green:#2EFF9A; --yellow:#FFD600; --blue:#3B8FFF;
  }
  body::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
    background:${skin.dark
      ? 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)'
      : 'none'};
  }`;

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { storageSet('claw_authed', authed); }, [authed]);
  useEffect(() => { storageSet('claw_skin', skinKey); }, [skinKey]);
  useEffect(() => { storageSet('claw_contacts', contacts); }, [contacts]);
  useEffect(() => { storageSet('claw_calllog', callLog); }, [callLog]);
  useEffect(() => { storageSet('claw_scripts', scripts); }, [scripts]);

  // Load recordings when tab opens
  useEffect(() => {
    if (tab === 'recordings') loadRecordings();
    if (tab === 'inbox') loadInbox();
  }, [tab]);

  async function loadRecordings() {
    setRecLoading(true);
    try {
      const r = await fetch('/api/recordings?action=list&limit=100');
      const d = await r.json();
      setRecordings(d.recordings || []);
    } catch {}
    setRecLoading(false);
  }

  async function loadInbox() {
    setInboxLoading(true);
    try {
      const r = await fetch('/api/twilio?action=inbox');
      const d = await r.json();
      setInbox(d.messages || []);
    } catch {}
    setInboxLoading(false);
  }

  async function sendReply(toNumber, body) {
    if (!body.trim()) return;
    try {
      await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to: toNumber, body }) });
      notify(`Reply sent to ${toNumber}`, 'success');
      setReplyTarget(null);
      setInboxReplyText('');
      setTimeout(() => loadInbox(), 1500);
    } catch { notify('Failed to send reply', 'warning'); }
  }

  function startPoll(sid) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/twilio?action=callstatus&sid=${sid}`);
        const d = await r.json();
        if (['completed','failed','busy','no-answer'].includes(d.status)) {
          clearInterval(pollRef.current);
          setCallState('ended');
        }
      } catch {}
    }, 3000);
  }

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const activeContact = activeIdx !== null ? contacts[activeIdx] : null;
  const filteredContacts = contacts.filter(c => {
    const ms = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.business_name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search);
    const mf = statusFilter === 'all' || c.status === statusFilter;
    return ms && mf;
  });

  function selectContact(idx) {
    setActiveIdx(idx);
    setNotes(contacts[idx]?.notes || '');
    setSmsBody(SMS_FOLLOW_UP(contacts[idx]?.name || '', scripts[scriptIdx]?.name || ''));
  }

  function updateContactStatus(idx, status) {
    setContacts(prev => { const next=[...prev]; next[idx]={...next[idx], status, notes}; return next; });
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
        if (!cols[phoneIdx] && !cols[emailIdx]) continue;
        newOnes.push({ id:Date.now()+i, name:nameIdx>=0?cols[nameIdx]:'', business_name:bizIdx>=0?cols[bizIdx]:'', phone:phoneIdx>=0?cols[phoneIdx]:'', email:emailIdx>=0?cols[emailIdx]:'', status:'new', notes:'', list_name:file.name.replace('.csv',''), created_at:new Date().toISOString() });
      }
      setContacts(prev => [...prev, ...newOnes]);
      notify(`✅ Imported ${newOnes.length} contacts`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function startCall() {
    if (activeIdx === null) return notify('Select a contact first', 'warning');
    if (!activeContact.phone) return notify('No phone number on this contact', 'warning');
    if (!isTCPAHour()) return notify('⛔ Outside TCPA hours (8am–9pm local). Cannot dial.', 'warning');
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: activeContact.phone, contactId: activeContact.id, contactName: activeContact.name, contactEmail: activeContact.email||'', script: scripts[scriptIdx]?.name, aiMode: aiCallMode })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`📞 Dialing ${activeContact.name || activeContact.phone}...`, 'info');
      startPoll(data.callSid);
    } catch (err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function endCall() {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setCallState('ended');
  }

  async function setDisposition(outcome) {
    if (activeIdx === null) return;
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setCallState('idle');
    const entry = { id:Date.now(), contact_id:activeContact.id, name:activeContact.name, business:activeContact.business_name, phone:activeContact.phone, outcome, duration:callSeconds, notes, script:scripts[scriptIdx]?.name, timestamp:new Date().toISOString() };
    setCallLog(prev => [entry, ...prev]);
    const statusMap = { answered:'called', voicemail:'voicemail', callback:'callback', interested:'interested', 'not-interested':'not-interested' };
    updateContactStatus(activeIdx, statusMap[outcome] || 'called');
    if (outcome === 'interested') {
      notify(`🔥 HOT LEAD! Auto-texting ${activeContact.name || activeContact.phone}`, 'success');
      try { await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:activeContact.phone, body:SMS_FOLLOW_UP(activeContact.name, scripts[scriptIdx]?.name) }) }); } catch {}
    }
    setCallSeconds(0); setNotes('');
    if (agentModeRef.current && !agentPausedRef.current) agentRef.current = setTimeout(() => agentNext(), 4000);
  }

  function toggleAgent() {
    if (!agentMode) { setAgentConfirm(true); }
    else { setAgentMode(false); clearTimeout(agentRef.current); notify('⚡ Agent stopped', 'warning'); }
  }

  function startAgent() {
    setAgentConfirm(false);
    setAgentMode(true); setAgentPaused(false);
    notify('⚡ Agent ACTIVE — auto-dialing new contacts', 'info');
    setTimeout(() => agentNext(), 1000);
  }

  function agentNext() {
    if (!agentModeRef.current || agentPausedRef.current) return;
    if (!isTCPAHour()) { setAgentMode(false); notify('⛔ Agent stopped — outside TCPA hours (8am–9pm)', 'warning'); return; }
    const newOnes = contacts.filter(c => c.status === 'new');
    if (newOnes.length === 0) { setAgentMode(false); notify('✅ Agent complete — no new contacts remaining', 'success'); return; }
    const nextIdx = contacts.indexOf(newOnes[0]);
    selectContact(nextIdx);
    setTimeout(() => { if (agentModeRef.current && !agentPausedRef.current) startCall(); }, 1500);
  }

  async function sendSMS() {
    if (!activeContact?.phone) return notify('No phone number', 'warning');
    try {
      const r = await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:activeContact.phone, body:smsBody }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      notify(`✅ SMS sent`, 'success'); setSmsModal(false);
    } catch (err) { notify(`SMS failed: ${err.message}`, 'warning'); }
  }

  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content],{type:'text/csv'})); a.download = filename; a.click();
  }

  const totalCalls = callLog.length;
  const answeredCalls = callLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const interestedCalls = callLog.filter(c => c.outcome === 'interested').length;
  const callbackCalls = callLog.filter(c => c.outcome === 'callback').length;
  const pipeline = interestedCalls * 99;
  const answerRate = totalCalls > 0 ? Math.round(answeredCalls/totalCalls*100) : 0;
  const intRate = totalCalls > 0 ? Math.round(interestedCalls/totalCalls*100) : 0;
  const statusColor = { idle:'#6B7A8D', dialing:'#FFD600', connected:'#2EFF9A', ended:'#FF6B2B' };
  const statusText = { idle:'STANDBY', dialing:'DIALING...', connected:'CONNECTED', ended:'CALL ENDED' };
  const statusBadge = { new:'var(--teal)', called:'var(--text-dim)', voicemail:'var(--blue)', callback:'var(--orange)', interested:'var(--green)', 'not-interested':'var(--red)' };
  const newCount = contacts.filter(c=>c.status==='new').length;
  const callbackCount = contacts.filter(c=>c.status==='callback').length;
  const tcpaOk = isTCPAHour();

  // ── LOGIN GATE ──
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const TABS = [
    { key:'dialer',     label:'DIALER' },
    { key:'dashboard',  label:'DASHBOARD' },
    { key:'recordings', label:'RECORDINGS' },
    { key:'inbox',      label:`INBOX${inbox.length>0?' ('+inbox.length+')':''}` },
    { key:'admin',      label:'ADMIN' },
  ];

  return (
    <>
      <Head>
        <title>CLAW DIALER — Command Center</title>
        <link rel="icon" href={FAVICON_URL} />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{baseCss}</style>
        <style>{skinCss}</style>
      </Head>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:48,background:'var(--surface)',borderBottom:`1px solid var(--teal)44`,position:'sticky',top:0,zIndex:100,gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',textShadow:skin.dark?`0 0 20px ${skin.accent}66`:'none'}}>
            ⚡ CLAW DIALER
          </span>
          <span style={{display:'flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:9,background:'rgba(46,255,154,0.08)',border:'1px solid rgba(46,255,154,0.2)',color:'#2EFF9A'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#2EFF9A',animation:'pulse 2s infinite',display:'inline-block'}}></span>LIVE
          </span>
          {!tcpaOk && <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#FF3B3B',border:'1px solid #FF3B3B44',padding:'2px 8px',borderRadius:2}}>⛔ OUTSIDE TCPA HOURS</span>}
          {tcpaOk && agentMode && <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#2EFF9A',border:'1px solid #2EFF9A44',padding:'2px 8px',borderRadius:2,animation:'pulse 1.5s infinite'}}>⚡ AGENT RUNNING</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)'}}>+1 (855) 960-0110</span>
          <span style={{color:'var(--border2)',fontFamily:'DM Mono,monospace'}}>|</span>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--teal)'}}>{clock}</span>
          <button onClick={() => { setAuthed(false); storageSet('claw_authed', false); }} style={{marginLeft:4,padding:'3px 10px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>LOGOUT</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 16px',overflowX:'auto'}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:tab===t.key?'var(--teal)':'var(--text-dim)',cursor:'pointer',border:'none',borderBottom:tab===t.key?`2px solid var(--teal)`:'2px solid transparent',background:'none',transition:'all 0.2s',flexShrink:0,whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'0 4px',flexShrink:0}}>
          {/* AI MODE toggle with tooltip */}
          <div style={{position:'relative',display:'flex',alignItems:'center'}} title="AI MODE: When ON, the dialer uses Claude AI to have a live conversation with the prospect instead of playing the MP3 recording.">
            <button onClick={() => setAiCallMode(v => !v)} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${aiCallMode?'var(--teal)':'var(--border2)'}`,background:aiCallMode?'var(--teal)22':'transparent',color:aiCallMode?'var(--teal)':'var(--text-dim)',borderRadius:2}}>
              {aiCallMode ? '🤖 AI ON' : '🤖 AI'}
            </button>
          </div>
          {/* AGENT toggle with tooltip */}
          <div style={{position:'relative',display:'flex',alignItems:'center'}} title="AGENT: Auto-dials through all NEW contacts one by one, no clicking required. Uses whatever mode is active (AI or MP3).">
            <button onClick={toggleAgent} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${agentMode?'#2EFF9A':'var(--border2)'}`,background:agentMode?'rgba(46,255,154,0.1)':'transparent',color:agentMode?'#2EFF9A':'var(--text-dim)',borderRadius:2}}>
              {agentMode ? '⚡ STOP' : '⚡ AGENT'}
            </button>
          </div>
        </div>
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && (
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr 260px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* LEFT: CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'8px 10px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:5,flexDirection:'column'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'6px 10px',outline:'none',borderRadius:2}} />
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {['all','new','called','callback','interested','voicemail'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'3px 7px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,cursor:'pointer',border:`1px solid ${statusFilter===f?'var(--teal)':'var(--border2)'}`,background:statusFilter===f?'var(--teal)22':'transparent',color:statusFilter===f?'var(--teal)':'var(--text-dim)',borderRadius:2,textTransform:'uppercase'}}>
                    {f}{f==='callback'&&callbackCount>0?` (${callbackCount})`:''}
                  </button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {filteredContacts.length === 0 ? (
                <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>No contacts.<br/>Upload CSV in Admin tab.</div>
              ) : filteredContacts.map((c) => {
                const realIdx = contacts.indexOf(c);
                return (
                  <div key={c.id} onClick={() => selectContact(realIdx)} style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeIdx===realIdx?'var(--surface2)':'transparent',borderLeft:activeIdx===realIdx?`2px solid var(--teal)`:'2px solid transparent',transition:'all 0.1s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:2,background:`${statusBadge[c.status]||'var(--teal)'}22`,border:`1px solid ${statusBadge[c.status]||'var(--teal)'}44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:10,color:statusBadge[c.status]||'var(--teal)',flexShrink:0}}>
                        {initials(c.name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'No Name'}</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.business_name||c.phone||''}</div>
                      </div>
                      <div style={{width:5,height:5,borderRadius:'50%',background:statusBadge[c.status]||'var(--border2)',flexShrink:0}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:6,alignItems:'center'}}>
              <button onClick={() => setShowAddModal(true)} style={{flex:1,padding:'6px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>+ ADD</button>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)'}}>{newCount} new</span>
            </div>
          </div>

          {/* CENTER: DIALER */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column'}}>
            {/* Contact card */}
            <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              {activeContact ? (
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:2,background:`var(--teal)22`,border:`1px solid var(--teal)44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:16,color:'var(--teal)',flexShrink:0}}>{initials(activeContact.name)}</div>
                  <div>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:2}}>{activeContact.name||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--teal)'}}>{activeContact.phone}</div>
                    {activeContact.business_name && <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:1}}>{activeContact.business_name}</div>}
                    {activeContact.email && <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)'}}>{activeContact.email}</div>}
                  </div>
                  <div style={{marginLeft:'auto',padding:'3px 8px',borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,background:`${statusBadge[activeContact.status]||'var(--teal)'}22`,color:statusBadge[activeContact.status]||'var(--teal)',border:`1px solid ${statusBadge[activeContact.status]||'var(--teal)'}44`,textTransform:'uppercase'}}>
                    {activeContact.status||'new'}
                  </div>
                </div>
              ) : (
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)',padding:'8px 0'}}>← Select a contact to begin</div>
              )}
            </div>

            {/* Call controls */}
            <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:statusColor[callState],boxShadow:`0 0 6px ${statusColor[callState]}`,animation:callState==='connected'?'pulse 1.5s infinite':'none'}}></div>
                <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:statusColor[callState]}}>{statusText[callState]}</span>
                {callState !== 'idle' && <span style={{fontFamily:'DM Mono,monospace',fontSize:13,color:'var(--text-mid)',marginLeft:'auto'}}>{fmtTime(callSeconds)}</span>}
              </div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                {callState === 'idle' && (
                  <button onClick={startCall} disabled={!tcpaOk} style={{padding:'11px 22px',fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,background:tcpaOk?'#2EFF9A':'#2EFF9A44',color:'#080A0F',border:'none',cursor:tcpaOk?'pointer':'not-allowed',borderRadius:2}}>📞 DIAL</button>
                )}
                {['dialing','connected'].includes(callState) && (
                  <>
                    <button onClick={endCall} style={{padding:'11px 22px',fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,background:'#FF3B3B',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>🔴 END</button>
                    <button onClick={() => setDisposition('voicemail')} style={{padding:'11px 12px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🎙 DROP VM</button>
                  </>
                )}
                <button onClick={() => activeContact ? setSmsModal(true) : notify('Select a contact first','warning')} style={{padding:'11px 12px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>💬 SMS</button>
              </div>
              {['connected','ended'].includes(callState) && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  {[['answered','✅ ANSWERED','#2EFF9A'],['voicemail','📬 VM','var(--text-dim)'],['callback','🔁 CALLBACK','#FF6B2B'],['interested','🔥 INTERESTED','var(--teal)'],['not-interested','❌ NO','#FF3B3B']].map(([outcome,label,color]) => (
                    <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'8px 4px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',cursor:'pointer',border:`1px solid ${color}44`,background:`${color}11`,color,borderRadius:2,textAlign:'center'}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{padding:'10px 18px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>// CALL NOTES</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Type notes during call..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2,resize:'none',height:54}} />
            </div>

            {/* Scripts — scrollable tab row */}
            <div style={{flex:1,padding:'10px 18px'}}>
              <div style={{display:'flex',gap:5,marginBottom:10,overflowX:'auto',paddingBottom:4}}>
                {scripts.map((s,i) => (
                  <button key={i} onClick={() => setScriptIdx(i)} style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${scriptIdx===i?s.color+'88':'var(--border2)'}`,background:scriptIdx===i?'var(--surface3)':'transparent',color:scriptIdx===i?s.color:'var(--text-dim)',borderRadius:2,textTransform:'uppercase',flexShrink:0}}>
                    {s.name}
                  </button>
                ))}
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:12}}>
                {scripts[scriptIdx]?.sections.map((sec,i) => (
                  <div key={i} style={{marginBottom:12}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:scripts[scriptIdx].color,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{sec.label}</div>
                    <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:13,color:'var(--text-mid)',lineHeight:1.6}} dangerouslySetInnerHTML={{__html:sec.text.replace(/\[([^\]]+)\]/g,'<span style="color:var(--teal);font-family:DM Mono,monospace;font-size:10px">[$1]</span>')}} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE STATS + LOG */}
          <div style={{background:'var(--surface)',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:10}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:3,color:'var(--text-mid)'}}>LIVE STATS</span>
            </div>
            {[['Calls',totalCalls,'var(--teal)'],['Answer Rate',`${answerRate}%`,'#2EFF9A'],['Interested',`${intRate}%`,'#FF6B2B']].map(([label,val,color]) => (
              <div key={label} style={{padding:'12px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:4,textTransform:'uppercase'}}>{label}</div>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:28,letterSpacing:2,color,lineHeight:1}}>{val}</div>
              </div>
            ))}
            <div style={{padding:'12px',borderBottom:'1px solid var(--border)',background:`${skin.accent}08`,borderLeft:`2px solid var(--teal)`}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:4}}>PIPELINE MRR</div>
              <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:24,color:'var(--teal)',letterSpacing:2}}>${pipeline.toLocaleString()}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',marginTop:3}}>@ $99/mo × {interestedCalls} hot leads</div>
            </div>
            {callbackCount > 0 && (
              <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'#FF6B2B11',borderLeft:'2px solid #FF6B2B'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'#FF6B2B',letterSpacing:2,marginBottom:6}}>🔁 CALLBACKS DUE</div>
                {contacts.filter(c=>c.status==='callback').slice(0,5).map(c => (
                  <div key={c.id} onClick={()=>{selectContact(contacts.indexOf(c));setStatusFilter('all');}} style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,color:'var(--text-mid)',cursor:'pointer',padding:'2px 0',borderBottom:'1px solid var(--border)'}}>{c.name||c.phone}</div>
                ))}
              </div>
            )}
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:3,color:'var(--text-mid)'}}>CALL LOG</span>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'3px 7px',fontFamily:'Barlow Condensed,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>EXPORT</button>
            </div>
            {callLog.length === 0 ? (
              <div style={{padding:16,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)'}}>No calls yet</div>
            ) : callLog.slice(0,60).map(entry => {
              const c = {answered:'#2EFF9A',voicemail:'var(--text-dim)',callback:'#FF6B2B',interested:'var(--teal)','not-interested':'#FF3B3B'}[entry.outcome]||'var(--text-dim)';
              return (
                <div key={entry.id} style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name||entry.phone||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',marginTop:1}}>{entry.outcome?.toUpperCase()} · {fmtTime(entry.duration||0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
            {[['Total Calls',totalCalls,'var(--teal)',totalCalls],['Answer Rate',`${answerRate}%`,'#2EFF9A',answerRate],['Hot Leads',interestedCalls,'#FF6B2B',intRate],['Pipeline MRR',`$${pipeline.toLocaleString()}`,'var(--teal)',100]].map(([label,val,color,pct]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:18}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:36,letterSpacing:2,color,lineHeight:1,marginBottom:5}}>{val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase'}}>{label}</div>
                <div style={{height:2,background:'var(--surface3)',borderRadius:2,marginTop:10,overflow:'hidden'}}>
                  <div style={{height:'100%',background:color,width:`${Math.min(pct,100)}%`,transition:'width 0.5s'}}></div>
                </div>
              </div>
            ))}
          </div>
          {/* Callback alert */}
          {callbackCount > 0 && (
            <div style={{background:'#FF6B2B11',border:'1px solid #FF6B2B44',borderLeft:'3px solid #FF6B2B',borderRadius:2,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:18}}>🔁</span>
              <div>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:2,color:'#FF6B2B'}}>{callbackCount} CALLBACKS WAITING</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)',marginTop:2}}>Go to Dialer → filter by CALLBACK to reach them</div>
              </div>
              <button onClick={()=>{setTab('dialer');setStatusFilter('callback');}} style={{marginLeft:'auto',padding:'6px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'#FF6B2B',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>DIAL NOW</button>
            </div>
          )}
          {/* Hot leads alert */}
          {interestedCalls > 0 && (
            <div style={{background:'var(--teal)11',border:'1px solid var(--teal)44',borderLeft:'3px solid var(--teal)',borderRadius:2,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:18}}>🔥</span>
              <div>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:2,color:'var(--teal)'}}>{interestedCalls} HOT LEADS — ${pipeline.toLocaleString()} PIPELINE</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)',marginTop:2}}>SMS was auto-sent to each. Check Inbox for replies.</div>
              </div>
              <button onClick={()=>setTab('inbox')} style={{marginLeft:'auto',padding:'6px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>CHECK INBOX</button>
            </div>
          )}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:3,color:'var(--text-mid)'}}>OUTCOME BREAKDOWN</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['OUTCOME','COUNT','%','BAR'].map(h => <th key={h} style={{padding:'7px 14px',textAlign:h==='OUTCOME'?'left':'right',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['INTERESTED 🔥',callLog.filter(c=>c.outcome==='interested').length,'var(--teal)'],['ANSWERED',callLog.filter(c=>c.outcome==='answered').length,'#2EFF9A'],['CALLBACK',callLog.filter(c=>c.outcome==='callback').length,'#FF6B2B'],['VOICEMAIL',callLog.filter(c=>c.outcome==='voicemail').length,'var(--text-dim)'],['NOT INTERESTED',callLog.filter(c=>c.outcome==='not-interested').length,'#FF3B3B']].map(([label,count,color]) => {
                  const pct = totalCalls > 0 ? Math.round(count/totalCalls*100) : 0;
                  return (
                    <tr key={label} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:600,color}}>{label}</td>
                      <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{count}</td>
                      <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)'}}>{pct}%</td>
                      <td style={{padding:'8px 14px',width:100}}>
                        <div style={{height:4,background:'var(--surface3)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',background:color,width:`${pct}%`}}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Recent call timeline */}
          {callLog.length > 0 && (
            <div style={{marginTop:16,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
              <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:3,color:'var(--text-mid)'}}>RECENT CALLS</span>
              </div>
              {callLog.slice(0,15).map(entry => {
                const c = {answered:'#2EFF9A',voicemail:'#6B7A8D',callback:'#FF6B2B',interested:'var(--teal)','not-interested':'#FF3B3B'}[entry.outcome]||'#6B7A8D';
                return (
                  <div key={entry.id} style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}></div>
                    <div style={{flex:1}}>
                      <span style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:600}}>{entry.name||'Unknown'}</span>
                      {entry.business && <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginLeft:8}}>{entry.business}</span>}
                    </div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:c}}>{entry.outcome?.toUpperCase()}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',minWidth:40,textAlign:'right'}}>{fmtTime(entry.duration||0)}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',minWidth:80,textAlign:'right'}}>{fmtDate(entry.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RECORDINGS TAB ── */}
      {tab === 'recordings' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'var(--text-mid)'}}>CALL RECORDINGS + AI ANALYSIS</div>
            <button onClick={loadRecordings} style={{padding:'6px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>↻ REFRESH</button>
          </div>
          {recLoading ? (
            <div style={{textAlign:'center',padding:40,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>Loading recordings...</div>
          ) : recordings.length === 0 ? (
            <div style={{textAlign:'center',padding:40,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>No recordings yet. Calls are recorded automatically — they'll appear here after each call completes.</div>
          ) : recordings.map(rec => {
            const isOpen = expandedRec === rec.id || expandedRec === rec.callSid;
            const a = rec.analysis;
            const sentColor = {positive:'#2EFF9A',negative:'#FF3B3B',neutral:'var(--text-dim)'}[a?.sentiment]||'var(--text-dim)';
            return (
              <div key={rec.id||rec.callSid} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,marginBottom:8,overflow:'hidden'}}>
                <div onClick={()=>setExpandedRec(isOpen?null:(rec.id||rec.callSid))} style={{padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:sentColor,flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:14,fontWeight:600}}>{rec.contactName||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>{rec.outcome?.toUpperCase()} · {rec.script||'—'} · {fmtDate(rec.timestamp||rec.transcribedAt)}</div>
                  </div>
                  {rec.transcript && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--teal)',padding:'2px 6px',border:'1px solid var(--teal)44',borderRadius:2}}>TRANSCRIPT</span>}
                  {a && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:sentColor,padding:'2px 6px',border:`1px solid ${sentColor}44`,borderRadius:2}}>{a.sentiment?.toUpperCase()}</span>}
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)'}}>{isOpen?'▲':'▼'}</span>
                </div>
                {isOpen && (
                  <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)',background:'var(--surface2)'}}>
                    {a && (
                      <div style={{marginBottom:14}}>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--teal)',letterSpacing:2,marginBottom:8}}>// AI ANALYSIS</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                          {[['SUMMARY',a.summary],['FOLLOW-UP',a.follow_up_action],['WHAT WORKED',a.what_worked],['IMPROVE',a.what_to_improve]].map(([k,v])=>v?(
                            <div key={k} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:'8px 10px'}}>
                              <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--text-dim)',letterSpacing:1,marginBottom:4}}>{k}</div>
                              <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,color:'var(--text-mid)',lineHeight:1.5}}>{v}</div>
                            </div>
                          ):null)}
                        </div>
                        {(a.objections?.length > 0 || a.buying_signals?.length > 0) && (
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                            {[['OBJECTIONS RAISED',a.objections,'#FF3B3B'],['BUYING SIGNALS',a.buying_signals,'#2EFF9A']].map(([k,items,color])=>items?.length>0?(
                              <div key={k} style={{background:'var(--surface)',border:`1px solid ${color}33`,borderRadius:2,padding:'8px 10px'}}>
                                <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color,letterSpacing:1,marginBottom:5}}>{k}</div>
                                {items.map((o,i)=><div key={i} style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,color:'var(--text-mid)',padding:'2px 0'}}>{o}</div>)}
                              </div>
                            ):null)}
                          </div>
                        )}
                      </div>
                    )}
                    {rec.transcript && (
                      <div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--teal)',letterSpacing:2,marginBottom:6}}>// TRANSCRIPT</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-mid)',lineHeight:1.8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:'10px 12px',maxHeight:200,overflowY:'auto',whiteSpace:'pre-wrap'}}>{rec.transcript}</div>
                      </div>
                    )}
                    {!a && !rec.transcript && <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)'}}>Recording in progress or transcript not yet available.</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── INBOX TAB ── */}
      {tab === 'inbox' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'var(--text-mid)'}}>TWO-WAY INBOX</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>Inbound SMS replies to +1 (855) 960-0110 · Tap a message to reply</div>
            </div>
            <button onClick={loadInbox} style={{padding:'6px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>↻ REFRESH</button>
          </div>
          {inboxLoading ? (
            <div style={{textAlign:'center',padding:40,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>Loading inbox...</div>
          ) : inbox.length === 0 ? (
            <div style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:32,marginBottom:12}}>📭</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>No inbound messages yet.<br/>When prospects reply to your texts, they'll show here.</div>
            </div>
          ) : inbox.map(msg => {
            const isReplying = replyTarget === msg.from;
            return (
              <div key={msg.sid} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,marginBottom:8,overflow:'hidden'}}>
                <div style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'var(--teal)22',border:'1px solid var(--teal)44',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:11,color:'var(--teal)'}}>?</div>
                      <div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--teal)'}}>{msg.from}</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)'}}>{fmtDate(msg.dateSent)}</div>
                      </div>
                    </div>
                    <button onClick={()=>{setReplyTarget(isReplying?null:msg.from);setInboxReplyText(SMS_FOLLOW_UP('',scripts[scriptIdx]?.name||''));}} style={{padding:'5px 12px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,background:isReplying?'var(--teal)':'transparent',color:isReplying?'var(--bg)':'var(--teal)',border:'1px solid var(--teal)44',cursor:'pointer',borderRadius:2}}>
                      {isReplying ? 'CANCEL' : '↩ REPLY'}
                    </button>
                  </div>
                  <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:14,color:'var(--text)',lineHeight:1.5,padding:'8px 10px',background:'var(--surface2)',borderRadius:2,borderLeft:'2px solid var(--teal)44'}}>
                    {msg.body}
                  </div>
                </div>
                {isReplying && (
                  <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',background:'var(--surface2)'}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginBottom:6}}>REPLY TO {msg.from}</div>
                    <textarea value={inboxReplyText} onChange={e=>setInboxReplyText(e.target.value)} style={{width:'100%',background:'var(--surface)',border:`1px solid ${inboxReplyText.length>160?'#FF3B3B':'var(--border2)'}`,color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:70,marginBottom:6}} />
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:inboxReplyText.length>160?'#FF3B3B':'var(--text-dim)'}}>{inboxReplyText.length}/160</span>
                      <button onClick={()=>sendReply(msg.from, inboxReplyText)} style={{padding:'7px 18px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND REPLY</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab === 'admin' && (
        <div style={{padding:20,overflowY:'auto',height:'calc(100vh - 90px)'}}>

          {/* HOW TO USE */}
          <div style={{marginBottom:24,background:'var(--teal)08',border:'1px solid var(--teal)33',borderLeft:'3px solid var(--teal)',borderRadius:2,padding:'14px 16px'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:13,letterSpacing:2,color:'var(--teal)',marginBottom:10}}>⚡ QUICK GUIDE</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                ['📋 Upload contacts','Go to UPLOAD below → drop your CSV → contacts appear in the Dialer list'],
                ['📞 Manual dial','Dialer tab → pick a contact → click DIAL. Disposition the call when done.'],
                ['🤖 AI MODE','Top-right toggle. ON = AI (Claude) talks live. OFF = plays the VinHunter MP3.'],
                ['⚡ AGENT MODE','Top-right toggle. Dials all NEW contacts automatically, no clicking needed.'],
                ['💬 Two-way SMS','After a call, SMS sends auto on INTERESTED. Replies show in INBOX tab.'],
                ['🎙 Recordings','Every call is recorded. RECORDINGS tab shows transcripts + AI analysis.'],
              ].map(([title, desc]) => (
                <div key={title} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:'8px 10px'}}>
                  <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,fontWeight:700,color:'var(--text)',marginBottom:2}}>{title}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',lineHeight:1.5}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SKIN SWITCHER */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>SKIN / THEME</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:8}}>// DARK</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:14}}>
              {Object.entries(SKINS).filter(([,s])=>s.dark).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{padding:'12px 8px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`2px solid ${skinKey===key?s.accent:'var(--border2)'}`,background:skinKey===key?`${s.accent}22`:s.bg,color:skinKey===key?s.accent:s.textDim,borderRadius:3,textAlign:'center',transition:'all 0.15s',position:'relative'}}>
                  {skinKey===key && <div style={{position:'absolute',top:3,right:3,width:5,height:5,borderRadius:'50%',background:s.accent}}></div>}
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontWeight:700,fontSize:9,color:skinKey===key?s.accent:s.text}}>{s.label}</div>
                </button>
              ))}
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:8}}>// LIGHT</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
              {Object.entries(SKINS).filter(([,s])=>!s.dark).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{padding:'12px 8px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`2px solid ${skinKey===key?s.accent:'#C0CEDC'}`,background:skinKey===key?`${s.accent}18`:s.bg,color:skinKey===key?s.accent:s.textDim,borderRadius:3,textAlign:'center',transition:'all 0.15s',position:'relative'}}>
                  {skinKey===key && <div style={{position:'absolute',top:3,right:3,width:5,height:5,borderRadius:'50%',background:s.accent}}></div>}
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontWeight:700,fontSize:9,color:skinKey===key?s.accent:s.text}}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CSV UPLOAD */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>UPLOAD CONTACTS (CSV)</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:24,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:2}}>
              <div style={{fontSize:26,marginBottom:7}}>📂</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>Click to upload CSV</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:4,opacity:0.6}}>Columns needed: name, phone · Optional: business_name, email</div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
            </label>
          </div>

          {/* SCRIPTS EDITOR */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>EDIT SCRIPTS</div>
            {scripts.map((s,i) => (
              <div key={i} style={{marginBottom:14}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:s.color,letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>SCRIPT {String.fromCharCode(65+i)} — {s.name}</div>
                <textarea defaultValue={s.sections.map(sec=>`[${sec.label}]\n${sec.text}`).join('\n\n')}
                  onBlur={e=>{const blocks=e.target.value.split(/\[([^\]]+)\]\n/);const sections=[];for(let j=1;j<blocks.length;j+=2)sections.push({label:blocks[j],text:(blocks[j+1]||'').trim()});if(sections.length>0)setScripts(prev=>{const next=[...prev];next[i]={...next[i],sections};return next;});}}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:10,padding:'9px 11px',outline:'none',borderRadius:2,resize:'vertical',minHeight:90,lineHeight:1.6}} />
              </div>
            ))}
          </div>

          {/* DATA MANAGEMENT */}
          <div>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>DATA MANAGEMENT</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>📥 EXPORT CALL LOG</button>
              <button onClick={() => exportCSV([['Name','Business','Phone','Email','Status','List'],...contacts.map(c=>[c.name,c.business_name,c.phone,c.email,c.status,c.list_name])],'contacts.csv')} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>📥 EXPORT CONTACTS</button>
              <button onClick={() => { if(confirm('Clear all call log and contacts? This cannot be undone.')) { setContacts([]); setCallLog([]); notify('All data cleared','warning'); } }} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'#FF3B3B',color:'white',border:'none',cursor:'pointer',borderRadius:2,marginLeft:'auto'}}>🗑 CLEAR ALL DATA</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS MODAL ── */}
      {smsModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:3,padding:22,width:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:3,color:'var(--teal)',marginBottom:16}}>SEND SMS</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginBottom:4}}>TO: {activeContact?.phone||'—'} {activeContact?.name?`(${activeContact.name})`:''}</div>
            <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:`1px solid ${smsBody.length>160?'#FF3B3B':'var(--border2)'}`,color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:80,marginBottom:4}} />
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:smsBody.length>160?'#FF3B3B':smsBody.length>140?'#FFD600':'var(--text-dim)'}}>{smsBody.length}/160 chars</span>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setSmsModal(false)} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={sendSMS} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:3,padding:22,width:400,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:3,color:'var(--teal)',marginBottom:16}}>ADD CONTACT</div>
            {[['Name','name'],['Business','business_name'],['Phone *','phone'],['Email','email'],['List Name','list_name']].map(([label,key]) => (
              <div key={key} style={{marginBottom:9}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:1,marginBottom:4}}>{label.toUpperCase()}</div>
                <input value={newContact[key]} onChange={e => setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => { if(!newContact.phone) return notify('Phone number required','warning'); setContacts(prev => [...prev, {...newContact, id:Date.now(), status:'new', notes:'', created_at:new Date().toISOString()}]); setNewContact({name:'',business_name:'',phone:'',email:'',list_name:''}); setShowAddModal(false); notify('Contact added','success'); }} style={{padding:'8px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AGENT CONFIRM MODAL ── */}
      {agentConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid #2EFF9A44',borderRadius:3,padding:24,width:400,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'#2EFF9A',marginBottom:8}}>⚡ START AGENT?</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-dim)',lineHeight:1.7,marginBottom:16}}>
              Agent will auto-dial all <strong style={{color:'var(--text)'}}>{newCount} NEW contacts</strong> back-to-back with a 4-second pause between each call.<br/><br/>
              Mode: <strong style={{color:aiCallMode?'var(--teal)':'#FF6B2B'}}>{aiCallMode?'🤖 AI CONVERSATION':'📻 MP3 PITCH'}</strong><br/>
              Script: <strong style={{color:'var(--text)'}}>{scripts[scriptIdx]?.name||'—'}</strong><br/><br/>
              TCPA hours enforced — agent will stop if you go outside 8am–9pm.
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setAgentConfirm(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={startAgent} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'#2EFF9A',color:'#080A0F',border:'none',cursor:'pointer',borderRadius:2}}>START DIALING</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION ── */}
      {notification && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'11px 16px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'#2EFF9A':notification.type==='warning'?'#FF6B2B':'var(--teal)'}`,borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text)',zIndex:1000,maxWidth:300,animation:'slideUp 0.3s ease'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── SCRIPTS ─────────────────────────────────────────────────────────────────
const DEFAULT_SCRIPTS = [
  {
    name: 'VINHUNTER / DEALER', color: '#14F1C6',
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

// Product-aware SMS templates
const SMS_TEMPLATES = {
  'VINHUNTER / DEALER': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Free lot audit: what buyers find when they Google your VINs + 4 things we check that CARFAX structurally can't. vinledgerai.live/pricing Reply STOP to opt out.`,
  'ECONOCLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. 21 AI agents, your biz, 24/7. $500 setup + $99/mo — agencies charge $5K+ for the same. econoclaw.vercel.app Reply STOP to opt out.`,
  'WHITEGLOVECLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. White-glove AI. SetupClaw scope, 20% less. VPS $2,400, Mac Mini $4K, same-day go-live. Reply STOP to opt out.`,
  'RENTACLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Try 21 AI agents a week, $49. Doesn't pay for itself, I refund you personally. econoclaw.vercel.app/rent Reply STOP to opt out.`,
  'BUDGETCLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Year 1 your way: $6,188+. Year 1 BUDGETclaw: $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
  'TRANSBID': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. TransBid: post projects free, zero cost until job done and you're satisfied. HomeAdvisor charges 15-30% hidden. transbid.live Reply STOP to opt out.`,
  'CLAWAWAY': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. We build AI systems. Flexible on what, how you pay. Card, crypto, rev share, barter. econoclaw.vercel.app Reply STOP to opt out.`,
};
const SMS_FOLLOW_UP = (name, scriptName) => {
  const fn = SMS_TEMPLATES[scriptName] || SMS_TEMPLATES['VINHUNTER / DEALER'];
  return fn(name);
};

// ─── SKINS ───────────────────────────────────────────────────────────────────
const SKINS = {
  DEFAULT:      { label:'CLAW DEFAULT', icon:'🖤', accent:'#14F1C6', bg:'#080A0F', surface:'#0D1017', surface2:'#121820', surface3:'#1A2230', border:'#1E2D40', border2:'#243344', text:'#E8EDF5', textDim:'#6B7A8D', textMid:'#9AAABB' },
  CYBERCLAW:    { label:'CYBERCLAW',    icon:'💜', accent:'#BF00FF', bg:'#0A0010', surface:'#100020', surface2:'#160030', surface3:'#1E0040', border:'#2D0060', border2:'#3D0080', text:'#F0E0FF', textDim:'#7A5A9A', textMid:'#B090D0' },
  GOTHICCLAW:   { label:'GOTHICCLAW',   icon:'🩸', accent:'#CC0000', bg:'#0D0000', surface:'#1A0000', surface2:'#200000', surface3:'#2A0000', border:'#3D0000', border2:'#550000', text:'#FFDDDD', textDim:'#7A3333', textMid:'#BB7777' },
  TACTICLAW:    { label:'TACTICLAW',    icon:'🎯', accent:'#7FFF00', bg:'#0A0C07', surface:'#141A0E', surface2:'#1A2214', surface3:'#202A18', border:'#2A3820', border2:'#344828', text:'#E8F0D0', textDim:'#5A7040', textMid:'#8AAA60' },
  ECONOSKIN:    { label:'ECONOCLAW',    icon:'🔥', accent:'#FF6B2B', bg:'#0F0800', surface:'#1A0E00', surface2:'#221200', surface3:'#2C1800', border:'#3D2200', border2:'#552E00', text:'#FFE8D0', textDim:'#7A5030', textMid:'#BB8860' },
  BUDGETSKIN:   { label:'BUDGETCLAW',   icon:'📊', accent:'#39FF14', bg:'#000A00', surface:'#001400', surface2:'#001C00', surface3:'#002400', border:'#003800', border2:'#004A00', text:'#D0FFD0', textDim:'#3A7A3A', textMid:'#70BB70' },
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const baseCss = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; color: var(--text); font-family: 'Barlow Condensed', sans-serif; overflow: hidden; background: var(--bg); }
  body::before { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px); pointer-events: none; z-index: 9999; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border2); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes flash { 0%{box-shadow:0 0 0 rgba(20,241,198,0)} 50%{box-shadow:0 0 60px rgba(20,241,198,0.4)} 100%{box-shadow:0 0 0 rgba(20,241,198,0)} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  --orange: #FF6B2B; --red: #FF3B3B; --green: #2EFF9A; --yellow: #FFD600; --blue: #3B8FFF;
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
function storageGet(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── FAVICON SVG ─────────────────────────────────────────────────────────────
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#080A0F"/><text x="4" y="24" font-size="22" font-family="monospace" fill="#14F1C6">⚡</text></svg>`;
const FAVICON_URL = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClawDialer() {
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

  const timerRef = useRef(null);
  const agentRef = useRef(null);
  const agentModeRef = useRef(false);
  const agentPausedRef = useRef(false);
  const pollRef = useRef(null);

  agentModeRef.current = agentMode;
  agentPausedRef.current = agentPaused;

  const skin = SKINS[skinKey] || SKINS.DEFAULT;

  // Skin-derived CSS vars
  const skinCss = `:root {
    --bg:${skin.bg}; --surface:${skin.surface}; --surface2:${skin.surface2}; --surface3:${skin.surface3};
    --border:${skin.border}; --border2:${skin.border2};
    --teal:${skin.accent}; --teal-dim:${skin.accent}88;
    --text:${skin.text}; --text-dim:${skin.textDim}; --text-mid:${skin.textMid};
    --orange:#FF6B2B; --red:#FF3B3B; --green:#2EFF9A; --yellow:#FFD600; --blue:#3B8FFF;
  }`;

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  // Persist
  useEffect(() => { storageSet('claw_skin', skinKey); }, [skinKey]);
  useEffect(() => { storageSet('claw_contacts', contacts); }, [contacts]);
  useEffect(() => { storageSet('claw_calllog', callLog); }, [callLog]);
  useEffect(() => { storageSet('claw_scripts', scripts); }, [scripts]);

  // Poll call status
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
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // ── CONTACTS ──
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
      notify(`Imported ${newOnes.length} contacts`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── CALL ──
  async function startCall() {
    if (activeIdx === null) return notify('Select a contact first', 'warning');
    if (!activeContact.phone) return notify('No phone number', 'warning');
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
      notify(`Dialing ${activeContact.name || activeContact.phone}...`, 'info');
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
      notify(`🔥 HOT LEAD! Auto-sending SMS to ${activeContact.name}`, 'success');
      try {
        await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:activeContact.phone, body:SMS_FOLLOW_UP(activeContact.name, scripts[scriptIdx]?.name) }) });
      } catch {}
    }
    setCallSeconds(0);
    setNotes('');
    if (agentModeRef.current && !agentPausedRef.current) {
      agentRef.current = setTimeout(() => agentNext(), 4000);
    }
  }

  // ── AGENT MODE ──
  function toggleAgent() {
    const next = !agentMode;
    setAgentMode(next);
    if (next) { setAgentPaused(false); notify('AI Agent Mode ACTIVE', 'info'); setTimeout(() => agentNext(), 1000); }
    else { clearTimeout(agentRef.current); notify('Agent stopped', 'warning'); }
  }

  function agentNext() {
    if (!agentModeRef.current || agentPausedRef.current) return;
    const newOnes = contacts.filter(c => c.status === 'new');
    if (newOnes.length === 0) { setAgentMode(false); notify('Agent complete — no new contacts remaining', 'success'); return; }
    const nextIdx = contacts.indexOf(newOnes[0]);
    selectContact(nextIdx);
    setTimeout(() => { if (agentModeRef.current && !agentPausedRef.current) startCall(); }, 1500);
  }

  // ── SMS ──
  async function sendSMS() {
    if (!activeContact?.phone) return notify('No phone number', 'warning');
    try {
      const r = await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:activeContact.phone, body:smsBody }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      notify(`SMS sent ✓`, 'success');
      setSmsModal(false);
    } catch (err) { notify(`SMS failed: ${err.message}`, 'warning'); }
  }

  // ── EXPORT ──
  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content],{type:'text/csv'})); a.download = filename; a.click();
  }

  // ── STATS ──
  const totalCalls = callLog.length;
  const answeredCalls = callLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const interestedCalls = callLog.filter(c => c.outcome === 'interested').length;
  const pipeline = interestedCalls * 99;
  const answerRate = totalCalls > 0 ? Math.round(answeredCalls/totalCalls*100) : 0;
  const intRate = totalCalls > 0 ? Math.round(interestedCalls/totalCalls*100) : 0;
  const statusColor = { idle:'#6B7A8D', dialing:'#FFD600', connected:'#2EFF9A', ended:'#FF6B2B' };
  const statusText = { idle:'STANDBY', dialing:'DIALING...', connected:'CONNECTED', ended:'CALL ENDED' };

  // Status badge color
  const statusBadge = { new:'var(--teal)', called:'var(--text-dim)', voicemail:'var(--blue)', callback:'var(--orange)', interested:'var(--green)', 'not-interested':'var(--red)' };

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
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:50,background:'var(--surface)',borderBottom:`1px solid var(--teal)44`,position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:20,letterSpacing:3,color:'var(--teal)',textShadow:`0 0 20px ${skin.accent}66`}}>
            ⚡ CLAW DIALER <span style={{color:'var(--text-dim)',fontSize:10,fontFamily:'DM Mono,monospace',letterSpacing:2,verticalAlign:'middle'}}>// COMMAND CENTER</span>
          </span>
          <span style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:10,background:'rgba(46,255,154,0.08)',border:'1px solid rgba(46,255,154,0.2)',color:'#2EFF9A'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#2EFF9A',animation:'pulse 2s infinite',display:'inline-block'}}></span>LIVE
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>
          <span>+1 (855) 960-0110</span>
          <span style={{color:'var(--border2)'}}>|</span>
          <span style={{color:'var(--teal)'}}>{clock}</span>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 20px'}}>
        {['dialer','dashboard','admin'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'10px 18px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:tab===t?'var(--teal)':'var(--text-dim)',cursor:'pointer',border:'none',borderBottom:tab===t?`2px solid var(--teal)`:'2px solid transparent',background:'none',transition:'all 0.2s'}}>
            {t.toUpperCase()}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,padding:'0 8px'}}>
          <button onClick={() => setAiCallMode(v => !v)} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${aiCallMode?'var(--teal)':'var(--border2)'}`,background:aiCallMode?'var(--teal)22':'transparent',color:aiCallMode?'var(--teal)':'var(--text-dim)',borderRadius:2}}>
            {aiCallMode ? '🤖 AI MODE ON' : '🤖 AI MODE'}
          </button>
          <button onClick={toggleAgent} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${agentMode?'#2EFF9A':'var(--border2)'}`,background:agentMode?'rgba(46,255,154,0.1)':'transparent',color:agentMode?'#2EFF9A':'var(--text-dim)',borderRadius:2}}>
            {agentMode ? '⚡ AGENT ON' : '⚡ AGENT'}
          </button>
        </div>
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && (
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr 260px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* LEFT: CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:6,flexDirection:'column'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'6px 10px',outline:'none',borderRadius:2}} />
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['all','new','called','callback','interested','voicemail'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,cursor:'pointer',border:`1px solid ${statusFilter===f?'var(--teal)':'var(--border2)'}`,background:statusFilter===f?'var(--teal)22':'transparent',color:statusFilter===f?'var(--teal)':'var(--text-dim)',borderRadius:2,textTransform:'uppercase'}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {filteredContacts.length === 0 ? (
                <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>No contacts.<br/>Upload CSV in Admin.</div>
              ) : filteredContacts.map((c, i) => {
                const realIdx = contacts.indexOf(c);
                return (
                  <div key={c.id} onClick={() => selectContact(realIdx)} style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeIdx===realIdx?'var(--surface2)':'transparent',borderLeft:activeIdx===realIdx?`2px solid var(--teal)`:'2px solid transparent',transition:'all 0.1s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:2,background:`${statusBadge[c.status]||'var(--teal)'}22`,border:`1px solid ${statusBadge[c.status]||'var(--teal)'}44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:11,color:statusBadge[c.status]||'var(--teal)',flexShrink:0}}>
                        {initials(c.name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'No Name'}</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.business_name||c.phone||''}</div>
                      </div>
                      <div style={{width:6,height:6,borderRadius:'50%',background:statusBadge[c.status]||'var(--border2)',flexShrink:0}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:6}}>
              <button onClick={() => setShowAddModal(true)} style={{flex:1,padding:'7px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>+ ADD</button>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',display:'flex',alignItems:'center',paddingLeft:6}}>{contacts.filter(c=>c.status==='new').length} new</span>
            </div>
          </div>

          {/* CENTER: DIALER */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:0}}>

            {/* Contact card */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              {activeContact ? (
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{width:44,height:44,borderRadius:2,background:`var(--teal)22`,border:`1px solid var(--teal)44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:18,color:'var(--teal)',flexShrink:0}}>
                    {initials(activeContact.name)}
                  </div>
                  <div>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:20,letterSpacing:2,color:'var(--text)'}}>{activeContact.name||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--teal)'}}>{activeContact.phone}</div>
                    {activeContact.business_name && <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>{activeContact.business_name}</div>}
                    {activeContact.email && <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)'}}>{activeContact.email}</div>}
                  </div>
                </div>
              ) : (
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>← Select a contact to dial</div>
              )}
            </div>

            {/* Call controls */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:statusColor[callState],boxShadow:`0 0 8px ${statusColor[callState]}`,animation:callState==='connected'?'pulse 1.5s infinite':'none'}}></div>
                <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:3,color:statusColor[callState]}}>{statusText[callState]}</span>
                {callState !== 'idle' && <span style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--text-mid)',marginLeft:'auto'}}>{fmtTime(callSeconds)}</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {callState === 'idle' && (
                  <button onClick={startCall} style={{padding:'12px 24px',fontFamily:'Bebas Neue,sans-serif',fontSize:15,letterSpacing:3,background:'#2EFF9A',color:'#080A0F',border:'none',cursor:'pointer',borderRadius:2}}>📞 DIAL</button>
                )}
                {['dialing','connected'].includes(callState) && (
                  <>
                    <button onClick={endCall} style={{padding:'12px 24px',fontFamily:'Bebas Neue,sans-serif',fontSize:15,letterSpacing:3,background:'#FF3B3B',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>🔴 END</button>
                    <button onClick={() => setDisposition('voicemail')} style={{padding:'12px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🎙 DROP VM</button>
                  </>
                )}
                <button onClick={() => activeContact ? setSmsModal(true) : notify('Select a contact','warning')} style={{padding:'12px 14px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,letterSpacing:1,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>💬 SMS</button>
              </div>
              {['connected','ended'].includes(callState) && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                  {[['answered','✅ ANSWERED','#2EFF9A'],['voicemail','📬 VM','var(--text-dim)'],['callback','🔁 CALLBACK','#FF6B2B'],['interested','🔥 INTERESTED','var(--teal)'],['not-interested','❌ NO','#FF3B3B']].map(([outcome,label,color]) => (
                    <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'9px 4px',fontFamily:'Barlow Condensed,sans-serif',fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',cursor:'pointer',border:`1px solid ${color}44`,background:`${color}11`,color,borderRadius:2,textAlign:'center'}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,marginBottom:6}}>// CALL NOTES</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Type notes during call..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:60}} />
            </div>

            {/* Script */}
            <div style={{flex:1,padding:'12px 20px'}}>
              <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
                {scripts.map((s,i) => (
                  <button key={i} onClick={() => setScriptIdx(i)} style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${scriptIdx===i?s.color+'88':'var(--border2)'}`,background:scriptIdx===i?'var(--surface3)':'transparent',color:scriptIdx===i?s.color:'var(--text-dim)',borderRadius:2,textTransform:'uppercase'}}>
                    {s.name}
                  </button>
                ))}
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:14}}>
                {scripts[scriptIdx]?.sections.map((sec,i) => (
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:scripts[scriptIdx].color,letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{sec.label}</div>
                    <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:13,color:'var(--text-mid)',lineHeight:1.6}} dangerouslySetInnerHTML={{__html:sec.text.replace(/\[([^\]]+)\]/g,'<span style="color:var(--teal);font-family:DM Mono,monospace;font-size:11px">[$1]</span>')}} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: STATS + LOG */}
          <div style={{background:'var(--surface)',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:10}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>LIVE STATS</span>
            </div>
            {[['Total Calls',totalCalls,'var(--teal)'],['Answer Rate',`${answerRate}%`,'#2EFF9A'],['Interested',`${intRate}%`,'#FF6B2B']].map(([label,val,color]) => (
              <div key={label} style={{padding:'14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{label}</div>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:30,letterSpacing:2,color,lineHeight:1}}>{val}</div>
              </div>
            ))}
            <div style={{padding:'14px',borderBottom:'1px solid var(--border)',background:`${skin.accent}08`,borderLeft:`2px solid var(--teal)`}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>EST. PIPELINE MRR</div>
              <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:26,color:'var(--teal)',letterSpacing:2}}>${pipeline.toLocaleString()}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:4}}>@ $99/mo per interested</div>
            </div>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CALL LOG</span>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'4px 8px',fontFamily:'Barlow Condensed,sans-serif',fontSize:9,fontWeight:700,letterSpacing:1,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>EXPORT</button>
            </div>
            {callLog.length === 0 ? (
              <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>No calls yet</div>
            ) : callLog.slice(0,60).map(entry => {
              const c = {answered:'#2EFF9A',voicemail:'var(--text-dim)',callback:'#FF6B2B',interested:'var(--teal)','not-interested':'#FF3B3B'}[entry.outcome]||'var(--text-dim)';
              return (
                <div key={entry.id} style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>{entry.outcome.toUpperCase()} · {fmtTime(entry.duration)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
            {[['Total Calls',totalCalls,'var(--teal)',totalCalls],['Answer Rate',`${answerRate}%`,'#2EFF9A',answerRate],['Hot Leads',interestedCalls,'#FF6B2B',intRate],['Pipeline MRR',`$${pipeline}`,'var(--teal)',100]].map(([label,val,color,pct]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:20}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:38,letterSpacing:2,color,lineHeight:1,marginBottom:6}}>{val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase'}}>{label}</div>
                <div style={{height:2,background:'var(--surface3)',borderRadius:2,marginTop:10,overflow:'hidden'}}>
                  <div style={{height:'100%',background:color,width:`${Math.min(pct,100)}%`,transition:'width 0.5s'}}></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>OUTCOME BREAKDOWN</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['OUTCOME','COUNT','%'].map(h => <th key={h} style={{padding:'8px 16px',textAlign:h==='OUTCOME'?'left':'right',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:1,fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['INTERESTED 🔥',callLog.filter(c=>c.outcome==='interested').length,'var(--teal)'],['ANSWERED',callLog.filter(c=>c.outcome==='answered').length,'#2EFF9A'],['CALLBACK',callLog.filter(c=>c.outcome==='callback').length,'#FF6B2B'],['VOICEMAIL',callLog.filter(c=>c.outcome==='voicemail').length,'var(--text-dim)'],['NOT INTERESTED',callLog.filter(c=>c.outcome==='not-interested').length,'#FF3B3B']].map(([label,count,color]) => (
                  <tr key={label} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:600,color}}>{label}</td>
                    <td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13}}>{count}</td>
                    <td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>{totalCalls>0?Math.round(count/totalCalls*100):0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab === 'admin' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>

          {/* SKIN SWITCHER */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>SKIN / THEME</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(SKINS).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{padding:'12px 8px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${skinKey===key?s.accent:'var(--border2)'}`,background:skinKey===key?`${s.accent}22`:'var(--surface2)',color:skinKey===key?s.accent:'var(--text-dim)',borderRadius:2,textAlign:'center',transition:'all 0.15s'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CSV UPLOAD */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>UPLOAD CONTACTS (CSV)</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:28,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:2}}>
              <div style={{fontSize:28,marginBottom:8}}>📂</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-dim)'}}>Click to upload CSV<br/><span style={{fontSize:9,opacity:0.6}}>Columns: name, business_name, phone, email</span></div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
            </label>
          </div>

          {/* SCRIPTS EDITOR */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>EDIT SCRIPTS</div>
            {scripts.map((s,i) => (
              <div key={i} style={{marginBottom:16}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:s.color,letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>SCRIPT {String.fromCharCode(65+i)} — {s.name}</div>
                <textarea defaultValue={s.sections.map(sec=>`[${sec.label}]\n${sec.text}`).join('\n\n')}
                  onBlur={e=>{const blocks=e.target.value.split(/\[([^\]]+)\]\n/);const sections=[];for(let j=1;j<blocks.length;j+=2)sections.push({label:blocks[j],text:(blocks[j+1]||'').trim()});if(sections.length>0)setScripts(prev=>{const next=[...prev];next[i]={...next[i],sections};return next;});}}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'10px 12px',outline:'none',borderRadius:2,resize:'vertical',minHeight:100,lineHeight:1.6}} />
              </div>
            ))}
          </div>

          {/* DATA MANAGEMENT */}
          <div>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>DATA MANAGEMENT</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CALL LOG</button>
              <button onClick={() => exportCSV([['Name','Business','Phone','Email','Status','List'],...contacts.map(c=>[c.name,c.business_name,c.phone,c.email,c.status,c.list_name])],'contacts.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CONTACTS</button>
              <button onClick={() => { if(confirm('Clear everything?')) { setContacts([]); setCallLog([]); notify('Cleared','warning'); } }} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'#FF3B3B',color:'white',border:'none',cursor:'pointer',borderRadius:2,marginLeft:'auto'}}>CLEAR ALL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS MODAL ── */}
      {smsModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',marginBottom:18}}>// SEND SMS</div>
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:1,marginBottom:6}}>TO</div>
              <input readOnly value={activeContact?.phone||''} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text-dim)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:1,marginBottom:6}}>MESSAGE</div>
              <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:`1px solid ${smsBody.length>160?'#FF3B3B':'var(--border2)'}`,color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:80}} />
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,textAlign:'right',marginTop:4,color:smsBody.length>160?'#FF3B3B':smsBody.length>140?'#FFD600':'var(--text-dim)'}}>{smsBody.length} / 160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={() => setSmsModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={sendSMS} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:420,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',marginBottom:18}}>// ADD CONTACT</div>
            {[['Name','name'],['Business','business_name'],['Phone','phone'],['Email','email'],['List Name','list_name']].map(([label,key]) => (
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:1,marginBottom:5}}>{label.toUpperCase()}</div>
                <input value={newContact[key]} onChange={e => setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => { if(!newContact.name && !newContact.phone) return notify('Need name or phone','warning'); setContacts(prev => [...prev, {...newContact, id:Date.now(), status:'new', notes:'', created_at:new Date().toISOString()}]); setNewContact({name:'',business_name:'',phone:'',email:'',list_name:''}); setShowAddModal(false); notify('Contact added','success'); }} style={{padding:'9px 16px',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION ── */}
      {notification && (
        <div style={{position:'fixed',bottom:24,right:24,padding:'12px 18px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'#2EFF9A':notification.type==='warning'?'#FF6B2B':'var(--teal)'}`,borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:320,animation:'slideUp 0.3s ease'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const DEFAULT_SCRIPTS = [
  {
    name: 'FILS / VINLEDGER',
    color: '#14F1C6',
    sections: [
      { label: 'OPENER', text: "Hey, is this [CONTACT_NAME]? Hey [FIRST_NAME], this is Chase calling from VinLedger — quick question for you..." },
      { label: 'HOOK', text: "Right now, when a buyer Googles one of your VINs before calling you — what do they find? Because we put a Trust Score, recall info, and a branded page on every vehicle on your lot, overnight. So instead of them finding sketchy third-party data, they find your dealership." },
      { label: 'DIFFERENTIATOR', text: "CARFAX charges dealers $99 to $300 a month just for reports. We give you unlimited reports, SEO-indexed inventory pages, lead capture, AND a full shop CRM to replace Tekmetric — all for $249 a month." },
      { label: 'CLOSE', text: "We're doing a founding partner rate right now — price is locked forever at whatever you sign up at. Can I send you a quick walkthrough link? Takes about 3 minutes to see what your lot would look like." }
    ]
  },
  {
    name: 'ECONOCLAW',
    color: '#FF6B2B',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — do you have anyone working your business 24/7, handling leads, answering questions, following up? Because most businesses don't." },
      { label: 'HOOK', text: "We deploy 21 specialized AI agents to your business. They handle customer service, content, research, outreach, analytics — all while you sleep. It's like hiring a full department, except it costs $99 a month." },
      { label: 'COMPARISON', text: "An agency would charge you $5,000 setup and $1,500 a month for this. We're at $500 setup and $99 a month during our launch window. After the window closes it goes to $299 — but founding customers keep $99 forever." },
      { label: 'CLOSE', text: "Can I send you a 2-minute breakdown of exactly what the 21 agents do? No pitch call needed — just read it and tell me if it makes sense for your business." }
    ]
  },
  {
    name: 'WHITEGLOVECLAW',
    color: '#FFD600',
    sections: [
      { label: 'OPENER', text: "Good [morning/afternoon] [CONTACT_NAME], I'm reaching out because we deploy enterprise-grade AI infrastructure for executive teams and founders who want the full white-glove experience." },
      { label: 'POSITIONING', text: "SetupClaw is the market leader in this space — we offer identical scope, identical hardening, identical deliverables, at 20% below their pricing. Same 24/7 infrastructure, same 14-day hypercare, same same-day go-live." },
      { label: 'TIERS', text: "Hosted VPS at $2,400. Mac Mini with iMessage integration at $4,000. In-person deployment at $4,800. Additional specialized agents at $1,200 each. SetupClaw charges $600 to $1,200 more for the same thing." },
      { label: 'CLOSE', text: "I'd love to schedule a 15-minute call to understand your specific needs. What does your week look like?" }
    ]
  },
  {
    name: 'RENTACLAW',
    color: '#3B8FFF',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — have you looked into AI agents for your business? Not asking you to commit to anything — we actually rent them." },
      { label: 'CONCEPT', text: "Think of it like renting a car. Daily at $9, weekly at $49, monthly at $149, annual at $999. You get all 21 agents for whatever period you need. Use them for a campaign, a product launch, a busy season — then pause." },
      { label: 'FLEXIBILITY', text: "We also accept IOU arrangements and revenue share if cash flow is tight. We're flexible because we want you to try it and see the value before you commit." },
      { label: 'CLOSE', text: "Want to try a week for $49? If it doesn't generate at least $49 in value, I'll give you your money back personally." }
    ]
  },
  {
    name: 'CLAWAWAY',
    color: '#2EFF9A',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME] — I'm going to be straight with you. We build AI systems. We're flexible on what we build, what you pay, and how you pay it." },
      { label: 'CORE MESSAGE', text: "Tell us what you want to build. Tell us what you want to pay. Tell us how you want to pay it. Card, ACH, Zelle, CashApp, crypto, rev share, equity, even barter. We'll figure it out." },
      { label: 'PROOF', text: "We're already running 21 AI agents across five live platforms. We know how to build this stuff. What we care about is getting you results, not getting you to sign a specific package." },
      { label: 'CLOSE', text: "What's the one thing in your business right now that's eating the most time or costing the most money? Let's start there." }
    ]
  }
];

const SMS_FOLLOW_UP = (name) =>
  `Hi ${name || 'there'}, this is Chase from VinLedger. Happy to walk you through how we get Google-indexed pages on your entire inventory overnight. Just reply here.`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080A0F; --surface: #0D1017; --surface2: #121820; --surface3: #1A2230;
    --border: #1E2D40; --border2: #243344;
    --teal: #14F1C6; --teal-dim: #0A9478;
    --orange: #FF6B2B; --red: #FF3B3B; --green: #2EFF9A; --yellow: #FFD600; --blue: #3B8FFF;
    --text: #E8EDF5; --text-dim: #6B7A8D; --text-mid: #9AAABB;
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'Barlow Condensed', sans-serif; overflow: hidden; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border2); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
`;

function fmtTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
function storageGet(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function ClawDialer() {
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
  const [notification, setNotification] = useState(null);
  const [smsModal, setSmsModal] = useState(false);
  const [smsBody, setSmsBody] = useState('');
  const [clock, setClock] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', business_name:'', phone:'', email:'', list_name:'' });

  const timerRef = useRef(null);
  const autoEndRef = useRef(null);
  const agentRef = useRef(null);
  const agentModeRef = useRef(false);
  const agentPausedRef = useRef(false);
  const callStateRef = useRef('idle');
  const activeIdxRef = useRef(null);
  const notesRef = useRef('');
  const scriptIdxRef = useRef(0);
  const callSecondsRef = useRef(0);
  const contactsRef = useRef([]);

  agentModeRef.current = agentMode;
  agentPausedRef.current = agentPaused;
  callStateRef.current = callState;
  activeIdxRef.current = activeIdx;
  notesRef.current = notes;
  scriptIdxRef.current = scriptIdx;
  callSecondsRef.current = callSeconds;
  contactsRef.current = contacts;

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { storageSet('claw_contacts', contacts); }, [contacts]);
  useEffect(() => { storageSet('claw_calllog', callLog); }, [callLog]);
  useEffect(() => { storageSet('claw_scripts', scripts); }, [scripts]);

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
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
    setSmsBody(SMS_FOLLOW_UP(contacts[idx]?.name || ''));
  }

  function updateContactStatus(idx, status, notesVal) {
    setContacts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status, notes: notesVal !== undefined ? notesVal : next[idx].notes };
      return next;
    });
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
        newOnes.push({ id: Date.now()+i, name: nameIdx>=0?cols[nameIdx]:'', business_name: bizIdx>=0?cols[bizIdx]:'', phone: phoneIdx>=0?cols[phoneIdx]:'', email: emailIdx>=0?cols[emailIdx]:'', status:'new', notes:'', list_name: file.name.replace('.csv',''), created_at: new Date().toISOString() });
      }
      setContacts(prev => [...prev, ...newOnes]);
      notify(`Imported ${newOnes.length} contacts`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function startCall() {
    const idx = activeIdxRef.current;
    if (idx === null) return notify('Select a contact first', 'warning');
    const contact = contactsRef.current[idx];
    if (!contact?.phone) return notify('No phone number', 'warning');
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.phone, contactId: contact.id, contactName: contact.name, script: scripts[scriptIdxRef.current]?.name })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`Dialing ${contact.name || contact.phone}...`, 'info');
      autoEndRef.current = setTimeout(() => {
        if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') endCall();
      }, 90000);
    } catch (err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function endCall() {
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    setCallState('ended');
  }

  async function setDisposition(outcome) {
    const idx = activeIdxRef.current;
    if (idx === null) return;
    const contact = contactsRef.current[idx];
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    setCallState('idle');
    const entry = { id: Date.now(), contact_id: contact.id, name: contact.name, business: contact.business_name, phone: contact.phone, outcome, duration: callSecondsRef.current, notes: notesRef.current, script: scripts[scriptIdxRef.current]?.name, timestamp: new Date().toISOString() };
    setCallLog(prev => [entry, ...prev]);
    updateContactStatus(idx, { answered:'called', voicemail:'voicemail', callback:'callback', interested:'interested', 'not-interested':'not-interested' }[outcome] || 'called', notesRef.current);
    if (outcome === 'interested') {
      notify(`🔥 HOT LEAD — auto-texting ${contact.name}`, 'success');
      try {
        await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: contact.phone, body: SMS_FOLLOW_UP(contact.name) }) });
      } catch {}
    }
    setCallSeconds(0);
    setNotes('');
    if (agentModeRef.current && !agentPausedRef.current) agentRef.current = setTimeout(() => agentNext(), 4000);
  }

  function toggleAgent() {
    const next = !agentMode;
    setAgentMode(next);
    if (next) { setAgentPaused(false); notify('AI Agent Mode ACTIVE', 'info'); setTimeout(() => agentNext(), 1000); }
    else { clearTimeout(agentRef.current); notify('Agent stopped', 'warning'); }
  }

  function agentNext() {
    if (!agentModeRef.current || agentPausedRef.current) return;
    setContacts(prev => {
      const newIdx = prev.findIndex(c => c.status === 'new');
      if (newIdx === -1) { setAgentMode(false); notify('Agent complete — queue empty', 'success'); return prev; }
      const contact = prev[newIdx];
      const updated = prev.map((c, i) => i === newIdx ? { ...c, status: 'calling' } : c);
      setTimeout(() => {
        setActiveIdx(newIdx);
        setNotes(contact.notes || '');
        setSmsBody(SMS_FOLLOW_UP(contact.name || ''));
        setTimeout(() => {
          if (agentModeRef.current && !agentPausedRef.current) startCallForAgent(contact, newIdx);
        }, 1500);
      }, 100);
      return updated;
    });
  }

  async function startCallForAgent(contact, idx) {
    if (!contact?.phone) return;
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: contact.phone, contactId: contact.id, contactName: contact.name, script: scripts[scriptIdxRef.current]?.name }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`[AGENT] Dialing ${contact.name || contact.phone}`, 'info');
      autoEndRef.current = setTimeout(() => {
        if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') {
          endCall();
          if (agentModeRef.current && !agentPausedRef.current) setDisposition('voicemail');
        }
      }, 90000);
    } catch (err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      notify(`Agent call failed: ${err.message}`, 'warning');
      setContacts(prev => prev.map((c, i) => i === idx ? { ...c, status: 'new' } : c));
    }
  }

  async function sendSMS() {
    if (!activeContact?.phone) return notify('No phone number', 'warning');
    if (smsBody.length > 160) return notify('Keep under 160 chars', 'warning');
    try {
      const r = await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: activeContact.phone, body: smsBody }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      notify(`SMS sent ✓`, 'success');
      setSmsModal(false);
    } catch (err) { notify(`SMS failed: ${err.message}`, 'warning'); }
  }

  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type:'text/csv'})); a.download = filename; a.click();
  }

  const totalCalls = callLog.length;
  const answeredCalls = callLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const interestedCalls = callLog.filter(c => c.outcome === 'interested').length;
  const pipeline = interestedCalls * 99;
  const answerRate = totalCalls > 0 ? Math.round(answeredCalls/totalCalls*100) : 0;
  const intRate = totalCalls > 0 ? Math.round(interestedCalls/totalCalls*100) : 0;
  const queuedCount = contacts.filter(c => c.status === 'new').length;
  const statusColor = { idle:'#6B7A8D', dialing:'#FFD600', connected:'#2EFF9A', ended:'#FF6B2B' };
  const statusText = { idle:'STANDBY', dialing:'DIALING...', connected:'CONNECTED', ended:'CALL ENDED' };

  return (
    <>
      <Head><title>CLAW DIALER — Command Center</title><style>{css}</style></Head>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:50,background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:3,color:'var(--teal)'}}>CLAW DIALER <span style={{color:'var(--text-dim)',fontSize:10,fontFamily:'DM Mono, monospace',letterSpacing:2,verticalAlign:'middle'}}>// COMMAND CENTER</span></span>
          <span style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:10,letterSpacing:1,background:'rgba(46,255,154,0.08)',border:'1px solid rgba(46,255,154,0.2)',color:'var(--green)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite',display:'inline-block'}}></span>TWILIO READY
          </span>
        </div>
        <div style={{display:'flex',gap:16,fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>
          <span>+1 (855) 960-0110</span><span style={{color:'var(--border2)'}}>|</span><span style={{color:'var(--teal)'}}>{clock}</span>
        </div>
      </div>

      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 20px'}}>
        {['dialer','dashboard','admin'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'10px 18px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color: tab===t ? 'var(--teal)' : 'var(--text-dim)',cursor:'pointer',border:'none',borderBottom: tab===t ? '2px solid var(--teal)' : '2px solid transparent',background:'none'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dialer' && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr 280px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CONTACTS</span>
              <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{filteredContacts.length} / {contacts.length}</span>
            </div>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:6}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2}} />
              <button onClick={() => setShowAddModal(true)} style={{padding:'7px 12px',background:'var(--teal)',color:'var(--bg)',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,border:'none',cursor:'pointer',borderRadius:2}}>+ ADD</button>
            </div>
            <div style={{padding:'6px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
              {['all','new','callback','interested'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',border:`1px solid ${statusFilter===f ? 'var(--teal-dim)' : 'var(--border2)'}`,background: statusFilter===f ? 'var(--surface3)' : 'transparent',color: statusFilter===f ? 'var(--teal)' : 'var(--text-dim)',borderRadius:2}}>
                  {f === 'all' ? 'ALL' : f === 'new' ? 'NEW' : f === 'callback' ? 'CB' : 'HOT'}
                </button>
              ))}
              <label style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>
                CSV<input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
              </label>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {filteredContacts.length === 0 ? (
                <div style={{padding:40,textAlign:'center',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:11}}>
                  <div style={{fontSize:28,marginBottom:10,opacity:0.3}}>📋</div>
                  {contacts.length === 0 ? 'Upload CSV or add contacts' : 'No matches'}
                </div>
              ) : filteredContacts.map((c) => {
                const idx = contacts.indexOf(c);
                const sColor = { new:'#3B8FFF', called:'#FFD600', calling:'#FFD600', interested:'#14F1C6', voicemail:'#6B7A8D', callback:'#FF6B2B', 'not-interested':'#FF3B3B' }[c.status||'new'];
                return (
                  <div key={c.id} onClick={() => selectContact(idx)} style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',gap:10,background: activeIdx===idx ? 'var(--surface3)' : 'transparent',borderLeft: activeIdx===idx ? '2px solid var(--teal)' : '2px solid transparent'}}>
                    <div style={{width:30,height:30,background:'var(--surface3)',border:'1px solid var(--border2)',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue, sans-serif',fontSize:13,color:'var(--teal)',flexShrink:0}}>{initials(c.name)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'Unknown'}</div>
                      <div style={{fontSize:11,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:2}}>{c.business_name||c.phone||'—'}</div>
                    </div>
                    <div style={{fontFamily:'DM Mono, monospace',fontSize:8,padding:'2px 6px',borderRadius:2,color:sColor,border:`1px solid ${sColor}33`,background:`${sColor}11`,flexShrink:0}}>{(c.status||'NEW').toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER DIALER */}
          <div style={{borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--orange)'}}>// AI AGENT MODE</span>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>AUTO-DIAL</span>
                <div onClick={toggleAgent} style={{width:38,height:19,background: agentMode ? 'rgba(255,107,43,0.3)' : 'var(--surface3)',border:`1px solid ${agentMode ? 'var(--orange)' : 'var(--border2)'}`,borderRadius:10,cursor:'pointer',position:'relative'}}>
                  <div style={{position:'absolute',width:13,height:13,borderRadius:'50%',background: agentMode ? 'var(--orange)' : 'var(--text-dim)',top:2,left: agentMode ? 21 : 2,transition:'left 0.3s',boxShadow: agentMode ? '0 0 8px rgba(255,107,43,0.6)' : 'none'}}></div>
                </div>
                {agentMode && <button onClick={() => setAgentPaused(p => !p)} style={{padding:'4px 10px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>{agentPaused ? 'RESUME' : 'PAUSE'}</button>}
              </div>
            </div>

            <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[['Queued', queuedCount, 'var(--text)'],['Called', totalCalls, 'var(--text)'],['Interested', interestedCalls, 'var(--teal)'],['Pipeline', `$${pipeline}`, 'var(--green)']].map(([label,val,color]) => (
                <div key={label} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:2,padding:'8px 10px',textAlign:'center'}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:18,color,lineHeight:1}}>{val}</div>
                  <div style={{fontSize:9,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase',marginTop:3}}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:26,letterSpacing:2,color:'var(--text)',lineHeight:1}}>{activeContact?.name || 'SELECT A CONTACT'}</div>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)',marginTop:4}}>{activeContact?.business_name || 'Choose from the list'}</div>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:13,color:'var(--teal)',marginTop:6}}>{activeContact?.phone || '—'}</div>
                </div>
                {callState !== 'idle' && <div style={{fontFamily:'DM Mono, monospace',fontSize:30,color:'var(--teal)',letterSpacing:4}}>{fmtTime(callSeconds)}</div>}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontFamily:'DM Mono, monospace',fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background: statusColor[callState],animation: ['dialing','connected'].includes(callState) ? 'pulse 1s infinite' : 'none'}}></div>
                <span style={{color: statusColor[callState]}}>{statusText[callState]}</span>
                {callSid && <span style={{color:'var(--text-dim)',fontSize:9}}>SID: {callSid.slice(0,16)}...</span>}
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {callState === 'idle' && <button onClick={startCall} style={{padding:'12px 24px',fontFamily:'Bebas Neue, sans-serif',fontSize:15,letterSpacing:3,background:'var(--green)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>📞 DIAL</button>}
                {['dialing','connected'].includes(callState) && <>
                  <button onClick={endCall} style={{padding:'12px 24px',fontFamily:'Bebas Neue, sans-serif',fontSize:15,letterSpacing:3,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>🔴 END</button>
                  <button onClick={() => setDisposition('voicemail')} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🎙 DROP VM</button>
                </>}
                <button onClick={() => activeContact ? setSmsModal(true) : notify('Select a contact','warning')} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>💬 SMS</button>
              </div>

              {['connected','ended'].includes(callState) && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                  {[['answered','✅ ANSWERED','var(--green)'],['voicemail','📬 VOICEMAIL','var(--text-dim)'],['callback','🔁 CALLBACK','var(--orange)'],['interested','🔥 INTERESTED','var(--teal)'],['not-interested','❌ NOT INT.','var(--red)']].map(([outcome,label,color]) => (
                    <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'8px 6px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,color,border:`1px solid ${color}44`,background:`${color}11`,cursor:'pointer',borderRadius:2}}>{label}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
              <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                {scripts.map((s,i) => (
                  <button key={i} onClick={() => setScriptIdx(i)} style={{padding:'5px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${scriptIdx===i ? s.color : 'var(--border2)'}`,background: scriptIdx===i ? `${s.color}22` : 'transparent',color: scriptIdx===i ? s.color : 'var(--text-dim)',borderRadius:2}}>{s.name}</button>
                ))}
              </div>
              {scripts[scriptIdx]?.sections.map((sec,i) => (
                <div key={i} style={{marginBottom:14,padding:'12px 14px',background:'var(--surface2)',border:'1px solid var(--border)',borderLeft:`2px solid ${scripts[scriptIdx].color}`,borderRadius:2}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:scripts[scriptIdx].color,letterSpacing:2,marginBottom:6}}>{sec.label}</div>
                  <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,lineHeight:1.6,color:'var(--text)'}}>{sec.text}</div>
                </div>
              ))}
              <div style={{marginTop:8}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:1,marginBottom:6}}>NOTES</div>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Call notes..." style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:60}} />
              </div>
            </div>
          </div>

          {/* RIGHT CALL LOG */}
          <div style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {[['TOTAL CALLS', totalCalls, 'var(--teal)'],['ANSWER RATE', `${answerRate}%`, 'var(--green)'],['INTERESTED', interestedCalls, 'var(--orange)']].map(([label,val,color]) => (
              <div key={label} style={{padding:'14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{label}</div>
                <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:30,letterSpacing:2,color,lineHeight:1}}>{val}</div>
              </div>
            ))}
            <div style={{padding:'14px',borderBottom:'1px solid var(--border)',background:'rgba(20,241,198,0.03)',borderLeft:'2px solid var(--teal)'}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>EST. PIPELINE MRR</div>
              <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:26,color:'var(--teal)',letterSpacing:2}}>${pipeline.toLocaleString()}</div>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginTop:4}}>@ $99/mo per interested</div>
            </div>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CALL LOG</span>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'4px 8px',fontFamily:'Barlow Condensed, sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>EXPORT</button>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {callLog.length === 0 ? <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>No calls yet</div>
              : callLog.slice(0,60).map(entry => {
                const c = {answered:'var(--green)',voicemail:'var(--text-dim)',callback:'var(--orange)',interested:'var(--teal)','not-interested':'var(--red)'}[entry.outcome]||'var(--text-dim)';
                return (
                  <div key={entry.id} style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name||'Unknown'}</div>
                      <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>{entry.outcome.toUpperCase()} · {fmtTime(entry.duration)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
            {[['Total Calls',totalCalls,'var(--teal)',totalCalls],['Answer Rate',`${answerRate}%`,'var(--green)',answerRate],['Hot Leads',interestedCalls,'var(--orange)',intRate],['Pipeline MRR',`$${pipeline}`,'var(--teal)',100]].map(([label,val,color,pct]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:20}}>
                <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:38,letterSpacing:2,color,lineHeight:1,marginBottom:6}}>{val}</div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,textTransform:'uppercase'}}>{label}</div>
                <div style={{height:2,background:'var(--surface3)',borderRadius:2,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',background:color,width:`${Math.min(pct,100)}%`,transition:'width 0.5s'}}></div></div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}><span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>OUTCOME BREAKDOWN</span></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['OUTCOME','COUNT','%'].map(h => <th key={h} style={{padding:'8px 16px',textAlign:h==='OUTCOME'?'left':'right',fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['INTERESTED 🔥','interested','var(--teal)'],['ANSWERED','answered','var(--green)'],['CALLBACK','callback','var(--orange)'],['VOICEMAIL','voicemail','var(--text-dim)'],['NOT INTERESTED','not-interested','var(--red)']].map(([label,key,color]) => {
                  const count = callLog.filter(c=>c.outcome===key).length;
                  return (
                    <tr key={key} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:13,fontWeight:600,color}}>{label}</td>
                      <td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:13}}>{count}</td>
                      <td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>{totalCalls>0?Math.round(count/totalCalls*100):0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'admin' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>UPLOAD CONTACTS (CSV)</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:28,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:2}}>
              <div style={{fontSize:28,marginBottom:8}}>📂</div>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>Click to upload CSV<br/><span style={{fontSize:9,opacity:0.6}}>Columns: name, business_name, phone, email</span></div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
            </label>
          </div>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>EDIT SCRIPTS</div>
            {scripts.map((s,i) => (
              <div key={i} style={{marginBottom:16}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:s.color,letterSpacing:2,marginBottom:6}}>SCRIPT {String.fromCharCode(65+i)} — {s.name}</div>
                <textarea defaultValue={s.sections.map(sec => `[${sec.label}]\n${sec.text}`).join('\n\n')}
                  onBlur={e => {
                    const blocks = e.target.value.split(/\[([^\]]+)\]\n/);
                    const sections = [];
                    for (let j = 1; j < blocks.length; j+=2) sections.push({label:blocks[j],text:(blocks[j+1]||'').trim()});
                    if (sections.length > 0) setScripts(prev => { const next=[...prev]; next[i]={...next[i],sections}; return next; });
                  }}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'10px 12px',outline:'none',borderRadius:2,resize:'vertical',minHeight:100,lineHeight:1.6}}
                />
              </div>
            ))}
          </div>
          <div>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>DATA MANAGEMENT</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CALL LOG</button>
              <button onClick={() => exportCSV([['Name','Business','Phone','Email','Status','List'],...contacts.map(c=>[c.name,c.business_name,c.phone,c.email,c.status,c.list_name])],'contacts.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CONTACTS</button>
              <button onClick={() => { if(confirm('Clear all?')) { setContacts([]); setCallLog([]); notify('Cleared','warning'); } }} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2,marginLeft:'auto'}}>CLEAR ALL</button>
            </div>
          </div>
        </div>
      )}

      {smsModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',marginBottom:18}}>// SEND SMS</div>
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:6}}>TO</div>
              <input readOnly value={activeContact?.phone||''} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:6}}>MESSAGE</div>
              <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:`1px solid ${smsBody.length>160?'var(--red)':'var(--border2)'}`,color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:80}} />
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,textAlign:'right',marginTop:4,color: smsBody.length>160 ? 'var(--red)' : smsBody.length>140 ? 'var(--yellow)' : 'var(--text-dim)'}}>{smsBody.length} / 160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={() => setSmsModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={sendSMS} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND SMS</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:420,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',marginBottom:18}}>// ADD CONTACT</div>
            {[['Name','name'],['Business','business_name'],['Phone','phone'],['Email','email'],['List Name','list_name']].map(([label,key]) => (
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:5}}>{label.toUpperCase()}</div>
                <input value={newContact[key]} onChange={e => setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => {
                if (!newContact.name && !newContact.phone) return notify('Need name or phone','warning');
                setContacts(prev => [...prev, {...newContact, id:Date.now(), status:'new', notes:'', created_at:new Date().toISOString()}]);
                setNewContact({name:'',business_name:'',phone:'',email:'',list_name:''});
                setShowAddModal(false);
                notify('Contact added','success');
              }} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div style={{position:'fixed',bottom:24,right:24,padding:'12px 18px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--teal)'}`,borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:320,animation:'slideUp 0.3s ease'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

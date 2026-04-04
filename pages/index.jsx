import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── REPS — edit here or via REPS env variable ────────────────────────────────
const REPS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REPS
  ? JSON.parse(process.env.NEXT_PUBLIC_REPS)
  : [
      { id: 'chase',    name: 'Chase Turnquest',       pin: '5325', role: 'admin' },
      { id: 'shawn',    name: 'Shawn Rogers',           pin: '5768', role: 'admin' },
      { id: 'malik',    name: 'Malik McCauley',         pin: '8322', role: 'admin' },
      { id: 'karen',    name: 'Karen Wince',            pin: '6048', role: 'rep'   },
      { id: 'shannon',  name: 'Shannon Joned',          pin: '8921', role: 'rep'   },
      { id: 'christian',name: 'Christian Daniel Loeza', pin: '7245', role: 'rep'   },
      { id: 'brittany', name: 'Brittany Lasley',        pin: '3648', role: 'rep'   },
      { id: 'jessica',  name: 'Jessica Blazer',         pin: '5976', role: 'rep'   },
      { id: 'chenice',  name: 'Chenice Griffith-Turney',pin: '5978', role: 'rep'   },
    ];

// ─── SCRIPTS ──────────────────────────────────────────────────────────────────
const SCRIPTS = {
  b2b: {
    name: 'Network Partner Outreach',
    color: '#4A9B4A',
    sections: [
      { label: 'OPENER', text: "Hi, is this the owner or administrator? This call may be recorded. I'm reaching out from CareCircle Network — we run the Intelligence Scanner that already indexes senior care facilities across Northwest Florida. Your facility has a current profile in our system. Quick question for you." },
      { label: 'HOOK', text: "Right now when a family Googles your facility before making a decision — we're one of the first things they find. Our scanner cross-references FL AHCA records, CMS data, Google, BBB, Indeed, and ProPublica. You can either manage that profile or leave it unmanaged." },
      { label: 'THE SHIFT', text: "A Place for Mom is under a Senate investigation right now — 37.5% of their 'Best of Senior Living' winners had active neglect citations. Families are looking for a trustworthy alternative. The March 2026 HHS reports are driving urgency. We send families to facilities with clean profiles." },
      { label: 'PRICING', text: "Network Partner: $499 setup, $149/month. Featured Partner: $999 setup, $349/month — includes priority placement and our AI care platform. Per-referral fee is $150. A Place for Mom charges $3,500 to $7,000 per placement. We're 95% less." },
      { label: 'CLOSE', text: "Can I text you the link to your current scanner profile so you can see what families are finding? No commitment — just transparency." },
      { label: 'OBJECTIONS', text: "Uses APFM → 'Under Senate investigation. We charge $150/referral, they charge up to $7,000.' | Too expensive → 'Free directory listing — no cost.' | Not interested → 'Can I just text your profile link?'" },
    ]
  },
  b2c: {
    name: 'Family Advocacy Outreach',
    color: '#3D8B7A',
    sections: [
      { label: 'OPENER', text: "Hi — this call may be recorded. I'm reaching out from CareCircle Network. We work with families who have a loved one in a senior care facility. Is this a good moment?" },
      { label: 'THE PROBLEM', text: "Most families feel okay about the facility during the day, during visiting hours. The question is what's happening on the night shift. On weekends. On holidays. When no one's expected. That's when 64% of nursing home staff admit some form of neglect occurs." },
      { label: 'WHAT WE DO', text: "We send trained advocates into facilities unannounced — overnight, on weekends, on holidays — working for your loved one and reporting back to you within 24 hours. No competitor — private, government, or nonprofit — offers this nationally. The ombudsman program has one paid staff per 50 facilities. 40% of facilities get zero quarterly visits." },
      { label: 'THE SCIENCE', text: "A 2025 federal study found making inspections unpredictable saves lives equivalent to a 12% increase in inspection frequency at zero additional cost. Facilities that can't predict the pattern can't selectively perform for it. That's the foundation of what we do." },
      { label: 'PRICING', text: "Starter: $599 one-time — 4 visits in 7-10 days, all shift windows, baseline report. Guardian Essential: $799/month — 4 visits/month. Guardian: $1,500/month — 8-10 visits including overnights. Guardian Elite: $2,500/month — near-daily presence." },
      { label: 'CLOSE', text: "Can I text you the information? No commitment — if nothing's wrong, you'll have confirmation in writing. If something is wrong, you'll know before it becomes a crisis." },
      { label: 'OBJECTIONS', text: "Seems fine → 'Most families feel that way until a night shift.' | Too expensive → '$599 one-time. Peace of mind documented.' | Has cameras → 'Cameras don't stop what happens when staff know family isn't coming.'" },
    ]
  }
};

const SMS_TEMPLATES = {
  b2b: (name) => `CareCircle Network: Hi${name?' '+name.split(' ')[0]:''} — your facility's scanner profile and partner options: carecircle.fit/research — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
  b2c: (name) => `CareCircle Network: Hi${name?' '+name.split(' ')[0]:''} — information on our family advocacy service: carecircle.fit — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtTime(s) { return `${Math.floor((s||0)/60).toString().padStart(2,'0')}:${((s||0)%60).toString().padStart(2,'0')}` }
function sGet(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function sSet(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} }
function lGet(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function lSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#1A3D1A"/><text x="5" y="22" font-size="14" font-family="serif" fill="#4CAF50" font-weight="bold">CC</text></svg>')}`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#0F1A0F;color:#E8F0E8;font-family:'Inter',sans-serif;overflow:hidden}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2D5A2D}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  :root{
    --bg:#0F1A0F;--surface:#141F14;--surface2:#192419;--surface3:#1F2E1F;
    --border:#243324;--border2:#2D422D;
    --green:#4A9B4A;--gl:#6BBF6B;--gd:#2D6A2D;
    --teal:#3D8B7A;--text:#E8F0E8;--dim:#7A9A7A;--mid:#A8C4A8;
    --red:#C44444;--orange:#C87A2A;--blue:#3A7AAA;--yellow:#A8A030;
  }
`;

const statusColor = { new:'var(--green)',called:'var(--dim)',voicemail:'var(--blue)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)',partner:'var(--teal)' };
const callStateColor = { idle:'var(--dim)',dialing:'var(--yellow)',connected:'var(--gl)',ended:'var(--orange)' };
const callStateText = { idle:'STANDBY',dialing:'DIALING...',connected:'CONNECTED',ended:'CALL ENDED' };

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    const rep = REPS.find(r => r.name.toLowerCase() === name.trim().toLowerCase() && r.pin === pin.trim());
    if (!rep) { setError('Name or PIN not recognized. Contact your manager.'); return; }
    onLogin(rep);
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',animation:'fadeIn 0.3s ease'}}>
      <div style={{width:380,padding:48,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,animation:'slideUp 0.3s ease'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:'var(--gl)',letterSpacing:0.5}}>CareCircle</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:3,textTransform:'uppercase',marginTop:6}}>Remote Care Center</div>
          <div style={{width:36,height:1,background:'var(--border2)',margin:'14px auto 0'}}></div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:7}}>Your Full Name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="First Last"
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:14,padding:'10px 12px',outline:'none',borderRadius:3}} autoFocus />
          </div>
          <div style={{marginBottom:22}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:7}}>PIN</div>
            <input value={pin} onChange={e=>setPin(e.target.value)} placeholder="••••" type="password" maxLength={6}
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:20,padding:'10px 12px',outline:'none',borderRadius:3,letterSpacing:6}} />
          </div>
          {error && <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--red)',marginBottom:14,padding:'8px 10px',background:'rgba(204,68,68,0.08)',border:'1px solid rgba(204,68,68,0.2)',borderRadius:3}}>{error}</div>}
          <button type="submit" style={{width:'100%',padding:'12px',background:'var(--green)',color:'white',border:'none',borderRadius:3,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Sign In
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:22,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>carecircle.fit · 850-341-4324</div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CareCircleDialer() {
  const [rep, setRep] = useState(null);
  const [contactType, setContactType] = useState('b2b');
  const [contacts, setContacts] = useState(() => lGet('cc_contacts_b2b', []));
  const [activeContact, setActiveContact] = useState(null);
  const [tab, setTab] = useState('dialer');
  const [statusFilter, setStatusFilter] = useState('new');
  const [search, setSearch] = useState('');
  const [callState, setCallState] = useState('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [callSid, setCallSid] = useState(null);
  const [notes, setNotes] = useState('');
  const [aiCallMode, setAiCallMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [smsModal, setSmsModal] = useState(false);
  const [smsBody, setSmsBody] = useState('');
  const [clock, setClock] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', business_name:'', phone:'', email:'' });
  const [myLog, setMyLog] = useState([]);
  const [allLog, setAllLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Session restore
  useEffect(() => {
    const saved = sGet('cc_rep', null);
    if (saved) setRep(saved);
  }, []);

  function handleLogin(repData) {
    sSet('cc_rep', repData);
    setRep(repData);
  }

  function handleLogout() {
    sessionStorage.clear();
    setRep(null);
    setMyLog([]);
    setAllLog([]);
  }

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  // Contacts — localStorage per type, shared key so all reps see same pool
  const contactKey = `cc_contacts_${contactType}`;
  useEffect(() => {
    setContacts(lGet(contactKey, []));
    setActiveContact(null);
    setStatusFilter('new');
  }, [contactType]);

  useEffect(() => { lSet(contactKey, contacts); }, [contacts]);

  // Load call logs from KV
  async function loadLogs() {
    if (!rep) return;
    setLoadingLog(true);
    try {
      const r = await fetch(`/api/kv?action=rep&repId=${rep.id}`);
      const d = await r.json();
      setMyLog(d.calls || []);
      if (rep.role === 'admin') {
        const r2 = await fetch('/api/kv?action=all');
        const d2 = await r2.json();
        setAllLog(d2.calls || []);
      }
    } catch(e) {}
    setLoadingLog(false);
  }

  useEffect(() => { if (rep) loadLogs(); }, [rep]);

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Contacts filtered
  const allFiltered = contacts.filter(c => {
    const ms = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.business_name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search);
    const mf = statusFilter === 'all' || c.status === statusFilter;
    // Hide contacts claimed by other reps (show own + unclaimed)
    const mc = !c.claimedBy || c.claimedBy === rep?.id;
    return ms && mf && mc;
  });

  function selectContact(c) {
    setActiveContact(c);
    setNotes(c.notes || '');
    setSmsBody(SMS_TEMPLATES[contactType](c.name || ''));
  }

  function updateContact(id, updates) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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

  async function startCall() {
    if (!activeContact) return notify('Select a contact first', 'warning');
    if (!activeContact.phone) return notify('No phone number', 'warning');
    // Claim contact
    updateContact(activeContact.id, { claimedBy: rep.id });
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
          contactName: activeContact.name || '',
          contactBusiness: activeContact.business_name || '',
          contactType,
          repId: rep.id,
          repName: rep.name,
          script: SCRIPTS[contactType].name,
          aiMode: aiCallMode,
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`Dialing ${activeContact.name || activeContact.phone}...`);
      startPoll(data.callSid);
    } catch(err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      updateContact(activeContact.id, { claimedBy: null });
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function endCall() {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setCallState('ended');
  }

  async function setDisposition(outcome) {
    if (!activeContact) return;
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setCallState('idle');
    const statusMap = { answered:'called', voicemail:'voicemail', callback:'callback', interested:'interested', 'not-interested':'not-interested' };
    updateContact(activeContact.id, { status: statusMap[outcome] || 'called', notes, claimedBy: null });
    // Save to KV
    const record = {
      repId: rep.id, repName: rep.name,
      contactName: activeContact.name, contactBusiness: activeContact.business_name,
      contactPhone: activeContact.phone, contactType,
      outcome, duration: callSeconds, script: SCRIPTS[contactType].name, notes,
      timestamp: new Date().toISOString(),
    };
    try { await fetch('/api/kv?action=save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(record) }); } catch {}
    setMyLog(prev => [record, ...prev]);
    if (outcome === 'interested') {
      notify(`Interested lead! Auto-sending SMS to ${activeContact.name || activeContact.phone}`, 'success');
      try {
        await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: activeContact.phone, body: SMS_TEMPLATES[contactType](activeContact.name||'') }) });
      } catch {}
    }
    setCallSeconds(0);
    setNotes('');
    setActiveContact(null);
  }

  async function sendSMS() {
    if (!activeContact?.phone) return notify('No phone number', 'warning');
    try {
      const r = await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: activeContact.phone, body: smsBody }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      notify('SMS sent ✓', 'success');
      setSmsModal(false);
    } catch(err) { notify(`SMS failed: ${err.message}`, 'warning'); }
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { notify('CSV appears empty', 'warning'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''));
      const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('business') && !h.includes('company'));
      const bizIdx = headers.findIndex(h => h.includes('business') || h.includes('company') || h.includes('facility'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('cell'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const cityIdx = headers.findIndex(h => h.includes('city'));
      const newOnes = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g,''));
        if (!cols[phoneIdx] && !cols[emailIdx]) continue;
        newOnes.push({ id: `${Date.now()}-${i}`, name: nameIdx>=0?cols[nameIdx]:'', business_name: bizIdx>=0?cols[bizIdx]:'', phone: phoneIdx>=0?cols[phoneIdx]:'', email: emailIdx>=0?cols[emailIdx]:'', city: cityIdx>=0?cols[cityIdx]:'', status:'new', notes:'', list_name: file.name.replace('.csv','') });
      }
      setContacts(prev => [...prev, ...newOnes]);
      notify(`Imported ${newOnes.length} contacts to ${contactType.toUpperCase()} pool`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function addContact() {
    if (!newContact.name && !newContact.phone) { notify('Need name or phone', 'warning'); return; }
    setContacts(prev => [...prev, { ...newContact, id: `manual-${Date.now()}`, status:'new', notes:'' }]);
    setNewContact({ name:'', business_name:'', phone:'', email:'' });
    setShowAddModal(false);
    notify('Contact added', 'success');
  }

  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content],{type:'text/csv'}));
    a.download = filename; a.click();
  }

  // Stats
  const myTotal = myLog.length;
  const myInterested = myLog.filter(c => c.outcome === 'interested').length;
  const myAnswered = myLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const myRate = myTotal > 0 ? Math.round(myAnswered/myTotal*100) : 0;

  const script = SCRIPTS[contactType];
  const isAdmin = rep?.role === 'admin';

  if (!rep) return <><style>{CSS}</style><LoginScreen onLogin={handleLogin} /></>;

  return (
    <>
      <Head>
        <title>CareCircle — Remote Care Center</title>
        <link rel="icon" href={FAVICON} />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{CSS}</style>
      </Head>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:50,background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:700,color:'var(--gl)'}}>CareCircle</span>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2}}>//&nbsp;REMOTE CARE CENTER</span>
          <span style={{display:'flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:8,background:'rgba(74,155,74,0.1)',border:'1px solid rgba(74,155,74,0.2)',color:'var(--green)'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite',display:'inline-block'}}></span>LIVE
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:14,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>
          <span>Rep: <span style={{color:'var(--gl)'}}>{rep.name}</span>{isAdmin&&<span style={{color:'var(--teal)',marginLeft:5}}>[ADMIN]</span>}</span>
          <span style={{color:'var(--green)'}}>{clock}</span>
          <button onClick={handleLogout} style={{padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>SIGN OUT</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 20px'}}>
        {['dialer','dashboard',...(isAdmin?['admin']:[])].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'9px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:0.8,textTransform:'uppercase',color:tab===t?'var(--gl)':'var(--dim)',cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid var(--gl)':'2px solid transparent',background:'none',transition:'all 0.15s'}}>
            {t}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
          <div style={{display:'flex',border:'1px solid var(--border2)',borderRadius:3,overflow:'hidden'}}>
            <button onClick={() => setContactType('b2b')} style={{padding:'4px 11px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,cursor:'pointer',border:'none',background:contactType==='b2b'?'var(--gd)':'transparent',color:contactType==='b2b'?'var(--gl)':'var(--dim)',transition:'all 0.15s'}}>B2B PROVIDERS</button>
            <button onClick={() => setContactType('b2c')} style={{padding:'4px 11px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,cursor:'pointer',border:'none',borderLeft:'1px solid var(--border2)',background:contactType==='b2c'?'var(--gd)':'transparent',color:contactType==='b2c'?'var(--gl)':'var(--dim)',transition:'all 0.15s'}}>B2C FAMILIES</button>
          </div>
          <button onClick={() => setAiCallMode(v => !v)} style={{padding:'4px 9px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,cursor:'pointer',border:`1px solid ${aiCallMode?'var(--green)':'var(--border2)'}`,background:aiCallMode?'rgba(74,155,74,0.12)':'transparent',color:aiCallMode?'var(--green)':'var(--dim)',borderRadius:2}}>
            {aiCallMode?'🤖 AI ON':'🤖 AI'}
          </button>
        </div>
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && (
        <div style={{display:'grid',gridTemplateColumns:'285px 1fr 245px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* LEFT: CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',gap:6}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${contactType==='b2b'?'providers':'families'}...`}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['new','all','called','callback','interested','voicemail','not-interested'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,letterSpacing:0.5,cursor:'pointer',border:`1px solid ${statusFilter===f?'var(--green)':'var(--border2)'}`,background:statusFilter===f?'rgba(74,155,74,0.12)':'transparent',color:statusFilter===f?'var(--green)':'var(--dim)',borderRadius:2,textTransform:'uppercase'}}>
                    {f}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{allFiltered.length} contacts · {contactType==='b2b'?'Providers':'Families'}</div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {allFiltered.length === 0 ? (
                <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)',lineHeight:2}}>No contacts.<br/>Upload CSV in Admin tab.</div>
              ) : allFiltered.map(c => (
                <div key={c.id} onClick={() => selectContact(c)} style={{padding:'10px 13px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeContact?.id===c.id?'var(--surface2)':'transparent',borderLeft:activeContact?.id===c.id?'2px solid var(--green)':'2px solid transparent',transition:'all 0.1s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:26,height:26,borderRadius:3,background:`${statusColor[c.status]||'var(--green)'}18`,border:`1px solid ${statusColor[c.status]||'var(--green)'}33`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:statusColor[c.status]||'var(--green)',flexShrink:0}}>
                      {(c.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'No Name'}</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.business_name||c.phone||''}</div>
                    </div>
                    <div style={{width:5,height:5,borderRadius:'50%',background:statusColor[c.status]||'var(--border2)',flexShrink:0}}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:6}}>
              <button onClick={() => setShowAddModal(true)} style={{flex:1,padding:'6px',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:500,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:3}}>+ Add Contact</button>
            </div>
          </div>

          {/* CENTER: DIALER */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column'}}>
            {/* Contact card */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              {activeContact ? (
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:3,background:'rgba(74,155,74,0.12)',border:'1px solid rgba(74,155,74,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace',fontSize:13,color:'var(--gl)',flexShrink:0}}>
                    {(activeContact.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'var(--text)'}}>{activeContact.name||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--green)',marginTop:2}}>{activeContact.phone}</div>
                    {activeContact.business_name&&<div style={{fontSize:11,color:'var(--dim)',marginTop:2}}>{activeContact.business_name}</div>}
                    {activeContact.city&&<div style={{fontSize:10,color:'var(--dim)'}}>{activeContact.city}, FL</div>}
                  </div>
                </div>
              ) : (
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>← Select a contact to begin</div>
              )}
            </div>

            {/* Call controls */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:callStateColor[callState],animation:callState==='connected'?'pulse 1.5s infinite':'none'}}></div>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:11,letterSpacing:2,color:callStateColor[callState]}}>{callStateText[callState]}</span>
                {callState!=='idle'&&<span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--mid)',marginLeft:'auto'}}>{fmtTime(callSeconds)}</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {callState==='idle'&&<button onClick={startCall} style={{padding:'10px 20px',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>📞 Dial</button>}
                {['dialing','connected'].includes(callState)&&(
                  <>
                    <button onClick={endCall} style={{padding:'10px 20px',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>🔴 End</button>
                    <button onClick={() => setDisposition('voicemail')} style={{padding:'10px 12px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Drop VM</button>
                  </>
                )}
                <button onClick={() => activeContact?setSmsModal(true):notify('Select a contact','warning')} style={{padding:'10px 12px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>💬 SMS</button>
              </div>
              {['connected','ended'].includes(callState)&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  {[['answered','✓ Answered','var(--green)'],['voicemail','📬 VM','var(--dim)'],['callback','↩ Callback','var(--orange)'],['interested','★ Interested','var(--gl)'],['not-interested','✕ No','var(--red)']].map(([outcome,label,color]) => (
                    <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'8px 4px',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,cursor:'pointer',border:`1px solid ${color}44`,background:`${color}12`,color,borderRadius:3,textAlign:'center'}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Call Notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes during call..."
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3,resize:'none',height:55,lineHeight:1.5}} />
            </div>

            {/* Script */}
            <div style={{flex:1,padding:'12px 20px'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:script.color,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>
                Script — {script.name}
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:14}}>
                {script.sections.map((sec,i) => (
                  <div key={i} style={{marginBottom:13}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:script.color,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{sec.label}</div>
                    <div style={{fontSize:12,color:'var(--mid)',lineHeight:1.65}}>{sec.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MY STATS + LOG */}
          <div style={{background:'var(--surface)',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
            <div style={{padding:'11px 14px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:10}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1.5,color:'var(--dim)',textTransform:'uppercase'}}>My Stats</span>
            </div>
            {[['Calls Made',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Interested',myInterested,'var(--teal)']].map(([label,val,color]) => (
              <div key={label} style={{padding:'13px 14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{label}</div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:600,color,lineHeight:1}}>{val}</div>
              </div>
            ))}
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,color:'var(--dim)',textTransform:'uppercase'}}>My Log</span>
              <button onClick={() => exportCSV([['Rep','Contact','Business','Phone','Outcome','Duration','Script','Notes','Time'],...myLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'my-calls.csv')}
                style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>EXPORT</button>
            </div>
            {myLog.length===0 ? (
              <div style={{padding:16,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>No calls yet</div>
            ) : myLog.slice(0,60).map((entry,i) => {
              const c = {answered:'var(--green)',voicemail:'var(--dim)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)'}[entry.outcome]||'var(--dim)';
              return (
                <div key={i} style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.contactName||'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginTop:1}}>{(entry.outcome||'').toUpperCase()} · {fmtTime(entry.duration)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab==='dashboard' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)',marginBottom:18}}>{rep.name}'s Dashboard</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
            {[['Total Calls',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Interested',myInterested,'var(--teal)']].map(([label,val,color]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:18}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:34,fontWeight:700,color,lineHeight:1,marginBottom:5}}>{val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Admin: all reps */}
          {isAdmin && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--teal)'}}>All Reps Activity</div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={loadLogs} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>{loadingLog?'Loading...':'↺ Refresh'}</button>
                  <button onClick={() => exportCSV([['Rep','Contact','Business','Phone','Type','Outcome','Duration','Script','Notes','Time'],...allLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.contactType,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'all-calls.csv')}
                    style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>EXPORT ALL</button>
                </div>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Rep','Contact','Type','Outcome','Duration','Time'].map(h => <th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {allLog.slice(0,150).map((entry,i) => {
                      const c = {answered:'var(--green)',voicemail:'var(--dim)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)'}[entry.outcome]||'var(--dim)';
                      return (
                        <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'8px 14px',fontSize:12,color:'var(--teal)',fontWeight:500}}>{entry.repName}</td>
                          <td style={{padding:'8px 14px',fontSize:11,color:'var(--text)'}}>{entry.contactName||'—'}</td>
                          <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{(entry.contactType||'').toUpperCase()}</td>
                          <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:10,color:c}}>{(entry.outcome||'').toUpperCase()}</td>
                          <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>{fmtTime(entry.duration)}</td>
                          <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{entry.timestamp?new Date(entry.timestamp).toLocaleString():'—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {allLog.length===0&&<div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>No calls recorded yet</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab==='admin'&&isAdmin&&(
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)',marginBottom:22}}>Admin Panel</div>

          {/* CSV Upload */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>
              Upload Contacts — currently uploading to: <span style={{color:contactType==='b2b'?'var(--green)':'var(--teal)'}}>{contactType==='b2b'?'B2B Provider Pool':'B2C Family Pool'}</span>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginBottom:10}}>Toggle B2B / B2C in the nav bar to switch pools before uploading.</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:24,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:3}}>
              <div style={{fontSize:24,marginBottom:6}}>📂</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>Click to upload CSV → {contactType==='b2b'?'Provider':'Family'} pool<br/><span style={{fontSize:8,opacity:0.6}}>Columns: name, business_name, phone, email, city</span></div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
            </label>
          </div>

          {/* Rep list */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>Active Reps</div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Name','PIN','Role'].map(h => <th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {REPS.map(r => (
                    <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'8px 14px',fontSize:12,fontWeight:500,color:'var(--text)'}}>{r.name}</td>
                      <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>{r.pin}</td>
                      <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:9,color:r.role==='admin'?'var(--teal)':'var(--dim)'}}>{r.role.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:8}}>To add/change reps: update the REPS array in index.jsx and redeploy.</div>
          </div>

          {/* Export */}
          <div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>Data Export</div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => exportCSV([['Rep','Contact','Business','Phone','Type','Outcome','Duration','Script','Notes','Time'],...allLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.contactType,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'carecircle-all-calls.csv')}
                style={{padding:'9px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Export All Calls</button>
            </div>
          </div>
        </div>
      )}

      {/* SMS MODAL */}
      {smsModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:420,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:16}}>Send SMS</div>
            <div style={{marginBottom:10}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>To</div>
              <input readOnly value={activeContact?.phone||''} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--dim)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:3}} />
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Message</div>
              <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)}
                style={{width:'100%',background:'var(--surface2)',border:`1px solid ${smsBody.length>160?'var(--red)':'var(--border2)'}`,color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3,resize:'none',height:75}} />
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,textAlign:'right',marginTop:3,color:smsBody.length>160?'var(--red)':smsBody.length>140?'var(--yellow)':'var(--dim)'}}>{smsBody.length} / 160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={() => setSmsModal(false)} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Cancel</button>
              <button onClick={sendSMS} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>Send SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:380,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:16}}>Add {contactType==='b2b'?'Provider':'Family'} Contact</div>
            {[['Name','name'],['Business / Facility','business_name'],['Phone','phone'],['Email','email']].map(([label,key]) => (
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{label}</div>
                <input value={newContact[key]} onChange={e => setNewContact(p=>({...p,[key]:e.target.value}))}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Cancel</button>
              <button onClick={addContact} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification&&(
        <div style={{position:'fixed',bottom:22,right:22,padding:'11px 16px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--teal)'}`,borderRadius:3,fontFamily:'Inter,sans-serif',fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:300,animation:'slideUp 0.3s ease',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

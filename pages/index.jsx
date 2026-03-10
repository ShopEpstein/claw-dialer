import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PASSWORD = 'claw2026';

// Area code → UTC offset (standard time). Used for TCPA 8am-9pm local guard.
const AREA_TZ = {
  // Eastern
  '201':'-5','202':'-5','203':'-5','207':'-5','212':'-5','215':'-5','216':'-5','217':'-5','218':'-5','219':'-5',
  '224':'-5','225':'-6','228':'-6','229':'-5','231':'-5','234':'-5','239':'-5','240':'-5','248':'-5','251':'-6',
  '252':'-5','253':'-8','254':'-6','256':'-6','260':'-5','267':'-5','269':'-5','270':'-6','276':'-5','281':'-6',
  '301':'-5','302':'-5','303':'-7','304':'-5','305':'-5','309':'-6','310':'-8','312':'-6','313':'-5','314':'-6',
  '315':'-5','316':'-6','317':'-5','318':'-6','319':'-6','320':'-6','321':'-5','323':'-8','325':'-6','330':'-5',
  '331':'-6','334':'-6','336':'-5','337':'-6','339':'-5','340':'-4','347':'-5','351':'-5','352':'-5','360':'-8',
  '361':'-6','385':'-7','386':'-5','401':'-5','402':'-6','404':'-5','405':'-6','406':'-7','407':'-5','408':'-8',
  '409':'-6','410':'-5','412':'-5','413':'-5','414':'-6','415':'-8','417':'-6','419':'-5','423':'-5','425':'-8',
  '430':'-6','432':'-6','434':'-5','435':'-7','440':'-5','442':'-8','443':'-5','445':'-5','458':'-8','469':'-6',
  '470':'-5','475':'-5','478':'-5','479':'-6','480':'-7','484':'-5','501':'-6','502':'-5','503':'-8','504':'-6',
  '505':'-7','507':'-6','508':'-5','509':'-8','510':'-8','512':'-6','513':'-5','515':'-6','516':'-5','517':'-5',
  '518':'-5','520':'-7','530':'-8','531':'-6','534':'-6','539':'-6','540':'-5','541':'-8','551':'-5','559':'-8',
  '561':'-5','562':'-8','563':'-6','567':'-5','570':'-5','571':'-5','573':'-6','574':'-5','575':'-7','580':'-6',
  '585':'-5','586':'-5','601':'-6','602':'-7','603':'-5','605':'-6','606':'-5','607':'-5','608':'-6','609':'-5',
  '610':'-5','612':'-6','614':'-5','615':'-6','616':'-5','617':'-5','618':'-6','619':'-8','620':'-6','623':'-7',
  '626':'-8','628':'-8','629':'-6','630':'-6','631':'-5','636':'-6','641':'-6','646':'-5','650':'-8','651':'-6',
  '657':'-8','659':'-6','660':'-6','661':'-8','662':'-6','667':'-5','669':'-8','671':'-10','678':'-5','681':'-5',
  '682':'-6','701':'-6','702':'-8','703':'-5','704':'-5','706':'-5','707':'-8','708':'-6','712':'-6','713':'-6',
  '714':'-8','715':'-6','716':'-5','717':'-5','718':'-5','719':'-7','720':'-7','724':'-5','725':'-8','726':'-6',
  '727':'-5','731':'-6','732':'-5','734':'-5','737':'-6','740':'-5','743':'-5','747':'-8','754':'-5','757':'-5',
  '760':'-8','762':'-5','763':'-6','765':'-5','769':'-6','770':'-5','772':'-5','773':'-6','774':'-5','775':'-8',
  '779':'-6','781':'-5','785':'-6','786':'-5','801':'-7','802':'-5','803':'-5','804':'-5','805':'-8','806':'-6',
  '808':'-10','810':'-5','812':'-5','813':'-5','814':'-5','815':'-6','816':'-6','817':'-6','818':'-8','820':'-8',
  '828':'-5','830':'-6','831':'-8','832':'-6','843':'-5','845':'-5','847':'-6','848':'-5','850':'-6','856':'-5',
  '857':'-5','858':'-8','859':'-5','860':'-5','862':'-5','863':'-5','864':'-5','865':'-5','870':'-6','872':'-6',
  '878':'-5','901':'-6','903':'-6','904':'-5','906':'-5','907':'-9','908':'-5','909':'-8','910':'-5','912':'-5',
  '913':'-6','914':'-5','915':'-7','916':'-8','917':'-5','918':'-6','919':'-5','920':'-6','925':'-8','928':'-7',
  '929':'-5','931':'-6','936':'-6','937':'-5','938':'-6','940':'-6','941':'-5','947':'-5','949':'-8','951':'-8',
  '952':'-6','954':'-5','956':'-6','959':'-5','970':'-7','971':'-8','972':'-6','973':'-5','978':'-5','979':'-6',
  '980':'-5','984':'-5','985':'-6','989':'-5'
};

function getTCPAHour(phone) {
  const digits = phone.replace(/\D/g,'');
  const areaCode = digits.startsWith('1') ? digits.slice(1,4) : digits.slice(0,3);
  const offsetHours = parseInt(AREA_TZ[areaCode] || '-6');
  const nowUTC = new Date();
  const localHour = (nowUTC.getUTCHours() + 24 + offsetHours) % 24;
  return localHour;
}

function isTCPAAllowed(phone) {
  const h = getTCPAHour(phone);
  return h >= 8 && h < 21;
}

const DEFAULT_SCRIPTS = [
  {
    name: 'VINHUNTER / DEALER', color: '#14F1C6',
    sections: [
      { label: 'OPENER', text: "Hey, is this [CONTACT_NAME]? Hey [FIRST_NAME], this is Chase calling from VinHunter — VinLedger AI Live — quick question for you..." },
      { label: 'QUALIFY', text: "Do you have a service department, or just sales? [If sales only → pitch $99 Dealer Marketing. If service dept → pitch $249 Dealer Pro CRM.]" },
      { label: 'HOOK', text: "Right now, when a buyer Googles one of your VINs before calling you — what do they find? We put a Trust Score, recall info, AND check things CARFAX structurally cannot — active federal investigations, AI fraud detection — on every vehicle on your lot, overnight." },
      { label: 'DIFFERENTIATOR', text: "CARFAX charges dealers $99 to $300 a month just for reports with no marketing, no landing pages. We give you unlimited reports, SEO-indexed inventory pages, lead capture, AND a full shop CRM to replace Tekmetric — all for $249 a month. Or just the marketing package at $99." },
      { label: 'CLOSE', text: "We're locking founding partner rates right now — whatever tier you sign up at, price never increases. Can I send you a quick walkthrough link?" },
      { label: '🔀 CROSS-SELL → CLAW', text: "[After VinHunter yes/interest]: By the way — we also deploy 21 AI agents to handle your leads, customer follow-up, and reviews automatically. $500 setup, $99/mo. Most dealers run it alongside VinHunter. Want me to include that in the walkthrough?" }
    ]
  },
  {
    name: 'ECONOCLAW', color: '#FF6B2B',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — do you have anyone working your business 24/7, handling leads, answering questions, following up? Because most businesses don't." },
      { label: 'HOOK', text: "We deploy 21 specialized AI agents to your business. They handle customer service, content, research, outreach, analytics — all while you sleep. It's like hiring a full department, except it costs $99 a month." },
      { label: 'COMPARISON', text: "An agency would charge you $5,000 setup and $1,500 a month for this. We're at $500 setup and $99 a month during our launch window." },
      { label: 'CLOSE', text: "Can I send you a 2-minute breakdown of exactly what the 21 agents do? No pitch call needed — just read it and tell me if it makes sense for your business." },
      { label: '🔀 CROSS-SELL → VINHUNTER', text: "[If they're in auto]: We also run VinHunter — free CARFAX alternative that puts a Google-indexed Trust Score page on every vehicle in your inventory overnight. $99/mo. Want me to add that to the walkthrough?" },
      { label: '🔀 CROSS-SELL → TRANSBID', text: "[If they're a contractor]: We also run TransBid Live — public contract exchange, zero upfront, 0.5% only when you win a job. HomeAdvisor charges you whether you win or not. Want me to include that?" }
    ]
  },
  {
    name: 'WHITEGLOVECLAW', color: '#FFD600',
    sections: [
      { label: 'OPENER', text: "Good [morning/afternoon] [CONTACT_NAME], I'm reaching out because we deploy enterprise-grade AI infrastructure for executive teams and founders who want the full white-glove experience." },
      { label: 'POSITIONING', text: "SetupClaw is the market leader — we offer identical scope, identical deliverables, at 20% below their pricing. Same 24/7 infrastructure, same same-day go-live." },
      { label: 'TIERS', text: "Hosted VPS at $2,400. Mac Mini with iMessage at $4,000. In-person at $4,800. Additional agents at $1,200 each." },
      { label: 'CLOSE', text: "I'd love to schedule a 15-minute call. What does your week look like?" },
      { label: '🔀 CROSS-SELL → ECONOCLAW', text: "[If budget is a concern]: We also offer EconoClaw — same 21 agents, software-only, $500 setup and $99/mo. No hardware needed. That's the entry point if you want to test before committing to full infrastructure." }
    ]
  },
  {
    name: 'RENTACLAW', color: '#3B8FFF',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], quick question — have you looked into AI agents for your business? Not asking you to commit — we actually rent them." },
      { label: 'CONCEPT', text: "Think of it like renting a car. Daily $9, weekly $49, monthly $149. You get all 21 agents for whatever period you need." },
      { label: 'FLEXIBILITY', text: "We also accept IOU arrangements and revenue share if cash flow is tight." },
      { label: 'CLOSE', text: "Want to try a week for $49? If it doesn't generate at least $49 in value, I'll give you your money back personally." },
      { label: '🔀 UPSELL → ECONOCLAW', text: "[After rental interest]: If you like it, we convert the rental to $500 setup + $99/mo — and your rental payments count toward the setup fee. You're not throwing money away." }
    ]
  },
  {
    name: 'BUDGETCLAW', color: '#39FF14',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME], I'm going to show you a spreadsheet in 30 seconds. Year 1 with what you're probably doing now: $6,188+. Year 1 with BUDGETclaw: $2,687. Same result, fraction of the cost." },
      { label: 'HOOK', text: "BUDGETclaw is 21 AI agents — customer service, content, leads, outreach, analytics — on a budget plan. Micro at $199/mo, Standard $299/mo, Pro $499/mo. No setup fee on annual." },
      { label: 'COMPARISON', text: "You're probably paying: Zapier $50/mo, ChatGPT $20/mo, HubSpot $45/mo, a VA $800/mo, an SEO tool $99/mo. That's $1,014/mo. We replace all of it for $199 to $499." },
      { label: 'CLOSE', text: "Micro plan is $199 a month. No contract, cancel anytime. Can I send you the cost breakdown so you can see exactly where the savings come from?" },
      { label: '🔀 UPSELL → ECONOCLAW', text: "[After yes]: The launch pricing on EconoClaw — our flagship tier — is $500 setup + $99/mo. If you want to lock that rate before the window closes, I can do both today." }
    ]
  },
  {
    name: 'CLAWAWAY', color: '#2EFF9A',
    sections: [
      { label: 'OPENER', text: "Hey [CONTACT_NAME] — I'm going to be straight with you. We build AI systems. We're flexible on what we build, what you pay, and how you pay it." },
      { label: 'CORE MESSAGE', text: "Tell us what you want to build. Tell us what you want to pay. Tell us how you want to pay it. Card, Zelle, crypto, rev share, barter. We'll figure it out." },
      { label: 'PROOF', text: "We're already running 21 AI agents across five live platforms — VinHunter, TransBid Live, Memory Magnet, GUNR, MUVR." },
      { label: 'CLOSE', text: "What's the one thing in your business right now that's eating the most time or costing the most money? Let's start there." },
      { label: '🔀 ROUTE TO RIGHT PRODUCT', text: "[After they tell you their problem]: [Auto/dealer → VinHunter $99/mo] [AI agents/automation → EconoClaw $99/mo] [Contracting → TransBid 0.5%] [Tight budget → RentAClaw $9/day] [Enterprise → WhiteGloveClaw $2,400+] [Test drive → RentAClaw $49/week]" }
    ]
  }
];

const SMS_TEMPLATES = {
  'VINHUNTER / DEALER': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase here. Free lot audit: what buyers find when they Google your VINs + 4 things we check that CARFAX structurally can't. vinledgerai.live/pricing Reply STOP to opt out.`,
  'ECONOCLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. 21 AI agents, your biz, 24/7. $500 setup + $99/mo — agencies charge $5K+ for the same. econoclaw.vercel.app Reply STOP to opt out.`,
  'WHITEGLOVECLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Full white-glove AI. SetupClaw scope, 20% less. VPS $2,400, Mac Mini $4K, same-day go-live. econoclaw.vercel.app Reply STOP to opt out.`,
  'RENTACLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Try 21 AI agents a week, $49. Doesn't pay for itself, I refund you personally. econoclaw.vercel.app/rent Reply STOP to opt out.`,
  'BUDGETCLAW': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. Year 1 your way: $6,188+. Year 1 BUDGETclaw: $2,687. 21 agents from $199/mo. econoclaw.vercel.app/budget Reply STOP to opt out.`,
  'CLAWAWAY': (name) => `Hey${name?' '+name.split(' ')[0]:''} — Chase. We build AI systems. Flexible on what, how you pay. Card, crypto, rev share, barter. econoclaw.vercel.app Reply STOP to opt out.`,
};
const SMS_FOLLOW_UP = (name, scriptName) => {
  const fn = SMS_TEMPLATES[scriptName] || SMS_TEMPLATES['VINHUNTER / DEALER'];
  return fn(name);
};

// ── SKINS ─────────────────────────────────────────────────────────────────────
const SKINS = {
  DEFAULT: {
    label: 'CLAW DEFAULT', icon: '🖤',
    accent: '#14F1C6', accentDim: '#0A9478',
    bg: '#080A0F', surface: '#0D1017', surface2: '#121820', surface3: '#1A2230',
    border: '#1E2D40', border2: '#243344',
    text: '#E8EDF5', textDim: '#6B7A8D', textMid: '#9AAABB',
    scanline: 'rgba(20,241,198,0.3)', grid: 'rgba(20,241,198,0.03)',
    fontImport: '',
    bodyFont: "'Barlow Condensed', sans-serif",
    monoFont: "'DM Mono', monospace",
    headerFont: "'Bebas Neue', sans-serif",
  },
  CYBERCLAW: {
    label: 'CYBERCLAW', icon: '💜',
    accent: '#BF00FF', accentDim: '#7A00A8',
    bg: '#0A0010', surface: '#100020', surface2: '#160030', surface3: '#1E0040',
    border: '#2D0060', border2: '#3D0080',
    text: '#F0E0FF', textDim: '#7A5A9A', textMid: '#B090D0',
    scanline: 'rgba(191,0,255,0.3)', grid: 'rgba(191,0,255,0.03)',
    fontImport: '',
    bodyFont: "'Barlow Condensed', sans-serif",
    monoFont: "'DM Mono', monospace",
    headerFont: "'Bebas Neue', sans-serif",
  },
  GOTHICCLAW: {
    label: 'GOTHICCLAW', icon: '🩸',
    accent: '#CC0000', accentDim: '#880000',
    bg: '#0D0000', surface: '#1A0000', surface2: '#200000', surface3: '#2A0000',
    border: '#3D0000', border2: '#550000',
    text: '#FFDDDD', textDim: '#7A3333', textMid: '#BB7777',
    scanline: 'rgba(204,0,0,0.3)', grid: 'rgba(204,0,0,0.03)',
    fontImport: '',
    bodyFont: "'Barlow Condensed', sans-serif",
    monoFont: "'DM Mono', monospace",
    headerFont: "'Bebas Neue', sans-serif",
  },
  TACTICLAW: {
    label: 'TACTICLAW', icon: '🎯',
    accent: '#7FFF00', accentDim: '#507A00',
    bg: '#0A0C07', surface: '#141A0E', surface2: '#1A2214', surface3: '#202A18',
    border: '#2A3820', border2: '#344828',
    text: '#E8F0D0', textDim: '#5A7040', textMid: '#8AAA60',
    scanline: 'rgba(127,255,0,0.3)', grid: 'rgba(127,255,0,0.03)',
    fontImport: '',
    bodyFont: "'Barlow Condensed', sans-serif",
    monoFont: "'DM Mono', monospace",
    headerFont: "'Bebas Neue', sans-serif",
  },
  ECONOSKIN: {
    label: 'ECONOCLAW', icon: '🔥',
    accent: '#FF6B2B', accentDim: '#A84000',
    bg: '#0F0800', surface: '#1A0E00', surface2: '#221200', surface3: '#2C1800',
    border: '#3D2200', border2: '#552E00',
    text: '#FFE8D0', textDim: '#7A5030', textMid: '#BB8860',
    scanline: 'rgba(255,107,43,0.3)', grid: 'rgba(255,107,43,0.03)',
    fontImport: '',
    bodyFont: "'Barlow Condensed', sans-serif",
    monoFont: "'DM Mono', monospace",
    headerFont: "'Bebas Neue', sans-serif",
  },
  BUDGETSKIN: {
    label: 'BUDGETCLAW', icon: '📊',
    accent: '#39FF14', accentDim: '#1A8A00',
    bg: '#000A00', surface: '#001400', surface2: '#001C00', surface3: '#002400',
    border: '#003800', border2: '#004A00',
    text: '#D0FFD0', textDim: '#3A7A3A', textMid: '#70BB70',
    scanline: 'rgba(57,255,20,0.3)', grid: 'rgba(57,255,20,0.03)',
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap');",
    bodyFont: "'IBM Plex Mono', monospace",
    monoFont: "'IBM Plex Mono', monospace",
    headerFont: "'IBM Plex Mono', monospace",
  },
};

const VINLEDGER_API = 'https://vinledgerai.live';

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
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
`;

function fmtTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
function storageGet(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (pw === PASSWORD) { onLogin(); }
    else {
      setErr(true); setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setErr(false), 2000);
      setPw('');
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* Scan line */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(20,241,198,0.4),transparent)',animation:'scanline 4s linear infinite',pointerEvents:'none'}}></div>
      {/* Grid */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(20,241,198,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(20,241,198,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}}></div>

      <div style={{position:'relative',zIndex:1,textAlign:'center',animation: shake ? 'none' : undefined, transform: shake ? 'translateX(0)' : undefined}}>
        <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:48,letterSpacing:8,color:'var(--teal)',textShadow:'0 0 40px rgba(20,241,198,0.5)',marginBottom:4}}>CLAW DIALER</div>
        <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)',letterSpacing:4,marginBottom:48}}>// COMMAND CENTER — AUTHORIZED ACCESS ONLY</div>

        <div style={{background:'var(--surface)',border:`1px solid ${err ? 'var(--red)' : 'var(--border2)'}`,borderRadius:2,padding:32,width:320,transition:'border-color 0.2s'}}>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color: err ? 'var(--red)' : 'var(--text-dim)',letterSpacing:2,marginBottom:12,transition:'color 0.2s'}}>
            {err ? 'ACCESS DENIED' : 'ENTER PASSCODE'}
          </div>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
            style={{width:'100%',background:'var(--surface2)',border:`1px solid ${err ? 'var(--red)' : 'var(--border2)'}`,color:'var(--teal)',fontFamily:'DM Mono, monospace',fontSize:20,padding:'12px 14px',outline:'none',borderRadius:2,textAlign:'center',letterSpacing:8,marginBottom:16}}
          />
          <button onClick={attempt} style={{width:'100%',padding:'12px',fontFamily:'Bebas Neue, sans-serif',fontSize:16,letterSpacing:4,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>
            AUTHENTICATE
          </button>
        </div>

        <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--border2)',marginTop:24,letterSpacing:1}}>
          SOLANA SOLAR SOLUTIONS © 2026
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClawDialer() {
  const [authed, setAuthed] = useState(() => storageGet('claw_authed', false));
  const [skinKey, setSkinKey] = useState(() => storageGet('claw_skin', 'DEFAULT'));
  const skin = SKINS[skinKey] || SKINS.DEFAULT;
  const [contacts, setContacts] = useState(() => storageGet('claw_contacts', []));
  const [callLog, setCallLog] = useState(() => storageGet('claw_calllog', []));
  const [inboxMessages, setInboxMessages] = useState(() => storageGet('claw_inbox', []));
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
  const [resetModal, setResetModal] = useState(false);
  const [loadingVL, setLoadingVL] = useState(false);
  const [vlFilter, setVlFilter] = useState('FL');
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [serverAgent, setServerAgent] = useState({ status:'idle', queue:0, called:0, total:0, current:null, interested:0, recentCalls:[] });
  const [serverAgentRunning, setServerAgentRunning] = useState(false);
  const serverPollRef = useRef(null);
  const [aiCallMode, setAiCallMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // {x, y, idx}
  const [confirmDelete, setConfirmDelete] = useState(null); // idx or 'bulk'
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'dial' | 'log'
  // Review / recordings
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [expandedRec, setExpandedRec] = useState(null);
  // Callback scheduler
  const [callbackModal, setCallbackModal] = useState(null); // contact idx
  const [callbackTime, setCallbackTime] = useState('');
  const [callbacks, setCallbacks] = useState(() => storageGet('claw_callbacks', []));
  // Email follow-up
  const [emailModal, setEmailModal] = useState(null); // {contact}
  const [emailSending, setEmailSending] = useState(false);
  // Square pay link
  const [payModal, setPayModal] = useState(null); // {contact}
  const [payResult, setPayResult] = useState(null);

  const timerRef = useRef(null);
  const autoEndRef = useRef(null);
  const pollRef = useRef(null);
  const inboxPollRef = useRef(null);
  const agentRef = useRef(null);
  const agentModeRef = useRef(false);
  const agentPausedRef = useRef(false);
  const callStateRef = useRef('idle');
  const activeIdxRef = useRef(null);
  const notesRef = useRef('');
  const scriptIdxRef = useRef(0);
  const callSecondsRef = useRef(0);
  const contactsRef = useRef([]);
  const pressedOneRef = useRef(false); // tracks if press-1 happened this call

  agentModeRef.current = agentMode;
  agentPausedRef.current = agentPaused;
  callStateRef.current = callState;
  activeIdxRef.current = activeIdx;
  notesRef.current = notes;
  scriptIdxRef.current = scriptIdx;
  callSecondsRef.current = callSeconds;
  contactsRef.current = contacts;
  const aiCallModeRef = useRef(false);
  aiCallModeRef.current = aiCallMode;

  // Close context menu on outside click
  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  // Mobile detection
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Persist
  useEffect(() => { storageSet('claw_contacts', contacts); }, [contacts]);
  useEffect(() => { storageSet('claw_calllog', callLog); }, [callLog]);
  useEffect(() => { storageSet('claw_inbox', inboxMessages); }, [inboxMessages]);
  useEffect(() => { storageSet('claw_scripts', scripts); }, [scripts]);
  useEffect(() => { storageSet('claw_authed', authed); }, [authed]);

  // Persist callbacks
  useEffect(() => { storageSet('claw_callbacks', callbacks); }, [callbacks]);

  // TCPA-safe count helper
  const tcpaSafeCount = contacts.filter(c => c.status === 'new' && isTCPAAllowed(c.phone)).length;
  const tcpaUnsafeCount = contacts.filter(c => c.status === 'new' && !isTCPAAllowed(c.phone)).length;

  // Poll server agent status every 5s
  useEffect(() => {
    function pollServerAgent() {
      fetch('/api/agent?action=status')
        .then(r => r.json())
        .then(data => {
          setServerAgent(data);
          setServerAgentRunning(data.status === 'running');
        })
        .catch(() => {});
    }
    pollServerAgent();
    serverPollRef.current = setInterval(pollServerAgent, 5000);
    return () => clearInterval(serverPollRef.current);
  }, [authed]);

  async function startServerAgent() {
    const state = vlFilter || 'FL';
    const r = await fetch('/api/agent?action=start', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ state })
    });
    const data = await r.json();
    notify(data.message || 'Server agent started', 'success');
  }

  async function stopServerAgent() {
    await fetch('/api/agent?action=stop', { method: 'POST' });
    notify('Server agent stopped', 'warning');
  }

  async function pauseServerAgent() {
    await fetch('/api/agent?action=pause', { method: 'POST' });
    notify('Server agent paused', 'warning');
  }

  async function resumeServerAgent() {
    await fetch('/api/agent?action=resume', { method: 'POST' });
    notify('Server agent resumed', 'success');
  }

  // Poll inbound SMS every 10s
  useEffect(() => {
    if (!authed) return;
    function pollInbox() {
      fetch('/api/twilio?action=inbox')
        .then(r => r.json())
        .then(data => {
          if (data.messages && data.messages.length > 0) {
            setInboxMessages(prev => {
              const existingSids = new Set(prev.map(m => m.sid));
              const newMsgs = data.messages.filter(m => !existingSids.has(m.sid));
              if (newMsgs.length > 0) {
                setUnreadInbox(u => u + newMsgs.length);
                return [...newMsgs, ...prev].slice(0, 200);
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }
    pollInbox();
    inboxPollRef.current = setInterval(pollInbox, 10000);
    return () => clearInterval(inboxPollRef.current);
  }, [authed]);

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const activeContact = activeIdx !== null ? contacts[activeIdx] : null;

  const filteredContacts = contacts.filter(c => {
    if (c.status === 'dnc') return statusFilter === 'dnc';
    const ms = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.business_name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search);
    const mf = statusFilter === 'all' || c.status === statusFilter;
    return ms && mf;
  });

  function selectContact(idx) {
    setActiveIdx(idx);
    setNotes(contacts[idx]?.notes || '');
    setSmsBody(SMS_FOLLOW_UP(contacts[idx]?.name || '', scripts[scriptIdxRef.current]?.name || ''));
    if (isMobile) setMobileView('dial');
  }

  function updateContactStatus(idx, status, notesVal) {
    setContacts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status, notes: notesVal !== undefined ? notesVal : next[idx].notes };
      return next;
    });
  }

  function resetQueue() {
    setContacts(prev => prev.map(c =>
      ['called','voicemail','calling'].includes(c.status) ? { ...c, status: 'new' } : c
    ));
    setResetModal(false);
    notify('Queue reset — all contacts back to NEW', 'success');
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

  // ── CALL ─────────────────────────────────────────────────────────────────
  async function startCall() {
    const idx = activeIdxRef.current;
    if (idx === null) return notify('Select a contact first', 'warning');
    const contact = contactsRef.current[idx];
    if (!contact?.phone) return notify('No phone number', 'warning');
    pressedOneRef.current = false;
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.phone, contactId: contact.id, contactName: contact.name, script: scripts[scriptIdxRef.current]?.name, aiMode: aiCallModeRef.current })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`Dialing ${contact.name || contact.phone}...`, 'info');
      startPoll(data.callSid);
      autoEndRef.current = setTimeout(() => {
        if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') endCall();
      }, 90000);
    } catch (err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function startPoll(sid) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const pr = await fetch(`/api/twilio?action=callstatus&sid=${sid}`);
        const pd = await pr.json();
        const done = pd.status === 'completed' || pd.status === 'failed' || pd.status === 'busy' || pd.status === 'no-answer';
        if (done && (callStateRef.current === 'connected' || callStateRef.current === 'dialing')) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          clearTimeout(autoEndRef.current);
          // Determine disposition
          const dur = parseInt(pd.duration || 0);
          let outcome;
          if (pressedOneRef.current) outcome = 'interested';
          else if (pd.status === 'no-answer' || pd.status === 'failed' || pd.status === 'busy') outcome = 'voicemail';
          else if (pd.status === 'completed' && dur >= 15) outcome = 'answered';
          else outcome = 'voicemail';
          if (agentModeRef.current && !agentPausedRef.current) {
            setDisposition(outcome);
          } else {
            setCallState('ended');
          }
        }
      } catch {}
    }, 3000);
  }

  function endCall() {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    clearTimeout(autoEndRef.current);
    setCallState('ended');
  }

  async function setDisposition(outcome) {
    const idx = activeIdxRef.current;
    if (idx === null) return;
    const contact = contactsRef.current[idx];
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    clearTimeout(autoEndRef.current);
    setCallState('idle');
    const entry = { id: Date.now(), contact_id: contact.id, name: contact.name, business: contact.business_name, phone: contact.phone, outcome, duration: callSecondsRef.current, notes: notesRef.current, script: scripts[scriptIdxRef.current]?.name, timestamp: new Date().toISOString() };
    setCallLog(prev => [entry, ...prev]);
    updateContactStatus(idx, { answered:'called', voicemail:'voicemail', callback:'callback', interested:'interested', 'not-interested':'not-interested' }[outcome] || 'called', notesRef.current);
    if (outcome === 'interested') {
      notify(`🔥 HOT LEAD — auto-texting ${contact.name}`, 'success');
      try {
        await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: contact.phone, body: SMS_FOLLOW_UP(contact.name, scripts[scriptIdxRef.current]?.name || '') }) });
      } catch {}
    }
    syncToVinLedger(contact, outcome, notesRef.current);
    setCallSeconds(0);
    setNotes('');
    pressedOneRef.current = false;
    if (agentModeRef.current && !agentPausedRef.current) agentRef.current = setTimeout(() => agentNext(), 2000);
  }

  // ── VINLEDGER SYNC ───────────────────────────────────────────────────────
  async function loadFromVinLedger() {
    setLoadingVL(true);
    try {
      const url = `${VINLEDGER_API}/api/dealers/export?has_phone=true&limit=500${vlFilter ? `&state=${vlFilter}` : ''}`;
      const r = await fetch(url);
      const data = await r.json();
      const dealers = (data.dealers || data || []);
      const mapped = dealers.map(d => ({
        id: `vl_${d.id}`,
        vinledger_id: d.id,
        name: d.name || 'Unknown Dealer',
        business_name: d.name || '',
        phone: d.phone || '',
        email: '',
        address: [d.address, d.city, d.state, d.zip].filter(Boolean).join(', '),
        dealer_type: d.dealer_type || 'independent',
        status: d.call_status || 'new',
        notes: d.call_notes || '',
        list_name: `VinLedger ${vlFilter || 'All'}`,
        created_at: new Date().toISOString()
      })).filter(d => d.phone);
      const existingPhones = new Set(contacts.map(c => c.phone));
      const fresh = mapped.filter(d => !existingPhones.has(d.phone));
      setContacts(prev => [...prev, ...fresh]);
      notify(`Loaded ${fresh.length} dealers from VinLedger (${mapped.length - fresh.length} dupes skipped)`, 'success');
    } catch(err) {
      notify(`VinLedger load failed: ${err.message}`, 'warning');
    }
    setLoadingVL(false);
  }

  async function syncToVinLedger(contact, outcome, notes) {
    if (!contact?.vinledger_id) return;
    try {
      await fetch(`${VINLEDGER_API}/api/dealers/${contact.vinledger_id}/call-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, notes, called_at: new Date().toISOString() })
      });
    } catch(err) {
      console.error('VinLedger sync failed:', err.message);
    }
  }

  // ── AGENT MODE ────────────────────────────────────────────────────────────
  function toggleAgent() {
    const next = !agentMode;
    if (next) {
      // Check if queue has new contacts
      const newCount = contacts.filter(c => c.status === 'new').length;
      if (newCount === 0) {
        setResetModal(true);
        return;
      }
      setAgentMode(true);
      setAgentPaused(false);
      notify(`AI Agent firing — ${newCount} contacts in queue`, 'info');
      setTimeout(() => agentNext(), 500);
    } else {
      setAgentMode(false);
      clearTimeout(agentRef.current);
      notify('Agent stopped', 'warning');
    }
  }

  function agentNext() {
    if (!agentModeRef.current || agentPausedRef.current) return;
    setContacts(prev => {
      const newIdx = prev.findIndex(c => c.status === 'new');
      if (newIdx === -1) {
        setAgentMode(false);
        notify('Queue empty — all contacts dialed', 'success');
        return prev;
      }
      const contact = prev[newIdx];

      // TCPA time guard
      if (contact.phone && !isTCPAAllowed(contact.phone)) {
        const h = getTCPAHour(contact.phone);
        notify(`TCPA skip: ${contact.name} — local time ${h}:00 (outside 8am-9pm)`, 'warning');
        // Mark skipped and move to next
        const updated = prev.map((c, i) => i === newIdx ? { ...c, status: 'tcpa-skip' } : c);
        agentRef.current = setTimeout(() => agentNext(), 500);
        return updated;
      }

      const updated = prev.map((c, i) => i === newIdx ? { ...c, status: 'calling' } : c);
      setTimeout(() => {
        setActiveIdx(newIdx);
        setNotes(contact.notes || '');
        setSmsBody(SMS_FOLLOW_UP(contact.name || '', scripts[scriptIdxRef.current]?.name || ''));
        setTimeout(() => {
          if (agentModeRef.current && !agentPausedRef.current) startCallForAgent(contact, newIdx);
        }, 800);
      }, 100);
      return updated;
    });
  }

  async function startCallForAgent(contact, idx) {
    if (!contact?.phone) return;
    pressedOneRef.current = false;
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    clearTimeout(autoEndRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      const r = await fetch('/api/twilio?action=call', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: contact.phone, contactId: contact.id, contactName: contact.name, script: scripts[scriptIdxRef.current]?.name, aiMode: aiCallModeRef.current })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCallSid(data.callSid);
      setCallState('connected');
      notify(`[AGENT] ${contact.name || contact.phone}`, 'info');
      startPoll(data.callSid);
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
      if (agentModeRef.current) agentRef.current = setTimeout(() => agentNext(), 3000);
    }
  }

  // ── QUEUE MANAGEMENT ─────────────────────────────────────────────────────
  function deleteContact(idx) {
    setContacts(prev => prev.filter((_, i) => i !== idx));
    if (activeIdx === idx) setActiveIdx(null);
    else if (activeIdx > idx) setActiveIdx(a => a - 1);
    setConfirmDelete(null);
    notify('Lead removed', 'warning');
  }

  function bulkDelete() {
    setContacts(prev => prev.filter((_, i) => !selectedIds.has(i)));
    setSelectedIds(new Set());
    setBulkMode(false);
    setActiveIdx(null);
    setConfirmDelete(null);
    notify(`Deleted ${selectedIds.size} leads`, 'warning');
  }

  function markDNC(idx) {
    setContacts(prev => { const next=[...prev]; next[idx]={...next[idx], status:'dnc'}; return next; });
    setContextMenu(null);
    notify('Marked Do Not Call', 'warning');
  }

  function bulkSetStatus(status) {
    setContacts(prev => prev.map((c, i) => selectedIds.has(i) ? {...c, status} : c));
    setSelectedIds(new Set());
    setBulkMode(false);
    notify(`${selectedIds.size} contacts → ${status.toUpperCase()}`, 'success');
  }

  function toggleSelectContact(idx, e) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredContacts.map(c => contacts.indexOf(c))));
  }

  function skipContact() {
    const idx = activeIdxRef.current;
    if (idx === null) return;
    updateContactStatus(idx, 'voicemail', notesRef.current);
    notify('Skipped', 'info');
    if (agentModeRef.current && !agentPausedRef.current) agentRef.current = setTimeout(() => agentNext(), 500);
  }

  // ── RECORDINGS / REVIEW ───────────────────────────────────────────────────
  async function loadRecordings() {
    setRecordingsLoading(true);
    try {
      const r = await fetch('/api/recordings?action=list&limit=50');
      const data = await r.json();
      setRecordings(data.recordings || []);
    } catch(e) { notify('Could not load recordings', 'warning'); }
    setRecordingsLoading(false);
  }

  async function loadPatterns() {
    setPatternsLoading(true);
    try {
      const r = await fetch('/api/recordings?action=patterns');
      const data = await r.json();
      setPatterns(data.patterns);
    } catch(e) {}
    setPatternsLoading(false);
  }

  // ── CALLBACK SCHEDULER ────────────────────────────────────────────────────
  function scheduleCallback(idx) {
    setCallbackModal(idx);
    const now = new Date();
    now.setHours(now.getHours() + 2);
    setCallbackTime(now.toISOString().slice(0,16));
  }

  function saveCallback() {
    const contact = contacts[callbackModal];
    if (!contact || !callbackTime) return;
    const cb = {
      id: Date.now(),
      contactIdx: callbackModal,
      contactName: contact.name,
      contactPhone: contact.phone,
      business: contact.business_name,
      scheduledFor: callbackTime,
      done: false,
    };
    setCallbacks(prev => [...prev, cb]);
    updateContactStatus(callbackModal, 'callback');
    setCallbackModal(null);
    notify(`Callback scheduled for ${new Date(callbackTime).toLocaleString()}`, 'success');
  }

  function dismissCallback(id) {
    setCallbacks(prev => prev.map(cb => cb.id === id ? {...cb, done: true} : cb));
  }

  const pendingCallbacks = callbacks.filter(cb => !cb.done && new Date(cb.scheduledFor) <= new Date(Date.now() + 30*60*1000));

  // ── EMAIL FOLLOW-UP ───────────────────────────────────────────────────────
  async function sendEmailFollowUp(contact) {
    if (!contact.email) return notify('No email on file for this contact', 'warning');
    setEmailSending(true);
    const activeScriptName = scripts[scriptIdxRef.current]?.name || 'VinHunter';
    try {
      const r = await fetch('/api/recordings?action=email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.email, contactName: contact.name, business: contact.business_name, product: activeScriptName }),
      });
      const data = await r.json();
      if (data.ok) notify(`Email sent to ${contact.email} [${activeScriptName}]`, 'success');
      else notify(`Email failed: ${data.error || 'Unknown error'}`, 'warning');
    } catch(e) { notify('Email send failed', 'warning'); }
    setEmailSending(false);
    setEmailModal(null);
  }

  // ── SQUARE PAY LINK ───────────────────────────────────────────────────────
  async function generatePayLink(amount, tier) {
    const activeScriptName = scripts[scriptIdxRef.current]?.name || 'VinHunter';
    try {
      const r = await fetch('/api/recordings?action=pay-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: tier || activeScriptName, contactName: payModal?.name, product: activeScriptName }),
      });
      const data = await r.json();
      setPayResult(data);
    } catch(e) { notify('Pay link generation failed', 'warning'); }
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
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

  async function replyToMessage(to, body) {
    try {
      const r = await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to, body }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      notify(`Reply sent ✓`, 'success');
    } catch (err) { notify(`Reply failed: ${err.message}`, 'warning'); }
  }

  function exportCSV(rows, filename) {
    const content = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type:'text/csv'})); a.download = filename; a.click();
  }

  // ── STATS ─────────────────────────────────────────────────────────────────
  const totalCalls = callLog.length;
  const answeredCalls = callLog.filter(c => !['voicemail','not-interested'].includes(c.outcome)).length;
  const interestedCalls = callLog.filter(c => c.outcome === 'interested').length;
  const pipeline = interestedCalls * 99;
  const answerRate = totalCalls > 0 ? Math.round(answeredCalls/totalCalls*100) : 0;
  const intRate = totalCalls > 0 ? Math.round(interestedCalls/totalCalls*100) : 0;
  const queuedCount = contacts.filter(c => c.status === 'new').length;
  const statusColor = { idle:'#6B7A8D', dialing:'#FFD600', connected:'#2EFF9A', ended:'#FF6B2B' };
  const statusText = { idle:'STANDBY', dialing:'DIALING...', connected:'CONNECTED', ended:'CALL ENDED' };

  const tabs = ['dialer','dashboard','inbox','review','admin'];

  // Inject dynamic skin CSS
  useEffect(() => {
    const s = skin;
    const styleId = 'claw-skin-style';
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }
    el.textContent = `
      ${s.fontImport || ''}
      :root {
        --bg: ${s.bg}; --surface: ${s.surface}; --surface2: ${s.surface2}; --surface3: ${s.surface3};
        --border: ${s.border}; --border2: ${s.border2};
        --teal: ${s.accent}; --teal-dim: ${s.accentDim};
        --text: ${s.text}; --text-dim: ${s.textDim}; --text-mid: ${s.textMid};
      }
      html, body { font-family: ${s.bodyFont}; }
    `;
    storageSet('claw_skin', skinKey);
  }, [skinKey]);

  // ── PANEL RENDERS ─────────────────────────────────────────────────────────
  const ContactsPanel = (
    <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)'}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CONTACTS</span>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{filteredContacts.length}/{contacts.length}</span>
          <button onClick={() => { setBulkMode(b=>!b); setSelectedIds(new Set()); }} style={{padding:'2px 6px',fontFamily:'DM Mono, monospace',fontSize:8,background:bulkMode?'rgba(255,107,43,0.2)':'transparent',border:`1px solid ${bulkMode?'var(--orange)':'var(--border2)'}`,color:bulkMode?'var(--orange)':'var(--text-dim)',cursor:'pointer',borderRadius:2,letterSpacing:1}}>{bulkMode?'DONE':'SELECT'}</button>
          <button onClick={() => setResetModal(true)} style={{padding:'2px 6px',fontFamily:'DM Mono, monospace',fontSize:8,background:'transparent',border:'1px solid var(--border2)',color:'var(--text-dim)',cursor:'pointer',borderRadius:2,letterSpacing:1}}>RESET</button>
        </div>
      </div>
      {bulkMode && selectedIds.size > 0 && (
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',background:'rgba(255,107,43,0.08)',display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--orange)'}}>{selectedIds.size} SELECTED</span>
          <button onClick={selectAll} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:8,background:'transparent',border:'1px solid var(--border2)',color:'var(--text-dim)',cursor:'pointer',borderRadius:2}}>ALL</button>
          <button onClick={() => bulkSetStatus('new')} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:8,background:'transparent',border:'1px solid var(--blue)',color:'var(--blue)',cursor:'pointer',borderRadius:2}}>→ NEW</button>
          <button onClick={() => bulkSetStatus('callback')} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:8,background:'transparent',border:'1px solid var(--orange)',color:'var(--orange)',cursor:'pointer',borderRadius:2}}>→ CB</button>
          <button onClick={() => bulkSetStatus('dnc')} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:8,background:'transparent',border:'1px solid var(--red)',color:'var(--red)',cursor:'pointer',borderRadius:2}}>DNC</button>
          <button onClick={() => setConfirmDelete('bulk')} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:8,background:'rgba(255,59,59,0.15)',border:'1px solid var(--red)',color:'var(--red)',cursor:'pointer',borderRadius:2}}>🗑 DELETE</button>
        </div>
      )}
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:6}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'7px 10px',outline:'none',borderRadius:2}} />
        <button onClick={() => setShowAddModal(true)} style={{padding:'7px 12px',background:'var(--teal)',color:'var(--bg)',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,border:'none',cursor:'pointer',borderRadius:2}}>+ ADD</button>
      </div>
      <div style={{padding:'6px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
        {['all','new','callback','interested','dnc'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${statusFilter===f?'var(--teal-dim)':'var(--border2)'}`,background:statusFilter===f?'var(--surface3)':'transparent',color:statusFilter===f?'var(--teal)':'var(--text-dim)',borderRadius:2}}>
            {f==='all'?'ALL':f==='new'?'NEW':f==='callback'?'CB':f==='interested'?'HOT':'DNC'}
          </button>
        ))}
        <label style={{padding:'4px 10px',fontSize:9,fontFamily:'Barlow Condensed, sans-serif',fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>
          CSV<input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV} />
        </label>
      </div>
      <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',background:'rgba(20,241,198,0.03)',display:'flex',gap:6,alignItems:'center'}}>
        <select value={vlFilter} onChange={e=>setVlFilter(e.target.value)} style={{background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:9,padding:'4px 6px',outline:'none',borderRadius:2}}>
          <option value="">ALL STATES</option>
          {['FL','TX','CA','GA','NC','TN','AL','MS','LA','SC','VA','OH','MI','IL','PA','NY','NJ','AZ','NV','CO'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={loadFromVinLedger} disabled={loadingVL} style={{flex:1,padding:'5px 10px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,cursor:loadingVL?'wait':'pointer',border:'1px solid var(--teal-dim)',background:loadingVL?'rgba(20,241,198,0.05)':'rgba(20,241,198,0.1)',color:'var(--teal)',borderRadius:2}}>
          {loadingVL ? '⟳ LOADING...' : '⚡ LOAD VINLEDGER'}
        </button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filteredContacts.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text-dim)',fontFamily:'DM Mono, monospace',fontSize:11}}>
            <div style={{fontSize:28,marginBottom:10,opacity:0.3}}>📋</div>
            {contacts.length === 0 ? 'Upload CSV or add contacts' : 'No matches'}
          </div>
        ) : filteredContacts.map((c) => {
          const idx = contacts.indexOf(c);
          const sColor = {new:'#3B8FFF',called:'#FFD600',calling:'#FFD600',interested:'#14F1C6',voicemail:'#6B7A8D',callback:'#FF6B2B','not-interested':'#FF3B3B','tcpa-skip':'#6B3B7A',dnc:'#4A0000'}[c.status||'new'];
          return (
            <div key={c.id}
              onClick={() => bulkMode ? toggleSelectContact(idx, {stopPropagation:()=>{}}) : selectContact(idx)}
              onContextMenu={e => { e.preventDefault(); setContextMenu({x:e.clientX, y:e.clientY, idx}); }}
              style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',gap:10,background:activeIdx===idx?'var(--surface3)':'transparent',borderLeft:activeIdx===idx?'2px solid var(--teal)':'2px solid transparent',position:'relative',opacity:c.status==='dnc'?0.4:1}}
            >
              {bulkMode && (
                <div onClick={e=>toggleSelectContact(idx,e)} style={{width:16,height:16,border:`1px solid ${selectedIds.has(idx)?'var(--teal)':'var(--border2)'}`,background:selectedIds.has(idx)?'var(--teal)':'transparent',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                  {selectedIds.has(idx) && <span style={{color:'var(--bg)',fontSize:10,lineHeight:1}}>✓</span>}
                </div>
              )}
              <div style={{width:30,height:30,background:'var(--surface3)',border:'1px solid var(--border2)',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue, sans-serif',fontSize:13,color:'var(--teal)',flexShrink:0}}>{initials(c.name)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'Unknown'}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:2}}>{c.business_name||c.phone||'—'}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:8,padding:'2px 6px',borderRadius:2,color:sColor,border:`1px solid ${sColor}33`,background:`${sColor}11`,flexShrink:0}}>{(c.status||'NEW').toUpperCase()}</div>
                <button onClick={e=>{e.stopPropagation();setConfirmDelete(idx);}} style={{padding:'2px 5px',background:'transparent',border:'1px solid transparent',color:'var(--text-dim)',cursor:'pointer',borderRadius:2,fontSize:10}} onMouseOver={e=>e.currentTarget.style.color='var(--red)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-dim)'}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DialPanel = (
    <div style={{borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden',height:'100%'}}>
      {/* Agent bar */}
      <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--orange)'}}>// AI AGENT MODE</span>
          {agentMode && <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--orange)',animation:'pulse 1s infinite'}}>{agentPaused?'PAUSED':'RUNNING'}</span>}
          <div style={{padding:'2px 8px',borderRadius:2,border:`1px solid ${aiCallMode?'var(--teal)':'var(--border2)'}`,background:aiCallMode?'rgba(20,241,198,0.1)':'transparent',fontFamily:'DM Mono, monospace',fontSize:8,color:aiCallMode?'var(--teal)':'var(--text-dim)',cursor:'pointer'}} onClick={() => setAiCallMode(m=>!m)}>
            {aiCallMode ? '🤖 AI MODE' : '📻 REC MODE'}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{queuedCount} IN QUEUE</span>
          {queuedCount > 0 && (
            <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:tcpaSafeCount > 0 ? 'var(--green)' : 'var(--red)',padding:'2px 6px',border:`1px solid ${tcpaSafeCount > 0 ? 'var(--green)' : 'var(--red)'}22`,borderRadius:2}}>
              {tcpaSafeCount > 0 ? `✓ ${tcpaSafeCount} DIALABLE NOW` : `⏳ ${tcpaUnsafeCount} OUTSIDE HOURS`}
            </span>
          )}
          <div onClick={toggleAgent} style={{width:38,height:19,background:agentMode?'rgba(255,107,43,0.3)':'var(--surface3)',border:`1px solid ${agentMode?'var(--orange)':'var(--border2)'}`,borderRadius:10,cursor:'pointer',position:'relative'}}>
            <div style={{position:'absolute',width:13,height:13,borderRadius:'50%',background:agentMode?'var(--orange)':'var(--text-dim)',top:2,left:agentMode?21:2,transition:'left 0.3s',boxShadow:agentMode?'0 0 8px rgba(255,107,43,0.6)':'none'}}></div>
          </div>
          {agentMode && <button onClick={() => setAgentPaused(p=>!p)} style={{padding:'4px 10px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>{agentPaused?'RESUME':'PAUSE'}</button>}
        </div>
      </div>
      {/* Stats */}
      <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,flexShrink:0}}>
        {[['Queued',queuedCount,'var(--text)'],['Called',totalCalls,'var(--text)'],['Interested',interestedCalls,'var(--teal)'],['Pipeline',`$${pipeline}`,'var(--green)']].map(([label,val,color]) => (
          <div key={label} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:2,padding:'8px 10px',textAlign:'center'}}>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:18,color,lineHeight:1}}>{val}</div>
            <div style={{fontSize:9,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase',marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>
      {/* Active call */}
      <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:isMobile?20:26,letterSpacing:2,color:'var(--text)',lineHeight:1}}>{activeContact?.name||'SELECT A CONTACT'}</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)',marginTop:4}}>{activeContact?.business_name||'Choose from the list'}</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:13,color:'var(--teal)',marginTop:6}}>{activeContact?.phone||'—'}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            {callState !== 'idle' && <div style={{fontFamily:'DM Mono, monospace',fontSize:30,color:'var(--teal)',letterSpacing:4}}>{fmtTime(callSeconds)}</div>}
            {isMobile && activeContact && <button onClick={() => setMobileView('list')} style={{padding:'4px 10px',fontFamily:'DM Mono, monospace',fontSize:9,background:'transparent',border:'1px solid var(--border2)',color:'var(--text-dim)',cursor:'pointer',borderRadius:2}}>← LEADS</button>}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontFamily:'DM Mono, monospace',fontSize:11}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:statusColor[callState],animation:['dialing','connected'].includes(callState)?'pulse 1s infinite':'none'}}></div>
          <span style={{color:statusColor[callState]}}>{statusText[callState]}</span>
          {callSid && <span style={{color:'var(--text-dim)',fontSize:9}}>SID: {callSid.slice(0,16)}...</span>}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          {callState==='idle' && (
            <div style={{display:'flex',gap:0,borderRadius:2,overflow:'hidden',border:'1px solid var(--border2)'}}>
              <button onClick={startCall} style={{padding:'12px 20px',fontFamily:'Bebas Neue, sans-serif',fontSize:15,letterSpacing:3,background:aiCallMode?'rgba(20,241,198,0.15)':'var(--green)',color:aiCallMode?'var(--teal)':'var(--bg)',border:'none',cursor:'pointer'}}>
                {aiCallMode ? '🤖 AI DIAL' : '📞 DIAL'}
              </button>
              <button onClick={() => setAiCallMode(m => !m)} title={aiCallMode ? 'Switch to recording' : 'Switch to AI agent'} style={{padding:'12px 10px',fontFamily:'DM Mono, monospace',fontSize:9,background:aiCallMode?'rgba(20,241,198,0.25)':'var(--surface3)',color:aiCallMode?'var(--teal)':'var(--text-dim)',border:'none',borderLeft:'1px solid var(--border2)',cursor:'pointer',letterSpacing:1}}>{aiCallMode ? 'AI' : 'REC'}</button>
            </div>
          )}
          {['dialing','connected'].includes(callState) && <>
            <button onClick={endCall} style={{padding:'12px 24px',fontFamily:'Bebas Neue, sans-serif',fontSize:15,letterSpacing:3,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>🔴 END</button>
            {!aiCallMode && <button onClick={() => setDisposition('voicemail')} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🎙 DROP VM</button>}
          </>}
          {callState==='idle' && agentMode && (
            <button onClick={skipContact} style={{padding:'12px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>⏭ SKIP</button>
          )}
          <button onClick={() => activeContact?setSmsModal(true):notify('Select a contact','warning')} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>💬 SMS</button>
          {activeContact && callState === 'idle' && <>
            <button onClick={() => activeContact.email ? setEmailModal(activeContact) : notify('No email — add one in admin','warning')} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--blue)',border:'1px solid var(--blue)44',cursor:'pointer',borderRadius:2}} title="Send Brevo email follow-up">📧 EMAIL</button>
            <button onClick={() => setPayModal(activeContact)} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--green)',border:'1px solid var(--green)44',cursor:'pointer',borderRadius:2}} title="Generate Square pay link">💳 PAY</button>
            <button onClick={() => scheduleCallback(activeIdx)} style={{padding:'12px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--orange)',border:'1px solid var(--orange)44',cursor:'pointer',borderRadius:2}} title="Schedule callback reminder">⏰ CB</button>
          </>}
          {activeContact && callState==='idle' && (
            <button onClick={() => setConfirmDelete(activeIdx)} style={{padding:'12px 10px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>🗑</button>
          )}
        </div>
        {['connected','ended'].includes(callState) && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
            {[['answered','✅ ANSWERED','var(--green)'],['voicemail','📬 VOICEMAIL','var(--text-dim)'],['callback','🔁 CALLBACK','var(--orange)'],['interested','🔥 INTERESTED','var(--teal)'],['not-interested','❌ NOT INT.','var(--red)']].map(([outcome,label,color]) => (
              <button key={outcome} onClick={() => setDisposition(outcome)} style={{padding:'8px 6px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,color,border:`1px solid ${color}44`,background:`${color}11`,cursor:'pointer',borderRadius:2}}>{label}</button>
            ))}
          </div>
        )}
      </div>
      {/* Script */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {scripts.map((s,i) => (
            <button key={i} onClick={() => setScriptIdx(i)} style={{padding:'5px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1.5,cursor:'pointer',border:`1px solid ${scriptIdx===i?s.color:'var(--border2)'}`,background:scriptIdx===i?`${s.color}22`:'transparent',color:scriptIdx===i?s.color:'var(--text-dim)',borderRadius:2}}>{s.name}</button>
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
  );

  const LogPanel = (
    <div style={{overflow:'hidden',display:'flex',flexDirection:'column',height:'100%'}}>
      {[['TOTAL CALLS',totalCalls,'var(--teal)'],['ANSWER RATE',`${answerRate}%`,'var(--green)'],['INTERESTED',interestedCalls,'var(--orange)']].map(([label,val,color]) => (
        <div key={label} style={{padding:'14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>{label}</div>
          <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:30,letterSpacing:2,color,lineHeight:1}}>{val}</div>
        </div>
      ))}
      <div style={{padding:'14px',borderBottom:'1px solid var(--border)',background:'rgba(20,241,198,0.03)',borderLeft:'2px solid var(--teal)',flexShrink:0}}>
        <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>EST. PIPELINE MRR</div>
        <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:26,color:'var(--teal)',letterSpacing:2}}>${pipeline.toLocaleString()}</div>
        <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginTop:4}}>@ $99/mo per interested</div>
      </div>
      <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:'var(--text-mid)'}}>CALL LOG</span>
        <button onClick={() => exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'4px 8px',fontFamily:'Barlow Condensed, sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--text-dim)',borderRadius:2}}>EXPORT</button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {callLog.length===0?<div style={{padding:20,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>No calls yet</div>
        :callLog.slice(0,60).map(entry => {
          const c={answered:'var(--green)',voicemail:'var(--text-dim)',callback:'var(--orange)',interested:'var(--teal)','not-interested':'var(--red)'}[entry.outcome]||'var(--text-dim)';
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
  );

  return (
    <>
      <Head><title>CLAW DIALER — Command Center</title><style>{css}</style></Head>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:50,background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:3,color:'var(--teal)'}}>CLAW DIALER <span style={{color:'var(--text-dim)',fontSize:10,fontFamily:'DM Mono, monospace',letterSpacing:2,verticalAlign:'middle'}}>// COMMAND CENTER</span></span>
          <span style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:10,background:'rgba(46,255,154,0.08)',border:'1px solid rgba(46,255,154,0.2)',color:'var(--green)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite',display:'inline-block'}}></span>TWILIO READY
          </span>
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>
          <span>+1 (855) 960-0110</span>
          <span style={{color:'var(--border2)'}}>|</span>
          <span style={{color:'var(--teal)'}}>{clock}</span>
          <button onClick={() => { setAuthed(false); storageSet('claw_authed', false); }} style={{padding:'3px 8px',fontFamily:'DM Mono, monospace',fontSize:9,background:'transparent',border:'1px solid var(--border2)',color:'var(--text-dim)',cursor:'pointer',borderRadius:2,letterSpacing:1}}>LOCK</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 20px'}}>
        {tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='inbox') setUnreadInbox(0); }} style={{padding:'10px 18px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color: tab===t ? 'var(--teal)' : 'var(--text-dim)',cursor:'pointer',border:'none',borderBottom: tab===t ? '2px solid var(--teal)' : '2px solid transparent',background:'none',position:'relative'}}>
            {t.toUpperCase()}
            {t === 'inbox' && unreadInbox > 0 && <span style={{position:'absolute',top:6,right:4,background:'var(--red)',color:'white',borderRadius:'50%',width:14,height:14,fontSize:8,fontFamily:'DM Mono, monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadInbox}</span>}
          </button>
        ))}
      </div>

      {/* ── CALLBACK REMINDER BANNER ── */}
      {pendingCallbacks.length > 0 && (
        <div style={{background:'rgba(255,107,43,0.12)',borderBottom:'1px solid rgba(255,107,43,0.3)',padding:'8px 20px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:11,letterSpacing:3,color:'var(--orange)'}}>🔔 CALLBACK DUE</span>
          {pendingCallbacks.map(cb => (
            <span key={cb.id} style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text)'}}>
              {cb.contactName} — {new Date(cb.scheduledFor).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
              <button onClick={() => dismissCallback(cb.id)} style={{marginLeft:8,padding:'1px 5px',fontSize:9,background:'transparent',border:'1px solid var(--border2)',color:'var(--text-dim)',cursor:'pointer',borderRadius:2}}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* ── SERVER AGENT BANNER ── */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'10px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:serverAgentRunning?'var(--green)':'var(--text-dim)',animation:serverAgentRunning?'pulse 1s infinite':'none'}}></div>
          <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:12,letterSpacing:3,color:serverAgentRunning?'var(--green)':'var(--text-dim)'}}>SERVER AGENT</span>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginLeft:4}}>{serverAgent.status.toUpperCase()}</span>
        </div>
        {serverAgent.status !== 'idle' && <>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-mid)'}}>
            {serverAgent.called}/{serverAgent.total} CALLED
          </span>
          <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--teal)'}}>
            {serverAgent.interested} INTERESTED
          </span>
          {serverAgent.current && <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--yellow)',animation:'pulse 1s infinite'}}>
            📞 {serverAgent.current.name || serverAgent.current.phone}
          </span>}
        </>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {serverAgent.status === 'idle' || serverAgent.status === 'done' ? (
            <button onClick={startServerAgent} style={{padding:'6px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:1,background:'var(--green)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>
              ▶ START SERVER AGENT
            </button>
          ) : <>
            {serverAgent.paused ? (
              <button onClick={resumeServerAgent} style={{padding:'6px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>▶ RESUME</button>
            ) : (
              <button onClick={pauseServerAgent} style={{padding:'6px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--yellow)',border:'1px solid var(--yellow)',cursor:'pointer',borderRadius:2}}>⏸ PAUSE</button>
            )}
            <button onClick={stopServerAgent} style={{padding:'6px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--red)',border:'1px solid var(--red)',cursor:'pointer',borderRadius:2}}>⏹ STOP</button>
          </>}
        </div>
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && !isMobile && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr 280px',height:'calc(100vh - 90px)',overflow:'hidden'}}>
          {ContactsPanel}
          {DialPanel}
          {LogPanel}
        </div>
      )}

      {tab === 'dialer' && isMobile && (
        <div style={{height:'calc(100vh - 110px)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Mobile sub-nav */}
          <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
            {[['list','📋 LEADS'],['dial','📞 DIAL'],['log','📊 LOG']].map(([v,label]) => (
              <button key={v} onClick={() => setMobileView(v)} style={{flex:1,padding:'10px 4px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,letterSpacing:1,background:'none',border:'none',borderBottom:`2px solid ${mobileView===v?'var(--teal)':'transparent'}`,color:mobileView===v?'var(--teal)':'var(--text-dim)',cursor:'pointer'}}>
                {label}
                {v==='dial' && activeContact && <span style={{display:'block',fontSize:8,color:'var(--text-dim)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:80,margin:'1px auto 0'}}>{activeContact.name||activeContact.phone}</span>}
              </button>
            ))}
          </div>

          {/* LEADS view */}
          {mobileView === 'list' && (
            <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              {ContactsPanel}
            </div>
          )}

          {/* DIAL view */}
          {mobileView === 'dial' && (
            <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              {DialPanel}
            </div>
          )}

          {/* LOG view */}
          {mobileView === 'log' && (
            <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              {LogPanel}
            </div>
          )}
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
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
                {['OUTCOME','COUNT','%'].map(h=><th key={h} style={{padding:'8px 16px',textAlign:h==='OUTCOME'?'left':'right',fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',fontWeight:400}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['INTERESTED 🔥','interested','var(--teal)'],['ANSWERED','answered','var(--green)'],['CALLBACK','callback','var(--orange)'],['VOICEMAIL','voicemail','var(--text-dim)'],['NOT INTERESTED','not-interested','var(--red)']].map(([label,key,color])=>{
                  const count=callLog.filter(c=>c.outcome===key).length;
                  return(<tr key={key} style={{borderBottom:'1px solid var(--border)'}}><td style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:13,fontWeight:600,color}}>{label}</td><td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:13}}>{count}</td><td style={{padding:'9px 16px',textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>{totalCalls>0?Math.round(count/totalCalls*100):0}%</td></tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INBOX TAB ── */}
      {tab === 'inbox' && (
        <div style={{height:'calc(100vh - 90px)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--teal)'}}>// INBOUND SMS REPLIES</span>
            <span style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)'}}>{inboxMessages.length} messages</span>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {inboxMessages.length === 0 ? (
              <div style={{padding:60,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>
                <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>💬</div>
                No replies yet — replies to your SMS campaigns appear here
              </div>
            ) : inboxMessages.map((msg, i) => (
              <InboxMessage key={msg.sid||i} msg={msg} onReply={replyToMessage} notify={notify} />
            ))}
          </div>
        </div>
      )}

      {/* ── REVIEW TAB ── */}
      {tab === 'review' && (
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          {/* Patterns panel */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,marginBottom:24,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--teal)'}}>// AI CALL INTELLIGENCE</span>
              <button onClick={() => { loadPatterns(); }} disabled={patternsLoading} style={{padding:'5px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:patternsLoading?'transparent':'var(--teal)',color:patternsLoading?'var(--text-dim)':'var(--bg)',border:`1px solid ${patternsLoading?'var(--border2)':'var(--teal)'}`,cursor:'pointer',borderRadius:2}}>
                {patternsLoading ? '⟳ ANALYZING...' : '⚡ ANALYZE PATTERNS'}
              </button>
            </div>
            {patterns ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:0}}>
                {[
                  ['TOP OBJECTIONS', patterns.top_objections, 'var(--red)'],
                  ['BUYING SIGNALS', patterns.top_signals, 'var(--green)'],
                ].map(([label, items, color]) => (
                  <div key={label} style={{padding:'16px 20px',borderRight:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                    <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color,letterSpacing:2,marginBottom:10}}>{label}</div>
                    {(items||[]).map((item, i) => (
                      <div key={i} style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,color:'var(--text)',marginBottom:5,paddingLeft:10,borderLeft:`2px solid ${color}`}}>{item}</div>
                    ))}
                  </div>
                ))}
                <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--teal)',letterSpacing:2,marginBottom:8}}>WHAT IS WORKING</div>
                  <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,color:'var(--text)',lineHeight:1.5}}>{patterns.best_approach}</div>
                </div>
                <div style={{padding:'16px 20px',borderLeft:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--yellow)',letterSpacing:2,marginBottom:8}}>KEY INSIGHT</div>
                  <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,color:'var(--text)',lineHeight:1.5}}>{patterns.patterns}</div>
                </div>
                <div style={{padding:'16px 20px',gridColumn:'1/-1',background:'rgba(255,107,43,0.05)',borderTop:'1px solid var(--border)'}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--orange)',letterSpacing:2,marginBottom:8}}>⚡ RECOMMENDED ACTION</div>
                  <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:15,fontWeight:700,color:'var(--text)'}}>{patterns.recommendation}</div>
                </div>
              </div>
            ) : (
              <div style={{padding:32,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>
                Run at least 5 calls to enable pattern analysis. Click Analyze Patterns when ready.
              </div>
            )}
          </div>

          {/* Recordings list */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)'}}>CALL TRANSCRIPTS</span>
              <button onClick={loadRecordings} disabled={recordingsLoading} style={{padding:'5px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>
                {recordingsLoading ? '⟳' : '↻ LOAD'}
              </button>
            </div>
            {recordings.length === 0 ? (
              <div style={{padding:32,textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)'}}>
                <div style={{fontSize:28,marginBottom:8,opacity:0.3}}>🎙</div>
                Recordings appear here after calls complete. Twilio transcription takes ~1 minute per call.
              </div>
            ) : recordings.map(rec => (
              <div key={rec.id} style={{borderBottom:'1px solid var(--border)'}}>
                <div onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)} style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,background:expandedRec===rec.id?'var(--surface2)':'transparent'}}
                  onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'}
                  onMouseOut={e=>e.currentTarget.style.background=expandedRec===rec.id?'var(--surface2)':'transparent'}
                >
                  <div style={{width:8,height:8,borderRadius:'50%',background:{answered:'var(--green)',voicemail:'var(--text-dim)',interested:'var(--teal)',callback:'var(--orange)','not-interested':'var(--red)'}[rec.outcome]||'var(--text-dim)',flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,fontWeight:600,color:'var(--text)'}}>{rec.contactName || 'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginTop:2}}>{rec.outcome?.toUpperCase()} · {rec.duration}s · {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : ''}</div>
                  </div>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:rec.transcript ? 'var(--green)' : 'var(--text-dim)',padding:'2px 6px',border:`1px solid ${rec.transcript?'var(--green)':'var(--border2)'}22`,borderRadius:2}}>
                    {rec.transcript ? '📝 TRANSCRIPT' : '⏳ PENDING'}
                  </div>
                  <span style={{color:'var(--text-dim)',fontSize:12}}>{expandedRec===rec.id?'▲':'▼'}</span>
                </div>
                {expandedRec === rec.id && (
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid var(--border)',background:'var(--surface2)'}}>
                    {rec.analysis && (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14,paddingTop:14}}>
                        {[
                          ['SENTIMENT', rec.analysis.sentiment, {positive:'var(--green)',neutral:'var(--yellow)',negative:'var(--red)'}[rec.analysis.sentiment]||'var(--text-dim)'],
                          ['OBJECTIONS', (rec.analysis.objections||[]).join(', ') || 'None', 'var(--red)'],
                          ['SIGNALS', (rec.analysis.buying_signals||[]).join(', ') || 'None', 'var(--green)'],
                        ].map(([label, val, color]) => (
                          <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:'10px 12px'}}>
                            <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>{label}</div>
                            <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,color,fontWeight:600}}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {rec.analysis?.summary && (
                      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:2,padding:'10px 12px',marginBottom:10}}>
                        <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:5}}>AI SUMMARY</div>
                        <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,color:'var(--text)',lineHeight:1.5}}>{rec.analysis.summary}</div>
                      </div>
                    )}
                    {rec.analysis?.what_to_improve && (
                      <div style={{background:'rgba(255,107,43,0.05)',border:'1px solid rgba(255,107,43,0.2)',borderRadius:2,padding:'10px 12px',marginBottom:10}}>
                        <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--orange)',letterSpacing:2,marginBottom:5}}>IMPROVE</div>
                        <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,color:'var(--text)'}}>{rec.analysis.what_to_improve}</div>
                      </div>
                    )}
                    {rec.transcript && (
                      <div style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:2,padding:'12px'}}>
                        <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',letterSpacing:2,marginBottom:8}}>FULL TRANSCRIPT</div>
                        <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-mid)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{rec.transcript}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADMIN TAB ── */}
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
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>SKIN / THEME</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(SKINS).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{padding:'12px 8px',fontFamily:'DM Mono, monospace',fontSize:9,letterSpacing:1,cursor:'pointer',border:`1px solid ${skinKey===key ? s.accent : 'var(--border2)'}`,background:skinKey===key ? `${s.accent}22` : 'var(--surface2)',color:skinKey===key ? s.accent : 'var(--text-dim)',borderRadius:2,textAlign:'center',transition:'all 0.15s'}}>
                  <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                  <div style={{letterSpacing:1}}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>EDIT SCRIPTS</div>
            {scripts.map((s,i) => (
              <div key={i} style={{marginBottom:16}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:s.color,letterSpacing:2,marginBottom:6}}>SCRIPT {String.fromCharCode(65+i)} — {s.name}</div>
                <textarea defaultValue={s.sections.map(sec=>`[${sec.label}]\n${sec.text}`).join('\n\n')}
                  onBlur={e=>{const blocks=e.target.value.split(/\[([^\]]+)\]\n/);const sections=[];for(let j=1;j<blocks.length;j+=2)sections.push({label:blocks[j],text:(blocks[j+1]||'').trim()});if(sections.length>0)setScripts(prev=>{const next=[...prev];next[i]={...next[i],sections};return next;});}}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'10px 12px',outline:'none',borderRadius:2,resize:'vertical',minHeight:100,lineHeight:1.6}}
                />
              </div>
            ))}
          </div>
          <div>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:14,letterSpacing:3,color:'var(--text-mid)',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>DATA MANAGEMENT</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>exportCSV([['Name','Business','Phone','Outcome','Duration','Script','Notes','Time'],...callLog.map(c=>[c.name,c.business,c.phone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'call-log.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CALL LOG</button>
              <button onClick={()=>exportCSV([['Name','Business','Phone','Email','Status','List'],...contacts.map(c=>[c.name,c.business_name,c.phone,c.email,c.status,c.list_name])],'contacts.csv')} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>EXPORT CONTACTS</button>
              <button onClick={()=>{if(confirm('Clear all?')){setContacts([]);setCallLog([]);notify('Cleared','warning');}}} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2,marginLeft:'auto'}}>CLEAR ALL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CALLBACK SCHEDULER MODAL ── */}
      {callbackModal !== null && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--orange)',borderRadius:2,padding:28,width:380,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--orange)',marginBottom:18}}>⏰ SCHEDULE CALLBACK</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)',marginBottom:6}}>CONTACT</div>
            <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:15,color:'var(--text)',marginBottom:16}}>{contacts[callbackModal]?.name} — {contacts[callbackModal]?.business_name}</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)',marginBottom:6}}>CALL BACK AT</div>
            <input type="datetime-local" value={callbackTime} onChange={e=>setCallbackTime(e.target.value)}
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:13,padding:'10px 12px',outline:'none',borderRadius:2,marginBottom:20}} />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setCallbackModal(null)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={saveCallback} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--orange)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SCHEDULE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL FOLLOW-UP MODAL ── */}
      {emailModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--blue)',borderRadius:2,padding:28,width:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--blue)',marginBottom:18}}>📧 EMAIL FOLLOW-UP</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:4}}>TO</div>
            <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,color:'var(--text)',marginBottom:16}}>{emailModal.name} — {emailModal.email || <span style={{color:'var(--red)'}}>NO EMAIL ON FILE</span>}</div>
            <div style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:2,padding:'12px 14px',marginBottom:16}}>
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:8}}>PREVIEW — VINLEDGER FOLLOW-UP EMAIL</div>
              <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,color:'var(--text-mid)',lineHeight:1.6}}>
                Hey {emailModal.name?.split(' ')[0] || 'there'},<br/>
                Following up on our conversation. VinLedger puts a Trust Score and Google-indexed page on every VIN on your lot — overnight. $99/mo founding partner rate, locks forever.<br/>
                <span style={{color:'var(--teal)'}}>→ Includes pricing link + reply options</span>
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setEmailModal(null)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => sendEmailFollowUp(emailModal)} disabled={emailSending || !emailModal.email} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:emailModal.email?'var(--blue)':'var(--surface3)',color:emailModal.email?'white':'var(--text-dim)',border:'none',cursor:emailModal.email?'pointer':'default',borderRadius:2}}>
                {emailSending ? '⟳ SENDING...' : 'SEND EMAIL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SQUARE PAY LINK MODAL ── */}
      {payModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--green)',borderRadius:2,padding:28,width:460,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--green)',marginBottom:6}}>💳 COLLECT PAYMENT</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:10,color:'var(--text-dim)',marginBottom:18}}>{payModal.name} · {payModal.business_name}</div>
            {!payResult ? (() => {
              const sName = scripts[scriptIdx]?.name || '';
              const isVH = sName.includes('VINHUNTER') || sName.includes('VIN');
              const isWG = sName.includes('WHITEGLOV');
              const isRent = sName.includes('RENTACLAW');
              const isBudget = sName.includes('BUDGET');
              const tiers = isWG
                ? [['$2,400 VPS','2400','WGC Hosted VPS'],['$4,000 Mac Mini','4000','WGC Mac Mini Remote'],['$4,800 In-Person','4800','WGC Mac Mini In-Person'],['+$1,200 Agent','1200','Additional Agent']]
                : isRent
                ? [['$9/day','9','RentAClaw Daily'],['$49/week','49','RentAClaw Weekly'],['$149/mo','149','RentAClaw Monthly'],['$999/yr','999','RentAClaw Annual']]
                : isBudget
                ? [['$199/mo','199','BUDGETclaw Micro'],['$299/mo','299','BUDGETclaw Standard'],['$499/mo','499','BUDGETclaw Pro']]
                : isVH
                ? [['$29/mo','29','Verified Dealer'],['$49/mo','49','Dealer Reports'],['$99/mo','99','Dealer Marketing'],['$249/mo','249','Dealer Pro CRM']]
                // EconoClaw / ClawAway / default
                : [['$99/mo','99','EconoClaw Launch'],['$500 setup','500','EconoClaw Setup Fee'],['$249/mo','249','Agency/Multi-loc'],['$499/mo','499','White-Label']];
              const col = scripts[scriptIdx]?.color || 'var(--green)';
              return (
              <>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:10}}>SELECT AMOUNT — {sName || 'VINHUNTER'}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:20}}>
                  {tiers.map(([label, amount, tier]) => (
                    <button key={amount} onClick={() => generatePayLink(amount, tier)} style={{padding:'14px 10px',fontFamily:'Bebas Neue, sans-serif',fontSize:15,letterSpacing:2,background:`${col}18`,color:col,border:`1px solid ${col}44`,cursor:'pointer',borderRadius:2,textAlign:'center'}}>
                      {label}<div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:'var(--text-dim)',marginTop:4,fontWeight:400,letterSpacing:1}}>{tier}</div>
                    </button>
                  ))}
                </div>
              </>
              );
            })() : (
              <div>
                <div style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:2,padding:'14px',marginBottom:14}}>
                  <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:6}}>NEXT STEPS</div>
                  <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:14,color:'var(--text)',lineHeight:1.6,marginBottom:10}}>{payResult.note}</div>
                  <a href={payResult.squareDashboard} target="_blank" rel="noreferrer" style={{display:'inline-block',padding:'8px 16px',background:'var(--teal)',color:'var(--bg)',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:700,textDecoration:'none',borderRadius:2}}>→ Open Square Dashboard</a>
                </div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:6}}>SMS TEMPLATE (paste your link in)</div>
                <textarea readOnly value={payResult.smsTemplate} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2,resize:'none',height:70}} onClick={e => e.target.select()} />
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginTop:6}}>{payResult.smsTemplate?.length}/160 chars</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={() => { setPayModal(null); setPayResult(null); }} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS MODAL ── */}
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
              <div style={{fontFamily:'DM Mono, monospace',fontSize:9,textAlign:'right',marginTop:4,color:smsBody.length>160?'var(--red)':smsBody.length>140?'var(--yellow)':'var(--text-dim)'}}>{smsBody.length}/160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setSmsModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={sendSMS} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,padding:24,width:420,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,letterSpacing:3,color:'var(--teal)',marginBottom:18}}>// ADD CONTACT</div>
            {[['Name','name'],['Business','business_name'],['Phone','phone'],['Email','email'],['List Name','list_name']].map(([label,key])=>(
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)',marginBottom:5}}>{label.toUpperCase()}</div>
                <input value={newContact[key]} onChange={e=>setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} />
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setShowAddModal(false)} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={()=>{if(!newContact.name&&!newContact.phone)return notify('Need name or phone','warning');setContacts(prev=>[...prev,{...newContact,id:Date.now(),status:'new',notes:'',created_at:new Date().toISOString()}]);setNewContact({name:'',business_name:'',phone:'',email:'',list_name:''});setShowAddModal(false);notify('Contact added','success');}} style={{padding:'9px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET QUEUE MODAL ── */}
      {resetModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--orange)',borderRadius:2,padding:32,width:400,animation:'slideUp 0.2s ease',textAlign:'center'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:22,letterSpacing:3,color:'var(--orange)',marginBottom:12}}>QUEUE EMPTY</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)',lineHeight:1.7,marginBottom:24}}>
              All contacts have been dialed.<br/>Reset called/voicemail contacts back to NEW and run the list again?
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setResetModal(false)} style={{padding:'10px 20px',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={()=>{resetQueue();setTimeout(()=>{setAgentMode(true);setAgentPaused(false);setTimeout(()=>agentNext(),500);},100);}} style={{padding:'10px 20px',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:700,background:'var(--orange)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>RESET + START AGENT</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEXT MENU ── */}
      {contextMenu && (
        <div onClick={e=>e.stopPropagation()} style={{position:'fixed',top:contextMenu.y,left:contextMenu.x,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:2,zIndex:500,minWidth:160,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',animation:'slideUp 0.1s ease'}}>
          {[
            ['📞 Call Now', () => { selectContact(contextMenu.idx); setContextMenu(null); setTimeout(startCall, 100); }],
            ['💬 Send SMS', () => { selectContact(contextMenu.idx); setContextMenu(null); setSmsModal(true); }],
            ['🔁 Mark Callback', () => { updateContactStatus(contextMenu.idx, 'callback'); setContextMenu(null); notify('Marked callback','success'); }],
            ['🔥 Mark Interested', () => { updateContactStatus(contextMenu.idx, 'interested'); setContextMenu(null); notify('Marked interested','success'); }],
            ['↩️ Reset to New', () => { updateContactStatus(contextMenu.idx, 'new'); setContextMenu(null); notify('Reset to new','success'); }],
            ['🚫 Do Not Call', () => markDNC(contextMenu.idx)],
            ['🗑 Delete', () => { setConfirmDelete(contextMenu.idx); setContextMenu(null); }],
          ].map(([label, fn]) => (
            <div key={label} onClick={fn} style={{padding:'10px 16px',fontFamily:'Barlow Condensed, sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',color:'var(--text)',borderBottom:'1px solid var(--border)'}}
              onMouseOver={e=>e.currentTarget.style.background='var(--surface3)'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}
            >{label}</div>
          ))}
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      {confirmDelete !== null && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--red)',borderRadius:2,padding:32,width:360,animation:'slideUp 0.2s ease',textAlign:'center'}}>
            <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:3,color:'var(--red)',marginBottom:10}}>CONFIRM DELETE</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--text-dim)',lineHeight:1.7,marginBottom:24}}>
              {confirmDelete === 'bulk'
                ? `Delete ${selectedIds.size} selected leads? This cannot be undone.`
                : `Remove "${contacts[confirmDelete]?.name || contacts[confirmDelete]?.phone}" from the queue?`}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={() => setConfirmDelete(null)} style={{padding:'10px 20px',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:700,background:'transparent',color:'var(--text-dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:2}}>CANCEL</button>
              <button onClick={() => confirmDelete === 'bulk' ? bulkDelete() : deleteContact(confirmDelete)} style={{padding:'10px 20px',fontFamily:'Barlow Condensed, sans-serif',fontSize:12,fontWeight:700,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:2}}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div style={{position:'fixed',bottom:24,right:24,padding:'12px 18px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--teal)'}`,borderRadius:2,fontFamily:'DM Mono, monospace',fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:320,animation:'slideUp 0.3s ease'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}

// ── INBOX MESSAGE COMPONENT ────────────────────────────────────────────────
function InboxMessage({ msg, onReply, notify }) {
  const [replyText, setReplyText] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <div style={{borderBottom:'1px solid var(--border)',padding:'14px 20px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{fontFamily:'DM Mono, monospace',fontSize:12,color:'var(--teal)',fontWeight:700}}>{msg.from}</span>
            <span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:'var(--text-dim)'}}>{msg.dateSent ? new Date(msg.dateSent).toLocaleString() : ''}</span>
          </div>
          <div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:15,color:'var(--text)',lineHeight:1.5}}>{msg.body}</div>
        </div>
        <button onClick={()=>setOpen(o=>!o)} style={{padding:'6px 12px',fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,letterSpacing:1,background:open?'var(--teal)':'transparent',color:open?'var(--bg)':'var(--teal)',border:'1px solid var(--teal)',cursor:'pointer',borderRadius:2,flexShrink:0}}>
          {open?'CANCEL':'REPLY'}
        </button>
      </div>
      {open && (
        <div style={{marginTop:12,display:'flex',gap:8}}>
          <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&replyText.trim()){onReply(msg.from,replyText);setReplyText('');setOpen(false);}}} placeholder="Type reply..." style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono, monospace',fontSize:11,padding:'8px 10px',outline:'none',borderRadius:2}} autoFocus />
          <button onClick={()=>{if(replyText.trim()){onReply(msg.from,replyText);setReplyText('');setOpen(false);}}} style={{padding:'8px 14px',fontFamily:'Barlow Condensed, sans-serif',fontSize:11,fontWeight:700,background:'var(--teal)',color:'var(--bg)',border:'none',cursor:'pointer',borderRadius:2}}>SEND</button>
        </div>
      )}
    </div>
  );
}

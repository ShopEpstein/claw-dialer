import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── REPS — edit here or via REPS env variable ────────────────────────────────
const REPS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REPS
  ? JSON.parse(process.env.NEXT_PUBLIC_REPS)
  : [
      { id: 'chase',    name: 'Chase Turnquest',  pin: '5325', role: 'admin' },
      { id: 'rep12',    name: 'Rep 12',            pin: '1012', role: 'rep'   },
      { id: 'erica',    name: 'Erica Leverett',   pin: '3817', role: 'rep'   },
      { id: 'rep1',     name: 'Rep 1',             pin: '1001', role: 'rep'   },
      { id: 'rep2',     name: 'Rep 2',             pin: '1002', role: 'rep'   },
      { id: 'rep3',     name: 'Rep 3',             pin: '1003', role: 'rep'   },
      { id: 'rep4',     name: 'Rep 4',             pin: '1004', role: 'rep'   },
      { id: 'rep5',     name: 'Rep 5',             pin: '1005', role: 'rep'   },
      { id: 'rep6',     name: 'Rep 6',             pin: '1006', role: 'rep'   },
      { id: 'rep7',     name: 'Rep 7',             pin: '1007', role: 'rep'   },
      { id: 'rep8',     name: 'Rep 8',             pin: '1008', role: 'rep'   },
      { id: 'rep9',     name: 'Rep 9',             pin: '1009', role: 'rep'   },
      { id: 'rep10',    name: 'Rep 10',            pin: '1010', role: 'rep'   },
      { id: 'rep11',    name: 'Rep 11',            pin: '1011', role: 'rep'   },
    ];

// ─── NUMBER POOL — local numbers available for outbound dialing ───────────────
const NUMBER_POOL = [
  { number: '+18502033021', label: '(850) 203-3021', friendlyName: 'Chase Local'   },
  { number: '+18507211779', label: '(850) 721-1779', friendlyName: 'Jessica Local' },
  { number: '+18502043347', label: '(850) 204-3347', friendlyName: 'Erica Local'   },
  { number: '+18542261882', label: '(854) 226-1882', friendlyName: 'SC Local'      },
];

// ─── SCRIPTS ──────────────────────────────────────────────────────────────────
const SCRIPTS = {
  b2b: [
    {
      id: 'b2b-cold-facility',
      name: 'Cold — Nursing Home / ALF',
      color: '#4A9B4A',
      sections: [
        { label: 'OPENER', text: "Hi, is this the owner or administrator? This call may be recorded. I'm reaching out from CareCircle Network — we run the Intelligence Scanner that already indexes senior care facilities across Northwest Florida. Your facility has a current profile in our system. Quick question for you." },
        { label: 'HOOK', text: "Pull up carecircle.fit/research and search your facility name — I'll wait. [Pause.] That score pulls from AHCA inspection records, CMS data, Google reviews, BBB, and employee satisfaction data. Families are using this to make placement decisions right now." },
        { label: 'THE SHIFT', text: "A Place for Mom is under a Senate investigation — 37.5% of their 'Best of Senior Living' winners had active neglect citations. Families are looking for a trustworthy alternative. We send families to facilities with clean profiles. We charge $150 per referral. APFM charges $3,500 to $7,000 per placement." },
        { label: 'ADVOCACY ANGLE', text: "In March 2026 the HHS Inspector General confirmed nursing homes are chemically restraining dementia patients to lighten staff workload. That's national news. Families are scared. The facility that says 'we welcome independent family advocates, we have nothing to hide' — that's a line in your admissions materials no competitor can say. That's what partnership with CareCircle gives you." },
        { label: 'PRICING', text: "Network Partner: $499 setup, $149/month — referral matching, SEO content, managed profile. Featured Partner: $999 setup, $349/month — priority placement, AI care platform. 60-day guarantee: no qualified referral in 60 days, full refund." },
        { label: 'CLOSE', text: "Can I text you the link to your current scanner profile so you can see what families are finding? No commitment — just transparency." },
        { label: 'OBJECTIONS', text: "Uses APFM → 'Under Senate investigation. We charge $150/referral, they charge up to $7,000. No reason you can't use both.' | No budget → '60-day guarantee removes the risk. Full refund if we don't deliver.' | Info already public → 'It is — we pull public sources. The question is whether families see your raw data or your curated profile.' | Staff won't like advocates → 'The facilities that say that are exactly why families need this service. Being advocacy-welcome is a differentiator right now.'" },
      ]
    },
    {
      id: 'b2b-cold-agency',
      name: 'Cold — Home Care Agency',
      color: '#4A9B4A',
      sections: [
        { label: 'OPENER', text: "Hi, I'm reaching out from CareCircle Network — we actively match families in your area with licensed home care providers. Your agency already has a profile in our system. Two minutes?" },
        { label: 'HOOK', text: "Go to carecircle.fit/research and search your agency name. That profile pulls from your FL license status, Google reviews, BBB, AHCA records, and Indeed. Families are comparing you to competitors before they call anyone." },
        { label: 'DIFFERENTIATOR', text: "We charge $150 per converted client. A Place for Mom charges $3,500 to $7,000. We're 95% less. And families who find you through CareCircle are pre-educated and higher intent than a cold referral — they've already compared you to alternatives." },
        { label: 'FEATURED VALUE', text: "Featured Partner includes our AI care intelligence platform — real-time care logs, family portal for out-of-state family members, concern flagging. You can offer this to client families as a value-add in your own admissions conversations." },
        { label: 'PRICING', text: "Network Partner: $149/month plus $150 per converted client. Featured Partner: $349/month — no per-referral fee, includes AI care platform. Both include a 60-day full refund guarantee." },
        { label: 'CLOSE', text: "Can I text you a link to your current profile so you can see what families are finding? No commitment." },
        { label: 'OBJECTIONS', text: "More referrals than we can handle → 'This is about quality signal, not volume. CareCircle families are pre-motivated and have already compared you to alternatives.' | Don't want per-referral fee → 'Featured Partner at $349/month — flat rate, no per-referral charge.' | Already have referral sources → 'We reach families doing independent research online before they call anyone. Different channel entirely.'" },
      ]
    },
    {
      id: 'b2b-warm-followup',
      name: 'Warm Follow-Up',
      color: '#4A9B4A',
      sections: [
        { label: 'OPENER', text: "Hi [Name], it's [Your Name] from CareCircle Network — following up on our conversation from [day]. Did you get a chance to look at the partnership overview I sent?" },
        { label: 'IF INTERNAL APPROVER', text: "Here's the language that usually makes this easy internally: one referral from us — one converted client — covers your annual Network Partner cost by a factor of 10 or more. A single memory care resident represents $50,000 to $80,000 in annual revenue. The partnership costs $1,490 a year. That's the math your approver needs." },
        { label: 'THREE-WAY CLOSE', text: "If they want to hear it directly, I'm happy to get on a quick call with both of you. I can do [day/time]. Does that work?" },
        { label: 'ROI CASE', text: "60-day guarantee: if we don't send you a qualified referral in 60 days, full refund. You're not making a faith bet — the only risk is 60 days of time. The upside is being a featured partner in the fastest-growing senior care accountability platform in Northwest Florida." },
        { label: 'CLOSE', text: "Can we book a 15-minute call this week to get you activated? I can have your profile live within 24 hours of the agreement." },
        { label: 'OBJECTIONS', text: "Still not sure on ROI → '60-day guarantee. Full refund if we don't deliver.' | Want free listing only → 'Free listings appear after featured and network partners in family matching. You're visible but not prioritized.' | Need to think → 'What would make you confident? I can answer that right now.'" },
      ]
    },
    {
      id: 'b2b-closing',
      name: 'Closing Call',
      color: '#4A9B4A',
      sections: [
        { label: 'OPENER', text: "Hi [Name], it's [Your Name] — circling back to confirm where you're at. Last time it sounded like you were leaning toward [Network / Featured] Partnership. Ready to move forward?" },
        { label: 'NEXT STEPS', text: "Here's what happens: I send you the partnership agreement today — straightforward, month-to-month, cancel anytime. Once signed and the setup fee is processed, your profile goes live within 24 hours and you start appearing in family matching immediately. For Featured Partners, I'll book a 30-minute onboarding call." },
        { label: 'SETUP FEE OBJECTION', text: "The setup fee covers your profile build, vetting review, and match configuration. It's one-time and fully covered by the 60-day guarantee — if we don't deliver a qualified referral in 60 days, the entire amount comes back to you." },
        { label: 'CLOSE', text: "I can send the agreement right now — takes about 5 minutes to sign. Want me to send it while we're on the phone?" },
        { label: 'OBJECTIONS', text: "Month-to-month vs annual → 'Month-to-month available at standard monthly rate. Annual saves you 2 months. Most partners convert to annual after the first referral.' | Referrals slow to come → '60-day guarantee is exactly for that. Full refund if we don't deliver in 60 days.'" },
      ]
    },
  ],
  b2c: [
    {
      id: 'b2c-inbound-warm',
      name: 'Inbound / Warm Lead',
      color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi, is this [First Name]? This is [Your Name] calling from CareCircle Network — you reached out through our website about your family's care situation. Did I catch you at an okay time?" },
        { label: 'DISCOVERY', text: "I appreciate you reaching out. Tell me a little about what's going on — who is in the facility and what's been on your mind? [Listen. Note: facility type, how long they've been there, what triggered the call, whether they're local or out of state.]" },
        { label: 'BRIDGE', text: "Got it. So you have [loved one] at [facility type] and [summarize concern]. That's exactly the situation we built this service for — not because something is definitely wrong, but because right now you don't have a way to know what happens when you're not there." },
        { label: 'WHAT WE DO', text: "We enter the facility as your loved one's designated essential caregiver — that's a legal designation that gives us full access. We show up unannounced. We cover overnight visits, weekends, shift changes — the windows families almost never see. Written report within 24 hours of every visit." },
        { label: 'PRICING', text: "We start most families with the Starter — four visits over seven to ten days, covering all major shift windows including at least one overnight. It's $599 one-time and gives you a real picture of how that facility operates when nobody expects us. After that, monthly plans start at $799." },
        { label: 'CLOSE', text: "I just need about ten minutes to get your loved one's information, the facility name and address, and what you want us to pay attention to. We can have the first visit scheduled within 48 hours. Do you have time now?" },
        { label: 'OBJECTIONS', text: "Need to talk to siblings → 'You don't need a family vote to gather information. The Starter is $599 and gives everyone documented proof of what's actually happening.' | Insurance covers it? → 'It's not — and that's intentional. We work for your family, not an insurer.' | Already visit regularly → 'Staff knows your face. We show up at 2am on a Tuesday. That's a completely different picture.' | Facility would object → 'Facilities cannot legally prevent an authorized family advocate. Facilities that push back are exactly the ones families need to know about.'" },
      ]
    },
    {
      id: 'b2c-social',
      name: 'Social / Facebook Lead',
      color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi [Name], this is [Your Name] with CareCircle Network — you filled out a form through our Facebook page a little while ago about your family's care situation. Did I catch you at an okay time?" },
        { label: 'RE-ENGAGE', text: "I just wanted to follow up quickly. Tell me — who is the family member you're concerned about and where are they right now? [They may not remember the form. Don't make them feel embarrassed — move to their situation.]" },
        { label: 'VALIDATE', text: "[Reflect what they said.] That concern is completely valid — and most families we talk to are in exactly that position. They visit when they can. The staff seems good. But there's a whole part of the facility's week they've never seen." },
        { label: 'WHAT WE DO', text: "What CareCircle does is fill that gap. We go in unannounced — overnight, weekends, shift changes — as your loved one's authorized advocate. We document what we find and send you a written report within 24 hours. No surprises, no guessing." },
        { label: 'PRICING + CLOSE', text: "The best starting point is our Starter — four visits over seven to ten days, $599 one-time. Most families say they got information they couldn't have gotten any other way. Want me to walk you through what that looks like?" },
        { label: 'TRIGGER QUESTION', text: "[If hesitant:] Can I ask — what was it about the post that caught your attention? Was there something specific going on with your loved one's care? [This surfaces the real concern. Reflect it back and anchor the Starter to solving that specific thing.]" },
        { label: 'OBJECTIONS', text: "Just curious, not sure I need it → 'That's how most families start. Can I ask — what made you curious? Something specific going on?' | Don't know what you do → 'In one sentence: trained advocates into facilities unannounced, overnight, written report within 24 hours. We work for the family.' | Too expensive → 'The Starter is $599 one-time. It's the right first step for any family that wants to know what's actually happening.'" },
      ]
    },
    {
      id: 'b2c-cold',
      name: 'Cold Outbound Family',
      color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi, my name is [Rep Name] — I'm calling from CareCircle Network. Do you have 30 seconds for me to explain why I'm reaching out? [Wait for yes.] We help families across the country navigate senior care — whether that's keeping an eye on a loved one in a facility, or finding quality in-home help so someone can stay at home. Quick question — do you have a parent or family member who's either in a nursing home or assisted living right now, or maybe still at home but starting to need some day-to-day help? [Listen. Let them talk. Their answer routes the call.]" },
        { label: 'TRACK A — IN A FACILITY', text: "How long have they been there, and how often are you able to visit? [Listen.] Here's why I ask. A World Health Organization review found that 64% of facility staff — roughly two out of three — admitted to some form of resident mistreatment in the past year. That's not an attack on every facility, and most staff are good people doing hard work under pressure. But it means the families who stay close and stay visible get measurably better outcomes. That's what we do. We send trained independent advocates into facilities unannounced — overnight, weekends, shift changes — the times families never see. You get a written report within 24 hours. We work for your family, not the facility." },
        { label: 'TRACK B — NEEDS HOME CARE', text: "Got it. CareCircle has a vetted network of licensed home care agencies across the country. When a family comes to us, we match you with a top-rated agency in your area — someone local, reputable, with the track record to back it up. They handle non-medical home care: companionship, personal care, light housekeeping, transportation, meal prep — the things that let someone stay safely at home. Most accept major insurance, and depending on your state, some Medicaid coverage applies too. A lot of families are surprised by what's actually covered. Would it be worth a free 15-minute call with a matched agency in your area just to see what's available? No commitment — just information." },
        { label: 'TRACK C — NOT SURE', text: "Completely fair. Can I ask what the care picture looks like right now? Even just knowing what's out there before you need it is useful — most families call us after something's already gone wrong." },
        { label: 'JUST HAVE A CONVERSATION', text: "Don't rush the pitch. Ask: 'What's the biggest thing you worry about with their care right now?' | 'How often are you able to get in and see them?' | 'Have you noticed any changes recently — in them, or in how the staff are responding?' Understand the situation. The right solution becomes obvious when you listen. You're not closing today — you're building trust." },
        { label: 'BOOK THE FOLLOW-UP', text: "Here's what I'd suggest — let me set up a short call between you and the right person on our team. They'll look at your specific situation and tell you exactly what makes sense. Free, no obligation, 15 minutes. Are mornings or afternoons better for you this week?" },
        { label: 'OBJECTIONS', text: "Not sure I need anything → 'Completely fair — can I ask what the care situation looks like right now? Even just knowing what's out there is useful.' | Home care is expensive → 'Our partner agencies take most insurance, and depending on your state, some Medicaid coverage applies. A lot of families don't realize what's covered. The consultation is free — worth finding out.' | Already in a facility and happy → 'Great to hear. An unannounced visit either confirms everything's great, or catches something early. Families who do it say they sleep better at night.' | How did you get my number → 'We connect with families navigating senior care. If you'd prefer not to be called, I'll take you off the list right now — no problem at all.' | Those statistics sound made up → 'It's from a World Health Organization review of studies on long-term care — the 64% figure is on WHO's official elder abuse fact sheet. I can text you the link right now.' [Text: https://www.who.int/news-room/fact-sheets/detail/abuse-of-older-people] | Do you operate in my state → 'Yes — we have vetted partners in [state]. Let me connect you with the agency in your area.'" },
      ]
    },
    {
      id: 'b2c-assisting-seniors',
      name: 'Assisting Seniors Referral',
      color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi [Name], this is [Your Name] — I'm calling on behalf of Assisting Seniors and CareCircle Network. You were referred to us and I wanted to reach out personally. How are things going right now with your family's care situation?" },
        { label: 'QUALIFY — LISTEN FOR TRACK', text: "[CRITICAL: Listen carefully. Are they talking about finding in-home care (Assisting Seniors track) or about a loved one already in a facility with concerns (CareCircle Present track)?]" },
        { label: 'ASSISTING SENIORS TRACK', text: "You're in exactly the right place. Assisting Seniors has been serving Gulf Coast families for 17 years — they specialize in exactly this situation. I'm going to connect you directly with their team. Is [time] a good time for that call? [CRITICAL: Do NOT pitch Guardian Plans to Medicaid-qualified patients. Route to Assisting Seniors.]" },
        { label: 'CARECIRCLE PRESENT TRACK', text: "Tell me more about the facility situation. How long have they been there and what's been on your mind? [If they're on this track, go to Inbound Warm Lead script from here — the opener is already done.]" },
        { label: 'ASSISTING SENIORS HANDOFF', text: "Assisting Seniors is our founding partner — 17 years in this market, 5-star Google rating, zero state enforcement actions. They will take care of you. Their number is [Assisting Seniors number]. I'll send them your information right now so they're ready for you." },
        { label: 'OBJECTIONS', text: "Thought Assisting Seniors was handling my case → 'They are — and they're excellent. I'm just making sure you have everything you need and the right team is ready for you.' | What's the difference → 'Assisting Seniors helps families find care. CareCircle monitors the quality of care after placement — unannounced visits, overnight coverage, written reports. Two different services, both working for your family.'" },
      ]
    },
  ]
};

// Active script per contact type — default to first in each array
const DEFAULT_SCRIPT = { b2b: 'b2b-cold-facility', b2c: 'b2c-cold' };

const SMS_TEMPLATES = {
  b2b: (name) => `CareCircle Network: Hi${name?' '+name.split(' ')[0]:''} — your facility's scanner profile and partner options: carecircle.fit/research — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
  b2c: (name) => `CareCircle Network: Hi${name?' '+name.split(' ')[0]:''} — information on our family advocacy service: carecircle.fit — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtTime(s) { return `${Math.floor((s||0)/60).toString().padStart(2,'0')}:${((s||0)%60).toString().padStart(2,'0')}` }

// Shuffle new leads randomly, then spread same-last-name contacts apart so
// people in the same household are never called back-to-back.
function shuffleLeads(arr) {
  const a = [...arr];
  // Fisher-Yates shuffle
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Spread pass: if two adjacent contacts share a last name, push the second
  // one at least 5 slots forward.
  const ln = c => (c.name || '').trim().split(/\s+/).pop().toLowerCase();
  for (let i = 0; i < a.length - 1; i++) {
    if (!ln(a[i]) || ln(a[i]) !== ln(a[i + 1])) continue;
    for (let j = Math.min(i + 5, a.length - 1); j < a.length; j++) {
      if (ln(a[j]) !== ln(a[i])) { [a[i + 1], a[j]] = [a[j], a[i + 1]]; break; }
    }
  }
  return a;
}
function sGet(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function sSet(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} }
function lGet(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function lSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#1A3D1A"/><text x="5" y="22" font-size="14" font-family="serif" fill="#4CAF50" font-weight="bold">CC</text></svg>')}`;

// ─── SKINS ────────────────────────────────────────────────────────────────────
const SKINS = {
  CARECIRCLE:    { label:'CARECIRCLE',    icon:'🌿', dark:true,  repAccessible:true,  bg:'#0F1A0F', surface:'#141F14', surface2:'#192419', surface3:'#1F2E1F', border:'#243324', border2:'#2D422D', accent:'#4A9B4A', accentL:'#6BBF6B', accentD:'#2D6A2D', teal:'#3D8B7A', text:'#E8F0E8', dim:'#7A9A7A', mid:'#A8C4A8', red:'#C44444', orange:'#C87A2A', blue:'#3A7AAA', yellow:'#A8A030' },
  // ── dark ──
  DEFAULT:       { label:'CLAW DEFAULT',  icon:'🖤', dark:true,  bg:'#080A0F', surface:'#0D1017', surface2:'#111520', surface3:'#151A26', border:'#1A2030', border2:'#202840', accent:'#14F1C6', accentL:'#30FFD8', accentD:'#0A9980', teal:'#0DD6B0', text:'#E0F0EC', dim:'#4A7A70', mid:'#7AAAA0', red:'#E05050', orange:'#E09040', blue:'#4080C0', yellow:'#B0A030' },
  CYBERCLAW:     { label:'CYBERCLAW',     icon:'💜', dark:true,  bg:'#0A0010', surface:'#0F0018', surface2:'#130020', surface3:'#180028', border:'#200035', border2:'#280045', accent:'#BF00FF', accentL:'#D040FF', accentD:'#8000B0', teal:'#8000B0', text:'#F0E0FF', dim:'#604070', mid:'#9060B0', red:'#E04060', orange:'#C060B0', blue:'#6040E0', yellow:'#A060E0' },
  GOTHICCLAW:    { label:'GOTHICCLAW',    icon:'🩸', dark:true,  bg:'#0D0000', surface:'#120000', surface2:'#180000', surface3:'#1E0000', border:'#280000', border2:'#360000', accent:'#CC0000', accentL:'#EE2222', accentD:'#880000', teal:'#880020', text:'#F0E0E0', dim:'#704040', mid:'#A06060', red:'#FF3030', orange:'#CC4020', blue:'#8040A0', yellow:'#A08020' },
  TACTICLAW:     { label:'TACTICLAW',     icon:'🎯', dark:true,  bg:'#0A0C07', surface:'#0F1209', surface2:'#13180C', surface3:'#181F10', border:'#20280A', border2:'#283510', accent:'#7FFF00', accentL:'#AAFF40', accentD:'#50B000', teal:'#50B000', text:'#E8F0D8', dim:'#5A7030', mid:'#88A050', red:'#D06030', orange:'#C08020', blue:'#408040', yellow:'#C0C000' },
  ECONOCLAW:     { label:'ECONOCLAW',     icon:'🔥', dark:true,  bg:'#0F0800', surface:'#160C00', surface2:'#1C1000', surface3:'#221400', border:'#301800', border2:'#402000', accent:'#FF6B2B', accentL:'#FF8A50', accentD:'#C04000', teal:'#C04000', text:'#F0E8D8', dim:'#7A5030', mid:'#B07848', red:'#FF4020', orange:'#FF8020', blue:'#8060C0', yellow:'#C09020' },
  BUDGETCLAW:    { label:'BUDGETCLAW',    icon:'📊', dark:true,  bg:'#000A00', surface:'#000F00', surface2:'#001400', surface3:'#001A00', border:'#002200', border2:'#002E00', accent:'#39FF14', accentL:'#60FF40', accentD:'#20B000', teal:'#20B000', text:'#E0F0D8', dim:'#407040', mid:'#60A060', red:'#C04040', orange:'#B06020', blue:'#408040', yellow:'#A0A000' },
  // ── light ──
  CLAW_LIGHT:    { label:'CLAW LIGHT',    icon:'🤍', dark:false, repAccessible:true,  bg:'#F0F4F8', surface:'#FFFFFF', surface2:'#F5F8FC', surface3:'#EEF2F7', border:'#D8E0EB', border2:'#C5D0DE', accent:'#008B7A', accentL:'#00B09A', accentD:'#006055', teal:'#006055', text:'#1A2A35', dim:'#708090', mid:'#4A6070', red:'#C03030', orange:'#B06000', blue:'#2060A0', yellow:'#707000' },
  CYBER_LIGHT:   { label:'CYBER LIGHT',   icon:'🪻', dark:false, bg:'#F5F0FF', surface:'#FFFFFF', surface2:'#F0EAFF', surface3:'#EAE0FF', border:'#D8CCEE', border2:'#C8B8E4', accent:'#7C00CC', accentL:'#9C20EE', accentD:'#580090', teal:'#580090', text:'#180028', dim:'#806090', mid:'#503870', red:'#B03050', orange:'#A05080', blue:'#5030C0', yellow:'#806090' },
  GOTHIC_LIGHT:  { label:'GOTHIC LIGHT',  icon:'📜', dark:false, bg:'#F5F0E8', surface:'#FFF8F0', surface2:'#F0E8DC', surface3:'#E8DDD0', border:'#D0C0B0', border2:'#C0B0A0', accent:'#8B0000', accentL:'#AA1010', accentD:'#600000', teal:'#600020', text:'#200000', dim:'#806060', mid:'#604040', red:'#AA0000', orange:'#904020', blue:'#603060', yellow:'#806000' },
  TACTIC_LIGHT:  { label:'TACTIC LIGHT',  icon:'🗺️', dark:false, bg:'#F2EED8', surface:'#FFFDE8', surface2:'#ECEAD0', surface3:'#E4E2C4', border:'#C8C4A0', border2:'#B8B490', accent:'#3A6600', accentL:'#508800', accentD:'#284800', teal:'#284800', text:'#1A2000', dim:'#708050', mid:'#506030', red:'#804020', orange:'#806000', blue:'#405830', yellow:'#606000' },
  ECONO_LIGHT:   { label:'ECONO LIGHT',   icon:'☀️', dark:false, bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#FFF0E4', surface3:'#FFE8D8', border:'#E8D0B8', border2:'#D8C0A8', accent:'#CC4400', accentL:'#EE6020', accentD:'#A03000', teal:'#A03000', text:'#200800', dim:'#806050', mid:'#604030', red:'#CC2000', orange:'#CC6000', blue:'#806040', yellow:'#888020' },
  BUDGET_LIGHT:  { label:'BUDGET LIGHT',  icon:'🟢', dark:false, bg:'#F8FFF8', surface:'#FFFFFF', surface2:'#F0FFF0', surface3:'#E8FEE8', border:'#C8ECC8', border2:'#B8DEB8', accent:'#008800', accentL:'#00AA00', accentD:'#005500', teal:'#005500', text:'#001800', dim:'#508050', mid:'#306030', red:'#AA2020', orange:'#886020', blue:'#406040', yellow:'#686000' },
  // ── rep picks ──
  BLOSSOM:       { label:'BLOSSOM',       icon:'💗', dark:true,  repAccessible:true,  tagline:'Powered by Love ♥', bg:'#1A0A12', surface:'#22101C', surface2:'#2C1424', surface3:'#361A2E', border:'#4E2240', border2:'#642D52', accent:'#FF6B9D', accentL:'#FF8FB5', accentD:'#CC4070', teal:'#E8609A', text:'#FFE0EC', dim:'#9A5878', mid:'#C88098', red:'#FF4466', orange:'#FF7066', blue:'#C060D0', yellow:'#E0A8B8' },
  HIBISCUS:      { label:'HIBISCUS',      icon:'🌺', dark:true,  repAccessible:true,  tagline:'Be Bold. Be You.', bg:'#160010', surface:'#1E0018', surface2:'#270022', surface3:'#30002C', border:'#460044', border2:'#5C0058', accent:'#FF2288', accentL:'#FF55AA', accentD:'#CC0066', teal:'#DD1177', text:'#FFDDEE', dim:'#884468', mid:'#BB6688', red:'#FF3344', orange:'#FF6655', blue:'#9933CC', yellow:'#EEAACC' },
  SAKURA:        { label:'SAKURA',        icon:'🌸', dark:false, repAccessible:true,  tagline:'Girl Power 🌸', bg:'#FFF5F8', surface:'#FFFFFF', surface2:'#FFECF4', surface3:'#FFE2EE', border:'#F0CCDA', border2:'#E0B8CA', accent:'#C4527A', accentL:'#E0709A', accentD:'#A03060', teal:'#B03878', text:'#2A0818', dim:'#A07080', mid:'#785060', red:'#CC2040', orange:'#C06030', blue:'#805090', yellow:'#907030' },
  PETAL:         { label:'PETAL',         icon:'🌷', dark:false, repAccessible:true,  tagline:'Soft Power 🌷', bg:'#FEF0FA', surface:'#FFFFFF', surface2:'#FDE8F8', surface3:'#FBD8F2', border:'#ECCAE8', border2:'#E0AACC', accent:'#C030A0', accentL:'#E050C0', accentD:'#900080', teal:'#980098', text:'#280028', dim:'#906080', mid:'#705060', red:'#CC2040', orange:'#B05040', blue:'#7040A0', yellow:'#806040' },
};

function buildSkinCss(s) {
  return `:root{--bg:${s.bg};--surface:${s.surface};--surface2:${s.surface2};--surface3:${s.surface3};--border:${s.border};--border2:${s.border2};--green:${s.accent};--gl:${s.accentL};--gd:${s.accentD};--teal:${s.teal};--text:${s.text};--dim:${s.dim};--mid:${s.mid};--red:${s.red};--orange:${s.orange};--blue:${s.blue};--yellow:${s.yellow}}`;
}

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;overflow:hidden}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2)}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

const statusColor = { new:'var(--green)',called:'var(--dim)',voicemail:'var(--blue)',callback:'var(--orange)',booked:'var(--gl)','not-interested':'var(--red)',disconnected:'var(--dim)',dnc:'var(--red)','no-answer':'var(--dim)','wrong-number':'var(--dim)',gatekeeper:'var(--orange)',partner:'var(--teal)' };
const callStateColor = { idle:'var(--dim)',dialing:'var(--yellow)',connected:'var(--gl)',ended:'var(--orange)' };
const callStateText = { idle:'STANDBY',dialing:'DIALING...',connected:'CONNECTED',ended:'CALL ENDED' };

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, activeSkin }) {
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
          {activeSkin?.tagline && <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--mid)',letterSpacing:1,marginTop:5}}>{activeSkin.tagline}</div>}
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

// Small component: fetches + plays a recording by callSid
function InterestedRecording({ callSid }) {
  const [state, setState] = React.useState('idle'); // idle | loading | found | none | error
  const [recordingSid, setRecordingSid] = React.useState(null);
  const load = async () => {
    setState('loading');
    try {
      const r = await fetch('/api/recordings?action=fetch-list', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ callSids: [callSid] }),
      });
      const d = await r.json();
      const match = (d.list || []).find(x => x.callSid === callSid);
      if (match) { setRecordingSid(match.recordingSid); setState('found'); }
      else setState('none');
    } catch { setState('error'); }
  };
  if (state === 'idle') return <button onClick={load} style={{fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--green)',background:'rgba(74,155,74,0.08)',color:'var(--green)',borderRadius:2,padding:'4px 10px',letterSpacing:0.5}}>▶ LOAD RECORDING</button>;
  if (state === 'loading') return <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>Loading…</span>;
  if (state === 'none') return <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>No recording found</span>;
  if (state === 'error') return <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--red)'}}>Error loading</span>;
  return <audio controls src={`/api/recordings?action=stream&sid=${recordingSid}`} style={{width:'100%',height:32,marginTop:4}} />;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CareCircleDialer() {
  const [rep, setRep] = useState(null);
  const [contactType, setContactType] = useState('b2c');
  const [contacts, setContacts] = useState([]);
  const [listAssignments, setListAssignments] = useState({});
  const [contactsLoading, setContactsLoading] = useState(false);
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
  const [activeScriptId, setActiveScriptId] = useState(DEFAULT_SCRIPT[contactType]);
  const [myLog, setMyLog] = useState([]);
  const [allLog, setAllLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState('');
  const [micBlocked, setMicBlocked] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [dialPhone, setDialPhone] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [dashRange, setDashRange] = useState('today'); // 'today'|'week'|'month'|'custom'
  const [dashFrom, setDashFrom] = useState('');
  const [dashTo, setDashTo] = useState('');
  const [dashRepFilter, setDashRepFilter] = useState('all');
  const [autoDial, setAutoDial] = useState(false);
  const [autoDialCountdown, setAutoDialCountdown] = useState(null);
  const [lifecycleContact, setLifecycleContact] = useState(null); // { contact, history }
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [playingSid, setPlayingSid] = useState(null);
  const [interestedModal, setInterestedModal] = useState(null); // { repName, entries }
  const [onlineReps, setOnlineReps] = useState([]);
  const [numberAssignments, setNumberAssignments] = useState({}); // { repId -> phoneNumber }
  const [numberPoolSaving, setNumberPoolSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [lifecycleRecordings, setLifecycleRecordings] = useState({}); // { callSid -> {recordingSid} | 'loading' | null }
  const [activeConfs, setActiveConfs] = useState({}); // { repId -> confData }
  const [monitoring, setMonitoring] = useState(null); // { repId, repName, mode } | null
  const [dialTimes, setDialTimes] = useState({}); // { repId -> minutes in range }
  const [skinKey, setSkinKey] = useState(() => lGet('cc_skin', 'CARECIRCLE'));
  const [callbackModal, setCallbackModal] = useState(false);
  const [callbackTime, setCallbackTime] = useState('');
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTo, setChatTo] = useState('all');
  const [chatLastRead, setChatLastRead] = useState(0);

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);
  const syncRef = useRef(null);
  const heartbeatRef = useRef(null);
  const presencePollRef = useRef(null);
  const twilioConnRef = useRef(null);
  const twilioDeviceRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatPollRef = useRef(null);
  const confPollRef = useRef(null);
  const monitorConnRef = useRef(null);

  // Session restore
  useEffect(() => {
    const saved = sGet('cc_rep', null);
    if (saved) { setRep(saved); startHeartbeat(saved); }
  }, []);

  // Admin: poll presence every 30s
  useEffect(() => {
    if (rep?.role !== 'admin') return;
    const repIds = REPS.map(r => r.id).join(',');
    const poll = async () => {
      try {
        const r = await fetch(`/api/kv?action=presence&repIds=${repIds}`);
        const d = await r.json();
        setOnlineReps(d.online || []);
      } catch {}
    };
    poll();
    presencePollRef.current = setInterval(poll, 30000);
    return () => clearInterval(presencePollRef.current);
  }, [rep]);

  function startHeartbeat(repData) {
    const ping = () => {
      fetch('/api/kv?action=rep-online', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ repId: repData.id, repName: repData.name }) }).catch(()=>{});
    };
    ping();
    heartbeatRef.current = setInterval(ping, 60000);
  }

  function handleLogin(repData) {
    sSet('cc_rep', repData);
    setRep(repData);
    startHeartbeat(repData);
  }

  function handleLogout() {
    if (rep) fetch('/api/kv?action=rep-offline', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ repId: rep.id }) }).catch(()=>{});
    clearInterval(heartbeatRef.current);
    clearInterval(presencePollRef.current);
    clearInterval(chatPollRef.current);
    clearInterval(confPollRef.current);
    if (monitorConnRef.current) { monitorConnRef.current.disconnect(); monitorConnRef.current = null; }
    sessionStorage.clear();
    setRep(null);
    setMyLog([]);
    setAllLog([]);
    setOnlineReps([]);
    setChatMessages([]);
    setChatOpen(false);
  }

  // Persist skin selection
  useEffect(() => { lSet('cc_skin', skinKey); }, [skinKey]);

  // Chat
  async function fetchChat() {
    try {
      const r = await fetch('/api/kv?action=chat-fetch');
      const d = await r.json();
      setChatMessages(((d.messages || []).slice().reverse()));
    } catch {}
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    // Reps always message Chase. Admin messages the selected rep.
    const to = isAdmin ? (chatTo || REPS.find(r => r.id !== rep?.id)?.id || 'all') : 'chase';
    const toRep = REPS.find(r => r.id === to);
    const toName = toRep?.name || 'Admin';
    const body = { fromId: rep.id, fromName: rep.name, fromRole: rep.role, to, toName, text: chatInput.trim() };
    setChatInput('');
    try {
      await fetch('/api/kv?action=chat-send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      await fetchChat();
    } catch {}
  }

  async function markChatRead() {
    const ts = Date.now();
    setChatLastRead(ts);
    if (rep) {
      try { await fetch('/api/kv?action=chat-lastread', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ repId: rep.id, ts }) }); } catch {}
    }
  }

  useEffect(() => {
    if (!rep) return;
    fetch(`/api/kv?action=chat-lastread&repId=${rep.id}`).then(r => r.json()).then(d => setChatLastRead(d.ts || 0)).catch(() => {});
    fetchChat();
    chatPollRef.current = setInterval(fetchChat, 20000);
    return () => clearInterval(chatPollRef.current);
  }, [rep?.id]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatOpen && chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior:'smooth' });
  }, [chatMessages, chatOpen]);

  // Admin: poll active conferences every 10s
  useEffect(() => {
    if (!rep || rep.role !== 'admin') return;
    const repIds = REPS.map(r => r.id).join(',');
    const poll = async () => {
      try {
        const r = await fetch(`/api/kv?action=active-confs&repIds=${repIds}`);
        const d = await r.json();
        setActiveConfs(d.confs || {});
      } catch {}
    };
    poll();
    confPollRef.current = setInterval(poll, 10000);
    return () => clearInterval(confPollRef.current);
  }, [rep?.id]);

  async function startMonitor(targetRepId, targetRepName, mode) {
    if (monitorConnRef.current) { monitorConnRef.current.disconnect(); monitorConnRef.current = null; }
    if (!twilioDeviceRef.current) { notify('Twilio SDK not ready', 'warning'); return; }
    try {
      const conn = await twilioDeviceRef.current.connect({
        params: { To: 'monitor', targetRepId, mode, adminRepId: rep.id, repId: rep.id },
      });
      monitorConnRef.current = conn;
      setMonitoring({ repId: targetRepId, repName: targetRepName, mode });
      conn.on('disconnect', () => { monitorConnRef.current = null; setMonitoring(null); });
      conn.on('error', () => { monitorConnRef.current = null; setMonitoring(null); });
    } catch(e) { notify(`Monitor failed: ${e.message}`, 'warning'); }
  }

  function stopMonitor() {
    if (monitorConnRef.current) { monitorConnRef.current.disconnect(); monitorConnRef.current = null; }
    setMonitoring(null);
  }

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  // Contacts — stored in KV so all reps share the same pool
  async function loadContacts(pool) {
    setContactsLoading(true);
    try {
      const r = await fetch(`/api/kv?action=contacts&pool=${pool}`);
      const d = await r.json();
      // Deduplicate by phone on load (guards against double-upload)
      const seen = new Set();
      const deduped = (d.contacts || []).filter(c => {
        const key = c.phone || c.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Shuffle unclaimed new leads so same-household contacts aren't adjacent
      const newLeads = deduped.filter(c => c.status === 'new' && !c.claimedBy);
      const rest     = deduped.filter(c => !(c.status === 'new' && !c.claimedBy));
      setContacts([...shuffleLeads(newLeads), ...rest]);
    } catch { setContacts([]); }
    setContactsLoading(false);
  }

  async function saveContacts(pool, updated) {
    try {
      const r = await fetch(`/api/kv?action=contacts-save&pool=${pool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updated }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify(`Failed to save contacts: ${d.error || r.status}`, 'warning');
      }
    } catch(e) { notify(`Failed to save contacts: ${e.message}`, 'warning'); }
  }

  async function loadListAssignments(pool) {
    try {
      const r = await fetch(`/api/kv?action=list-assignments&pool=${pool}`);
      const d = await r.json();
      setListAssignments(d.assignments || {});
    } catch {}
  }

  async function saveListAssignments(pool, assignments) {
    try {
      await fetch(`/api/kv?action=list-assignments-save&pool=${pool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
    } catch(e) { notify(`Failed to save list assignment: ${e.message}`, 'warning'); }
  }

  async function updateContactKV(pool, id, updates) {
    try {
      await fetch(`/api/kv?action=contact-update&pool=${pool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
    } catch {}
  }

  useEffect(() => {
    if (!rep) return;
    loadContacts(contactType);
    loadListAssignments(contactType);
    setActiveContact(null);
    setStatusFilter('new');
    setActiveScriptId(DEFAULT_SCRIPT[contactType]);
  }, [contactType, rep]);

  // Poll KV every 5 seconds to sync lead claims across all reps
  useEffect(() => {
    if (!rep) return;
    syncRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/kv?action=contacts&pool=${contactType}`);
        const d = await r.json();
        if (d.contacts) setContacts(prev => {
          const fresh = Object.fromEntries(d.contacts.map(c => [c.id, c]));
          // Update existing contacts in-place, preserving shuffled order
          const updated = prev.map(c => fresh[c.id] ? { ...c, ...fresh[c.id] } : c);
          // Append genuinely new contacts (e.g. just uploaded by admin), shuffled
          const existingIds = new Set(prev.map(c => c.id));
          const brandNew = d.contacts.filter(c => !existingIds.has(c.id) && c.status === 'new');
          return brandNew.length ? [...updated, ...shuffleLeads(brandNew)] : updated;
        });
      } catch {}
    }, 5000);
    return () => clearInterval(syncRef.current);
  }, [rep, contactType]);

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

  // Fetch accumulated dial-time (minutes) for all reps across the current range
  async function loadDialTimes() {
    if (!rep || rep.role !== 'admin') return;
    try {
      const now = new Date();
      const dates = [];
      if (dashRange === 'today') {
        dates.push(now.toISOString().slice(0, 10));
      } else if (dashRange === 'week') {
        const d = new Date(now); d.setDate(now.getDate() - now.getDay());
        while (d <= now) { dates.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
      } else if (dashRange === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        while (d <= now) { dates.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
      } else if (dashRange === 'custom' && dashFrom) {
        const d = new Date(dashFrom + 'T00:00:00');
        const end = dashTo ? new Date(dashTo + 'T23:59:59') : now;
        while (d <= end) { dates.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
      }
      if (!dates.length) return;
      const repIds = REPS.map(r => r.id);
      const res = await fetch('/api/kv?action=dial-times', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ repIds, dates }) });
      const data = await res.json();
      setDialTimes(data.totals || {});
    } catch {}
  }

  useEffect(() => { if (rep) { loadLogs(); loadDialTimes(); } }, [rep]);
  useEffect(() => { loadDialTimes(); }, [dashRange, dashFrom, dashTo]);
  useEffect(() => { if (rep && tab === 'admin') loadNumberAssignments(); }, [rep, tab]);

  // Fetch recordings for all callSids in the lifecycle modal when it opens
  useEffect(() => {
    if (!lifecycleContact) return;
    const sids = lifecycleContact.history.map(e => e.callSid).filter(Boolean);
    if (sids.length === 0) return;
    setLifecycleRecordings(prev => {
      const next = { ...prev };
      sids.forEach(sid => { if (!next[sid]) next[sid] = 'loading'; });
      return next;
    });
    fetch('/api/recordings?action=fetch-list', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSids: sids }),
    }).then(r => r.json()).then(d => {
      setLifecycleRecordings(prev => {
        const next = { ...prev };
        sids.forEach(sid => { next[sid] = d.map?.[sid] || null; });
        return next;
      });
    }).catch(() => {
      setLifecycleRecordings(prev => {
        const next = { ...prev };
        sids.forEach(sid => { if (next[sid] === 'loading') next[sid] = null; });
        return next;
      });
    });
  }, [lifecycleContact]);

  async function runOutcomeMigration() {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const r = await fetch('/api/kv?action=migrate-outcomes', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ repIds: REPS.map(r => r.id) }),
      });
      const d = await r.json();
      setMigrateResult(d.ok ? `Done — ${d.fixed} call record${d.fixed===1?'':'s'} updated.` : `Error: ${d.error}`);
      if (d.ok) { loadContacts(contactType); await loadAllLog(); }
    } catch(e) { setMigrateResult(`Error: ${e.message}`); }
    setMigrating(false);
  }

  async function loadNumberAssignments() {
    try {
      const r = await fetch('/api/twilio?action=phone-assignments');
      const d = await r.json();
      setNumberAssignments(d.assignments || {});
    } catch {}
  }

  async function saveNumberAssignment(repId, phoneNumber) {
    setNumberPoolSaving(true);
    try {
      const next = { ...numberAssignments };
      // Remove this number from any rep currently holding it
      Object.keys(next).forEach(id => { if (next[id] === phoneNumber) delete next[id]; });
      if (repId) next[repId] = phoneNumber; else delete next[repId];
      await fetch('/api/twilio?action=phone-assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: next }),
      });
      setNumberAssignments(next);
      notify('Number assignment saved', 'success');
    } catch { notify('Failed to save assignment', 'warning'); }
    setNumberPoolSaving(false);
  }

  useEffect(() => {
    if (!rep) return;
    fetch(`/api/token?repId=${rep.id}`)
      .then(r => r.json())
      .then(({ token }) => {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            navigator.mediaDevices.enumerateDevices()
              .then(devices => setAudioDevices(devices.filter(d => d.kind === 'audioinput')));
            const setup = () => {
              const device = new Twilio.Device(token, { logLevel: 1 });
              twilioDeviceRef.current = device;
              device.on('error', (err) => { setSdkReady(false); setSdkError(err.message || 'Device error'); });
              device.on('registered', () => { setSdkReady(true); setSdkError(''); });
              device.register();
              setTimeout(() => {
                try { if (device.state === 'registered') { setSdkReady(true); setSdkError(''); } } catch(e) {}
              }, 5000);
            };
            if (typeof Twilio !== 'undefined') {
              setup();
            } else {
              const s = document.createElement('script');
              s.src = 'https://unpkg.com/@twilio/voice-sdk@2/dist/twilio.min.js';
              s.onload = setup;
              document.head.appendChild(s);
            }
          })
          .catch(() => setMicBlocked(true));
      })
      .catch(() => {});
  }, [rep]);

  function handleDeviceChange(deviceId) {
    setSelectedDeviceId(deviceId);
    if (twilioDeviceRef.current?.audio) {
      twilioDeviceRef.current.audio.setInputDevice(deviceId);
    }
  }

  const notify = useCallback((msg, type='info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Contacts filtered
  // not-interested is treated identically to DNC — permanently suppressed, never re-dialed (TCPA)
  const DEAD_STATUSES = ['dnc', 'not-interested', 'disconnected', 'wrong-number'];
  // Statuses eligible for recycling after all new leads are exhausted
  const RECYCLE_STATUSES = ['voicemail', 'no-answer', 'called', 'gatekeeper'];

  // Build a set of phone numbers that have been dialed in the last 24h by anyone in the system.
  // This blocks duplicates by phone number regardless of contact ID or which outbound number called.
  const calledPhones24h = new Set(
    contacts
      .filter(c => c.lastCalledAt && (Date.now() - new Date(c.lastCalledAt).getTime()) < 86400000)
      .map(c => c.phone).filter(Boolean)
  );

  // Returns the best available lead: NEW contacts first, recycled (voicemail/no-answer/called)
  // only after all new contacts are exhausted. Never returns dead or claimed-by-others contacts.
  function nextAvailableLead(excludeId) {
    const ok = c =>
      c.id !== excludeId &&
      (!c.claimedBy || c.claimedBy === rep?.id) &&
      !DEAD_STATUSES.includes(c.status) &&
      (!c.lastCalledAt || (Date.now() - new Date(c.lastCalledAt).getTime()) > 86400000) &&
      (!c.phone || !calledPhones24h.has(c.phone));
    return (
      contacts.find(c => c.status === 'new' && ok(c)) ||
      contacts.find(c => RECYCLE_STATUSES.includes(c.status) && ok(c)) ||
      null
    );
  }

  // True when there are zero new leads left (so next pick will be a recycled contact)
  const hasNewLeads = contacts.some(c =>
    c.status === 'new' &&
    (!c.claimedBy || c.claimedBy === rep?.id) &&
    (!c.lastCalledAt || (Date.now() - new Date(c.lastCalledAt).getTime()) > 86400000) &&
    (!c.phone || !calledPhones24h.has(c.phone))
  );


  const allFiltered = contacts.filter(c => {
    const ms = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.business_name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search);
    const mf = statusFilter === 'all' || c.status === statusFilter;
    // Hide contacts claimed by other reps (show own + unclaimed)
    const mc = !c.claimedBy || c.claimedBy === rep?.id;
    // DNC / not-interested / disconnected / wrong-number are permanently excluded unless explicitly filtered
    const notDead = !DEAD_STATUSES.includes(c.status) || statusFilter === c.status;
    // Block if this contact's own lastCalledAt is within 24h
    const notCalledToday = !c.lastCalledAt
      || ['callback','booked'].includes(c.status)
      || statusFilter === c.status
      || (Date.now() - new Date(c.lastCalledAt).getTime()) > 86400000;
    // Also block by phone number — catches duplicates with same phone but different IDs
    const phoneNotCalledToday = !c.phone || !calledPhones24h.has(c.phone)
      || ['callback','booked'].includes(c.status)
      || statusFilter === c.status;
    // List assignment: reps only see contacts from their assigned lists (or unassigned lists)
    const assignedTo = c.list_name ? listAssignments[c.list_name] : null;
    const listOk = rep?.role === 'admin' || !assignedTo || assignedTo === rep?.id;
    return ms && mf && mc && notDead && notCalledToday && phoneNotCalledToday && listOk;
  });

  function selectContact(c) {
    setActiveContact(c);
    setNotes(c.notes || '');
    setSmsBody(SMS_TEMPLATES[contactType](c.name || ''));
    setDialPhone(c.phone || '');
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

  async function startCall(overrideContact) {
    // Use overrideContact if passed (auto-dial passes it directly to avoid stale state)
    const contact = overrideContact !== undefined ? overrideContact : activeContact;
    // When auto-dial passes overrideContact, use contact.phone directly —
    // dialPhone is stale React state and would dial the PREVIOUS person.
    // For manual dials, dialPhone takes priority (user may have typed a custom number).
    const phone = overrideContact !== undefined
      ? (contact?.phone || dialPhone.trim())
      : (dialPhone.trim() || contact?.phone);
    if (!phone) return notify('Enter a phone number to dial', 'warning');
    const name = contact?.name || phone;
    if (contact) {
      const now = new Date().toISOString();
      // Stamp lastCalledAt immediately on dial — not just at disposition.
      // This removes the lead from everyone's queue within seconds (next KV sync),
      // even if the call drops before a disposition is set.
      updateContact(contact.id, { claimedBy: rep.id, lastCalledAt: now });
      updateContactKV(contactType, contact.id, { claimedBy: rep.id, lastCalledAt: now });
    }
    setNotification(null); // clear any previous notification immediately
    setCallState('dialing');
    setCallSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCallSeconds(s => s+1), 1000);
    try {
      if (aiCallMode) {
        const r = await fetch('/api/twilio?action=call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone,
            contactName: name,
            contactBusiness: contact?.business_name || '',
            contactType,
            repId: rep.id,
            repName: rep.name,
            script: SCRIPTS[contactType].name,
            aiMode: true,
          })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setCallSid(data.callSid);
        setCallState('connected');
        notify(`Dialing ${name}...`);
        startPoll(data.callSid);
      } else {
        if (!sdkReady) throw new Error('Phone not ready — wait for the READY badge before dialing.');
        const call = await twilioDeviceRef.current.connect({ params: {
          To: phone,
          contactName: name,
          repId: rep.id,
          contactType,
          script: SCRIPTS[contactType].name,
        }});
        twilioConnRef.current = call;
        call.on('disconnect', () => { clearInterval(timerRef.current); setCallState('ended'); twilioConnRef.current = null; });
        call.on('error', (err) => { clearInterval(timerRef.current); setCallState('idle'); if (contact) { updateContact(contact.id, { claimedBy: null }); updateContactKV(contactType, contact.id, { claimedBy: null }); } twilioConnRef.current = null; notify(`Call failed: ${err.message}`, 'warning'); });
        setCallState('connected');
        notify(`Dialing ${name}...`);
      }
    } catch(err) {
      setCallState('idle');
      clearInterval(timerRef.current);
      if (contact) {
        updateContact(contact.id, { claimedBy: null });
        updateContactKV(contactType, contact.id, { claimedBy: null });
      }
      notify(`Call failed: ${err.message}`, 'warning');
    }
  }

  function endCall() {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    if (twilioConnRef.current) { twilioConnRef.current.disconnect(); twilioConnRef.current = null; }
    setCallState('ended');
  }

  async function setDisposition(outcome, callbackAt) {
    if (!activeContact) return;
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    if (twilioConnRef.current) { twilioConnRef.current.disconnect(); twilioConnRef.current = null; }
    setCallState('idle');
    const statusMap = { answered:'called', voicemail:'voicemail', callback:'callback', booked:'booked', 'not-interested':'not-interested', disconnected:'disconnected', dnc:'dnc', 'no-answer':'no-answer', 'wrong-number':'wrong-number', gatekeeper:'gatekeeper' };
    const contactUpdates = { status: statusMap[outcome] || 'called', notes, claimedBy: null, lastCalledAt: new Date().toISOString(), ...(callbackAt ? { callbackAt } : {}) };
    updateContact(activeContact.id, contactUpdates);
    updateContactKV(contactType, activeContact.id, contactUpdates);
    // Save to KV
    const record = {
      repId: rep.id, repName: rep.name,
      contactName: activeContact.name, contactBusiness: activeContact.business_name,
      contactPhone: activeContact.phone, contactType,
      outcome, duration: callSeconds, script: SCRIPTS[contactType].name, notes,
      timestamp: new Date().toISOString(), callSid: callSid || null,
      ...(callbackAt ? { callbackAt } : {}),
    };
    try { await fetch('/api/kv?action=save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(record) }); } catch {}
    setMyLog(prev => [record, ...prev]);
    // Schedule the callback via the callbacks API and notify admin
    if (outcome === 'callback' && callbackAt) {
      try {
        await fetch('/api/callbacks?action=schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: activeContact.id,
            contactName: activeContact.name,
            contactPhone: activeContact.phone,
            contactType,
            callbackAt: new Date(callbackAt).toISOString(),
            repId: rep.id,
            repName: rep.name,
            notes,
            script: SCRIPTS[contactType].find(s => s.id === activeScriptId)?.name || SCRIPTS[contactType][0]?.name,
          }),
        });
        notify(`Callback scheduled for ${new Date(callbackAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`, 'success');
      } catch { /* best-effort */ }
    }
    if (outcome === 'booked') {
      notify(`Booked! Auto-sending SMS to ${activeContact.name || activeContact.phone}`, 'success');
      try {
        await fetch('/api/twilio?action=sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: activeContact.phone, body: SMS_TEMPLATES[contactType](activeContact.name||'') }) });
      } catch {}
    }
    setCallSeconds(0);
    setNotes('');
    setActiveContact(null);

    if (autoDial) {
      const next = nextAvailableLead(activeContact.id);
      if (next) {
        if (next.status !== 'new') notify('All new leads dialed — recycling previously called contacts', 'info');
        let secs = 3;
        setAutoDialCountdown(secs);
        countdownRef.current = setInterval(() => {
          secs--;
          if (secs <= 0) {
            clearInterval(countdownRef.current);
            setAutoDialCountdown(null);
            selectContact(next);
            setTimeout(() => startCall(next), 100);
          } else {
            setAutoDialCountdown(secs);
          }
        }, 1000);
      } else {
        notify('All leads dialed — no contacts available to queue', 'warning');
      }
    }
  }

  function openLifecycle(phone, name) {
    const contact = contacts.find(c => c.phone === phone) || { phone, name, status: 'unknown', notes: '' };
    const history = [...(allLog || []), ...(myLog || [])]
      .filter(e => e.contactPhone === phone)
      .filter((e, i, arr) => arr.findIndex(x => x.timestamp === e.timestamp) === i) // dedupe
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setLifecycleContact({ contact: { ...contact }, history });
  }


  function cancelAutoDial() {
    clearInterval(countdownRef.current);
    setAutoDialCountdown(null);
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
      const nameIdx = headers.findIndex(h => h === 'name' || (h.includes('name') && !h.includes('business') && !h.includes('company') && !h.includes('first') && !h.includes('last')));
      const firstNameIdx = headers.findIndex(h => h === 'firstname' || h === 'first_name' || h === 'first name');
      const lastNameIdx = headers.findIndex(h => h === 'lastname' || h === 'last_name' || h === 'last name');
      const bizIdx = headers.findIndex(h => h.includes('business') || h.includes('company') || h.includes('facility'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('cell'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const cityIdx = headers.findIndex(h => h.includes('city'));
      const addressIdx = headers.findIndex(h => h.includes('address'));
      const stateIdx = headers.findIndex(h => h === 'state' || h === 'st');
      const zipIdx = headers.findIndex(h => h.includes('zip') || h.includes('postal'));
      const ageIdx = headers.findIndex(h => h === 'age');
      const incomeIdx = headers.findIndex(h => h.includes('income'));
      const networthIdx = headers.findIndex(h => h.includes('networth') || h.includes('net_worth') || h.includes('net worth'));
      const newOnes = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g,''));
        if (!cols[phoneIdx] && !cols[emailIdx]) continue;
        let name = '';
        if (firstNameIdx >= 0 || lastNameIdx >= 0) {
          name = [firstNameIdx>=0?cols[firstNameIdx]:'', lastNameIdx>=0?cols[lastNameIdx]:''].filter(Boolean).join(' ');
        } else if (nameIdx >= 0) {
          name = cols[nameIdx] || '';
        }
        newOnes.push({
          id: `${Date.now()}-${i}`,
          name,
          business_name: bizIdx>=0?cols[bizIdx]:'',
          phone: phoneIdx>=0?cols[phoneIdx]:'',
          email: emailIdx>=0?cols[emailIdx]:'',
          city: cityIdx>=0?cols[cityIdx]:'',
          address: addressIdx>=0?cols[addressIdx]:'',
          state: stateIdx>=0?cols[stateIdx]:'',
          zip: zipIdx>=0?cols[zipIdx]:'',
          age: ageIdx>=0?cols[ageIdx]:'',
          income: incomeIdx>=0?cols[incomeIdx]:'',
          networth: networthIdx>=0?cols[networthIdx]:'',
          status:'new', notes:'', list_name: file.name.replace('.csv','')
        });
      }
      setContacts(prev => {
        const combined = [...prev, ...newOnes];
        // Deduplicate by phone number
        const seen = new Set();
        const updated = combined.filter(c => {
          const key = c.phone || c.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        saveContacts(contactType, updated);
        return updated;
      });
      notify(`Imported ${newOnes.length} contacts to ${contactType.toUpperCase()} pool`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function addContact() {
    if (!newContact.name && !newContact.phone) { notify('Need name or phone', 'warning'); return; }
    setContacts(prev => {
      const updated = [...prev, { ...newContact, id: `manual-${Date.now()}`, status:'new', notes:'' }];
      saveContacts(contactType, updated);
      return updated;
    });
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

  // Date range filter
  const today = new Date().toDateString();
  function inDashRange(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    const now = new Date();
    if (dashRange === 'today') return d.toDateString() === now.toDateString();
    if (dashRange === 'week') {
      const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0);
      return d >= s;
    }
    if (dashRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (dashRange === 'custom') {
      if (dashFrom && d < new Date(dashFrom + 'T00:00:00')) return false;
      if (dashTo   && d > new Date(dashTo   + 'T23:59:59')) return false;
      return true;
    }
    return true;
  }
  const myTodayLog = myLog.filter(e => inDashRange(e.timestamp));
  const myTotal = myTodayLog.length;
  const myBooked = myTodayLog.filter(c => c.outcome === 'booked').length;
  const myAnswered = myTodayLog.filter(c => ['answered','booked','callback','not-interested','dnc'].includes(c.outcome)).length;
  const myRate = myTotal > 0 ? Math.round(myAnswered/myTotal*100) : 0;

  const script = SCRIPTS[contactType].find(s => s.id === activeScriptId) || SCRIPTS[contactType][0];
  const isAdmin = rep?.role === 'admin';
  const activeSkin = SKINS[skinKey] ?? SKINS.CARECIRCLE;
  const fullCss = BASE_CSS + buildSkinCss(activeSkin);
  const chatUnread = chatMessages.filter(m => m.ts > chatLastRead && m.fromId !== rep?.id && (m.to === 'all' || m.to === rep?.id || (isAdmin && m.to === 'admin'))).length;

  if (!rep) return <><style>{fullCss}</style><LoginScreen onLogin={handleLogin} activeSkin={activeSkin} /></>;

  return (
    <>
      <Head>
        <title>CareCircle — Remote Care Center</title>
        <link rel="icon" href={FAVICON} />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{fullCss}</style>
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
        <div style={{display:'flex',alignItems:'center',gap:10,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>
          <span>Rep: <span style={{color:'var(--gl)'}}>{rep.name}</span>{isAdmin&&<span style={{color:'var(--teal)',marginLeft:5}}>[ADMIN]</span>}</span>
          <span style={{color:'var(--green)'}}>{clock}</span>
          {/* Skin picker */}
          <div style={{position:'relative'}}>
            <button onClick={() => setShowSkinPicker(v => !v)} title="Change theme"
              style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:12,cursor:'pointer',border:`1px solid ${showSkinPicker?'var(--green)':'var(--border2)'}`,background:showSkinPicker?'rgba(74,155,74,0.12)':'transparent',color:'var(--text)',borderRadius:2}}>
              {activeSkin.icon}
            </button>
          </div>
          {/* Chat */}
          <button onClick={() => { const next = !chatOpen; setChatOpen(next); if (next) markChatRead(); }}
            style={{position:'relative',padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:9,cursor:'pointer',border:`1px solid ${chatOpen?'var(--teal)':chatUnread>0?'var(--orange)':'var(--border2)'}`,background:chatOpen?'rgba(61,139,122,0.12)':chatUnread>0?'rgba(200,122,42,0.1)':'transparent',color:chatOpen?'var(--teal)':chatUnread>0?'var(--orange)':'var(--dim)',borderRadius:2,letterSpacing:0.5}}>
            💬{chatUnread > 0 && <span style={{marginLeft:4,background:'var(--orange)',color:'white',borderRadius:8,padding:'0 4px',fontSize:7,fontWeight:700}}>{chatUnread}</span>}
          </button>
          {monitoring && (
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 9px',border:'1px solid var(--teal)',background:'rgba(61,139,122,0.12)',borderRadius:2,fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--teal)',letterSpacing:0.5}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--teal)',animation:'pulse 1.5s infinite',display:'inline-block'}}></span>
              {monitoring.mode === 'whisper' ? '🎤' : '👂'} {monitoring.repName.split(' ')[0]}
              <button onClick={stopMonitor} style={{marginLeft:2,padding:'1px 5px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--teal)',background:'transparent',color:'var(--teal)',borderRadius:1}}>✕</button>
            </div>
          )}
          <button onClick={handleLogout} style={{padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>SIGN OUT</button>
        </div>
      </div>

      {/* INFO BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,padding:'5px 20px',background:'rgba(180,140,60,0.07)',borderBottom:'1px solid rgba(180,140,60,0.18)',flexWrap:'wrap'}}>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--gl)',letterSpacing:0.5}}>carecircle.fit</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>·</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text)',letterSpacing:0.5}}>850-341-4324</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>·</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--text)',letterSpacing:0.5}}>Care@CareCircle.Fit</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>·</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:0.5}}>Billing questions → <span style={{color:'var(--text)'}}>Billing@CareCircle.Fit</span></span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>·</span>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:0.5}}>Assisting Seniors: <span style={{color:'var(--text)'}}>850-602-5161</span></span>
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
          <button onClick={() => { setAutoDial(v => !v); cancelAutoDial(); }} style={{padding:'4px 9px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,cursor:'pointer',border:`1px solid ${autoDial?'var(--teal)':'var(--border2)'}`,background:autoDial?'rgba(61,139,122,0.12)':'transparent',color:autoDial?'var(--teal)':'var(--dim)',borderRadius:2}}>
            {autoDial?'⚡ AUTO ON':'⚡ AUTO'}
          </button>
        </div>
      </div>

      {/* ── DIALER TAB ── */}
      {tab === 'dialer' && (
        <div style={{display:'grid',gridTemplateColumns:'285px 1fr 245px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* LEFT: CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {isAdmin ? (
              // ── ADMIN: full scrollable list ──────────────────────────────
              <>
                <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',gap:6}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${contactType==='b2b'?'providers':'families'}...`}
                    style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {['new','all','called','callback','booked','voicemail','no-answer','not-interested','gatekeeper','disconnected','wrong-number','dnc'].map(f => (
                      <button key={f} onClick={() => setStatusFilter(f)} style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,letterSpacing:0.5,cursor:'pointer',border:`1px solid ${statusFilter===f?'var(--green)':'var(--border2)'}`,background:statusFilter===f?'rgba(74,155,74,0.12)':'transparent',color:statusFilter===f?'var(--green)':'var(--dim)',borderRadius:2,textTransform:'uppercase'}}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{allFiltered.length} contacts · {contactType==='b2b'?'Providers':'Families'}</div>
                </div>
                <div style={{flex:1,overflowY:'auto'}}>
                  {allFiltered.length === 0 ? (
                    <div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)',lineHeight:2}}>{contactsLoading ? 'Loading contacts...' : 'No contacts.'}<br/>{!contactsLoading && 'Upload CSV in Admin tab.'}</div>
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
              </>
            ) : (
              // ── REP: bucket counts + next lead + follow-up queue ─────────
              <>
                {/* Search */}
                <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or number..."
                    style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
                </div>

                {/* Search results (only when searching) */}
                {search && (
                  <div style={{flex:1,overflowY:'auto',borderBottom:'1px solid var(--border)'}}>
                    {allFiltered.length === 0
                      ? <div style={{padding:16,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>No results</div>
                      : allFiltered.map(c => (
                        <div key={c.id} onClick={() => selectContact(c)} style={{padding:'10px 13px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeContact?.id===c.id?'var(--surface2)':'transparent',borderLeft:activeContact?.id===c.id?'2px solid var(--green)':'2px solid transparent'}}>
                          <div style={{fontSize:12,fontWeight:500}}>{c.name||c.phone}</div>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:1}}>{c.phone} · <span style={{color:statusColor[c.status]||'var(--dim)'}}>{c.status}</span></div>
                        </div>
                      ))
                    }
                  </div>
                )}

                {!search && (
                  <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:0}}>
                    {/* Bucket counts */}
                    <div style={{padding:'12px 12px 8px',borderBottom:'1px solid var(--border)'}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Lead Queue</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                        {[
                          ['New', contacts.filter(c => c.status==='new' && !c.claimedBy && (!c.lastCalledAt || Date.now()-new Date(c.lastCalledAt)>86400000)).length, 'var(--green)'],
                          ['Callback', contacts.filter(c => c.status==='callback' && c.claimedBy === rep?.id).length, 'var(--orange)'],
                          ['Booked', contacts.filter(c => c.status==='booked' && c.claimedBy === rep?.id).length, 'var(--gl)'],
                          ['Voicemail', contacts.filter(c => c.status==='voicemail' && (!c.lastCalledAt || Date.now()-new Date(c.lastCalledAt)>86400000)).length, 'var(--blue)'],
                        ].map(([label, count, color]) => (
                          <div key={label} style={{padding:'8px 10px',background:'var(--surface2)',border:`1px solid ${color}22`,borderRadius:3,textAlign:'center'}}>
                            <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color}}>{count}</div>
                            <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginTop:2,textTransform:'uppercase',letterSpacing:1}}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Lead button */}
                    <div style={{padding:'12px'}}>
                      <button onClick={() => {
                        const next = nextAvailableLead();
                        if (!next) { notify('All leads dialed — no contacts available', 'warning'); return; }
                        selectContact(next);
                        if (next.status !== 'new') notify('All new leads dialed — recycling previously called contacts', 'info');
                      }} style={{width:'100%',padding:'11px',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid var(--green)',background:'rgba(74,155,74,0.1)',color:'var(--gl)',borderRadius:3,letterSpacing:0.5}}>
                        → Next Lead
                      </button>
                    </div>

                    {/* Follow-up queue: only this rep's callback/booked contacts */}
                    {contacts.filter(c => ['callback','booked'].includes(c.status) && c.claimedBy === rep?.id).length > 0 && (
                      <div style={{borderTop:'1px solid var(--border)'}}>
                        <div style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase'}}>My Follow-ups</div>
                        {contacts.filter(c => ['callback','booked'].includes(c.status) && c.claimedBy === rep?.id).map(c => (
                          <div key={c.id} onClick={() => selectContact(c)} style={{padding:'10px 13px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeContact?.id===c.id?'var(--surface2)':'transparent',borderLeft:activeContact?.id===c.id?`2px solid ${statusColor[c.status]}`:'2px solid transparent'}}>
                            <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||c.phone}</div>
                            <div style={{display:'flex',gap:6,marginTop:2,alignItems:'center'}}>
                              <span style={{fontFamily:'DM Mono,monospace',fontSize:7,color:statusColor[c.status],textTransform:'uppercase'}}>{c.status}</span>
                              {c.notes && <span style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.notes.slice(0,30)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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
                    {activeContact.city&&<div style={{fontSize:10,color:'var(--dim)'}}>{[activeContact.city, activeContact.state, activeContact.zip].filter(Boolean).join(', ')}</div>}
                    {activeContact.address&&<div style={{fontSize:10,color:'var(--dim)'}}>{activeContact.address}</div>}
                    {contactType==='b2c'&&(activeContact.age||activeContact.income||activeContact.networth)&&(
                      <div style={{display:'flex',gap:10,marginTop:4,flexWrap:'wrap'}}>
                        {activeContact.age&&<span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',background:'var(--surface2)',padding:'2px 6px',borderRadius:2}}>AGE {activeContact.age}</span>}
                        {activeContact.income&&<span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',background:'var(--surface2)',padding:'2px 6px',borderRadius:2}}>INC ${Number(activeContact.income).toLocaleString()}</span>}
                        {activeContact.networth&&<span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',background:'var(--surface2)',padding:'2px 6px',borderRadius:2}}>NW ${Number(activeContact.networth).toLocaleString()}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>← Select a contact to begin</div>
              )}
              {activeContact && rep?.id === 'chase' && (
                <button
                  onClick={async () => {
                    if (!confirm(`Delete ${activeContact.name || activeContact.phone} permanently?`)) return;
                    await fetch(`/api/kv?action=contact-delete&pool=${contactType}`, {
                      method: 'POST', headers: {'Content-Type':'application/json'},
                      body: JSON.stringify({ id: activeContact.id })
                    });
                    setContacts(prev => prev.filter(c => c.id !== activeContact.id));
                    setActiveContact(null);
                  }}
                  style={{marginTop:10,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--red)',background:'transparent',border:'1px solid rgba(220,50,50,0.3)',borderRadius:3,padding:'3px 10px',cursor:'pointer',letterSpacing:'0.05em'}}
                >DELETE LEAD</button>
              )}
            </div>

            {/* Call controls */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
              <input value={dialPhone} onChange={e => setDialPhone(e.target.value)} placeholder="Enter number to dial directly  (+1...)"
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:13,padding:'8px 10px',outline:'none',borderRadius:3,marginBottom:10,letterSpacing:1}} />
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:callStateColor[callState],animation:callState==='connected'?'pulse 1.5s infinite':'none'}}></div>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:11,letterSpacing:2,color:callStateColor[callState]}}>{callStateText[callState]}</span>
                {callState!=='idle'&&<span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--mid)',marginLeft:'auto'}}>{fmtTime(callSeconds)}</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                {callState==='idle'&&<button onClick={startCall} style={{padding:'10px 20px',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>📞 Dial</button>}
                {!micBlocked && sdkReady && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1.5,color:'var(--gl)',padding:'3px 7px',border:'1px solid rgba(107,191,107,0.35)',borderRadius:2,background:'rgba(107,191,107,0.08)'}}>● READY</span>}
                {!micBlocked && !sdkReady && !sdkError && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,color:'var(--dim)',padding:'3px 7px',border:'1px solid var(--border2)',borderRadius:2}}>◌ CONNECTING...</span>}
                {sdkError && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,color:'var(--orange)',padding:'3px 7px',border:'1px solid rgba(200,122,42,0.35)',borderRadius:2,background:'rgba(200,122,42,0.08)'}} title={sdkError}>⚠ SDK ERROR</span>}
                {micBlocked && <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,color:'var(--red)',padding:'3px 7px',border:'1px solid rgba(196,68,68,0.35)',borderRadius:2,background:'rgba(196,68,68,0.08)'}}>⚠ MIC BLOCKED</span>}
                {['dialing','connected'].includes(callState)&&(
                  <>
                    <button onClick={endCall} style={{padding:'10px 20px',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,background:'var(--red)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>🔴 End</button>
                    <button onClick={() => setDisposition('voicemail')} style={{padding:'10px 12px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Drop VM</button>
                  </>
                )}
                <button onClick={() => activeContact?setSmsModal(true):notify('Select a contact','warning')} style={{padding:'10px 12px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>💬 SMS</button>
              </div>
              {micBlocked && <div style={{marginTop:8,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--red)',lineHeight:1.6}}>Click the camera icon in your browser address bar to allow microphone access</div>}
              {sdkError && <div style={{marginTop:8,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--orange)',lineHeight:1.6}}>{sdkError}</div>}
              {sdkReady && audioDevices.length > 0 && (
                <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',flexShrink:0}}>Mic:</span>
                  <select value={selectedDeviceId} onChange={e => handleDeviceChange(e.target.value)}
                    style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:11,padding:'4px 7px',outline:'none',borderRadius:3,cursor:'pointer'}}>
                    {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0,6)}`}</option>)}
                  </select>
                </div>
              )}
              {autoDialCountdown !== null && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12,padding:'10px 14px',background:'rgba(61,139,122,0.1)',border:'1px solid var(--teal)',borderRadius:3}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--teal)'}}>⚡ Auto-dialing next lead in {autoDialCountdown}s...</span>
                  <button onClick={cancelAutoDial} style={{padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--teal)',background:'transparent',color:'var(--teal)',borderRadius:2,letterSpacing:0.5}}>CANCEL</button>
                </div>
              )}
              {['connected','ended'].includes(callState)&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  {[['booked','★ Booked','var(--gl)'],['callback','↩ Callback','var(--orange)'],['answered','✓ Spoke','var(--green)'],['voicemail','📬 Left VM','var(--blue)'],['no-answer','🔇 No Answer','var(--dim)'],['not-interested','✕ Not Int.','var(--red)'],...(contactType==='b2b'?[['gatekeeper','🚪 Gatekeeper','var(--orange)']]:[]),['wrong-number','🔀 Wrong #','var(--dim)'],['disconnected','✂ Disconn.','var(--dim)'],['dnc','🚫 DNC','var(--red)']].map(([outcome,label,color]) => (
                    <button key={outcome} onClick={() => {
                        if (outcome === 'callback') {
                          // Default to tomorrow at 10am local time
                          const d = new Date(); d.setDate(d.getDate()+1); d.setHours(10,0,0,0);
                          const pad = n => String(n).padStart(2,'0');
                          setCallbackTime(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T10:00`);
                          setCallbackModal(true);
                        } else {
                          setDisposition(outcome);
                        }
                      }} style={{padding:'8px 4px',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,cursor:'pointer',border:`1px solid ${color}44`,background:`${color}12`,color,borderRadius:3,textAlign:'center'}}>
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

            {/* Script selector */}
            <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',flexShrink:0}}>Script:</div>
              <select value={activeScriptId} onChange={e=>setActiveScriptId(e.target.value)}
                style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'5px 8px',outline:'none',borderRadius:3,cursor:'pointer'}}>
                {SCRIPTS[contactType].map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Script */}
            <div style={{flex:1,padding:'12px 20px'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:script.color,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>
                {script.name}
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
            {[['Calls Made',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Booked',myBooked,'var(--teal)']].map(([label,val,color]) => (
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
              const c = {answered:'var(--green)',voicemail:'var(--blue)',callback:'var(--orange)',booked:'var(--gl)','not-interested':'var(--red)',disconnected:'var(--dim)',dnc:'var(--red)','no-answer':'var(--dim)','wrong-number':'var(--dim)',gatekeeper:'var(--orange)'}[entry.outcome]||'var(--dim)';
              return (
                <div key={i} style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div onClick={() => entry.contactPhone && openLifecycle(entry.contactPhone, entry.contactName)} style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',cursor:entry.contactPhone?'pointer':'default',textDecoration:entry.contactPhone?'underline':'none',textDecorationStyle:'dotted',textUnderlineOffset:3}}>{entry.contactName||'Unknown'}</div>
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
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)'}}>{rep.name}'s Dashboard</div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              {['today','week','month','custom'].map(r => (
                <button key={r} onClick={() => setDashRange(r)}
                  style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.5,cursor:'pointer',borderRadius:2,border:`1px solid ${dashRange===r?'var(--teal)':'var(--border2)'}`,background:dashRange===r?'rgba(61,139,122,0.15)':'transparent',color:dashRange===r?'var(--teal)':'var(--dim)',textTransform:'uppercase'}}>
                  {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Custom'}
                </button>
              ))}
              {dashRange === 'custom' && (
                <>
                  <input type="date" value={dashFrom} onChange={e => setDashFrom(e.target.value)}
                    style={{padding:'3px 6px',fontFamily:'DM Mono,monospace',fontSize:10,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:2,outline:'none'}} />
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>→</span>
                  <input type="date" value={dashTo} onChange={e => setDashTo(e.target.value)}
                    style={{padding:'3px 6px',fontFamily:'DM Mono,monospace',fontSize:10,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:2,outline:'none'}} />
                </>
              )}
            </div>
          </div>

          {/* ── LIVE TEAM (admin only) ── */}
          {isAdmin && (() => {
            const TALK_OUTCOMES = new Set(['answered','callback','booked','voicemail','interested']);
            const todayStats = {};
            allLog.forEach(e => {
              if (!e.repId || !inDashRange(e.timestamp)) return;
              if (!todayStats[e.repId]) todayStats[e.repId] = { calls:0, dialDuration:0, talkDuration:0, booked:0 };
              todayStats[e.repId].calls++;
              todayStats[e.repId].dialDuration += (e.duration || 0);
              if (TALK_OUTCOMES.has(e.outcome)) todayStats[e.repId].talkDuration += (e.duration || 0);
              if (e.outcome === 'booked') todayStats[e.repId].booked++;
            });
            return (
              <div style={{marginBottom:28}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--teal)'}}>Live Team</div>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{onlineReps.length} online · updates every 30s</span>
                </div>
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                      {['Rep','Status',dashRange==='today'?'Calls Today':'Calls','Talk Time','Dial Time','Booked','Monitor'].map(h => (
                        <th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {REPS.map(r => {
                        const isOnline = onlineReps.some(o => o.repId === r.id);
                        const s = todayStats[r.id] || { calls:0, dialDuration:0, talkDuration:0, booked:0 };
                        const conf = activeConfs[r.id];
                        const isBeingMonitored = monitoring?.repId === r.id;
                        return (
                          <tr key={r.id} style={{borderBottom:'1px solid var(--border)',background:isBeingMonitored?'rgba(61,139,122,0.06)':'transparent'}}>
                            <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'var(--text)'}}>{r.name}</td>
                            <td style={{padding:'9px 14px'}}>
                              <span style={{display:'inline-flex',alignItems:'center',gap:5,fontFamily:'DM Mono,monospace',fontSize:8,color:isOnline?'var(--gl)':'var(--dim)'}}>
                                <span style={{width:6,height:6,borderRadius:'50%',background:isOnline?'var(--green)':'var(--border2)',display:'inline-block',animation:isOnline?'pulse 2s infinite':'none'}}></span>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </td>
                            <td style={{padding:'9px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:s.calls>0?'var(--text)':'var(--dim)'}}>{s.calls}</td>
                            <td style={{padding:'9px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:s.talkDuration>0?'var(--text)':'var(--dim)'}}>{fmtTime(s.talkDuration)}</td>
                            <td style={{padding:'9px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:s.dialDuration>0?'var(--text)':'var(--dim)'}}>{s.dialDuration>0?fmtTime(s.dialDuration):'—'}</td>
                            <td style={{padding:'9px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:s.booked>0?'var(--gl)':'var(--dim)',fontWeight:s.booked>0?600:400}}>
                              {s.booked > 0
                                ? <span style={{cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}} onClick={() => {
                                    const entries = allLog.filter(e => e.repId === r.id && e.outcome === 'booked' && inDashRange(e.timestamp));
                                    setInterestedModal({ repName: r.name, entries });
                                  }}>{s.booked}</span>
                                : s.booked}
                            </td>
                            <td style={{padding:'9px 14px'}}>
                              {conf ? (
                                isBeingMonitored ? (
                                  <button onClick={stopMonitor} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--red)',background:'rgba(196,68,68,0.12)',color:'var(--red)',borderRadius:2,letterSpacing:0.5}}>■ STOP</button>
                                ) : (
                                  <div style={{display:'flex',gap:5}}>
                                    <button onClick={() => startMonitor(r.id, r.name, 'listen')} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--blue)',background:'rgba(58,122,170,0.12)',color:'var(--blue)',borderRadius:2,letterSpacing:0.5}}>👂 LISTEN</button>
                                    <button onClick={() => startMonitor(r.id, r.name, 'whisper')} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--teal)',background:'rgba(61,139,122,0.12)',color:'var(--teal)',borderRadius:2,letterSpacing:0.5}}>🎤 WHISPER</button>
                                  </div>
                                )
                              ) : (
                                <span style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--border2)'}}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
            {[['Total Calls',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Booked',myBooked,'var(--teal)']].map(([label,val,color]) => (
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:18}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:34,fontWeight:700,color,lineHeight:1,marginBottom:5}}>{val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Admin: all reps */}
          {isAdmin && (() => {
            const filtered = allLog.filter(e => inDashRange(e.timestamp) && (dashRepFilter === 'all' || e.repId === dashRepFilter));
            return (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--teal)'}}>All Reps Activity <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)',fontWeight:400}}>({filtered.length} records)</span></div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <select value={dashRepFilter} onChange={e => setDashRepFilter(e.target.value)}
                    style={{padding:'4px 8px',fontFamily:'DM Mono,monospace',fontSize:9,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:2,outline:'none',cursor:'pointer'}}>
                    <option value="all">All Reps</option>
                    {REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button onClick={loadLogs} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>{loadingLog?'Loading...':'↺ Refresh'}</button>
                  <button onClick={() => exportCSV([['Rep','Contact','Business','Phone','Type','Outcome','Duration','Script','Notes','Time'],...filtered.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.contactType,c.outcome,c.duration,c.script,c.notes,c.timestamp])],`calls-${dashRange}.csv`)}
                    style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>EXPORT</button>
                </div>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Rep','Contact','Type','Outcome','Dur.','Time','Notes'].map(h => <th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0,300).map((entry,i) => {
                      const c = {answered:'var(--green)',voicemail:'var(--blue)',callback:'var(--orange)',booked:'var(--gl)','not-interested':'var(--red)',disconnected:'var(--dim)',dnc:'var(--red)','no-answer':'var(--dim)','wrong-number':'var(--dim)',gatekeeper:'var(--orange)'}[entry.outcome]||'var(--dim)';
                      const isExpanded = expandedLog === i;
                      return (
                        <>
                          <tr key={i} style={{borderBottom:'1px solid var(--border)',cursor:entry.notes?'pointer':'default'}} onClick={() => setExpandedLog(isExpanded?null:i)}>
                            <td style={{padding:'8px 14px',fontSize:12,color:'var(--teal)',fontWeight:500}}>{entry.repName}</td>
                            <td style={{padding:'8px 14px',fontSize:11,color:'var(--text)'}}>
                              {entry.contactPhone ? (
                                <span onClick={e => { e.stopPropagation(); openLifecycle(entry.contactPhone, entry.contactName); }} style={{cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}}>{entry.contactName||entry.contactPhone}</span>
                              ) : (entry.contactName||'—')}
                            </td>
                            <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{(entry.contactType||'').toUpperCase()}</td>
                            <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:10,color:c}}>{(entry.outcome||'').toUpperCase()}</td>
                            <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>{fmtTime(entry.duration)}</td>
                            <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{entry.timestamp?new Date(entry.timestamp).toLocaleString():'—'}</td>
                            <td style={{padding:'8px 14px',fontSize:11,color:'var(--dim)',maxWidth:200}}>
                              {entry.notes ? <span style={{color:'var(--mid)',cursor:'pointer'}}>{isExpanded ? '▲ hide' : entry.notes.slice(0,40)+(entry.notes.length>40?'…':'')}</span> : <span style={{opacity:0.3}}>—</span>}
                            </td>
                          </tr>
                          {isExpanded && entry.notes && (
                            <tr key={`${i}-notes`} style={{borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}>
                              <td colSpan={7} style={{padding:'10px 14px',fontSize:12,color:'var(--text)',lineHeight:1.5,fontStyle:'italic'}}>{entry.notes}</td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length===0&&<div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>No calls in this range</div>}
              </div>
            </div>
            );
          })()}
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab==='admin'&&isAdmin&&(
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)',marginBottom:22}}>Admin Panel</div>

          {/* One-time data migrations */}
          {migrateResult === null && (
            <div style={{marginBottom:20,padding:'10px 14px',background:'rgba(200,122,42,0.07)',border:'1px solid rgba(200,122,42,0.25)',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--orange)',letterSpacing:0.5}}>Existing records saved as "interested" need to be updated to "booked"</span>
              <button onClick={runOutcomeMigration} disabled={migrating} style={{padding:'5px 12px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--orange)',background:'rgba(200,122,42,0.12)',color:'var(--orange)',borderRadius:2,letterSpacing:0.5,whiteSpace:'nowrap'}}>
                {migrating ? 'MIGRATING...' : 'FIX NOW'}
              </button>
            </div>
          )}
          {migrateResult && (
            <div style={{marginBottom:20,padding:'10px 14px',background:'rgba(74,155,74,0.07)',border:'1px solid rgba(74,155,74,0.25)',borderRadius:3,fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--green)',letterSpacing:0.5}}>
              ✓ {migrateResult}
            </div>
          )}

          {/* Theme Switcher */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>
              UI Themes — <span style={{color:'var(--gl)'}}>{activeSkin.label}</span>
              {!activeSkin.dark && <span style={{color:'var(--orange)',marginLeft:6}}>[LIGHT MODE]</span>}
            </div>
            <div style={{marginBottom:6,fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase'}}>// DARK</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {Object.entries(SKINS).filter(([,s]) => s.dark).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
                  fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.5,cursor:'pointer',
                  border:`1px solid ${skinKey===key?'var(--green)':s.border2}`,
                  borderRadius:3,
                  background:skinKey===key?'rgba(74,155,74,0.12)':s.surface,
                  color:skinKey===key?'var(--gl)':s.accentL,
                  transition:'all 0.15s',
                }}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                  {skinKey===key && <span style={{color:'var(--gl)'}}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{marginBottom:6,fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase'}}>// LIGHT</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {Object.entries(SKINS).filter(([,s]) => !s.dark).map(([key, s]) => (
                <button key={key} onClick={() => setSkinKey(key)} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
                  fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.5,cursor:'pointer',
                  border:`1px solid ${skinKey===key?s.accent:s.border2}`,
                  borderRadius:3,
                  background:skinKey===key?s.surface3:s.surface2,
                  color:s.accent,
                  transition:'all 0.15s',
                }}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                  {skinKey===key && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

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

          {/* Lists */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>
              Uploaded Lists — <span style={{color:contactType==='b2b'?'var(--green)':'var(--teal)'}}>{contactType.toUpperCase()} Pool</span>
              <span style={{color:'var(--dim)',marginLeft:6}}>(toggle B2B/B2C above to manage the other pool)</span>
            </div>
            {contacts.length === 0 && <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>No contacts in this pool yet.</div>}
            {[...new Set(contacts.map(c => c.list_name).filter(Boolean))].map(listName => {
              const count = contacts.filter(c => c.list_name === listName).length;
              const assignedRepId = listAssignments[listName] || '';
              return (
                <div key={listName} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,marginBottom:6,gap:10,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text)'}}>{listName}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:2}}>{count} contacts</div>
                  </div>
                  <select
                    value={assignedRepId}
                    onChange={e => {
                      const updated = { ...listAssignments, [listName]: e.target.value || null };
                      if (!e.target.value) delete updated[listName];
                      setListAssignments(updated);
                      saveListAssignments(contactType, updated);
                      notify(e.target.value ? `"${listName}" assigned to ${REPS.find(r=>r.id===e.target.value)?.name}` : `"${listName}" unassigned (visible to all reps)`, 'success');
                    }}
                    style={{fontFamily:'DM Mono,monospace',fontSize:8,padding:'4px 6px',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:2,cursor:'pointer'}}
                  >
                    <option value=''>All Reps</option>
                    {REPS.filter(r => r.role === 'rep').map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button onClick={() => {
                    if (!confirm(`Delete "${listName}" and remove all ${count} contacts from the ${contactType.toUpperCase()} pool?`)) return;
                    const updated = contacts.filter(c => c.list_name !== listName);
                    setContacts(updated);
                    saveContacts(contactType, updated);
                    const updatedAssignments = { ...listAssignments };
                    delete updatedAssignments[listName];
                    setListAssignments(updatedAssignments);
                    saveListAssignments(contactType, updatedAssignments);
                    notify(`Deleted list "${listName}" (${count} contacts removed)`, 'success');
                  }} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--red)',background:'transparent',color:'var(--red)',borderRadius:2,letterSpacing:0.5}}>DELETE</button>
                </div>
              );
            })}
            {contacts.filter(c => !c.list_name).length > 0 && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--dim)'}}>Manually added</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:2}}>{contacts.filter(c => !c.list_name).length} contacts</div>
                </div>
                <button onClick={() => {
                  const count = contacts.filter(c => !c.list_name).length;
                  if (!confirm(`Delete all ${count} manually-added contacts from the ${contactType.toUpperCase()} pool?`)) return;
                  const updated = contacts.filter(c => c.list_name);
                  setContacts(updated);
                  saveContacts(contactType, updated);
                  notify(`Deleted ${count} manually-added contacts`, 'success');
                }} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--red)',background:'transparent',color:'var(--red)',borderRadius:2,letterSpacing:0.5}}>DELETE</button>
              </div>
            )}
          </div>

          {/* Contact Management */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <span>Contact Management — <span style={{color:contactType==='b2b'?'var(--green)':'var(--teal)'}}>{contactType.toUpperCase()} Pool</span>
              <span style={{marginLeft:8,color:'var(--dim)',fontWeight:400,letterSpacing:0}}>({contacts.length} total)</span></span>
              <button disabled={reconciling} onClick={async () => {
                if (!confirm(`Reconcile ${contacts.length} ${contactType.toUpperCase()} contacts against the full call log? This will update status and last-called date for any contact whose phone number appears in the log.`)) return;
                setReconciling(true); setReconcileResult(null);
                try {
                  const r = await fetch(`/api/kv?action=reconcile&pool=${contactType}`, { method: 'POST' });
                  const d = await r.json();
                  if (d.ok) {
                    setReconcileResult(`${d.matched} of ${d.total} contacts updated from call log`);
                    loadContacts(contactType);
                  } else { setReconcileResult(`Error: ${d.error}`); }
                } catch(e) { setReconcileResult(`Error: ${e.message}`); }
                setReconciling(false);
              }} style={{padding:'3px 10px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,letterSpacing:0.5,opacity:reconciling?0.5:1}}>
                {reconciling ? 'RECONCILING...' : 'RECONCILE W/ CALL LOG'}
              </button>
            </div>
            {reconcileResult && <div style={{marginBottom:8,padding:'6px 10px',fontFamily:'DM Mono,monospace',fontSize:9,color: reconcileResult.startsWith('Error') ? 'var(--red)' : 'var(--green)',background: reconcileResult.startsWith('Error') ? 'rgba(204,68,68,0.08)' : 'rgba(74,155,74,0.08)',border:`1px solid ${reconcileResult.startsWith('Error') ? 'rgba(204,68,68,0.2)' : 'rgba(74,155,74,0.2)'}`,borderRadius:3}}>{reconcileResult}</div>}
            <input value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Search name, phone, business..."
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3,marginBottom:8}} />
            <div style={{maxHeight:360,overflowY:'auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)'}}>
                  {['Name / Business','Phone','Status','Claimed By','Actions'].map(h => <th key={h} style={{padding:'7px 10px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {contacts.filter(c => {
                    const q = adminSearch.toLowerCase();
                    return !q || (c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.business_name||'').toLowerCase().includes(q);
                  }).slice(0,200).map(c => (
                    <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'6px 10px',fontSize:11,color:'var(--text)',maxWidth:180}}>
                        <div style={{fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name||'—'}</div>
                        {c.business_name&&<div style={{fontSize:9,color:'var(--dim)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.business_name}</div>}
                      </td>
                      <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)',whiteSpace:'nowrap'}}>{c.phone||'—'}</td>
                      <td style={{padding:'6px 10px'}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:7,letterSpacing:0.5,color:statusColor[c.status]||'var(--dim)',padding:'2px 5px',border:`1px solid ${statusColor[c.status]||'var(--dim)'}44`,borderRadius:2}}>{c.status||'new'}</span>
                      </td>
                      <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--teal)'}}>{c.claimedBy ? REPS.find(r=>r.id===c.claimedBy)?.name||c.claimedBy : <span style={{color:'var(--dim)'}}>—</span>}</td>
                      <td style={{padding:'6px 10px'}}>
                        <div style={{display:'flex',gap:5}}>
                          <button onClick={() => setEditingContact({...c})} style={{padding:'3px 7px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,letterSpacing:0.5}}>EDIT</button>
                          <button onClick={() => {
                            if (!confirm(`Delete "${c.name||c.phone}"?`)) return;
                            const updated = contacts.filter(x => x.id !== c.id);
                            setContacts(updated);
                            saveContacts(contactType, updated);
                            notify('Contact deleted', 'success');
                          }} style={{padding:'3px 7px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--red)',background:'transparent',color:'var(--red)',borderRadius:2,letterSpacing:0.5}}>DEL</button>
                          {c.claimedBy && <button onClick={() => {
                            const updated = contacts.map(x => x.id===c.id ? {...x, claimedBy:null} : x);
                            setContacts(updated);
                            saveContacts(contactType, updated);
                            notify('Lead released back to pool', 'success');
                          }} style={{padding:'3px 7px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--orange)',background:'transparent',color:'var(--orange)',borderRadius:2,letterSpacing:0.5}}>RELEASE</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.length === 0 && <div style={{padding:16,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>No contacts in this pool.</div>}
            </div>
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

          {/* Number Pool */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>Number Pool — Outbound Caller ID</span>
              <span style={{fontSize:7,color:'var(--dim)',letterSpacing:0.5,fontWeight:400,textTransform:'none'}}>SMS always uses toll-free · changes save instantly</span>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Number','Label','Assigned To (Outbound Calls)'].map(h => <th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {NUMBER_POOL.map(entry => {
                    const assignedRepId = Object.keys(numberAssignments).find(id => numberAssignments[id] === entry.number) || '';
                    return (
                      <tr key={entry.number} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text)',whiteSpace:'nowrap'}}>{entry.label}</td>
                        <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{entry.friendlyName}</td>
                        <td style={{padding:'8px 14px'}}>
                          <select
                            disabled={numberPoolSaving}
                            value={assignedRepId}
                            onChange={e => saveNumberAssignment(e.target.value, entry.number)}
                            style={{background:'var(--surface2)',border:'1px solid var(--border2)',color: assignedRepId ? 'var(--text)' : 'var(--dim)',fontFamily:'Inter,sans-serif',fontSize:11,padding:'5px 8px',outline:'none',borderRadius:3,cursor:'pointer',minWidth:180}}
                          >
                            <option value="">— Unassigned (uses toll-free) —</option>
                            {REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginTop:7}}>
              Toll-free default: (855) 960-0110 · Unassigned reps dial from toll-free
            </div>
          </div>

          {/* Recordings */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>Call Recordings</span>
              <button onClick={async () => {
                setRecordingsLoading(true);
                try {
                  // Fetch from both sources in parallel: Twilio (complete list) + KV (enriched metadata)
                  const [twilioRes, kvRes] = await Promise.all([
                    fetch('/api/recordings?action=fetch-list', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fetchRecent: 100 }) }),
                    fetch('/api/recordings?action=list&limit=500'),
                  ]);
                  const twilioData = await twilioRes.json();
                  const kvData = await kvRes.json();
                  // Build a lookup map from KV store by callSid
                  const kvMap = {};
                  for (const rec of (kvData.recordings || [])) { if (rec.callSid) kvMap[rec.callSid] = rec; }
                  // Merge: Twilio list is source of truth for recordingSid/url; KV fills in metadata
                  const merged = (twilioData.list || []).map(rec => {
                    const meta = kvMap[rec.callSid] || {};
                    return { ...rec, ...meta, recordingSid: rec.recordingSid, recordingUrl: rec.recordingUrl, dateCreated: rec.dateCreated, duration: meta.duration || rec.duration };
                  });
                  setRecordings(merged);
                } catch { notify('Failed to load recordings', 'warning'); }
                setRecordingsLoading(false);
              }} style={{padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,letterSpacing:0.5}}>
                {recordingsLoading ? 'LOADING...' : '↺ LOAD'}
              </button>
            </div>
            {recordings.length === 0 && !recordingsLoading && (
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>Click LOAD to fetch the last 50 recordings from Twilio.</div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {recordings.map((rec, i) => (
                <div key={rec.callSid || rec.recordingSid} style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'10px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {rec.contactName && rec.contactName !== 'Unknown' ? rec.contactName : <span style={{color:'var(--dim)'}}>Unknown caller</span>}
                      {rec.contactBusiness ? <span style={{fontSize:10,color:'var(--dim)',fontWeight:400}}> · {rec.contactBusiness}</span> : null}
                    </div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:3,display:'flex',gap:12,flexWrap:'wrap'}}>
                      {rec.repName && <span style={{color:'var(--gl)'}}>{rec.repName}</span>}
                      {rec.outcome && rec.outcome !== 'unknown' && <span style={{color: rec.outcome==='answered'||rec.outcome==='booked' ? 'var(--green)' : 'var(--dim)',textTransform:'uppercase'}}>{rec.outcome}</span>}
                      {rec.duration ? <span>{rec.duration}s</span> : null}
                      {rec.contactPhone && <span>{rec.contactPhone}</span>}
                      <span>{rec.transcribedAt ? new Date(rec.transcribedAt).toLocaleString() : rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '—'}</span>
                    </div>
                    {rec.notes && <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:4,fontStyle:'italic'}}>{rec.notes}</div>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,marginLeft:12}}>
                    {rec.recordingSid && (playingSid === rec.recordingSid ? (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <audio autoPlay controls src={`/api/recordings?action=stream&sid=${rec.recordingSid}`}
                          style={{height:28,width:220}} onEnded={() => setPlayingSid(null)} />
                        <button onClick={() => setPlayingSid(null)} style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>✕ CLOSE</button>
                      </div>
                    ) : (
                      <button onClick={() => setPlayingSid(rec.recordingSid)} style={{padding:'5px 12px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--green)',background:'rgba(74,155,74,0.1)',color:'var(--green)',borderRadius:2,letterSpacing:0.5}}>▶ PLAY</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

      {/* CALLBACK SCHEDULING MODAL */}
      {callbackModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:360,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--orange)',marginBottom:6}}>↩ Schedule Callback</div>
            {activeContact&&<div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginBottom:16}}>{activeContact.name||activeContact.phone}</div>}
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Call back at</div>
              <input type="datetime-local" value={callbackTime} onChange={e=>setCallbackTime(e.target.value)}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:13,padding:'8px 10px',outline:'none',borderRadius:3,cursor:'pointer'}} />
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginBottom:14,lineHeight:1.6}}>
              The call will be placed automatically at the scheduled time. Admin will be notified via SMS now.
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setCallbackModal(false)} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Cancel</button>
              <button onClick={() => { if (!callbackTime) return; setCallbackModal(false); setDisposition('callback', callbackTime); }}
                style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,background:'var(--orange)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>
                Schedule Callback
              </button>
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

      {/* CONTACT LIFECYCLE MODAL */}
      {lifecycleContact&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={() => setLifecycleContact(null)}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,width:'100%',maxWidth:620,maxHeight:'90vh',display:'flex',flexDirection:'column',animation:'slideUp 0.2s ease'}} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'var(--gl)'}}>{lifecycleContact.contact.name||lifecycleContact.contact.phone}</div>
                {lifecycleContact.contact.business_name&&<div style={{fontSize:11,color:'var(--dim)',marginTop:2}}>{lifecycleContact.contact.business_name}</div>}
                <div style={{display:'flex',gap:8,marginTop:6,alignItems:'center'}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{lifecycleContact.contact.phone}</span>
                  {lifecycleContact.contact.status&&<span style={{fontFamily:'DM Mono,monospace',fontSize:7,letterSpacing:0.5,color:statusColor[lifecycleContact.contact.status]||'var(--dim)',padding:'2px 5px',border:`1px solid ${statusColor[lifecycleContact.contact.status]||'var(--dim)'}44`,borderRadius:2}}>{lifecycleContact.contact.status}</span>}
                </div>
              </div>
              <button onClick={() => setLifecycleContact(null)} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>✕ CLOSE</button>
            </div>

            <div style={{overflowY:'auto',flex:1,padding:'18px 22px'}}>

              {/* Edit notes + status */}
              <div style={{marginBottom:20,padding:'14px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:3}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Update Contact</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>Status</div>
                    <select value={lifecycleContact.contact.status||'new'} onChange={e => setLifecycleContact(p => ({...p, contact:{...p.contact, status:e.target.value}}))}
                      style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'6px 8px',outline:'none',borderRadius:3}}>
                      {['new','called','voicemail','no-answer','callback','booked','not-interested','gatekeeper','wrong-number','disconnected','dnc'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>Assigned Rep</div>
                    <select value={lifecycleContact.contact.claimedBy||''} onChange={e => setLifecycleContact(p => ({...p, contact:{...p.contact, claimedBy:e.target.value||null}}))}
                      style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:11,padding:'6px 8px',outline:'none',borderRadius:3}}>
                      <option value=''>— Pool —</option>
                      {REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>Notes</div>
                  <textarea value={lifecycleContact.contact.notes||''} onChange={e => setLifecycleContact(p => ({...p, contact:{...p.contact, notes:e.target.value}}))}
                    placeholder="Add notes about this contact..."
                    style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'8px 10px',outline:'none',borderRadius:3,resize:'vertical',height:70}} />
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
                  <button onClick={async () => {
                    const updated = contacts.map(c => c.phone === lifecycleContact.contact.phone ? {...c, ...lifecycleContact.contact} : c);
                    setContacts(updated);
                    await saveContacts(contactType, updated);
                    if (lifecycleContact.contact.id) updateContactKV(contactType, lifecycleContact.contact.id, { status: lifecycleContact.contact.status, notes: lifecycleContact.contact.notes, claimedBy: lifecycleContact.contact.claimedBy });
                    notify('Contact updated', 'success');
                    setLifecycleContact(null);
                  }} style={{padding:'7px 16px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>Save Changes</button>
                </div>
              </div>

              {/* Call history */}
              <div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Call History ({lifecycleContact.history.length})</div>
                {lifecycleContact.history.length === 0 ? (
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',padding:'12px 0'}}>No calls logged for this contact yet.</div>
                ) : lifecycleContact.history.map((entry, i) => {
                  const c = {answered:'var(--green)',voicemail:'var(--blue)',callback:'var(--orange)',booked:'var(--gl)','not-interested':'var(--red)',disconnected:'var(--dim)',dnc:'var(--red)','no-answer':'var(--dim)','wrong-number':'var(--dim)',gatekeeper:'var(--orange)'}[entry.outcome]||'var(--dim)';
                  return (
                    <div key={i} style={{padding:'10px 12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:3,marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:entry.notes?6:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:c,display:'inline-block',flexShrink:0}}></span>
                          <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:c,fontWeight:600}}>{(entry.outcome||'').toUpperCase()}</span>
                          <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>· {fmtTime(entry.duration)}</span>
                          <span style={{fontSize:10,color:'var(--teal)',fontWeight:500}}>{entry.repName}</span>
                        </div>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{entry.timestamp?new Date(entry.timestamp).toLocaleString():'—'}</span>
                      </div>
                      {entry.notes&&<div style={{fontSize:11,color:'var(--mid)',fontStyle:'italic',paddingLeft:14,marginBottom:6,lineHeight:1.5}}>{entry.notes}</div>}
                      {/* Recording */}
                      {entry.callSid && (() => {
                        const rec = lifecycleRecordings[entry.callSid];
                        if (rec === 'loading') return <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',paddingLeft:14}}>Loading recording...</div>;
                        if (!rec) return null;
                        const streamUrl = `/api/recordings?action=stream&sid=${rec.recordingSid}`;
                        const fullUrl = `https://claw-dialer.vercel.app/api/recordings?action=stream&sid=${rec.recordingSid}`;
                        return (
                          <div style={{paddingLeft:14,marginTop:8}}>
                            <audio controls src={streamUrl} style={{width:'100%',height:32,marginBottom:7,display:'block'}} />
                            <div style={{display:'flex',gap:7}}>
                              <a href={streamUrl} download={`recording-${entry.callSid}.mp3`}
                                style={{padding:'4px 12px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--green)',background:'rgba(74,155,74,0.1)',color:'var(--green)',borderRadius:2,textDecoration:'none',letterSpacing:0.5}}>
                                ↓ DOWNLOAD
                              </a>
                              <button onClick={() => { navigator.clipboard.writeText(fullUrl); notify('Recording link copied', 'success'); }}
                                style={{padding:'4px 12px',fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',border:'1px solid var(--teal)',background:'rgba(61,139,122,0.1)',color:'var(--teal)',borderRadius:2,letterSpacing:0.5}}>
                                🔗 COPY LINK
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERESTED LEADS DRILL-DOWN MODAL */}
      {interestedModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:350,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={() => setInterestedModal(null)}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:540,maxHeight:'80vh',overflowY:'auto',animation:'slideUp 0.2s ease'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)'}}>Booked Leads</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginTop:2}}>{interestedModal.repName} · today</div>
              </div>
              <button onClick={() => setInterestedModal(null)} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:9,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>✕ CLOSE</button>
            </div>
            {interestedModal.entries.length === 0 ? (
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>No booked leads found.</div>
            ) : interestedModal.entries.map((e, i) => (
              <div key={i} style={{marginBottom:14,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:3,padding:'12px 14px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)',cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}} onClick={() => { setInterestedModal(null); openLifecycle(e.contactPhone, e.contactName); }}>{e.contactName || 'Unknown'}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--green)',marginTop:2}}>{e.contactPhone}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginTop:3}}>{fmtTime(e.duration)} · {new Date(e.timestamp).toLocaleTimeString()}{e.notes ? ` · "${e.notes}"` : ''}</div>
                  </div>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--gl)',border:'1px solid rgba(74,155,74,0.3)',borderRadius:2,padding:'2px 6px',flexShrink:0}}>BOOKED</span>
                </div>
                {e.callSid
                  ? <InterestedRecording callSid={e.callSid} />
                  : <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>No recording linked (call predates tracking)</div>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL (admin) */}
      {editingContact&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:440,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:16}}>Edit Contact</div>
            {[['Name','name'],['Business / Facility','business_name'],['Phone','phone'],['Email','email'],['City','city'],['Address','address']].map(([label,key]) => (
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>{label}</div>
                <input value={editingContact[key]||''} onChange={e => setEditingContact(p=>({...p,[key]:e.target.value}))}
                  style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
              </div>
            ))}
            <div style={{marginBottom:10}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>Notes</div>
              <textarea value={editingContact.notes||''} onChange={e => setEditingContact(p=>({...p,notes:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3,resize:'vertical',height:70}} />
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>Assign To (Claimed By)</div>
              <select value={editingContact.claimedBy||''} onChange={e => setEditingContact(p=>({...p,claimedBy:e.target.value||null}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}}>
                <option value=''>— Unassigned (back to pool) —</option>
                {REPS.map(r => <option key={r.id} value={r.id}>{r.name} ({r.role})</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setEditingContact(null)} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',cursor:'pointer',borderRadius:3}}>Cancel</button>
              <button onClick={() => {
                const updated = contacts.map(c => c.id===editingContact.id ? editingContact : c);
                setContacts(updated);
                saveContacts(contactType, updated);
                setEditingContact(null);
                notify('Contact updated', 'success');
              }} style={{padding:'8px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',cursor:'pointer',borderRadius:3}}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* SKIN PICKER DROPDOWN */}
      {showSkinPicker && (
        <>
          <div style={{position:'fixed',inset:0,zIndex:499}} onClick={() => setShowSkinPicker(false)} />
          <div style={{position:'fixed',top:54,right:160,zIndex:500,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:12,width:260,boxShadow:'0 8px 28px rgba(0,0,0,0.5)',animation:'slideUp 0.15s ease'}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>Choose Theme</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {Object.entries(SKINS)
                .filter(([, s]) => isAdmin || s.repAccessible)
                .map(([key, s]) => (
                <button key={key} onClick={() => { setSkinKey(key); setShowSkinPicker(false); }} style={{
                  display:'flex',alignItems:'center',gap:4,padding:'5px 8px',
                  fontFamily:'DM Mono,monospace',fontSize:8,cursor:'pointer',borderRadius:3,
                  border:`1px solid ${skinKey===key?'var(--green)':'rgba(128,128,128,0.3)'}`,
                  background:skinKey===key?'rgba(74,155,74,0.14)':s.dark?s.surface:s.surface2,
                  color:s.accentL, transition:'all 0.1s',
                }}>
                  <span>{s.icon}</span>
                  <span style={{whiteSpace:'nowrap'}}>{s.label}</span>
                  {skinKey===key && <span style={{color:'var(--green)',marginLeft:2}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={{position:'fixed',right:0,top:0,bottom:0,width:320,background:'var(--surface)',borderLeft:'1px solid var(--border2)',zIndex:300,display:'flex',flexDirection:'column',boxShadow:'-4px 0 20px rgba(0,0,0,0.4)'}}>
          {/* header */}
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--gl)',letterSpacing:1}}>MESSAGES</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginTop:2,letterSpacing:0.5}}>{isAdmin ? 'Rep threads → Chase' : 'Your thread with Chase'}</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:9,cursor:'pointer',border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2}}>✕</button>
          </div>
          {/* messages */}
          <div style={{flex:1,overflowY:'auto',padding:'10px 10px 6px',display:'flex',flexDirection:'column',gap:7}}>
            {chatMessages.length === 0 && (
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',textAlign:'center',marginTop:30}}>No messages yet. Say something!</div>
            )}
            {chatMessages
              .filter(m => isAdmin
                ? (chatTo ? (m.fromId === chatTo || m.to === chatTo) : true)
                : (m.fromId === rep.id || m.to === rep.id)
              )
              .map(m => {
                const isMe = m.fromId === rep.id;
                const isUnread = m.ts > chatLastRead && !isMe;
                return (
                  <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start'}}>
                    <div style={{
                      maxWidth:'88%',padding:'8px 10px',borderRadius:4,
                      background:isUnread?'rgba(200,122,42,0.12)':isMe?'var(--surface3)':'var(--surface2)',
                      border:`1px solid ${isUnread?'rgba(200,122,42,0.35)':isMe?'var(--border2)':'var(--border)'}`,
                    }}>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginBottom:4,display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{color:isMe?'var(--gl)':m.fromRole==='admin'?'var(--teal)':'var(--mid)'}}>{isMe ? 'You' : m.fromName}</span>
                        {isMe ? <span>→ {m.toName}</span> : <span>→ Chase</span>}
                        <span>· {new Date(m.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                        {isUnread && <span style={{color:'var(--orange)'}}>NEW</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--text)',lineHeight:1.45,wordBreak:'break-word'}}>{m.text}</div>
                    </div>
                  </div>
                );
              })}
            <div ref={chatBottomRef} />
          </div>
          {/* compose */}
          <div style={{padding:10,borderTop:'1px solid var(--border)',flexShrink:0}}>
            {isAdmin && (
              <select value={chatTo} onChange={e => setChatTo(e.target.value)} style={{width:'100%',marginBottom:7,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:11,padding:'5px 8px',outline:'none',borderRadius:3,cursor:'pointer'}}>
                <option value="">All threads</option>
                {REPS.filter(r => r.id !== rep.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
            <div style={{display:'flex',gap:6}}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={isAdmin ? `Message ${chatTo ? REPS.find(r=>r.id===chatTo)?.name||'' : 'a rep'}...` : 'Message Chase...'}
                style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'Inter,sans-serif',fontSize:12,padding:'7px 10px',outline:'none',borderRadius:3}} />
              <button onClick={sendChat} style={{padding:'7px 11px',fontFamily:'DM Mono,monospace',fontSize:9,cursor:'pointer',border:'1px solid var(--green)',background:'rgba(74,155,74,0.14)',color:'var(--gl)',borderRadius:3,letterSpacing:0.5,whiteSpace:'nowrap'}}>SEND</button>
            </div>
            {!isAdmin && <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:'var(--dim)',marginTop:5,letterSpacing:0.3}}>Messages go to Chase only</div>}
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification&&(
        <div style={{position:'fixed',bottom:22,right:chatOpen?342:22,padding:'11px 16px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--teal)'}`,borderRadius:3,fontFamily:'Inter,sans-serif',fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:300,animation:'slideUp 0.3s ease',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}


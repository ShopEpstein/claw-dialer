import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const REPS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REPS
  ? JSON.parse(process.env.NEXT_PUBLIC_REPS)
  : [
      { id: 'chase',     name: 'Chase Turnquest',        pin: '5325', role: 'admin' },
      { id: 'shawn',     name: 'Shawn Rogers',            pin: '5768', role: 'admin' },
      { id: 'malik',     name: 'Malik McCauley',          pin: '8322', role: 'admin' },
      { id: 'karen',     name: 'Karen Wince',             pin: '6048', role: 'rep'   },
      { id: 'shannon',   name: 'Shannon Joned',           pin: '8921', role: 'rep'   },
      { id: 'christian', name: 'Christian Daniel Loeza',  pin: '7245', role: 'rep'   },
      { id: 'brittany',  name: 'Brittany Lasley',         pin: '3648', role: 'rep'   },
      { id: 'jessica',   name: 'Jessica Blazer',          pin: '5976', role: 'rep'   },
      { id: 'chenice',   name: 'Chenice Griffith-Turney', pin: '5978', role: 'rep'   },
    ];

const SCRIPTS = {
  b2b: [
    {
      id: 'b2b-cold-facility', name: 'Cold Facility / Nursing Home', color: '#4A9B4A',
      sections: [
        { label: 'OPENER', text: "Hi, is this [NAME]? I'm [YOUR NAME] with CareCircle Network in Pensacola. I'll keep this brief — your facility already has a profile on our platform and families in [AREA] are actively researching it. I wanted to make sure the information we're showing them is accurate. Do you have two minutes?" },
        { label: 'HOOK', text: "Great. Pull up carecircle.fit/research and search [FACILITY NAME]. I'll wait. [Let them look. Don't talk while they're searching.] That score pulls from AHCA inspection records, CMS data, Google reviews, and employee satisfaction data. Families are using this to make placement decisions right now." },
        { label: 'THE SHIFT', text: "A Place for Mom is under a Senate investigation — 37.5% of their 'Best of Senior Living' winners had active neglect citations. The March 2026 HHS OIG report confirmed nursing homes are chemically restraining dementia patients to lighten staff workload. Families want a trustworthy alternative. We built it." },
        { label: 'ADVOCACY-WELCOME CLOSE', text: "What does it mean for [FACILITY NAME] to be the facility that says 'we welcome independent family advocates, we have nothing to hide'? That's a line in your admissions materials. No competitor in [AREA] can say it unless they actually do it." },
        { label: 'PRICING', text: "Network Partner: $499 setup + $149/month (or $1,490/year) + $150 per converted referral. Featured Partner: $999 setup + $349/month — includes priority placement and full AI care platform. Both: 60-day guarantee — no qualified referral in 60 days, full refund. APFM charges $3,500–$7,000 per placement. We're 95% less." },
        { label: 'CLOSE', text: "Can I text you the link to your current scanner profile so you can see what families are finding? No commitment — just transparency." },
        { label: 'OBJECTIONS', text: "'We use APFM' → 'You can keep using them. We charge $150/referral vs. $3,500–$7,000. Under Senate investigation. No reason you can't use both.' | 'No budget' → '60-day guarantee removes the risk.' | 'Info already public' → 'Exactly — question is whether families see raw data or your curated profile.'" },
        { label: 'DISPOSITIONS', text: "B2B-CLOSED-NET ($499+$149/mo) · B2B-CLOSED-FEAT ($999+$349/mo) · B2B-CONSULT (3-way with Chase) · B2B-PROFILE-SENT · B2B-CB-TODAY · B2B-VM1 · B2B-NOT-INT · B2B-DNC · B2B-NOT-LIC" },
      ]
    },
    {
      id: 'b2b-cold-agency', name: 'Cold Home Care Agency', color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi [NAME], this is [YOUR NAME] with CareCircle Network in Pensacola. I'll be brief — your agency already has a profile on our platform and we're actively matching families in [AREA] with licensed home care providers. I wanted to make sure we have your information right. Two minutes?" },
        { label: 'PROFILE PULL', text: "Go to carecircle.fit/research and search [AGENCY NAME]. Take a look at what families see when they research you. I'll wait. [The score pulls from your FL license status, Google reviews, BBB, AHCA records, and employee reviews from Indeed.]" },
        { label: 'PITCH', text: "Right now you're one listing among several — as a Network Partner, we actively match families to you based on their care needs and your service area. Our per-referral fee is $150. Not $3,500 like APFM. $150. The Featured tier includes our AI care intelligence platform — real-time care logs, family portal, concern flagging. You can offer this to clients as a value-add." },
        { label: 'PRICING', text: "Network Partner: $149/month + $150 per converted client. Featured Partner: $349/month — flat, no per-referral fee, includes AI care platform. Both include 60-day full refund guarantee." },
        { label: 'CLOSE', text: "Can I text you your current profile link? No commitment — just want you to see what families are finding when they research you." },
        { label: 'OBJECTIONS', text: "'More referrals than we can handle' → 'This is about quality signal. Families via CareCircle are pre-educated, higher-intent.' | 'Don't want per-referral fee' → 'Featured at $349/mo is flat — no per-referral fee.'" },
        { label: 'DISPOSITIONS', text: "B2B-CLOSED-NET · B2B-CLOSED-FEAT · B2B-CONSULT · B2B-PROFILE-SENT · B2B-CB-TODAY · B2B-VM1 · B2B-NOT-INT · B2B-DNC · B2B-NOT-LIC" },
      ]
    },
    {
      id: 'b2b-warm-followup', name: 'Warm Follow-Up', color: '#A78BFA',
      sections: [
        { label: 'OPENER', text: "Hi [NAME], it's [YOUR NAME] from CareCircle Network — following up on our conversation from [DAY]. Did you get a chance to look at the partnership overview I sent?" },
        { label: 'IF READY', text: "Perfect. I can get the partnership agreement to you today. Once signed and setup fee is processed, your profile activates within 24 hours and you start appearing in family matching immediately." },
        { label: 'IF INTERNAL APPROVER', text: "Here's the language that usually makes this easy internally: one referral from us covers your annual Network Partner cost by 10x or more. A single memory care resident at full rate = $50K–$80K annual revenue. The partnership costs $1,490/year. That's the math your approver needs." },
        { label: '3-WAY CALL OFFER', text: "If they want to hear it directly — I'm happy to get on a quick call with both of you. I can do [DAY/TIME]. Does that work? [This almost always moves things forward.]" },
        { label: 'OBJECTIONS', text: "'Not sure on ROI' → '60-day guarantee. If we don't send a qualified referral in 60 days, full refund.' | 'Start free?' → 'Free listings appear after Network/Featured partners. You're visible but not prioritized.'" },
        { label: 'DISPOSITIONS', text: "B2B-CLOSED-NET · B2B-CLOSED-FEAT · B2B-CONSULT · B2B-APPROVER · B2B-CB-TODAY · B2B-VM2 · B2B-NOT-INT" },
      ]
    },
    {
      id: 'b2b-closing', name: 'Closing Call (Ready to Sign)', color: '#F87171',
      sections: [
        { label: 'OPENER', text: "Hi [NAME], it's [YOUR NAME] — I wanted to circle back and confirm where you're at. Last time we talked it sounded like you were leaning toward the [Network / Featured] Partnership. Are you ready to move forward?" },
        { label: 'IF YES — NEXT STEPS', text: "Great. I'm sending you the partnership agreement today — month-to-month, cancel anytime. Once signed, your profile activates within 24 hours and you start appearing in family matching immediately. For Featured Partners, I'll book a 30-min onboarding call." },
        { label: 'SETUP FEE OBJECTION', text: "The setup fee is one-time and fully covered by the 60-day guarantee — if we don't deliver a qualified referral in 60 days, the entire amount comes back. You're not paying for access, you're paying for a result." },
        { label: 'OBJECTIONS', text: "'Month-to-month?' → 'Yes — available at standard monthly rate. Annual saves two months. Most convert to annual after the first referral.' | 'Referrals not immediate?' → '60-day guarantee. We don't keep your money unless we deliver.'" },
        { label: 'DISPOSITIONS', text: "B2B-CLOSED-NET (send agreement + activate profile) · B2B-CLOSED-FEAT (send agreement + book onboarding) · B2B-CONSULT · B2B-CB-TODAY" },
      ]
    },
  ],
  b2c: [
    {
      id: 'b2c-inbound', name: 'Inbound Warm Lead', color: '#6BBF6B',
      sections: [
        { label: 'OPENER', text: "Hi, is this [NAME]? This is [YOUR NAME] calling from CareCircle Network — you reached out through our website about your family's care situation. Did I catch you at an okay time?" },
        { label: 'DISCOVERY', text: "I appreciate you reaching out. Tell me a little about what's going on — who is in the facility and what's been on your mind? [Listen for: facility type, how long they've been there, what triggered the inquiry, local or out-of-state. Do NOT rush to price — let them ask.]" },
        { label: 'PITCH', text: "We enter the facility as your [loved one's] designated essential caregiver — a legal designation that gives us full access. We show up unannounced. We cover overnight visits, weekends, shift changes — the windows families almost never see. Written report within 24 hours of every visit." },
        { label: 'SCIENCE', text: "A 2025 UCLA/NBER study found making inspections unpredictable saves lives equivalent to a 12% increase in inspection frequency at zero added cost. Facilities that can't predict the pattern can't selectively perform for it. That's the foundation of what we do." },
        { label: 'PRICING', text: "Starter: $599 one-time — 4 visits over 7-10 days, all shift windows including at least one overnight, baseline report within 24hrs. Guardian Essential: from $799/month. Guardian: from $1,500/month — 8-10 visits, 2+ overnights. Guardian Elite: from $2,500/month — near-daily presence, Holiday Calendar." },
        { label: 'CLOSE', text: "I just need about ten minutes to get your loved one's information, the facility name, and what you want us to pay specific attention to. We can have the first visit scheduled within 48 hours. Do you have time now?" },
        { label: 'OBJECTIONS', text: "'Need to talk to siblings' → 'You don't need a family vote to gather information. $599 gives your whole family documented proof.' | 'Covered by insurance?' → 'Not by design — CareCircle works for your family, not insurers.' | 'I visit regularly' → 'Staff knows your face. We show up at 2am on a Tuesday. Completely different picture.' | 'Facility objects?' → 'Facilities cannot legally prevent an authorized family advocate. That right is federal law.'" },
        { label: 'DISPOSITIONS', text: "B2C-CLOSED-START ($599) · B2C-CLOSED-GUARD ($799+/mo) · B2C-CONSULT (book Chase) · B2C-CB-TODAY · B2C-VM1 · B2C-AS-REFERRAL · B2C-NOT-INT · B2C-DNC" },
      ]
    },
    {
      id: 'b2c-social', name: 'Social / Facebook Lead', color: '#3D8B7A',
      sections: [
        { label: 'OPENER', text: "Hi [NAME], this is [YOUR NAME] with CareCircle Network — you filled out a form through our Facebook page a little while ago about your family's care situation. Did I catch you at an okay time? [Call within 5 min of submission if possible. Move to their situation — don't make them feel embarrassed if they don't remember the form.]" },
        { label: 'RE-ENGAGE', text: "I just wanted to follow up quickly. Tell me — who is the family member you're concerned about and where are they right now?" },
        { label: 'IF HESITANT', text: "Can I ask — what was it about the post that caught your attention? Was there something specific going on with [loved one's] care? [This surfaces the real concern. Reflect it back and anchor the Starter to solving that specific thing.]" },
        { label: 'PITCH', text: "Most families feel okay about the facility during the day, during visiting hours. The question is what's happening on the night shift. On weekends. On holidays. When no one's expected. That's when 64% of nursing home staff admit some form of neglect occurs. We go in unannounced, overnight, documented within 24 hours." },
        { label: 'PRICING + CLOSE', text: "The Starter is $599 one-time — four visits over seven to ten days, all shift windows including at least one overnight. Most families say they got information they couldn't have gotten any other way. Want me to walk you through what that looks like?" },
        { label: 'OBJECTIONS', text: "'Just curious' → 'That's how most families start. Can I ask — what made you curious?' | 'Don't know what you do' → 'In one sentence: we send trained advocates into care facilities — unannounced, overnight, weekends — and send you a written report within 24 hours. The family pays us. We work for the family.'" },
        { label: 'DISPOSITIONS', text: "B2C-CLOSED-START · B2C-CLOSED-GUARD · B2C-CONSULT · B2C-CB-TODAY · B2C-VM1 · B2C-NOT-INT · B2C-DNC" },
      ]
    },
    {
      id: 'b2c-cold', name: 'Cold Outbound Family', color: '#C87A2A',
      sections: [
        { label: 'OPENER', text: "Hi, is this [NAME]? My name is [YOUR NAME] — I'm calling from CareCircle Network in Pensacola. I'll be quick — we provide independent oversight for families with loved ones in nursing homes and care facilities here in Northwest Florida. Do you have about 60 seconds? [If no: 'No problem at all — when would be a better time?' Do NOT push. Goal on cold: earn 60 seconds, surface a concern, plant the seed. Do NOT try to close same-call.]" },
        { label: 'IF YES', text: "The reason I'm calling is that a lot of families here are in a situation where their loved one is in a facility and they visit when they can — but there's a whole part of the week they never see. We put trained advocates into facilities unannounced — overnight, on weekends — and give families a written report within 24 hours." },
        { label: 'QUALIFY', text: "'Is that something that's ever crossed your mind?' [If YES → go to discovery. If NO → 'Does your loved one have someone who visits regularly, or more sporadic?' Regular: 'great, but you're still not seeing overnight or holiday staffing.' Sporadic: 'that's exactly the gap we fill.']" },
        { label: 'SEED PLANT CLOSE', text: "I'm not going to push you today — but can I text you one resource? We have a free provider research tool at carecircle.fit/research that shows AHCA inspection records, CMS data, complaint history for every facility in Northwest Florida. Free, no account required. Would it be okay if I texted you that link?" },
        { label: 'OBJECTIONS', text: "'How did you get my number?' → Be honest about your source. Offer to remove. | 'Not interested' → 'Completely fine. Do you have a loved one in a facility right now? Let me leave you with carecircle.fit/research — AHCA records for every NW Florida facility. Free, no account.'" },
        { label: 'DISPOSITIONS', text: "B2C-CONSULT · B2C-CB-TODAY · B2C-VM1 · B2C-VM2 · B2C-NOT-INT · B2C-DNC · B2C-BAD-NUM" },
      ]
    },
    {
      id: 'b2c-assisting-seniors', name: 'Assisting Seniors Referral', color: '#60A5FA',
      sections: [
        { label: 'OPENER', text: "Hi [NAME], this is [YOUR NAME] — I'm calling on behalf of Assisting Seniors and CareCircle Network. You were referred to us and I wanted to reach out personally. How are things going right now with your family's care situation?" },
        { label: 'QUALIFY FIRST', text: "CRITICAL: Listen before pitching. Are they talking about finding in-home care (Assisting Seniors track) or about a loved one already in a facility with concerns (CareCircle Present track)? DO NOT pitch Guardian Plans to Medicaid-qualified patients. DO NOT conflate both services on one call." },
        { label: 'ASSISTING SENIORS TRACK', text: "You're in exactly the right place. Assisting Seniors has been serving Gulf Coast families for 17 years — 5-star Google rating, zero state enforcement actions. I'm going to connect you directly with their team to make sure you get the right match. Is [TIME] good for that call?" },
        { label: 'CARECIRCLE PRESENT TRACK', text: "Tell me more about the facility situation. How long have they been there and what's been on your mind? [From here → go to Inbound Warm Lead script. The opener is already done.]" },
        { label: 'HANDOFF LINE', text: "Assisting Seniors is our founding partner — 17 years in this market, 5-star Google rating, zero state enforcement actions. Their number is [AS NUMBER]. I'll send them your information right now so they're ready for you." },
        { label: 'DISPOSITIONS', text: "B2C-AS-REFERRAL (log in AS system) · B2C-CONSULT · B2C-CLOSED-START · B2C-CB-TODAY · B2C-NOT-INT" },
      ]
    },
  ]
};

const SCRIPT_SMS = {
  'b2b-cold-facility':     (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — here's your facility's scanner profile: carecircle.fit/research — Network Partner $499 setup+$149/mo, 60-day refund guarantee. 850-341-4324. Reply STOP to opt out.`,
  'b2b-cold-agency':       (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — your agency profile is live & families in your area are comparing providers now. $149/mo, $150/converted client, 60-day guarantee. carecircle.fit/research Reply STOP.`,
  'b2b-warm-followup':     (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — following up on our partnership conversation. One referral covers annual cost 10x+. Happy to do a 3-way call. 850-341-4324. Reply STOP to opt out.`,
  'b2b-closing':           (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — sending partnership agreement now. Month-to-month, cancel anytime, 60-day refund guarantee. Questions: 850-341-4324. Reply STOP to opt out.`,
  'b2c-inbound':           (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — Starter: 4 unannounced visits all shift windows incl. overnight, written report within 24hrs. $599 one-time. carecircle.fit 850-341-4324. Reply STOP.`,
  'b2c-social':            (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — we go in unannounced overnight & weekends as your loved one's authorized advocate. Report in 24hrs. Starter $599. carecircle.fit Reply STOP.`,
  'b2c-cold':              (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — free facility research: AHCA records, CMS data, complaint history for any NW Florida facility. carecircle.fit/research No account needed. Reply STOP.`,
  'b2c-assisting-seniors': (n) => `CareCircle: Hi${n?' '+n.split(' ')[0]:''} — following up on your referral. Happy to connect you with the right team. 850-341-4324 · carecircle.fit Reply STOP to opt out.`,
};

const SMS_FALLBACK = {
  b2b: (n) => `CareCircle Network: Hi${n?' '+n.split(' ')[0]:''} — your facility's scanner profile and partner options: carecircle.fit/research — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
  b2c: (n) => `CareCircle Network: Hi${n?' '+n.split(' ')[0]:''} — information on our family advocacy service: carecircle.fit — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`,
};

const EMAIL_TEMPLATES = {
  'b2b-facility': {
    label: 'B2B — Facility Follow-Up',
    subject: (n,b) => `Your CareCircle profile + partnership overview${b?' — '+b:''}`,
    body: (n,b,rep) => `Hi ${n||'there'},

Good speaking with you. A few things I mentioned:

Your profile: carecircle.fit/research — search ${b||'your facility'} to see exactly what families see.

Partnership tiers:
• Network Partner: $499 setup + $149/mo. $150 per converted referral. 60-day full refund guarantee.
• Featured Partner: $999 setup + $349/mo. Priority placement, AI care intelligence platform, curated profile.

The 60-day guarantee: if we don't send you at least one qualified referral in your first 60 days, full refund. No conditions.

The advocacy-welcome angle: In a post-HHS-OIG-report market, being the facility that openly welcomes independent oversight is a meaningful admissions differentiator. We can help you communicate that in your admissions materials.

If you want to move faster, call or text me at 850-341-4324.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'b2b-agency': {
    label: 'B2B — Agency Follow-Up',
    subject: (n,b) => `${b||'Your agency'} profile + CareCircle partnership overview`,
    body: (n,b,rep) => `Hi ${n||'there'},

Thanks for taking a look today. Here's what I want you to have in writing:

Your profile is live at carecircle.fit/research. Families are using it to compare agencies in your area right now.

Partnership tiers:
• Network Partner: $149/mo + $150 per converted client
• Featured Partner: $349/mo — flat, no per-referral fee, includes AI care intelligence platform for client families

The AI platform gives your clients: real-time care logs, family portal for out-of-state family members, concern flagging, ongoing match quality monitoring — a value-add you can promote in your own admissions conversations.

Both tiers: 60-day full refund guarantee.

Questions: 850-341-4324.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'b2b-approver': {
    label: 'B2B — Internal Approver ROI Case',
    subject: (n,b) => `The ROI case for CareCircle Network Partnership${b?' — '+b:''}`,
    body: (n,b,rep) => `Hi ${n||'there'},

Here's the clean version for your approver:

The math: One converted client covers the annual Network Partner cost ($1,490) by 10x or more in first-year revenue. Featured Partner ($3,490/yr) covers itself with less than one month of one resident's revenue.

The risk protection: Both tiers include a 60-day full refund guarantee. No qualified referral in 60 days = full refund.

The market angle: HHS OIG released reports in March 2026 confirming widespread chemical restraint in nursing homes. Families are more skeptical than at any time in recent memory. Being a CareCircle Network Partner is a public signal that your facility welcomes transparency. That matters in admissions conversations right now.

I'm happy to join a call with you and your approver to answer questions directly.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'b2c-inbound': {
    label: 'B2C — After Inbound Call',
    subject: (n) => `What we talked about — next step for your family`,
    body: (n,b,rep) => `Hi ${n||'there'},

Thank you for taking the time to talk today. I want to make sure you have everything in one place.

What CareCircle Present does: we enter the facility as your loved one's designated essential caregiver — unannounced, overnight, on weekends — and send you a written report within 24 hours of every visit. Documented proof of exactly what's happening when no one expects us.

The Starter is the right first step: 4 visits over 7–10 days across all shift windows, including at least one overnight. Cost: $599 one-time.

To get started, I just need 10 minutes on a call with you. Reply to this email or call/text me at 850-341-4324.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'b2c-social': {
    label: 'B2C — After Social Lead Call',
    subject: (n) => `Real eyes inside the facility — here's how it works`,
    body: (n,b,rep) => `Hi ${n||'there'},

Good talking with you. Here's a quick summary of what CareCircle Present does and how families get started.

The short version: we enter care facilities as your loved one's authorized advocate — unannounced, on nights and weekends — and send you a written report within 24 hours. Real information, not a form letter.

The Starter is 4 visits over 7–10 days, $599 one-time. It's the right first step for any family that wants to know what's actually happening.

You can research your loved one's facility for free at carecircle.fit/research — we cross-reference AHCA, CMS, Google, and more.

Ready to talk: 850-341-4324 or reply here.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'b2c-cold': {
    label: 'B2C — After Cold Outbound',
    subject: (n) => `Free facility research — CareCircle Network`,
    body: (n,b,rep) => `Hi ${n||'there'},

This is ${rep} from CareCircle Network in Pensacola — I left you a voicemail earlier.

One resource I mentioned: carecircle.fit/research shows AHCA inspection records, CMS data, Google reviews, and complaint history for every facility in Northwest Florida. Free, no account required.

What we do: we send trained advocates into care facilities — unannounced, overnight, on weekends — as your loved one's authorized advocate. Written report within 24 hours. The Starter is $599 one-time.

No pressure. If you ever have a concern about a facility, I'm at 850-341-4324.

— ${rep}
CareCircle Network · carecircle.fit · 850-341-4324`,
  },
  'custom': { label: 'Custom Message', subject: () => '', body: () => '' },
};

function fmtTime(s) { return `${Math.floor((s||0)/60).toString().padStart(2,'0')}:${((s||0)%60).toString().padStart(2,'0')}` }
function fmtDate(ts) { try { return new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}); } catch { return ts||''; } }
function sGet(k,d) { try { const v=sessionStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } }
function sSet(k,v) { try { sessionStorage.setItem(k,JSON.stringify(v)); } catch {} }
function lGet(k,d) { try { return JSON.parse(localStorage.getItem(k))??d; } catch { return d; } }
function lSet(k,v) { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} }

const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#1A3D1A"/><text x="5" y="22" font-size="14" font-family="serif" fill="#4CAF50" font-weight="bold">CC</text></svg>')}`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#0F1A0F;color:#E8F0E8;font-family:'Inter',sans-serif;overflow:hidden}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2D5A2D}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  :root{--bg:#0F1A0F;--surface:#141F14;--surface2:#192419;--surface3:#1F2E1F;--border:#243324;--border2:#2D422D;--green:#4A9B4A;--gl:#6BBF6B;--gd:#2D6A2D;--teal:#3D8B7A;--text:#E8F0E8;--dim:#7A9A7A;--mid:#A8C4A8;--red:#C44444;--orange:#C87A2A;--blue:#3A7AAA;--yellow:#A8A030;}
  input,textarea,select{background:var(--surface2);border:1px solid var(--border2);color:var(--text);border-radius:3px;outline:none;font-family:'Inter',sans-serif;font-size:12px}
  input:focus,textarea:focus{border-color:var(--gl)}
`;

const statusColor = { new:'var(--green)',called:'var(--dim)',voicemail:'var(--blue)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)',partner:'var(--teal)' };
const callStateColor = { idle:'var(--dim)',dialing:'var(--yellow)',connected:'var(--gl)',ended:'var(--orange)' };
const callStateText  = { idle:'STANDBY',dialing:'DIALING...',connected:'CONNECTED',ended:'CALL ENDED' };

function LoginScreen({ onLogin }) {
  const [name,setName]=useState(''); const [pin,setPin]=useState(''); const [error,setError]=useState('');
  function handleLogin(e) {
    e.preventDefault();
    const rep=REPS.find(r=>r.name.toLowerCase()===name.trim().toLowerCase()&&r.pin===pin.trim());
    if(!rep){setError('Name or PIN not recognized. Contact your manager.');return;}
    onLogin(rep);
  }
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',animation:'fadeIn 0.3s ease'}}>
      <div style={{width:380,padding:48,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,animation:'slideUp 0.3s ease'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:'var(--gl)'}}>CareCircle</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:3,textTransform:'uppercase',marginTop:6}}>Remote Care Center</div>
          <div style={{width:36,height:1,background:'var(--border2)',margin:'14px auto 0'}}></div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:7}}>Your Full Name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="First Last" style={{width:'100%',fontSize:14,padding:'10px 12px'}} autoFocus/>
          </div>
          <div style={{marginBottom:22}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:7}}>PIN</div>
            <input value={pin} onChange={e=>setPin(e.target.value)} placeholder="••••" type="password" maxLength={6} style={{width:'100%',fontFamily:'DM Mono,monospace',fontSize:20,padding:'10px 12px',letterSpacing:6}}/>
          </div>
          {error&&<div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--red)',marginBottom:14,padding:'8px 10px',background:'rgba(196,68,68,0.08)',border:'1px solid rgba(196,68,68,0.2)',borderRadius:3}}>{error}</div>}
          <button type="submit" style={{width:'100%',padding:'12px',background:'var(--green)',color:'white',border:'none',borderRadius:3,fontSize:14,fontWeight:600,cursor:'pointer'}}>Sign In</button>
        </form>
        <div style={{textAlign:'center',marginTop:22,fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>carecircle.fit · 850-341-4324</div>
      </div>
    </div>
  );
}

export default function CareCircleDialer() {
  const [rep,setRep]=useState(null);
  const [contactType,setContactType]=useState('b2b');
  const [contacts,setContacts]=useState(()=>lGet('cc_contacts_b2b',[]));
  const [activeContact,setActiveContact]=useState(null);
  const [tab,setTab]=useState('dialer');
  const [scriptId,setScriptId]=useState('b2b-cold-facility');
  const [statusFilter,setStatusFilter]=useState('new');
  const [search,setSearch]=useState('');
  const [callState,setCallState]=useState('idle');
  const [callSeconds,setCallSeconds]=useState(0);
  const [callSid,setCallSid]=useState(null);
  const [notes,setNotes]=useState('');
  const [aiCallMode,setAiCallMode]=useState(false);
  const [notification,setNotification]=useState(null);
  const [clock,setClock]=useState('');
  const [showAddModal,setShowAddModal]=useState(false);
  const [newContact,setNewContact]=useState({name:'',business_name:'',phone:'',email:''});
  const [myLog,setMyLog]=useState([]);
  const [allLog,setAllLog]=useState([]);
  const [loadingLog,setLoadingLog]=useState(false);
  const [smsModal,setSmsModal]=useState(false);
  const [smsTo,setSmsTo]=useState('');
  const [smsBody,setSmsBody]=useState('');
  const [inboxMessages,setInboxMessages]=useState([]);
  const [inboxLoading,setInboxLoading]=useState(false);
  const [sentSms,setSentSms]=useState(()=>lGet('cc_sent_sms',[]));
  const [inboxTab,setInboxTab]=useState('inbox');
  const [emailModal,setEmailModal]=useState(false);
  const [emailTo,setEmailTo]=useState('');
  const [emailName,setEmailName]=useState('');
  const [emailBiz,setEmailBiz]=useState('');
  const [emailSubject,setEmailSubject]=useState('');
  const [emailBody,setEmailBody]=useState('');
  const [emailTemplate,setEmailTemplate]=useState('custom');
  const [sentEmails,setSentEmails]=useState(()=>lGet('cc_sent_emails',[]));
  const [emailSending,setEmailSending]=useState(false);

  const timerRef=useRef(null); const pollRef=useRef(null);

  useEffect(()=>{const saved=sGet('cc_rep',null);if(saved)setRep(saved);},[]);
  function handleLogin(r){sSet('cc_rep',r);setRep(r);}
  function handleLogout(){sessionStorage.clear();setRep(null);setMyLog([]);setAllLog([]);}

  useEffect(()=>{const t=setInterval(()=>setClock(new Date().toLocaleTimeString('en-US',{hour12:false})),1000);return()=>clearInterval(t);},[]);

  const contactKey=`cc_contacts_${contactType}`;
  useEffect(()=>{setContacts(lGet(contactKey,[]));setActiveContact(null);setStatusFilter('new');setScriptId(contactType==='b2b'?'b2b-cold-facility':'b2c-inbound');},[contactType]);
  useEffect(()=>{lSet(contactKey,contacts);},[contacts]);
  useEffect(()=>{lSet('cc_sent_sms',sentSms);},[sentSms]);
  useEffect(()=>{lSet('cc_sent_emails',sentEmails);},[sentEmails]);

  async function loadLogs(){
    if(!rep)return; setLoadingLog(true);
    try{const r=await fetch(`/api/kv?action=rep&repId=${rep.id}`);const d=await r.json();setMyLog(d.calls||[]);if(rep.role==='admin'){const r2=await fetch('/api/kv?action=all');const d2=await r2.json();setAllLog(d2.calls||[]);}}catch(e){}
    setLoadingLog(false);
  }
  useEffect(()=>{if(rep)loadLogs();},[rep]);

  async function loadInbox(){
    setInboxLoading(true);
    try{const r=await fetch('/api/twilio?action=inbox');const d=await r.json();setInboxMessages(d.messages||[]);}catch(e){}
    setInboxLoading(false);
  }
  useEffect(()=>{if(tab==='inbox')loadInbox();},[tab]);

  const notify=useCallback((msg,type='info')=>{setNotification({msg,type});setTimeout(()=>setNotification(null),3500);},[]);

  const allFiltered=contacts.filter(c=>{
    const ms=!search||(c.name||'').toLowerCase().includes(search.toLowerCase())||(c.business_name||'').toLowerCase().includes(search.toLowerCase())||(c.phone||'').includes(search);
    const mf=statusFilter==='all'||c.status===statusFilter;
    const mc=!c.claimedBy||c.claimedBy===rep?.id;
    return ms&&mf&&mc;
  });

  const currentScripts=SCRIPTS[contactType]||[];
  const activeScript=currentScripts.find(s=>s.id===scriptId)||currentScripts[0];

  function getSmsForScript(sid,name){return(SCRIPT_SMS[sid]||SMS_FALLBACK[contactType])(name);}

  function selectContact(c){
    setActiveContact(c); setNotes(c.notes||'');
    setSmsBody(getSmsForScript(scriptId,c.name||'')); setSmsTo(c.phone||'');
    setEmailTo(c.email||''); setEmailName(c.name||''); setEmailBiz(c.business_name||'');
  }

  function updateContact(id,updates){setContacts(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));}

  function startPoll(sid){
    if(pollRef.current)clearInterval(pollRef.current);
    pollRef.current=setInterval(async()=>{try{const r=await fetch(`/api/twilio?action=callstatus&sid=${sid}`);const d=await r.json();if(['completed','failed','busy','no-answer'].includes(d.status)){clearInterval(pollRef.current);setCallState('ended');}}catch{}},3000);
  }

  async function startCall(){
    if(!activeContact)return notify('Select a contact first','warning');
    if(!activeContact.phone)return notify('No phone number','warning');
    updateContact(activeContact.id,{claimedBy:rep.id});
    setCallState('dialing'); setCallSeconds(0); clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>setCallSeconds(s=>s+1),1000);
    try{
      const r=await fetch('/api/twilio?action=call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:activeContact.phone,contactName:activeContact.name||'',contactBusiness:activeContact.business_name||'',contactType,repId:rep.id,repName:rep.name,script:activeScript?.name,aiMode:aiCallMode})});
      const data=await r.json(); if(!r.ok)throw new Error(data.error);
      setCallSid(data.callSid); setCallState('connected'); notify(`Dialing ${activeContact.name||activeContact.phone}...`); startPoll(data.callSid);
    }catch(err){setCallState('idle');clearInterval(timerRef.current);updateContact(activeContact.id,{claimedBy:null});notify(`Call failed: ${err.message}`,'warning');}
  }

  function endCall(){clearInterval(timerRef.current);clearInterval(pollRef.current);setCallState('ended');}

  async function setDisposition(outcome){
    if(!activeContact)return;
    clearInterval(timerRef.current); clearInterval(pollRef.current); setCallState('idle');
    const statusMap={answered:'called',voicemail:'voicemail',callback:'callback',interested:'interested','not-interested':'not-interested'};
    updateContact(activeContact.id,{status:statusMap[outcome]||'called',notes,claimedBy:null});
    const record={repId:rep.id,repName:rep.name,contactName:activeContact.name,contactBusiness:activeContact.business_name,contactPhone:activeContact.phone,contactType,outcome,duration:callSeconds,script:activeScript?.name,notes,timestamp:new Date().toISOString()};
    try{await fetch('/api/kv?action=save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});}catch{}
    setMyLog(prev=>[record,...prev]);
    if(outcome==='interested'){
      notify(`Interested! Auto-sending SMS to ${activeContact.name||activeContact.phone}`,'success');
      const body=getSmsForScript(scriptId,activeContact.name||'');
      try{await fetch('/api/twilio?action=sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:activeContact.phone,body})});setSentSms(prev=>[{to:activeContact.phone,name:activeContact.name,body,repName:rep.name,timestamp:new Date().toISOString(),auto:true},...prev]);}catch{}
    }
    setCallSeconds(0); setNotes(''); setActiveContact(null);
  }

  async function sendSMS(){
    const to=smsTo||activeContact?.phone; if(!to)return notify('No phone number','warning'); if(!smsBody.trim())return notify('Message is empty','warning');
    try{const r=await fetch('/api/twilio?action=sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,body:smsBody})});const d=await r.json();if(!r.ok)throw new Error(d.error);
      setSentSms(prev=>[{to,name:activeContact?.name||emailName||to,body:smsBody,repName:rep.name,timestamp:new Date().toISOString(),auto:false},...prev]);
      notify('SMS sent ✓','success'); setSmsModal(false);}
    catch(err){notify(`SMS failed: ${err.message}`,'warning');}
  }

  function applyEmailTemplate(key){
    const tpl=EMAIL_TEMPLATES[key]; if(!tpl||key==='custom')return;
    const repName=rep?.name||'';
    setEmailSubject(tpl.subject(emailName,emailBiz));
    setEmailBody(tpl.body(emailName,emailBiz,repName));
  }

  async function sendEmail(){
    if(!emailTo)return notify('No email address','warning'); if(!emailSubject||!emailBody)return notify('Subject and body required','warning');
    setEmailSending(true);
    try{const r=await fetch('/api/recordings?action=email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:emailTo,contactName:emailName,business:emailBiz,subject:emailSubject,html:`<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6">${emailBody.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`,product:contactType==='b2b'?'claw':'vin'})});
      const d=await r.json(); if(!r.ok)throw new Error(d.error||'Send failed');
      setSentEmails(prev=>[{to:emailTo,name:emailName,biz:emailBiz,subject:emailSubject,repName:rep.name,timestamp:new Date().toISOString()},...prev]);
      notify('Email sent ✓','success'); setEmailModal(false);}
    catch(err){notify(`Email failed: ${err.message}`,'warning');}
    setEmailSending(false);
  }

  function handleCSV(e){
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const lines=ev.target.result.split('\n').filter(l=>l.trim()); if(lines.length<2){notify('CSV appears empty','warning');return;}
      const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/['"]/g,''));
      const nameIdx=headers.findIndex(h=>h.includes('name')&&!h.includes('business')&&!h.includes('company'));
      const bizIdx=headers.findIndex(h=>h.includes('business')||h.includes('company')||h.includes('facility'));
      const phoneIdx=headers.findIndex(h=>h.includes('phone')||h.includes('mobile')||h.includes('cell'));
      const emailIdx=headers.findIndex(h=>h.includes('email'));
      const cityIdx=headers.findIndex(h=>h.includes('city'));
      const newOnes=[];
      for(let i=1;i<lines.length;i++){const cols=lines[i].split(',').map(c=>c.trim().replace(/^["']|["']$/g,''));if(!cols[phoneIdx]&&!cols[emailIdx])continue;newOnes.push({id:`${Date.now()}-${i}`,name:nameIdx>=0?cols[nameIdx]:'',business_name:bizIdx>=0?cols[bizIdx]:'',phone:phoneIdx>=0?cols[phoneIdx]:'',email:emailIdx>=0?cols[emailIdx]:'',city:cityIdx>=0?cols[cityIdx]:'',status:'new',notes:'',list_name:file.name.replace('.csv','')});}
      setContacts(prev=>[...prev,...newOnes]); notify(`Imported ${newOnes.length} contacts to ${contactType.toUpperCase()} pool`,'success');
    };
    reader.readAsText(file); e.target.value='';
  }

  function addContact(){if(!newContact.name&&!newContact.phone){notify('Need name or phone','warning');return;}setContacts(prev=>[...prev,{...newContact,id:`manual-${Date.now()}`,status:'new',notes:''}]);setNewContact({name:'',business_name:'',phone:'',email:''});setShowAddModal(false);notify('Contact added','success');}

  function exportCSV(rows,filename){const content=rows.map(r=>r.map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/csv'}));a.download=filename;a.click();}

  const myTotal=myLog.length;
  const myInterested=myLog.filter(c=>c.outcome==='interested').length;
  const myAnswered=myLog.filter(c=>!['voicemail','not-interested'].includes(c.outcome)).length;
  const myRate=myTotal>0?Math.round(myAnswered/myTotal*100):0;
  const isAdmin=rep?.role==='admin';
  const navTabs=['dialer','inbox','email','dashboard',...(isAdmin?['admin']:[])];

  if(!rep)return<><style>{CSS}</style><LoginScreen onLogin={handleLogin}/></>;

  const btn=(label,onClick,style={})=><button onClick={onClick} style={{cursor:'pointer',...style}}>{label}</button>;
  const field=(label,val,setter,opts={})=>(
    <div style={{marginBottom:10}}>
      <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{label}</div>
      {opts.area
        ?<textarea value={val} onChange={e=>setter(e.target.value)} style={{width:'100%',padding:'7px 10px',resize:'vertical',...opts.style}}/>
        :<input value={val} onChange={e=>setter(e.target.value)} type={opts.type||'text'} placeholder={opts.placeholder||''} style={{width:'100%',fontSize:13,padding:'7px 10px',...opts.style}}/>}
    </div>
  );

  return (
    <>
      <Head>
        <title>CareCircle — Remote Care Center</title>
        <link rel="icon" href={FAVICON}/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
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
          <button onClick={handleLogout} style={{padding:'3px 9px',fontFamily:'DM Mono,monospace',fontSize:8,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>SIGN OUT</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 20px'}}>
        {navTabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'9px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:0.8,textTransform:'uppercase',color:tab===t?'var(--gl)':'var(--dim)',border:'none',borderBottom:tab===t?'2px solid var(--gl)':'2px solid transparent',background:'none',transition:'all 0.15s',cursor:'pointer'}}>
            {t==='inbox'?'📬 inbox':t==='email'?'✉️ email':t}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
          <div style={{display:'flex',border:'1px solid var(--border2)',borderRadius:3,overflow:'hidden'}}>
            <button onClick={()=>setContactType('b2b')} style={{padding:'4px 11px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,border:'none',background:contactType==='b2b'?'var(--gd)':'transparent',color:contactType==='b2b'?'var(--gl)':'var(--dim)',transition:'all 0.15s',cursor:'pointer'}}>B2B PROVIDERS</button>
            <button onClick={()=>setContactType('b2c')} style={{padding:'4px 11px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,border:'none',borderLeft:'1px solid var(--border2)',background:contactType==='b2c'?'var(--gd)':'transparent',color:contactType==='b2c'?'var(--gl)':'var(--dim)',transition:'all 0.15s',cursor:'pointer'}}>B2C FAMILIES</button>
          </div>
          <button onClick={()=>setAiCallMode(v=>!v)} style={{padding:'4px 9px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.8,border:`1px solid ${aiCallMode?'var(--green)':'var(--border2)'}`,background:aiCallMode?'rgba(74,155,74,0.12)':'transparent',color:aiCallMode?'var(--green)':'var(--dim)',borderRadius:2,cursor:'pointer'}}>
            {aiCallMode?'🤖 AI ON':'🤖 AI'}
          </button>
        </div>
      </div>

      {/* ── DIALER ── */}
      {tab==='dialer'&&(
        <div style={{display:'grid',gridTemplateColumns:'285px 1fr 245px',height:'calc(100vh - 90px)',overflow:'hidden'}}>

          {/* LEFT: CONTACTS */}
          <div style={{borderRight:'1px solid var(--border)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',gap:6}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${contactType==='b2b'?'providers':'families'}...`} style={{width:'100%',padding:'7px 10px'}}/>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['new','all','called','callback','interested','voicemail','not-interested'].map(f=>(
                  <button key={f} onClick={()=>setStatusFilter(f)} style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,letterSpacing:0.5,border:`1px solid ${statusFilter===f?'var(--green)':'var(--border2)'}`,background:statusFilter===f?'rgba(74,155,74,0.12)':'transparent',color:statusFilter===f?'var(--green)':'var(--dim)',borderRadius:2,textTransform:'uppercase',cursor:'pointer'}}>{f}</button>
                ))}
              </div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>{allFiltered.length} contacts · {contactType==='b2b'?'Providers':'Families'}</div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {allFiltered.length===0
                ?<div style={{padding:20,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)',lineHeight:2}}>No contacts.<br/>Upload CSV in Admin tab.</div>
                :allFiltered.map(c=>(
                  <div key={c.id} onClick={()=>selectContact(c)} style={{padding:'10px 13px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:activeContact?.id===c.id?'var(--surface2)':'transparent',borderLeft:activeContact?.id===c.id?'2px solid var(--green)':'2px solid transparent',transition:'all 0.1s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:3,background:`${statusColor[c.status]||'var(--green)'}18`,border:`1px solid ${statusColor[c.status]||'var(--green)'}33`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:statusColor[c.status]||'var(--green)',flexShrink:0}}>
                        {(c.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name||'No Name'}</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.business_name||c.phone||''}</div>
                      </div>
                      <div style={{display:'flex',gap:3,flexShrink:0}}>
                        {c.phone&&<span style={{fontSize:8}}>📞</span>}
                        {c.email&&<span style={{fontSize:8}}>✉</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
              <button onClick={()=>setShowAddModal(true)} style={{width:'100%',padding:'6px',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:500,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:3,cursor:'pointer'}}>+ Add Contact</button>
            </div>
          </div>

          {/* CENTER */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column'}}>
            {/* Contact card */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              {activeContact?(
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:3,background:'rgba(74,155,74,0.12)',border:'1px solid rgba(74,155,74,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace',fontSize:13,color:'var(--gl)',flexShrink:0}}>
                      {(activeContact.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'var(--text)'}}>{activeContact.name||'Unknown'}</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--green)',marginTop:2}}>{activeContact.phone}</div>
                      {activeContact.business_name&&<div style={{fontSize:11,color:'var(--dim)',marginTop:2}}>{activeContact.business_name}</div>}
                      {activeContact.email&&<div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{activeContact.email}</div>}
                      {activeContact.city&&<div style={{fontSize:10,color:'var(--dim)'}}>{activeContact.city}, FL</div>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setSmsTo(activeContact.phone||'');setSmsBody(getSmsForScript(scriptId,activeContact.name||''));setSmsModal(true);}} style={{padding:'5px 10px',fontSize:10,fontWeight:500,background:'transparent',border:'1px solid var(--border2)',color:'var(--dim)',borderRadius:3,cursor:'pointer'}}>💬 SMS</button>
                    <button onClick={()=>{setEmailTo(activeContact.email||'');setEmailName(activeContact.name||'');setEmailBiz(activeContact.business_name||'');setEmailTemplate('custom');setEmailModal(true);}} style={{padding:'5px 10px',fontSize:10,fontWeight:500,background:'transparent',border:'1px solid var(--border2)',color:'var(--dim)',borderRadius:3,cursor:'pointer'}}>✉️ Email</button>
                  </div>
                </div>
              ):<div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>← Select a contact to begin</div>}
            </div>

            {/* Call controls */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:callStateColor[callState],animation:callState==='connected'?'pulse 1.5s infinite':'none'}}></div>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:11,letterSpacing:2,color:callStateColor[callState]}}>{callStateText[callState]}</span>
                {callState!=='idle'&&<span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--mid)',marginLeft:'auto'}}>{fmtTime(callSeconds)}</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {callState==='idle'&&<button onClick={startCall} style={{padding:'10px 20px',fontSize:13,fontWeight:600,background:'var(--green)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>📞 Dial</button>}
                {['dialing','connected'].includes(callState)&&<>
                  <button onClick={endCall} style={{padding:'10px 20px',fontSize:13,fontWeight:600,background:'var(--red)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>🔴 End</button>
                  <button onClick={()=>setDisposition('voicemail')} style={{padding:'10px 12px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Drop VM</button>
                </>}
              </div>
              {['connected','ended'].includes(callState)&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  {[['answered','✓ Answered','var(--green)'],['voicemail','📬 VM','var(--dim)'],['callback','↩ Callback','var(--orange)'],['interested','★ Interested','var(--gl)'],['not-interested','✕ No','var(--red)']].map(([outcome,label,color])=>(
                    <button key={outcome} onClick={()=>setDisposition(outcome)} style={{padding:'8px 4px',fontSize:10,fontWeight:600,border:`1px solid ${color}44`,background:`${color}12`,color,borderRadius:3,textAlign:'center',cursor:'pointer'}}>{label}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Call Notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes during call..." style={{width:'100%',padding:'7px 10px',resize:'none',height:55,lineHeight:1.5}}/>
            </div>

            {/* Script picker + content */}
            <div style={{flex:1,padding:'12px 20px'}}>
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Script</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {currentScripts.map(s=>(
                    <button key={s.id} onClick={()=>{setScriptId(s.id);if(activeContact)setSmsBody(getSmsForScript(s.id,activeContact.name||''));}} style={{padding:'4px 10px',fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:0.5,border:`1px solid ${scriptId===s.id?s.color+'88':'var(--border2)'}`,background:scriptId===s.id?`${s.color}18`:'transparent',color:scriptId===s.id?s.color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              {activeScript&&(
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:14}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:activeScript.color,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>{activeScript.name}</div>
                  {activeScript.sections.map((sec,i)=>(
                    <div key={i} style={{marginBottom:13}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:7,color:activeScript.color,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{sec.label}</div>
                      <div style={{fontSize:12,color:'var(--mid)',lineHeight:1.65}}>{sec.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: STATS + LOG */}
          <div style={{background:'var(--surface)',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
            <div style={{padding:'11px 14px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:10}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1.5,color:'var(--dim)',textTransform:'uppercase'}}>My Stats</span>
            </div>
            {[['Calls Made',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Interested',myInterested,'var(--teal)']].map(([label,val,color])=>(
              <div key={label} style={{padding:'13px 14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{label}</div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:600,color,lineHeight:1}}>{val}</div>
              </div>
            ))}
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:8,letterSpacing:1,color:'var(--dim)',textTransform:'uppercase'}}>My Log</span>
              <button onClick={()=>exportCSV([['Rep','Contact','Business','Phone','Outcome','Duration','Script','Notes','Time'],...myLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'my-calls.csv')} style={{padding:'2px 7px',fontFamily:'DM Mono,monospace',fontSize:7,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>EXPORT</button>
            </div>
            {myLog.length===0
              ?<div style={{padding:16,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>No calls yet</div>
              :myLog.slice(0,60).map((entry,i)=>{
                const c={answered:'var(--green)',voicemail:'var(--dim)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)'}[entry.outcome]||'var(--dim)';
                return(
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

      {/* ── INBOX TAB ── */}
      {tab==='inbox'&&(
        <div style={{height:'calc(100vh - 90px)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:4}}>
              {['inbox','sent'].map(t=>(
                <button key={t} onClick={()=>setInboxTab(t)} style={{padding:'5px 14px',fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:1,textTransform:'uppercase',border:`1px solid ${inboxTab===t?'var(--green)':'var(--border2)'}`,background:inboxTab===t?'rgba(74,155,74,0.12)':'transparent',color:inboxTab===t?'var(--green)':'var(--dim)',borderRadius:2,cursor:'pointer'}}>
                  {t==='inbox'?'📥 Inbound':'📤 Sent'}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setSmsTo('');setSmsBody('');setSmsModal(true);}} style={{padding:'6px 14px',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>+ New SMS</button>
              <button onClick={loadInbox} style={{padding:'6px 12px',fontFamily:'DM Mono,monospace',fontSize:9,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>{inboxLoading?'Loading...':'↺ Refresh'}</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'0 24px'}}>
            {inboxTab==='inbox'&&(
              inboxMessages.length===0
                ?<div style={{padding:40,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>{inboxLoading?'Loading messages...':'No inbound messages. Click Refresh to check.'}</div>
                :inboxMessages.map((m,i)=>(
                  <div key={i} style={{padding:'14px 0',borderBottom:'1px solid var(--border)',display:'flex',gap:14}}>
                    <div style={{width:36,height:36,borderRadius:3,background:'rgba(61,139,122,0.15)',border:'1px solid rgba(61,139,122,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>💬</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--gl)',fontWeight:500}}>{m.from}</span>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{fmtDate(m.dateSent)}</span>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:8,padding:'1px 6px',borderRadius:2,background:'rgba(61,139,122,0.15)',color:'var(--teal)',marginLeft:'auto'}}>{m.status}</span>
                      </div>
                      <div style={{fontSize:13,color:'var(--text)',lineHeight:1.5}}>{m.body}</div>
                      <button onClick={()=>{setSmsTo(m.from);setSmsBody('');setSmsModal(true);}} style={{marginTop:6,padding:'3px 10px',fontSize:9,fontWeight:500,background:'transparent',border:'1px solid var(--border2)',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>↩ Reply</button>
                    </div>
                  </div>
                ))
            )}
            {inboxTab==='sent'&&(
              sentSms.length===0
                ?<div style={{padding:40,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>No sent messages yet.</div>
                :sentSms.map((m,i)=>(
                  <div key={i} style={{padding:'14px 0',borderBottom:'1px solid var(--border)',display:'flex',gap:14}}>
                    <div style={{width:36,height:36,borderRadius:3,background:'rgba(74,155,74,0.1)',border:'1px solid rgba(74,155,74,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📤</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{m.name||m.to}</span>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{m.to}</span>
                        {m.auto&&<span style={{fontFamily:'DM Mono,monospace',fontSize:8,padding:'1px 6px',borderRadius:2,background:'rgba(107,191,107,0.15)',color:'var(--gl)'}}>AUTO</span>}
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginLeft:'auto'}}>{fmtDate(m.timestamp)}</span>
                      </div>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',marginBottom:4}}>{m.repName}</div>
                      <div style={{fontSize:12,color:'var(--mid)',lineHeight:1.5}}>{m.body}</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ── EMAIL TAB ── */}
      {tab==='email'&&(
        <div style={{height:'calc(100vh - 90px)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)'}}>Email Center</div>
            <button onClick={()=>{setEmailTo('');setEmailName('');setEmailBiz('');setEmailSubject('');setEmailBody('');setEmailTemplate('custom');setEmailModal(true);}} style={{padding:'6px 14px',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>+ Compose</button>
          </div>
          <div style={{padding:'16px 24px',borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Quick Templates — click to pre-load & edit</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(EMAIL_TEMPLATES).filter(([k])=>k!=='custom').map(([key,tpl])=>(
                <button key={key} onClick={()=>{const repName=rep?.name||'';setEmailTemplate(key);setEmailSubject(tpl.subject(emailName||'Contact',emailBiz||'Business'));setEmailBody(tpl.body(emailName||'Contact',emailBiz||'Business',repName));setEmailModal(true);}} style={{padding:'10px 12px',textAlign:'left',background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer',transition:'border-color 0.15s'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--gl)',marginBottom:3}}>{tpl.label}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',lineHeight:1.3}}>{tpl.subject('Contact','Business')}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'0 24px'}}>
            <div style={{padding:'12px 0',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>Sent ({sentEmails.length})</div>
            {sentEmails.length===0
              ?<div style={{padding:40,textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>No sent emails yet.</div>
              :sentEmails.map((m,i)=>(
                <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)',display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{width:34,height:34,borderRadius:3,background:'rgba(74,155,74,0.1)',border:'1px solid rgba(74,155,74,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>✉️</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{m.name||m.to}</span>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)'}}>{m.to}</span>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginLeft:'auto'}}>{fmtDate(m.timestamp)}</span>
                    </div>
                    <div style={{fontSize:12,color:'var(--gl)',marginBottom:2}}>{m.subject}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)'}}>by {m.repName}{m.biz?' · '+m.biz:''}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab==='dashboard'&&(
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)',marginBottom:18}}>{rep.name}'s Dashboard</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
            {[['Total Calls',myTotal,'var(--green)'],['Answer Rate',`${myRate}%`,'var(--gl)'],['Interested',myInterested,'var(--teal)'],['SMS Sent',sentSms.filter(s=>s.repName===rep.name).length,'var(--orange)']].map(([label,val,color])=>(
              <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:18}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:34,fontWeight:700,color,lineHeight:1,marginBottom:5}}>{val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,textTransform:'uppercase'}}>{label}</div>
              </div>
            ))}
          </div>
          {isAdmin&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--teal)'}}>All Reps Activity</div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={loadLogs} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>{loadingLog?'Loading...':'↺ Refresh'}</button>
                  <button onClick={()=>exportCSV([['Rep','Contact','Business','Phone','Type','Outcome','Duration','Script','Notes','Time'],...allLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.contactType,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'all-calls.csv')} style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:8,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>EXPORT ALL</button>
                </div>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Rep','Contact','Type','Outcome','Duration','Time'].map(h=><th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {allLog.slice(0,150).map((entry,i)=>{
                      const c={answered:'var(--green)',voicemail:'var(--dim)',callback:'var(--orange)',interested:'var(--gl)','not-interested':'var(--red)'}[entry.outcome]||'var(--dim)';
                      return(
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

      {/* ── ADMIN ── */}
      {tab==='admin'&&isAdmin&&(
        <div style={{padding:24,overflowY:'auto',height:'calc(100vh - 90px)'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:600,color:'var(--gl)',marginBottom:22}}>Admin Panel</div>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>
              Upload Contacts — pool: <span style={{color:contactType==='b2b'?'var(--green)':'var(--teal)'}}>{contactType==='b2b'?'B2B Provider Pool':'B2C Family Pool'}</span>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--dim)',marginBottom:10}}>Toggle B2B / B2C in the nav bar to switch pools before uploading.</div>
            <label style={{display:'block',border:'1px dashed var(--border2)',padding:24,textAlign:'center',cursor:'pointer',background:'var(--surface2)',borderRadius:3}}>
              <div style={{fontSize:24,marginBottom:6}}>📂</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--dim)'}}>Click to upload CSV → {contactType==='b2b'?'Provider':'Family'} pool<br/><span style={{fontSize:8,opacity:0.6}}>Columns: name, business_name, phone, email, city</span></div>
              <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            </label>
          </div>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>Active Reps</div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Name','PIN','Role'].map(h=><th key={h} style={{padding:'8px 14px',textAlign:'left',fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,fontWeight:400,textTransform:'uppercase'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {REPS.map(r=>(
                    <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'8px 14px',fontSize:12,fontWeight:500,color:'var(--text)'}}>{r.name}</td>
                      <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--dim)'}}>{r.pin}</td>
                      <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontSize:9,color:r.role==='admin'?'var(--teal)':'var(--dim)'}}>{r.role.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:2,textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>Data Export</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>exportCSV([['Rep','Contact','Business','Phone','Type','Outcome','Duration','Script','Notes','Time'],...allLog.map(c=>[c.repName,c.contactName,c.contactBusiness,c.contactPhone,c.contactType,c.outcome,c.duration,c.script,c.notes,c.timestamp])],'carecircle-all-calls.csv')} style={{padding:'9px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Export All Calls</button>
              <button onClick={()=>exportCSV([['To','Name','Body','Rep','Time','Auto'],...sentSms.map(s=>[s.to,s.name,s.body,s.repName,s.timestamp,s.auto?'yes':'no'])],'carecircle-sms.csv')} style={{padding:'9px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Export SMS Log</button>
              <button onClick={()=>exportCSV([['To','Name','Business','Subject','Rep','Time'],...sentEmails.map(e=>[e.to,e.name,e.biz,e.subject,e.repName,e.timestamp])],'carecircle-emails.csv')} style={{padding:'9px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Export Email Log</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS MODAL ── */}
      {smsModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:480,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:14}}>Send SMS</div>
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Quick Templates</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {Object.entries(SCRIPT_SMS).map(([key,fn])=>(
                  <button key={key} onClick={()=>setSmsBody(fn(activeContact?.name||emailName||''))} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:7,border:'1px solid var(--border2)',background:'transparent',color:'var(--dim)',borderRadius:2,cursor:'pointer'}}>
                    {key.replace(/b[12]b-|b2c-/,'').replace(/-/g,' ')}
                  </button>
                ))}
                <button onClick={()=>setSmsBody('')} style={{padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:7,border:'1px solid var(--border2)',background:'transparent',color:'var(--red)',borderRadius:2,cursor:'pointer'}}>clear</button>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>To (phone number)</div>
              <input value={smsTo} onChange={e=>setSmsTo(e.target.value)} placeholder="+1..." style={{width:'100%',fontSize:13,padding:'8px 10px'}}/>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Message</div>
              <textarea value={smsBody} onChange={e=>setSmsBody(e.target.value)} style={{width:'100%',padding:'7px 10px',resize:'none',height:80,border:`1px solid ${smsBody.length>160?'var(--red)':'var(--border2)'}`}}/>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,textAlign:'right',marginTop:3,color:smsBody.length>160?'var(--red)':smsBody.length>140?'var(--yellow)':'var(--dim)'}}>{smsBody.length} / 160</div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={()=>setSmsModal(false)} style={{padding:'8px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Cancel</button>
              <button onClick={sendSMS} style={{padding:'8px 14px',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>Send SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL MODAL ── */}
      {emailModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:580,maxHeight:'90vh',overflowY:'auto',animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:14}}>Compose Email</div>
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Load Template</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {Object.entries(EMAIL_TEMPLATES).map(([key,tpl])=>(
                  <button key={key} onClick={()=>{setEmailTemplate(key);if(key!=='custom'){const repName=rep?.name||'';setEmailSubject(tpl.subject(emailName,emailBiz));setEmailBody(tpl.body(emailName,emailBiz,repName));}}} style={{padding:'4px 9px',fontFamily:'DM Mono,monospace',fontSize:8,border:`1px solid ${emailTemplate===key?'var(--gl)':'var(--border2)'}`,background:emailTemplate===key?'rgba(107,191,107,0.12)':'transparent',color:emailTemplate===key?'var(--gl)':'var(--dim)',borderRadius:2,cursor:'pointer'}}>
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            {[['To (email address)','text',emailTo,setEmailTo,'email@domain.com'],['Contact Name','text',emailName,setEmailName,''],['Business / Facility','text',emailBiz,setEmailBiz,''],['Subject','text',emailSubject,setEmailSubject,'']].map(([label,type,val,setter,ph])=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{label}</div>
                <input type={type} value={val} placeholder={ph} onChange={e=>setter(e.target.value)} style={{width:'100%',fontSize:12,padding:'7px 10px'}}/>
              </div>
            ))}
            <div style={{marginBottom:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Body</div>
              <textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)} style={{width:'100%',padding:'7px 10px',resize:'vertical',minHeight:220,lineHeight:1.6,fontFamily:'Inter,sans-serif',fontSize:12}}/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={()=>setEmailModal(false)} style={{padding:'8px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Cancel</button>
              <button onClick={sendEmail} disabled={emailSending} style={{padding:'8px 14px',fontSize:11,fontWeight:600,background:emailSending?'var(--dim)':'var(--green)',color:'white',border:'none',borderRadius:3,cursor:emailSending?'default':'pointer'}}>
                {emailSending?'Sending...':'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      {showAddModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:4,padding:22,width:380,animation:'slideUp 0.2s ease'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,color:'var(--gl)',marginBottom:16}}>Add {contactType==='b2b'?'Provider':'Family'} Contact</div>
            {[['Name','name'],['Business / Facility','business_name'],['Phone','phone'],['Email','email']].map(([label,key])=>(
              <div key={key} style={{marginBottom:10}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--dim)',letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{label}</div>
                <input value={newContact[key]} onChange={e=>setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:'100%',fontSize:12,padding:'7px 10px'}}/>
              </div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button onClick={()=>setShowAddModal(false)} style={{padding:'8px 14px',fontSize:11,fontWeight:500,background:'transparent',color:'var(--dim)',border:'1px solid var(--border2)',borderRadius:3,cursor:'pointer'}}>Cancel</button>
              <button onClick={addContact} style={{padding:'8px 14px',fontSize:11,fontWeight:600,background:'var(--green)',color:'white',border:'none',borderRadius:3,cursor:'pointer'}}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification&&(
        <div style={{position:'fixed',bottom:22,right:22,padding:'11px 16px',background:'var(--surface)',border:'1px solid var(--border2)',borderLeft:`3px solid ${notification.type==='success'?'var(--green)':notification.type==='warning'?'var(--orange)':'var(--teal)'}`,borderRadius:3,fontSize:12,color:'var(--text)',zIndex:1000,maxWidth:300,animation:'slideUp 0.3s ease',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
          {notification.msg}
        </div>
      )}
    </>
  );
}
